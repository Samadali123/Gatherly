import {
  Edit3,
  Menu,
  MessageCircleMore,
  Moon,
  MoreVertical,
  Phone,
  Reply,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import Avatar from '../../../shared/components/Avatar';
import Spinner from '../../../shared/components/Spinner';
import StatusViewer from '../../status/components/StatusViewer';
import { useAuthStore } from '../../auth/authStore';
import ChatInput from '../components/ChatInput';
import ConversationList from '../components/ConversationList';
import MessageBubble from '../components/MessageBubble';
import PinnedBanner from '../components/PinnedBanner';
import PinsDrawer from '../components/PinsDrawer';
import ThreadPanel from '../components/ThreadPanel';
import { useChatStore, useUiStore } from '../chatStore';
import { useChat } from '../hooks/useChat';
import { useSocket } from '../hooks/useSocket';
import VideoCallOverlay from '../../video/components/VideoCallOverlay';
import { useWebRTCCall } from '../../video/hooks/useWebRTCCall';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const { pushToast } = useUiStore();
  const [myStatuses, setMyStatuses] = useState([]);
  const [statusGroups, setStatusGroups] = useState([]);
  const [myStatusOpen, setMyStatusOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const {
    isSidebarOpen,
    setSidebarOpen,
    activeConversation,
    pinsOpen,
    setPinsOpen,
    threadOpen,
    setThreadOpen,
    threadParent,
    threadMessages,
  } = useChatStore();
  const {
    contacts,
    messages,
    pins,
    loadingConversation,
    sending,
    selectConversation,
    sendMessage,
    pinMessage,
    unpinMessage,
    fetchThread,
    sendThreadReply,
    uploadAttachments,
    addReaction,
    toggleReaction,
    deleteMessage,
    clearConversation,
  } = useChat();
  const videoCall = useWebRTCCall(user);

  useSocket({
    currentConversationKey: activeConversation?.key,
    currentReceiver: activeConversation?.name || activeConversation?.username,
  });

  useEffect(() => {
    api
      .get('/statuses')
      .then((response) => {
        const mine = response.data.data?.mine || [];
        const updates = response.data.data?.updates || [];
        const grouped = new Map();
        updates.forEach((status) => {
          const id = status.userId?._id || status.userId?.username;
          if (!id) return;
          const existing = grouped.get(id) || { user: status.userId, statuses: [], canReply: true };
          existing.statuses.push(status);
          grouped.set(id, existing);
        });
        setMyStatuses(mine);
        setStatusGroups([
          ...(mine.length ? [{ user, statuses: mine, canReply: false }] : []),
          ...Array.from(grouped.values()),
        ]);
      })
      .catch(() => {
        setMyStatuses([]);
        setStatusGroups([]);
      });
  }, []);

  useEffect(() => {
    api
      .get('/calls')
      .then((response) => setCallLogs(response.data.data || []))
      .catch(() => setCallLogs([]));
  }, [videoCall.call.state]);

  useEffect(() => {
    const event = videoCall.lastCallEvent;
    if (!event?.id) {
      return;
    }

    const peerName = event.peer?.displayName || event.peer?.name || event.peer?.username || 'User';
    if (event.reason === 'missed' || event.reason === 'rejected') {
      pushToast(`${peerName} did not answer the call.`, 'info', 'Video call');
    } else if (event.reason === 'disconnected') {
      pushToast('The call was disconnected.', 'info', 'Video call');
    }
  }, [pushToast, videoCall.lastCallEvent]);

  const subtitle = useMemo(() => {
    if (!activeConversation) {
      return 'Choose a person to begin.';
    }

    return 'Direct message';
  }, [activeConversation]);

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

  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-[min(88vw,320px)] border-r border-border-default bg-bg-tertiary shadow-[0_18px_70px_rgba(23,35,32,0.22)] transition duration-300 lg:static lg:inset-auto lg:w-auto lg:translate-x-0 lg:shadow-none`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border-default px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  className={`rounded-full p-1 ${myStatuses.length ? 'bg-brand-primary' : 'bg-transparent'}`}
                  disabled={!myStatuses.length}
                  onClick={() => setMyStatusOpen(true)}
                  type="button"
                >
                  <Avatar name={user?.name || user?.email} src={user?.avatar} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium text-text-primary">{user?.name}</p>
                  {user?.dndActive ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-primary">
                      <Moon size={12} strokeWidth={1.5} />
                      DND
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative">
                  <button
                    className={`relative flex min-h-10 min-w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-subtle hover:text-brand-primary ${
                      profileMenuOpen ? 'bg-brand-subtle text-brand-primary' : ''
                    }`}
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    type="button"
                  >
                    <MoreVertical size={18} strokeWidth={1.7} />
                  </button>
                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 overflow-hidden rounded-xl border border-border-default bg-white p-2 shadow-[0_18px_60px_rgba(23,35,32,0.16)]">
                      <button
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary transition hover:bg-brand-subtle"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setProfilePreviewOpen(true);
                        }}
                        type="button"
                      >
                        <UserRound size={15} strokeWidth={1.6} />
                        View profile
                      </button>
                      <Link
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-text-primary transition hover:bg-brand-subtle"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setSidebarOpen(false);
                        }}
                        to="/profile/edit"
                      >
                        <Edit3 size={15} strokeWidth={1.6} />
                        Edit profile
                      </Link>
                    </div>
                  ) : null}
                </div>
                <button
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                  type="button"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-border-default px-4 py-3">
            <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Conversations</p>
            <p className="mt-1 text-[13px] text-text-secondary">{contacts.length} people available</p>
            {callLogs.length ? <p className="mt-1 text-[12px] text-text-secondary">{callLogs.length} recent calls</p> : null}
          </div>

          <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <ConversationList
              activeConversation={activeConversation}
              contacts={contacts}
              onSelect={selectConversation}
            />
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-bg-primary">
        <div className="border-b border-border-default bg-bg-primary px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <Menu size={18} strokeWidth={1.5} />
              </button>
              <div className="min-w-0">
                <h2 className="truncate font-display text-[20px] font-medium leading-[1.35] text-text-primary">
                  {activeConversation?.displayName || activeConversation?.name || activeConversation?.username || 'Your inbox'}
                </h2>
                <p className="text-[13px] text-text-secondary">{subtitle}</p>
              </div>
            </div>
            {activeConversation ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary md:hidden"
                  onClick={() => videoCall.startCall(activeConversation)}
                  type="button"
                >
                  <Phone size={17} strokeWidth={1.6} />
                </button>
              </div>
            ) : null}
            {activeConversation ? (
              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-default bg-white px-3 text-[13px] font-medium text-text-secondary sm:min-h-11 sm:px-4"
                  onClick={() => videoCall.startCall(activeConversation)}
                  type="button"
                >
                  <Phone size={16} strokeWidth={1.5} />
                  Call
                </button>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-default bg-white px-3 text-[13px] font-medium text-text-secondary sm:min-h-11 sm:px-4"
                  onClick={clearConversation}
                  type="button"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                  Clear
                </button>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-default bg-white px-3 text-[13px] font-medium text-text-secondary sm:min-h-11 sm:px-4"
                  onClick={() => setThreadOpen(true)}
                  type="button"
                >
                  <Reply size={16} strokeWidth={1.5} />
                  Replies
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <PinnedBanner message={pins[0]} onViewAll={() => setPinsOpen(true)} />

            <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-5 sm:py-5">
              {loadingConversation ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : activeConversation ? (
                <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id || `${message.sender}-${message.createdAt}`}
                      message={message}
                      onPin={message.isPinned ? unpinMessage : pinMessage}
                      onReact={addReaction}
                      onReply={fetchThread}
                      onReplyPreviewClick={focusOriginalMessage}
                      onToggleReaction={toggleReaction}
                      onDelete={deleteMessage}
                      allowPin={Boolean(message._id)}
                      allowReply={Boolean(message._id)}
                      highlighted={String(highlightedMessageId) === String(message._id)}
                    />
                  ))}
                  {!messages.length ? (
                    <div className="rounded-xl border border-dashed border-border-default bg-white px-4 py-8 text-center text-[14px] text-text-secondary">
                      No messages yet. Start the conversation with a simple hello.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="mx-3 max-w-md rounded-xl border border-border-default bg-white p-5 text-center shadow-card sm:p-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
                      <MessageCircleMore size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-[28px] font-medium leading-[1.3] tracking-[-0.01em] text-text-primary">
                      Choose a conversation
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.6] text-text-secondary">
                      Pick a person from the left side to start chatting.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {activeConversation ? (
              <div className="border-t border-border-default bg-bg-primary">
                <div className="mx-auto w-full max-w-3xl">
                  <ChatInput
                    disabled={sending}
                    onSend={(content, attachments) => sendMessage(content, null, null, attachments)}
                    onUploadAttachments={uploadAttachments}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <PinsDrawer
        canUnpin={(message) => message.sender === user?.username || message.sender === user?.email}
        open={pinsOpen}
        onClose={() => setPinsOpen(false)}
        onUnpin={unpinMessage}
        pins={pins}
      />
      <ThreadPanel
        open={threadOpen}
        onClose={() => setThreadOpen(false)}
        onReply={sendThreadReply}
        onUploadAttachments={uploadAttachments}
        parent={threadParent}
        replies={threadMessages}
      />
      {myStatusOpen ? (
        <StatusViewer
          canReply={false}
          groups={statusGroups}
          onClose={() => setMyStatusOpen(false)}
          statuses={myStatuses}
          user={user}
        />
      ) : null}
      {profilePreviewOpen ? (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/55 px-4 py-6" onClick={() => setProfilePreviewOpen(false)}>
          <div
            className="w-full max-w-sm rounded-xl border border-border-default bg-bg-primary p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              alt={user?.name || 'Profile'}
              className="mx-auto h-28 w-28 rounded-full border border-border-default object-cover shadow-card"
              src={user?.avatar || user?.profileImage}
            />
            <h3 className="mt-4 truncate font-display text-[24px] font-medium text-text-primary">{user?.name || 'Your profile'}</h3>
            <p className="mt-1 truncate text-[14px] text-text-secondary">@{user?.username}</p>
            {user?.bio ? <p className="mt-4 text-[14px] leading-[1.6] text-text-primary">{user.bio}</p> : null}
            <button
              className="mt-6 min-h-11 w-full rounded-full border border-border-default bg-white px-4 text-[14px] font-medium text-text-secondary transition hover:border-brand-primary hover:text-brand-primary"
              onClick={() => setProfilePreviewOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <VideoCallOverlay
        call={videoCall.call}
        cameraOff={videoCall.cameraOff}
        duration={videoCall.duration}
        localVideoRef={videoCall.localVideoRef}
        muted={videoCall.muted}
        onAccept={videoCall.acceptCall}
        onEnd={videoCall.endCall}
        onReject={videoCall.rejectCall}
        onSwitchCamera={videoCall.switchCamera}
        onToggleCamera={videoCall.toggleCamera}
        onToggleMute={videoCall.toggleMute}
        remoteVideoRef={videoCall.remoteVideoRef}
      />
    </div>
  );
}
