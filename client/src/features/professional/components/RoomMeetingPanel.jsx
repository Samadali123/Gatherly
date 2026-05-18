import '@livekit/components-styles';
import { LiveKitRoom, PreJoin, VideoConference, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { AlertCircle, Check, MicOff, PenLine, Users, UserX, Video, VideoOff, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../../services/api';
import Spinner from '../../../shared/components/Spinner';
import SharedWhiteboard from './SharedWhiteboard';

const getMeetingErrorMessage = (error) => {
  const message = String(error?.message || error || '').toLowerCase();

  if (message.includes('invalid token')) {
    return 'Meeting token is invalid. Please check LiveKit URL, API key, and API secret.';
  }
  if (message.includes('permission') || message.includes('notallowed')) {
    return 'Camera or microphone permission was denied. Allow access in the browser and try again.';
  }
  if (message.includes('notreadable') || message.includes('device in use') || message.includes('could not start video')) {
    return 'Your camera is already being used by another browser or app. Turn it off there, then try again.';
  }
  if (message.includes('signal connection')) {
    return 'Could not connect to the meeting service. Please check the LiveKit configuration and try again.';
  }

  return error?.message || 'Unable to connect to meeting.';
};

function MeetingSocketControls({ onRemoved, socket, sessionId, setError }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    if (!socket || !sessionId || !localParticipant) return undefined;

    const forceMuted = async ({ sessionId: targetSessionId }) => {
      if (targetSessionId !== sessionId) return;
      await localParticipant.setMicrophoneEnabled(false);
      setError('The host muted your microphone.');
    };
    const forceCameraOff = async ({ sessionId: targetSessionId }) => {
      if (targetSessionId !== sessionId) return;
      await localParticipant.setCameraEnabled(false);
      setError('The host turned your camera off.');
    };
    const removed = ({ sessionId: targetSessionId }) => {
      if (targetSessionId !== sessionId) return;
      setError('The host removed you from the meeting.');
      onRemoved?.();
      room?.disconnect();
    };

    socket.on('room:meeting:force-muted', forceMuted);
    socket.on('room:meeting:force-camera-off', forceCameraOff);
    socket.on('room:meeting:removed', removed);

    return () => {
      socket.off('room:meeting:force-muted', forceMuted);
      socket.off('room:meeting:force-camera-off', forceCameraOff);
      socket.off('room:meeting:removed', removed);
    };
  }, [localParticipant, onRemoved, room, sessionId, setError, socket]);

  return null;
}

export default function RoomMeetingPanel({ roomCode, onClose, socket, session, meetingState, mode = 'host' }) {
<<<<<<< HEAD
  const terminalOverlayRef = useRef(false);
=======
  const meetingEndTimerRef = useRef(null);
  const finalMessageTimerRef = useRef(null);
  const intentionalExitRef = useRef(false);
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardReadOnly, setWhiteboardReadOnly] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [userChoices, setUserChoices] = useState(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [meetingEndedOverlay, setMeetingEndedOverlay] = useState(false);
<<<<<<< HEAD
  const [terminalMessage, setTerminalMessage] = useState('');
=======
  const [finalMessage, setFinalMessage] = useState('');
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
  const [leaveToasts, setLeaveToasts] = useState([]);
  const [controlsPosition, setControlsPosition] = useState(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [waitingRoomOpen, setWaitingRoomOpen] = useState(false);
  const [liveMeetingState, setLiveMeetingState] = useState(meetingState || { active: false, pending: [], approved: [], activeParticipants: [] });
  const dragStateRef = useRef(null);
  const meetingJoinedRef = useRef(false);
  const leaveToastTimersRef = useRef(new Map());
  const currentUser = { id: session?.sessionId };
  const activeMeeting = {
    hostId: liveMeetingState?.hostSessionId || (mode === 'host' ? session?.sessionId : null),
  };
  const isHost = mode === 'host' || Boolean(currentUser.id && activeMeeting.hostId && String(currentUser.id) === String(activeMeeting.hostId));
  const pendingRequests = liveMeetingState?.pending || [];
  const manageableParticipants = (liveMeetingState?.activeParticipants || []).filter((participant) => participant.sessionId !== session?.sessionId);
  const meetingId = roomCode;
  const hostActionText = 'Start meeting';
  const hostTitleText = 'Start room meeting';
<<<<<<< HEAD
  const meetingEndedText = terminalMessage || 'Meeting Ended';
  const liveKitAudioOptions = useMemo(() => {
    if (!userChoices?.audioEnabled) return false;
    return { deviceId: userChoices.audioDeviceId ? { exact: userChoices.audioDeviceId } : undefined };
  }, [userChoices?.audioDeviceId, userChoices?.audioEnabled]);
  const liveKitVideoOptions = useMemo(() => {
    if (!userChoices?.videoEnabled) return false;
    return { deviceId: userChoices.videoDeviceId ? { exact: userChoices.videoDeviceId } : undefined };
  }, [userChoices?.videoDeviceId, userChoices?.videoEnabled]);

  const showMeetingTerminal = (message) => {
    if (terminalOverlayRef.current) {
      return;
    }

    terminalOverlayRef.current = true;
    meetingJoinedRef.current = false;
    setError('');
=======
  const meetingEndedText = finalMessage || (isHost ? "You've ended the meeting." : 'The host has ended this meeting.');

  const showFinalMessageAndClose = (message) => {
    setFinalMessage(message);
    setMeetingEndedOverlay(true);
    if (finalMessageTimerRef.current) {
      window.clearTimeout(finalMessageTimerRef.current);
    }
    finalMessageTimerRef.current = window.setTimeout(() => {
      setMeetingEndedOverlay(false);
      setFinalMessage('');
      onClose?.();
    }, 1800);
  };

  const resetMeetingUi = () => {
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
    setMeeting(null);
    setUserChoices(null);
    setWaiting(false);
    setWhiteboardOpen(false);
    setWhiteboardReadOnly(false);
    setConfirmEndOpen(false);
    setParticipantsOpen(false);
    setWaitingRoomOpen(false);
<<<<<<< HEAD
    setLiveMeetingState({ active: false, pending: [], approved: [], activeParticipants: [] });
    setTerminalMessage(message);
    setMeetingEndedOverlay(true);
=======
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
  };

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
      setError(error.response?.data?.message || getMeetingErrorMessage(error));
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
      setError(error.response?.data?.message || getMeetingErrorMessage(error));
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
      intentionalExitRef.current = true;
      await api.delete(`/rooms/${roomCode}/meeting`);
      socket?.emit('meeting_ended', { meetingId });
<<<<<<< HEAD
      showMeetingTerminal('Meeting Ended');
=======
      meetingJoinedRef.current = false;
      resetMeetingUi();
      setError('');
      showFinalMessageAndClose("You've ended the meeting.");
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
    } catch (error) {
      intentionalExitRef.current = false;
      setError(error.response?.data?.message || 'Unable to end meeting.');
    } finally {
      setLoading(false);
      setConfirmEndOpen(false);
    }
  };

  const handleLiveKitDisconnected = () => {
<<<<<<< HEAD
    if (terminalOverlayRef.current) {
=======
    if (intentionalExitRef.current) {
      meetingJoinedRef.current = false;
      resetMeetingUi();
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
      return;
    }

    if (meetingJoinedRef.current) {
      if (!isHost) {
        socket?.emit('participant_left', {
          displayName: session?.alias || 'Participant',
          meetingId,
          userId: session?.sessionId,
        });
      }
      meetingJoinedRef.current = false;
    }

    showMeetingTerminal('You have left');
  };

  const leaveMeetingPanel = () => {
    if (isHost && (meeting || meetingJoinedRef.current || liveMeetingState?.active)) {
      setConfirmEndOpen(true);
      return;
    }

<<<<<<< HEAD
    if (waiting) {
      showMeetingTerminal('You have left');
      return;
    }

    setConfirmEndOpen(false);
    setParticipantsOpen(false);
    setWaitingRoomOpen(false);
=======
    if (meeting || meetingJoinedRef.current) {
      intentionalExitRef.current = true;
      if (!isHost && meetingJoinedRef.current) {
        socket?.emit('participant_left', {
          displayName: session?.alias || 'Participant',
          meetingId,
          userId: session?.sessionId,
        });
      }
      meetingJoinedRef.current = false;
      resetMeetingUi();
      setError('');
      showFinalMessageAndClose("You've left the meeting.");
      return;
    }

    resetMeetingUi();
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
    onClose?.();
  };


  const startControlsDrag = (event) => {
    if (event.button !== 0) return;
    const panel = event.currentTarget.closest('[data-meeting-control-panel]');
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setControlsPosition({ x: rect.left, y: rect.top });
    event.preventDefault();
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
      if (!sessionId || sessionId === session.sessionId) {
        joinApprovedMeeting();
      }
    };
    const handleMeetingState = (state) => {
      setLiveMeetingState(state || { active: false, pending: [], approved: [], activeParticipants: [] });
      if ((state?.pending || []).length) {
        setWaitingRoomOpen(true);
      }
    };
    const handleDenied = ({ sessionId }) => {
      if (sessionId === session.sessionId) {
        setWaiting(false);
        setError('The host did not admit you to this meeting.');
      }
    };
    const closeAfterMeetingEnded = () => {
<<<<<<< HEAD
      showMeetingTerminal('Meeting Ended');
=======
      meetingJoinedRef.current = false;
      resetMeetingUi();
      setError('');
      setLiveMeetingState({ active: false, pending: [], approved: [], activeParticipants: [] });
      showFinalMessageAndClose(isHost ? "You've ended the meeting." : 'The host has ended this meeting.');
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
    };
    const handleRoomEnded = closeAfterMeetingEnded;
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
    const handleMeetingEnded = closeAfterMeetingEnded;
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
    socket.on('room:meeting:state', handleMeetingState);
    socket.on('room:meeting:denied', handleDenied);
    socket.on('room:meeting:ended', handleRoomEnded);
    socket.on('whiteboard_opened', handleWhiteboardOpened);
    socket.on('whiteboard_closed', handleWhiteboardClosed);
    socket.on('meeting_ended', handleMeetingEnded);
    socket.on('participant_left_notify', handleParticipantLeftNotify);

    return () => {
      socket.off('room:meeting:approved', handleApproved);
      socket.off('room:meeting:state', handleMeetingState);
      socket.off('room:meeting:denied', handleDenied);
      socket.off('room:meeting:ended', handleRoomEnded);
      socket.off('whiteboard_opened', handleWhiteboardOpened);
      socket.off('whiteboard_closed', handleWhiteboardClosed);
      socket.off('meeting_ended', handleMeetingEnded);
      socket.off('participant_left_notify', handleParticipantLeftNotify);
      leaveToastTimersRef.current.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
      leaveToastTimersRef.current.clear();
    };
  }, [isHost, meetingId, session?.sessionId, socket]);

  useEffect(() => {
    setLiveMeetingState(meetingState || { active: false, pending: [], approved: [], activeParticipants: [] });
  }, [meetingState]);

  useEffect(() => {
    if (meetingEndedOverlay) {
      const timer = window.setTimeout(() => {
        setMeetingEndedOverlay(false);
        setTerminalMessage('');
        terminalOverlayRef.current = false;
        onClose?.();
      }, 3500);
      return () => window.clearTimeout(timer);
    }
  }, [meetingEndedOverlay, onClose]);

  useEffect(() => {
    const handleMove = (event) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      setControlsPosition({
        x: Math.max(8, Math.min(window.innerWidth - drag.width - 8, event.clientX - drag.offsetX)),
        y: Math.max(8, Math.min(window.innerHeight - drag.height - 8, event.clientY - drag.offsetY)),
      });
    };
    const handleUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[75] flex items-center justify-center p-0 sm:px-4 sm:py-6 ${meetingEndedOverlay ? 'bg-transparent' : 'bg-[rgba(15,31,27,0.82)]'}`}>
      <div className={`flex h-full w-full max-w-6xl flex-col overflow-hidden border border-white/15 bg-[#081713] shadow-[0_22px_90px_rgba(0,0,0,0.35)] transition-opacity sm:max-h-[900px] sm:rounded-xl ${meetingEndedOverlay ? 'opacity-0' : 'opacity-100'}`}>
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
                  <h3 className="font-display text-[24px] font-medium text-text-primary">{isHost ? hostTitleText : 'Join room meeting'}</h3>
                </div>
<<<<<<< HEAD
                <div className="gatherly-prejoin">
                  <PreJoin
                    camLabel="Camera"
                    defaults={{
                      username: session?.alias || 'Gatherly user',
                      audioEnabled: true,
                      videoEnabled: true,
                    }}
                    joinLabel={isHost ? hostActionText : 'Join meeting'}
                    micLabel="Microphone"
                    onError={(nextError) => setError(getMeetingErrorMessage(nextError))}
                    onSubmit={(choices) => setUserChoices(choices)}
                    userLabel="Display name"
                  />
                </div>
=======
                <PreJoin
                  camLabel="Camera"
                  defaults={{
                    username: session?.alias || 'Gatherly user',
                    audioEnabled: true,
                    videoEnabled: true,
                  }}
                  joinLabel={isHost ? hostActionText : 'Join meeting'}
                  micLabel="Microphone"
                  onError={(nextError) => {
                    if (!intentionalExitRef.current) {
                      setError(getMeetingErrorMessage(nextError));
                    }
                  }}
                  onSubmit={(choices) => setUserChoices(choices)}
                  userLabel="Display name"
                />
>>>>>>> d31212618874aadfaf24e00d1a37e4d63399429f
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
                  liveKitAudioOptions
                }
                connect
                data-lk-theme="default"
                onDisconnected={handleLiveKitDisconnected}
                onError={(nextError) => {
                  if (!intentionalExitRef.current) {
                    setError(getMeetingErrorMessage(nextError));
                  }
                }}
                serverUrl={meeting.url}
                token={meeting.token}
                video={
                  liveKitVideoOptions
                }
                className="h-full"
              >
                <MeetingSocketControls
                  onRemoved={() => showMeetingTerminal('You have left')}
                  sessionId={session?.sessionId}
                  setError={setError}
                  socket={socket}
                />
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
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white px-4 text-[13px] font-medium text-brand-primary shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                    onClick={() => setWaitingRoomOpen((current) => !current)}
                    type="button"
                  >
                    <Users size={16} strokeWidth={1.7} />
                    Waiting room{pendingRequests.length ? ` (${pendingRequests.length})` : ''}
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white px-4 text-[13px] font-medium text-brand-primary shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                    onClick={() => setParticipantsOpen((current) => !current)}
                    type="button"
                  >
                    <Users size={16} strokeWidth={1.7} />
                    View participants{manageableParticipants.length ? ` (${manageableParticipants.length})` : ''}
                  </button>
                </div>
              ) : null}
              {isHost && waitingRoomOpen ? (
                <div className="absolute inset-x-2 bottom-2 z-10 max-h-[45vh] overflow-y-auto rounded-xl border border-white/15 bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[300px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-text-secondary">Waiting room</p>
                    <button className="text-text-secondary" onClick={() => setWaitingRoomOpen(false)} type="button"><X size={16} /></button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {pendingRequests.length ? pendingRequests.map((request) => (
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
                    )) : <p className="text-[14px] leading-[1.6] text-text-secondary">No one is waiting yet.</p>}
                  </div>
                </div>
              ) : null}
              {isHost && participantsOpen ? (
                <div
                  className={`z-10 max-h-[45vh] w-[min(92vw,320px)] overflow-y-auto rounded-xl border border-white/15 bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] ${controlsPosition ? 'fixed' : 'absolute bottom-2 right-2 sm:bottom-4 sm:right-4'}`}
                  data-meeting-control-panel
                  style={controlsPosition ? { left: controlsPosition.x, top: controlsPosition.y } : undefined}
                >
                  <div className="-mx-1 -mt-1 mb-3 cursor-move rounded-lg px-1 py-1" onMouseDown={startControlsDrag} role="presentation">
                    <div className="flex items-center justify-between gap-3">
                      <p className="select-none text-[12px] font-medium uppercase tracking-[0.18em] text-text-secondary">Participants</p>
                      <button className="cursor-pointer text-text-secondary" onClick={() => setParticipantsOpen(false)} type="button"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {manageableParticipants.length ? manageableParticipants.map((participant) => (
                        <div className="rounded-xl border border-border-default bg-bg-secondary p-3" key={participant.sessionId}>
                          <p className="truncate font-medium text-text-primary">{participant.displayName || 'Participant'}</p>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <button className="inline-flex min-h-9 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary" onClick={() => socket?.emit('room:meeting:force-mute', { sessionId: participant.sessionId })} type="button" title="Mute microphone">
                              <MicOff size={15} />
                            </button>
                            <button className="inline-flex min-h-9 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary" onClick={() => socket?.emit('room:meeting:force-camera-off', { sessionId: participant.sessionId })} type="button" title="Turn camera off">
                              <VideoOff size={15} />
                            </button>
                            <button className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#f2cec1] bg-[#fff4ef] text-[#9a3412]" onClick={() => socket?.emit('room:meeting:remove-participant', { sessionId: participant.sessionId })} type="button" title="Remove participant">
                              <UserX size={15} />
                            </button>
                          </div>
                        </div>
                      )) : <p className="text-[14px] leading-[1.6] text-text-secondary">No participants joined yet.</p>}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="scrollbar-chat flex h-full items-center justify-center overflow-y-auto p-3 sm:p-6">
              <div className={`grid w-full gap-4 ${isHost ? 'max-w-4xl md:grid-cols-[minmax(0,1fr)_300px]' : 'max-w-2xl'}`}>
              <div className="rounded-xl border border-white/10 bg-white p-5 text-center sm:p-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
                  <Video size={24} strokeWidth={1.7} />
                </div>
                <h3 className="mt-4 font-display text-[26px] font-medium text-text-primary">{isHost ? hostTitleText : 'Join room meeting'}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
                  {isHost ? 'Start the meeting and admit people from the waiting room.' : 'Ask the host to admit you before joining the room meeting.'}
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
                  {waiting ? 'Waiting for host' : isHost ? hostActionText : 'Request to join'}
                </button>
              </div>
              {isHost ? (
              <div className="rounded-xl border border-white/10 bg-white p-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Waiting room</p>
                  <div className="mt-4 space-y-3">
                    {pendingRequests.length ? pendingRequests.map((request) => (
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
              </div>
              ) : null}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,23,19,0.72)] px-4 backdrop-blur-[2px]">
          <div className="relative rounded-2xl border border-white/15 bg-[#081713]/80 px-8 py-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
            <button
              className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
              onClick={() => {
                setMeetingEndedOverlay(false);
                setTerminalMessage('');
                terminalOverlayRef.current = false;
                onClose?.();
              }}
              type="button"
            >
              <X size={18} strokeWidth={2} />
            </button>
            <p className="font-display text-[26px] font-medium text-white sm:text-[34px]">{meetingEndedText}</p>
            <p className="mt-2 text-[13px] text-white/70">Returning to room...</p>
          </div>
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
