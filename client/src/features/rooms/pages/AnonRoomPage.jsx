import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import Spinner from '../../../shared/components/Spinner';
import { useAuthStore } from '../../auth/authStore';
import ChatInput from '../../chat/components/ChatInput';
import MessageBubble from '../../chat/components/MessageBubble';
import PinsDrawer from '../../chat/components/PinsDrawer';
import ThreadPanel from '../../chat/components/ThreadPanel';
import { useUiStore } from '../../chat/chatStore';
import JoinRoomModal from '../components/JoinRoomModal';
import ParticipantList from '../components/ParticipantList';

const RoomMeetingPanel = lazy(() => import('../../professional/components/RoomMeetingPanel'));

export default function AnonRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { pushToast } = useUiStore();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [session, setSession] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [pinsOpen, setPinsOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadParent, setThreadParent] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingMode, setMeetingMode] = useState('host');
  const [meetingState, setMeetingState] = useState({ active: false, pending: [], approved: [] });
  const [kicked, setKicked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const roomCreatorId = room?.createdBy?._id || room?.createdBy;
  const canKick = Boolean(user?.id && roomCreatorId && String(roomCreatorId) === String(user.id));
  const canUseMeetings = user?.role === 'professional';
  const passwordRequired = Boolean(room?.requiresPassword);
  const roomEnded = Boolean(room?.expiresAt && new Date(room.expiresAt).getTime() <= now);
  const canOpenMeeting = Boolean(canUseMeetings && session?.sessionId && !roomEnded && (canKick || meetingState.active));
  const roomEndedMessage = 'Time ended for this room. Sorry, nobody can chat here now.';

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const roomResponse = await api.get(`/rooms/${code}`);
        if (!active) {
          return;
        }

        setRoom(roomResponse.data.data);

        try {
          const sessionResponse = await api.get(`/rooms/${code}/session`);
          const currentSession = sessionResponse.data.data;
          setSession(currentSession);

          const [participantResponse, messageResponse, pollResponse] = await Promise.all([
            api.get(`/rooms/${code}/participants`),
            api.get(`/rooms/${code}/messages`),
            api.get(`/rooms/${code}/polls`),
          ]);

          if (!active) {
            return;
          }

          setParticipants(participantResponse.data.data || []);
          setMessages(messageResponse.data.data || []);
          setPolls(pollResponse.data.data || []);
        } catch {
          if (active) {
            setSession(null);
          }
        }
      } catch (error) {
        if (active) {
          pushToast(error.response?.data?.message || 'Unable to load room', 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [code, pushToast]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!session?.sessionId || !code) {
      return undefined;
    }

    const anonSocket = io('/', {
      transports: ['websocket'],
      auth: {
        sessionId: session.sessionId,
        roomCode: code,
      },
    });

    anonSocket.on('room:message:new', (message) => {
      setMessages((current) => [...current, message]);
    });

    anonSocket.on('room:message:updated', (message) => {
      setMessages((current) => current.map((entry) => (entry._id === message._id ? message : entry)));
      setThreadParent((current) => (current?._id === message._id ? message : current));
    });

    anonSocket.on('room:poll:new', (poll) => {
      setPolls((current) => [...current, poll]);
    });

    anonSocket.on('room:poll:updated', (poll) => {
      setPolls((current) => current.map((entry) => ((entry.id || entry._id) === (poll.id || poll._id) ? poll : entry)));
    });

    anonSocket.on('room:joined', async () => {
      try {
        const response = await api.get(`/rooms/${code}/participants`);
        setParticipants(response.data.data || []);
      } catch {}
    });

    anonSocket.on('room:left', async () => {
      try {
        const response = await api.get(`/rooms/${code}/participants`);
        setParticipants(response.data.data || []);
      } catch {}
    });

    anonSocket.on('room:participant:kicked', ({ sessionId, message }) => {
      setParticipants((current) => current.filter((participant) => participant.sessionId !== sessionId));

      if (sessionId === session.sessionId) {
        setKicked(true);
        setMeetingOpen(false);
        setMeetingState({ active: false, pending: [], approved: [] });
        setThreadOpen(false);
        setPinsOpen(false);
        pushToast(message || 'You are no longer in this room.', 'error');
        anonSocket.disconnect();
      }
    });

    anonSocket.on('room:expired', () => {
      setRoom((current) => (current ? { ...current, isActive: false, expiresAt: current.expiresAt || new Date().toISOString() } : current));
      setMeetingOpen(false);
      pushToast(roomEndedMessage, 'error');
    });

    anonSocket.on('room:error', ({ message }) => {
      pushToast(message || 'Unable to complete this room action.', 'error');
    });

    anonSocket.on('room:deleted', ({ message }) => {
      pushToast(message || 'This room was deleted by the host.', 'info');
      anonSocket.emit('room:deleted:ack');
      navigate('/rooms/new');
    });

    anonSocket.on('room:meeting:state', (state) => {
      setMeetingState(state || { active: false, pending: [], approved: [] });
    });

    anonSocket.on('room:meeting:ended', () => {
      setMeetingState({ active: false, pending: [], approved: [] });
      pushToast('The room meeting ended', 'info');
    });

    anonSocket.on('participant_list_update', ({ userId, action }) => {
      if (action === 'left') {
        setParticipants((current) => current.filter((participant) => participant.sessionId !== userId && participant.id !== userId));
        setMeetingState((current) => ({
          ...current,
          activeParticipants: (current.activeParticipants || []).filter((participant) => participant.sessionId !== userId && participant.id !== userId),
          approved: (current.approved || []).filter((sessionId) => sessionId !== userId),
        }));
      }
    });

    anonSocket.emit('room:meeting:state:request');

    setSocketInstance(anonSocket);

    return () => {
      anonSocket.disconnect();
      setSocketInstance(null);
    };
  }, [code, navigate, pushToast, session]);

  const roomCountdown = useMemo(() => {
    if (!room?.expiresAt) {
      return '';
    }

    const totalSeconds = Math.max(0, Math.floor((new Date(room.expiresAt).getTime() - now) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m left`;
    }

    return `${hours}h ${minutes}m ${seconds}s left`;
  }, [now, room?.expiresAt]);

  const joinRoom = async (password) => {
    setJoinLoading(true);
    try {
      setJoinError('');
      await api.post(`/rooms/${code}/join`, { password });
      const [sessionResponse, participantResponse, messageResponse, pollResponse] = await Promise.all([
        api.get(`/rooms/${code}/session`),
        api.get(`/rooms/${code}/participants`),
        api.get(`/rooms/${code}/messages`),
        api.get(`/rooms/${code}/polls`),
      ]);

      setSession(sessionResponse.data.data);
      setParticipants(participantResponse.data.data || []);
      setMessages(messageResponse.data.data || []);
      setPolls(pollResponse.data.data || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to join room';
      setJoinError(message);
      pushToast(message, 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const uploadAnonAttachments = async ({ type, files }) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      throw new Error('Kicked from room');
    }

    const formData = new FormData();
    formData.append('type', type);
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await api.post(`/rooms/${code}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data || [];
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to upload attachment', 'error');
      throw error;
    }
  };

  const sendAnonMessage = async (content, attachments = [], parentMessageId = null) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      return;
    }

    socketInstance?.emit('room:message:send', { content, parentMessageId, attachments });
  };

  const createAnonPoll = async ({ question, options }) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      return;
    }

    socketInstance?.emit('room:poll:create', { question, options });
  };

  const voteAnonPoll = async (pollId, optionId) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      return;
    }

    socketInstance?.emit('room:poll:vote', { pollId, optionId });
  };

  const reactToMessage = (message, emoji) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      return;
    }

    socketInstance?.emit('room:message:react', { messageId: message._id, emoji });
  };

  const pinMessage = (message) => {
    if (kicked || roomEnded) {
      pushToast(kicked ? 'You are no longer in this room.' : roomEndedMessage, 'error');
      return;
    }

    socketInstance?.emit(message.isPinned ? 'room:message:unpin' : 'room:message:pin', { messageId: message._id });
  };

  const openReplies = (message) => {
    setThreadParent(message);
    setThreadOpen(true);
  };

  const sendReply = async (content, attachments = []) => {
    if (!threadParent) {
      return;
    }

    await sendAnonMessage(content, attachments, threadParent._id);
  };

  const pins = messages.filter((message) => message.isPinned);
  const visibleMessages = messages;
  const threadReplies = threadParent
    ? messages.filter((message) => String(message.parentMessageId) === String(threadParent._id))
    : [];

  const mapAnonMessage = (message) => ({
    ...message,
    msg: message.content,
    sender: message.sessionId,
    anonymousAvatar: { color: message.avatarColor, label: message.alias || message.avatarAnimal },
  });

  const focusOriginalMessage = (messageId) => {
    const id = String(messageId || '');
    const target = document.getElementById(`message-${id}`);

    if (!target) {
      pushToast('Original message not available', 'info');
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(id);
    window.setTimeout(() => setHighlightedMessageId((current) => (current === id ? null : current)), 1500);
  };

  const kickParticipant = async (sessionId) => {
    try {
      await api.delete(`/rooms/${code}/participants/${sessionId}`);
      setParticipants((current) => current.filter((participant) => participant.sessionId !== sessionId));
      pushToast('Participant removed', 'success');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to remove participant', 'error');
    }
  };

  const deleteRoom = async () => {
    try {
      await api.delete(`/rooms/${code}`);
      pushToast('Room deleted', 'success');
      navigate('/rooms/new');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to delete room', 'error');
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-transparent px-2 py-2 sm:px-6 sm:py-4">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-4">
        <nav className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary px-3 py-3 shadow-card sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Gatherly</p>
            <p className="truncate font-display text-[18px] font-medium text-text-primary">{room?.name || 'Anonymous room'}</p>
          </div>
          <div className="scrollbar-chat -mx-1 flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 lg:justify-end lg:pb-0">
            <span className="rounded-full border border-border-default bg-brand-subtle px-3 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-text-secondary">
              {roomEnded ? 'Ended' : roomCountdown}
            </span>
            <Link className="rounded-full border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary" to="/chat">
              Chat
            </Link>
            <Link className="rounded-full border border-brand-primary bg-brand-subtle px-4 py-2 text-[13px] font-medium text-brand-primary" to="/rooms/new">
              Rooms
            </Link>
            {canOpenMeeting ? (
              <button
                className="rounded-full bg-brand-primary px-4 py-2 text-[13px] font-medium text-white"
                onClick={() => {
                  setMeetingMode(canKick ? 'host' : 'join');
                  setMeetingOpen(true);
                }}
                type="button"
              >
                {canKick ? 'Start meeting' : 'Join meeting'}
              </button>
            ) : null}
            {session?.sessionId && !kicked ? (
              canKick ? (
                <button
                  className="rounded-full border border-[#f2cec1] bg-white px-4 py-2 text-[13px] font-medium text-[#9a3412] hover:bg-[#fff4ef]"
                  onClick={() => setDeleteConfirmOpen(true)}
                  type="button"
                >
                  Delete room
                </button>
              ) : null
            ) : null}
          </div>
        </nav>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-card">
          {meetingState.active && session?.sessionId && meetingState.hostSessionId !== session.sessionId ? (
            <div className="shrink-0 border-b border-border-default bg-brand-subtle px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-brand-primary">Live meeting</p>
                  <p className="text-[14px] text-text-primary">{meetingState.hostAlias || 'Host'} started a room meeting.</p>
                </div>
                <button
                  className="min-h-10 rounded-full bg-brand-primary px-4 text-[13px] font-medium text-white"
                  onClick={() => {
                    setMeetingMode('join');
                    setMeetingOpen(true);
                  }}
                  type="button"
                >
                  Join meeting
                </button>
              </div>
            </div>
          ) : null}
          {kicked ? (
            <div className="shrink-0 border-b border-[#f2cec1] bg-[#fff4ef] px-5 py-3 text-[14px] font-medium text-[#7c2d12]">
              You are no longer in this room.
            </div>
          ) : null}
          {roomEnded ? (
            <div className="shrink-0 border-b border-[#f2cec1] bg-[#fff4ef] px-5 py-3 text-[14px] font-medium text-[#7c2d12]">
              {roomEndedMessage}
            </div>
          ) : null}
          {pins[0] ? (
          <div className="shrink-0 border-b border-border-default px-5 py-4">
              <button
                className="flex w-full items-center justify-between rounded-xl border border-border-default bg-white px-4 py-3 text-left"
                onClick={() => setPinsOpen(true)}
                type="button"
              >
                <span className="truncate text-[14px] text-text-primary">Pinned: {pins[0].content}</span>
                <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-brand-primary">View all</span>
              </button>
          </div>
          ) : null}

            <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-5 sm:py-6" data-chat-conversation-area>
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-4">
            {polls.map((poll) => (
              <div className="rounded-xl border border-border-default bg-white p-4 shadow-card" key={poll.id || poll._id}>
                <p className="text-[15px] font-medium text-text-primary">{poll.question}</p>
                <div className="mt-3 space-y-2">
                  {poll.options.map((option) => (
                    <button
                      className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border-default bg-bg-secondary px-3 py-2 text-left text-[14px] text-text-primary transition hover:border-brand-primary hover:bg-brand-subtle"
                      key={option.id}
                      onClick={() => voteAnonPoll(poll.id || poll._id, option.id)}
                      disabled={kicked || roomEnded}
                      type="button"
                    >
                      <span>{option.text}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[12px] text-text-secondary">{option.voteCount || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {visibleMessages.map((message) => (
              <MessageBubble
                isOwnOverride={message.sessionId === session?.sessionId}
                key={message._id || `${message.sessionId}-${message.createdAt}`}
                message={mapAnonMessage(message)}
                onPin={pinMessage}
                onReact={reactToMessage}
                onReply={openReplies}
                onReplyPreviewClick={focusOriginalMessage}
                onToggleReaction={reactToMessage}
                allowPin={Boolean(message._id)}
                allowReply={Boolean(message._id)}
                highlighted={String(highlightedMessageId) === String(message._id)}
              />
            ))}
            {!visibleMessages.length && !polls.length ? (
              <div className="rounded-xl border border-dashed border-border-default bg-white px-4 py-8 text-center text-[14px] text-text-secondary">
                No messages yet. Start the room with a simple hello.
              </div>
            ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-border-default bg-bg-primary">
            <div className="mx-auto max-w-3xl">
              <ChatInput
                disabled={kicked || roomEnded || !session}
                onCreatePoll={createAnonPoll}
                onSend={(content, attachments) => sendAnonMessage(content, attachments)}
                onUploadAttachments={uploadAnonAttachments}
              />
            </div>
          </div>
        </section>

        <aside className="scrollbar-chat hidden min-h-0 overflow-y-auto rounded-xl border border-border-default bg-bg-primary p-5 shadow-card xl:block">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Participants</p>
          <div className="mt-4">
            <ParticipantList currentSessionId={session?.sessionId} canKick={canKick} onKick={kickParticipant} participants={participants} />
          </div>
        </aside>
      </div>
      </div>

      <JoinRoomModal
        errorMessage={joinError}
        loading={joinLoading}
        onCancel={() => navigate('/rooms/new')}
        onJoin={joinRoom}
        open={!session}
        passwordRequired={passwordRequired}
      />
      <PinsDrawer
        canUnpin={(message) => message.sender === session?.sessionId}
        open={pinsOpen}
        onClose={() => setPinsOpen(false)}
        onUnpin={pinMessage}
        pins={pins.map(mapAnonMessage)}
      />
      <ThreadPanel
        open={threadOpen}
        onClose={() => setThreadOpen(false)}
        onReply={sendReply}
        onUploadAttachments={uploadAnonAttachments}
        disabled={kicked}
        parent={threadParent ? mapAnonMessage(threadParent) : null}
        replies={threadReplies.map(mapAnonMessage)}
      />
      {meetingOpen ? (
        <Suspense fallback={<div className="fixed inset-0 z-[75] flex items-center justify-center bg-[rgba(15,31,27,0.82)]"><Spinner size="lg" /></div>}>
          <RoomMeetingPanel
            meetingState={meetingState}
            mode={meetingMode}
            onClose={() => setMeetingOpen(false)}
            roomCode={code}
            session={session}
            socket={socketInstance}
          />
        </Suspense>
      ) : null}
      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border-default bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <h2 className="font-display text-[22px] font-medium text-text-primary">Delete this room?</h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
              This will delete all room messages, polls, and participants.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-full border border-border-default px-5 text-[14px] font-medium text-text-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                type="button"
              >
                No
              </button>
              <button
                className="min-h-11 rounded-full bg-[#c2410c] px-5 text-[14px] font-medium text-white"
                onClick={deleteRoom}
                type="button"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
