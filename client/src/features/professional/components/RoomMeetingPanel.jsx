import '@livekit/components-styles';
import { LiveKitRoom, PreJoin, VideoConference } from '@livekit/components-react';
import { AlertCircle, Check, PenLine, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import Spinner from '../../../shared/components/Spinner';
import SharedWhiteboard from './SharedWhiteboard';

export default function RoomMeetingPanel({ roomCode, onClose, socket, session, meetingState, mode = 'host' }) {
  const navigate = useNavigate();
  const meetingEndTimerRef = useRef(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardReadOnly, setWhiteboardReadOnly] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [userChoices, setUserChoices] = useState(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [meetingEndedOverlay, setMeetingEndedOverlay] = useState(false);
  const [leaveToasts, setLeaveToasts] = useState([]);
  const meetingJoinedRef = useRef(false);
  const leaveToastTimersRef = useRef(new Map());
  const currentUser = { id: session?.sessionId };
  const activeMeeting = {
    hostId: meetingState?.hostSessionId || (mode === 'host' ? session?.sessionId : null),
  };
  const isHost = Boolean(currentUser.id && activeMeeting.hostId && String(currentUser.id) === String(activeMeeting.hostId));
  const meetingId = roomCode;

  const fetchMeetingToken = async () => {
    const response = await api.post(`/rooms/${roomCode}/meeting-token`);
    return response.data.data;
  };

  const startMeeting = async () => {
    setLoading(true);
    try {
      setError('');
      const data = await fetchMeetingToken();
      setMeeting(data);
      setUserChoices(null);
      socket?.emit('room:meeting:start');
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to start meeting. Check LiveKit configuration.');
    } finally {
      setLoading(false);
    }
  };

  const requestJoin = () => {
    setError('');
    setWaiting(true);
    socket?.emit('room:meeting:join-request');
  };

  const joinApprovedMeeting = async () => {
    setLoading(true);
    try {
      setWaiting(false);
      setMeeting(await fetchMeetingToken());
      setUserChoices(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to join meeting.');
    } finally {
      setLoading(false);
    }
  };

  const openHostWhiteboard = () => {
    setWhiteboardReadOnly(false);
    setWhiteboardOpen(true);
    socket?.emit('whiteboard_opened', { meetingId });
  };

  const closeHostWhiteboard = () => {
    setWhiteboardOpen(false);
    setWhiteboardReadOnly(false);
    socket?.emit('whiteboard_closed', { meetingId });
  };

  const confirmEndMeeting = async () => {
    setLoading(true);
    try {
      await api.delete(`/rooms/${roomCode}/meeting`);
      socket?.emit('meeting_ended', { meetingId });
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to end meeting.');
    } finally {
      setLoading(false);
      setConfirmEndOpen(false);
    }
  };

  const handleLiveKitDisconnected = () => {
    if (meetingJoinedRef.current) {
      if (isHost) {
        socket?.emit('meeting_ended', { meetingId });
      } else {
        socket?.emit('participant_left', {
          displayName: session?.alias || 'Participant',
          meetingId,
          userId: session?.sessionId,
        });
      }
      meetingJoinedRef.current = false;
    }

    setMeeting(null);
    setUserChoices(null);
    setWhiteboardOpen(false);
    setWhiteboardReadOnly(false);
  };

  const leaveMeetingPanel = () => {
    if (meeting || meetingJoinedRef.current) {
      handleLiveKitDisconnected();
    }

    setWaiting(false);
    setConfirmEndOpen(false);
    onClose?.();
  };

  useEffect(() => {
    if (!meeting || !userChoices || !socket || !session?.sessionId) {
      return;
    }

    meetingJoinedRef.current = true;
    socket.emit('participant_joined', {
      displayName: userChoices.username || session?.alias || 'Participant',
      meetingId,
      userId: session.sessionId,
    });
  }, [meeting, meetingId, session?.alias, session?.sessionId, socket, userChoices]);

  useEffect(() => {
    if (!socket || !session?.sessionId) return undefined;

    const handleApproved = ({ sessionId }) => {
      if (sessionId === session.sessionId) {
        joinApprovedMeeting();
      }
    };
    const handleDenied = ({ sessionId }) => {
      if (sessionId === session.sessionId) {
        setWaiting(false);
        setError('The host did not admit you to this meeting.');
      }
    };
    const handleRoomEnded = () => {
      setMeeting(null);
      setUserChoices(null);
      setWaiting(false);
      setError('The host ended this meeting.');
    };
    const handleWhiteboardOpened = () => {
      if (isHost) return;
      setWhiteboardReadOnly(true);
      setWhiteboardOpen(true);
    };
    const handleWhiteboardClosed = () => {
      if (isHost) return;
      setWhiteboardOpen(false);
      setWhiteboardReadOnly(false);
    };
    const handleMeetingEnded = () => {
      meetingJoinedRef.current = false;
      setMeeting(null);
      setUserChoices(null);
      setWaiting(false);
      setWhiteboardOpen(false);
      setMeetingEndedOverlay(true);
      if (meetingEndTimerRef.current) {
        window.clearTimeout(meetingEndTimerRef.current);
      }
      meetingEndTimerRef.current = window.setTimeout(() => {
        setMeetingEndedOverlay(false);
        navigate('/');
      }, 3000);
    };
    const handleParticipantLeftNotify = ({ displayName }) => {
      if (!isHost) return;

      const id = Date.now() + Math.random();
      const toast = { displayName: displayName || 'Participant', id };

      setLeaveToasts((current) => [...current, toast]);
      const leaveTimer = window.setTimeout(() => {
        setLeaveToasts((current) => current.map((entry) => (entry.id === id ? { ...entry, leaving: true } : entry)));
      }, 3800);
      const removeTimer = window.setTimeout(() => {
        setLeaveToasts((current) => current.filter((entry) => entry.id !== id));
        leaveToastTimersRef.current.delete(id);
      }, 4000);
      leaveToastTimersRef.current.set(id, [leaveTimer, removeTimer]);
    };

    socket.on('room:meeting:approved', handleApproved);
    socket.on('room:meeting:denied', handleDenied);
    socket.on('room:meeting:ended', handleRoomEnded);
    socket.on('whiteboard_opened', handleWhiteboardOpened);
    socket.on('whiteboard_closed', handleWhiteboardClosed);
    socket.on('meeting_ended', handleMeetingEnded);
    socket.on('participant_left_notify', handleParticipantLeftNotify);

    return () => {
      socket.off('room:meeting:approved', handleApproved);
      socket.off('room:meeting:denied', handleDenied);
      socket.off('room:meeting:ended', handleRoomEnded);
      socket.off('whiteboard_opened', handleWhiteboardOpened);
      socket.off('whiteboard_closed', handleWhiteboardClosed);
      socket.off('meeting_ended', handleMeetingEnded);
      socket.off('participant_left_notify', handleParticipantLeftNotify);
      if (meetingEndTimerRef.current) {
        window.clearTimeout(meetingEndTimerRef.current);
      }
      leaveToastTimersRef.current.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
      leaveToastTimersRef.current.clear();
    };
  }, [isHost, meetingId, navigate, roomCode, session?.sessionId, socket]);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[rgba(15,31,27,0.82)] p-0 sm:px-4 sm:py-6">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-white/15 bg-[#081713] shadow-[0_22px_90px_rgba(0,0,0,0.35)] sm:max-h-[900px] sm:rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-3 py-3 text-white sm:px-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/60">Professional meeting</p>
            <h2 className="truncate font-display text-[18px] font-medium sm:text-[20px]">Room {roomCode}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" onClick={leaveMeetingPanel} type="button">
              <X size={18} strokeWidth={1.7} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {meeting && !userChoices ? (
            <div className="scrollbar-chat flex h-full items-center justify-center overflow-y-auto bg-[#0b1714] p-3 sm:p-6">
              <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-white p-4 shadow-[0_18px_70px_rgba(0,0,0,0.28)] sm:p-5">
                <div className="mb-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Device check</p>
                  <h3 className="font-display text-[24px] font-medium text-text-primary">Join room meeting</h3>
                </div>
                <PreJoin
                  camLabel="Camera"
                  defaults={{
                    username: session?.alias || 'Gatherly user',
                    audioEnabled: true,
                    videoEnabled: true,
                  }}
                  joinLabel="Join meeting"
                  micLabel="Microphone"
                  onError={(nextError) => setError(nextError.message || 'Unable to access camera or microphone.')}
                  onSubmit={(choices) => setUserChoices(choices)}
                  userLabel="Display name"
                />
                {error ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#f2cec1] bg-[#fff4ef] px-4 py-3 text-left text-[13px] text-text-primary">
                    <AlertCircle className="mt-0.5 shrink-0 text-brand-primary" size={16} strokeWidth={1.7} />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : meeting ? (
            <div className="relative h-full">
              <LiveKitRoom
                audio={
                  userChoices.audioEnabled
                    ? { deviceId: userChoices.audioDeviceId ? { exact: userChoices.audioDeviceId } : undefined }
                    : false
                }
                connect
                data-lk-theme="default"
                onDisconnected={handleLiveKitDisconnected}
                onError={(nextError) => setError(nextError.message || 'Unable to connect to meeting.')}
                serverUrl={meeting.url}
                token={meeting.token}
                video={
                  userChoices.videoEnabled
                    ? { deviceId: userChoices.videoDeviceId ? { exact: userChoices.videoDeviceId } : undefined }
                    : false
                }
                className="h-full"
              >
                <VideoConference />
              </LiveKitRoom>
              {isHost ? (
                <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white px-4 text-[13px] font-medium text-brand-primary shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                    onClick={openHostWhiteboard}
                    type="button"
                  >
                    <PenLine size={16} strokeWidth={1.7} />
                    Share Whiteboard
                  </button>
                  <button
                    className="min-h-10 rounded-full bg-[#c2410c] px-4 text-[13px] font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                    onClick={() => setConfirmEndOpen(true)}
                    type="button"
                  >
                    End Meeting
                  </button>
                </div>
              ) : null}
              {isHost && (meetingState?.pending || []).length ? (
                <div className="absolute inset-x-2 bottom-2 z-10 max-h-[45vh] overflow-y-auto rounded-xl border border-white/15 bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[300px]">
                  <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-text-secondary">Waiting room</p>
                  <div className="mt-3 space-y-3">
                    {meetingState.pending.map((request) => (
                      <div className="rounded-xl border border-border-default bg-bg-secondary p-3" key={request.sessionId}>
                        <p className="font-medium text-text-primary">{request.alias}</p>
                        <div className="mt-3 flex gap-2">
                          <button className="min-h-9 flex-1 rounded-full bg-brand-primary px-3 text-[12px] font-medium text-white" onClick={() => socket?.emit('room:meeting:approve', { sessionId: request.sessionId })} type="button">
                            Admit
                          </button>
                          <button className="min-h-9 flex-1 rounded-full border border-border-default px-3 text-[12px] font-medium text-text-secondary" onClick={() => socket?.emit('room:meeting:deny', { sessionId: request.sessionId })} type="button">
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="scrollbar-chat flex h-full items-center justify-center overflow-y-auto p-3 sm:p-6">
              <div className="grid w-full max-w-4xl gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-xl border border-white/10 bg-white p-5 text-center sm:p-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
                  <Video size={24} strokeWidth={1.7} />
                </div>
                <h3 className="mt-4 font-display text-[26px] font-medium text-text-primary">{isHost ? 'Start room meeting' : 'Join room meeting'}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
                  {isHost ? 'Start the LiveKit call and admit people from the waiting room.' : 'Ask the host to admit you before joining the LiveKit room.'}
                </p>
                {error ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#f2cec1] bg-[#fff4ef] px-4 py-3 text-left text-[13px] text-text-primary">
                    <AlertCircle className="mt-0.5 shrink-0 text-brand-primary" size={16} strokeWidth={1.7} />
                    <span>{error}</span>
                  </div>
                ) : null}
                <button
                  className="mt-5 inline-flex min-h-11 min-w-[160px] items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-[14px] font-medium text-white disabled:bg-border-default disabled:text-text-secondary"
                  disabled={loading || waiting}
                  onClick={isHost ? startMeeting : requestJoin}
                  type="button"
                >
                  {loading ? <Spinner size="sm" /> : <Video size={16} strokeWidth={1.7} />}
                  {waiting ? 'Waiting for host' : isHost ? 'Start meeting' : 'Request to join'}
                </button>
              </div>
              <div className="rounded-xl border border-white/10 bg-white p-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Waiting room</p>
                {isHost ? (
                  <div className="mt-4 space-y-3">
                    {(meetingState?.pending || []).length ? meetingState.pending.map((request) => (
                      <div className="rounded-xl border border-border-default bg-bg-secondary p-3" key={request.sessionId}>
                        <p className="font-medium text-text-primary">{request.alias}</p>
                        <div className="mt-3 flex gap-2">
                          <button className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-brand-primary px-3 text-[13px] font-medium text-white" onClick={() => socket?.emit('room:meeting:approve', { sessionId: request.sessionId })} type="button">
                            <Check size={15} /> Admit
                          </button>
                          <button className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-border-default px-3 text-[13px] font-medium text-text-secondary" onClick={() => socket?.emit('room:meeting:deny', { sessionId: request.sessionId })} type="button">
                            Deny
                          </button>
                        </div>
                      </div>
                    )) : <p className="text-[14px] leading-[1.6] text-text-secondary">No one is waiting yet.</p>}
                  </div>
                ) : (
                  <p className="mt-4 text-[14px] leading-[1.6] text-text-secondary">
                    {waiting ? 'Your request is visible to the host.' : 'Request access and keep this panel open.'}
                  </p>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {confirmEndOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
            <h3 className="font-display text-[22px] font-medium text-text-primary">End meeting for everyone?</h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">This will end the meeting for all participants.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="min-h-10 rounded-full border border-border-default px-4 text-[13px] font-medium text-text-secondary" onClick={() => setConfirmEndOpen(false)} type="button">
                Cancel
              </button>
              <button className="min-h-10 rounded-full bg-[#c2410c] px-4 text-[13px] font-medium text-white disabled:opacity-70" disabled={loading} onClick={confirmEndMeeting} type="button">
                End Meeting
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {meetingEndedOverlay ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <p className="text-center font-display text-[24px] font-medium text-white sm:text-[30px]">The host has ended this meeting</p>
        </div>
      ) : null}
      {isHost && leaveToasts.length ? (
        <div className="fixed bottom-4 right-4 z-[9999] flex w-[280px] flex-col-reverse gap-3">
          {leaveToasts.map((toast) => (
            <div
              className={`relative overflow-hidden rounded-xl border border-border-default bg-white px-4 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.2)] ${
                toast.leaving ? '[animation:gatherly-toast-out_0.2s_ease-in_forwards]' : '[animation:gatherly-toast-in_0.25s_ease-out]'
              }`}
              key={toast.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[16px] font-bold uppercase text-white">
                  {(toast.displayName || 'P').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-text-primary">{toast.displayName}</p>
                  <p className="text-[13px] text-text-secondary">has left the meeting</p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-xl bg-brand-primary [animation:gatherly-toast-shrink_4s_linear_forwards]" />
            </div>
          ))}
          <style>
            {`@keyframes gatherly-toast-in { from { transform: translateX(120px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes gatherly-toast-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120px); opacity: 0; } }
@keyframes gatherly-toast-shrink { from { width: 100%; } to { width: 0%; } }`}
          </style>
        </div>
      ) : null}
      {whiteboardOpen ? <SharedWhiteboard meetingId={meetingId} onClose={closeHostWhiteboard} readOnly={whiteboardReadOnly} roomCode={roomCode} socket={socket} /> : null}
    </div>
  );
}
