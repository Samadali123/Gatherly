import { ChevronLeft, ChevronRight, Download, Eye, FileText, Pin, Reply, Smile, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../../../shared/utils/formatDate';
import { useAuthStore } from '../../auth/authStore';
import EmojiPicker from './EmojiPicker';
import MediaPlayer from './MediaPlayer';

export default function MessageBubble({
  message,
  isOwnOverride,
  onReply,
  onPin,
  onDelete,
  onReact,
  onToggleReaction,
  onReplyPreviewClick,
  allowReply,
  allowPin,
  allowDelete,
  allowReact,
  highlighted = false,
}) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwn = isOwnOverride ?? (message.sender === currentUser?.email || message.sender === currentUser?.username);
  const isCallSystemMessage = message.statusContext?.type === 'call';
  const canReply = !isCallSystemMessage && isOwn && Boolean(onReply) && (allowReply ?? true);
  const canPin = !isCallSystemMessage && isOwn && Boolean(onPin) && (allowPin ?? true);
  const canDelete = !isCallSystemMessage && isOwn && Boolean(onDelete) && (allowDelete ?? true);
  const canReact = !isCallSystemMessage && !isOwn && Boolean(onReact) && (allowReact ?? true);
  const attachments = message.attachments || [];
  const topLevelGif = message.type === 'gif' && message.gifUrl
    ? [{ type: 'gif', gifUrl: message.gifUrl, previewUrl: message.previewUrl || message.gifUrl }]
    : [];
  const allAttachments = [...attachments, ...topLevelGif];
  const gifAttachments = allAttachments.filter((attachment) => attachment.type === 'gif');
  const imageAttachments = allAttachments.filter((attachment) => attachment.type === 'image');
  const stickerAttachments = allAttachments.filter((attachment) => attachment.type === 'sticker');
  const otherAttachments = allAttachments.filter((attachment) => !['gif', 'image', 'sticker'].includes(attachment.type));
  const hasAttachments = allAttachments.length > 0;
  const messageRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [pickerBoundary, setPickerBoundary] = useState(null);
  const [pickerTrigger, setPickerTrigger] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const imageRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, x: 0, y: 0 });
  const pinchRef = useRef({ distance: 0, scale: 1 });
  const readByOther = isOwn && (message.readBy || []).some((entry) => String(entry?._id || entry) !== String(currentUser?.id));
  const activePreview = preview?.type === 'image' ? preview.items?.[previewIndex] : preview;
  const clampScale = (value) => Math.min(4, Math.max(1, value));
  const resetPreviewTransform = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
    dragRef.current = { startX: 0, startY: 0, x: 0, y: 0 };
    pinchRef.current = { distance: 0, scale: 1 };
  };
  const openImagePreview = (index) => {
    setPreview({ type: 'image', items: imageAttachments });
    setPreviewIndex(index);
    resetPreviewTransform();
  };
  const closePreview = () => {
    setPreview(null);
    resetPreviewTransform();
  };
  const goToPreviewImage = (nextIndex) => {
    setPreviewIndex(nextIndex);
    resetPreviewTransform();
  };
  const downloadImageAsJpg = async () => {
    if (!activePreview?.url) {
      return;
    }

    const response = await fetch(activePreview.url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      canvas.toBlob((jpgBlob) => {
        if (!jpgBlob) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        const downloadUrl = URL.createObjectURL(jpgBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `gatherly-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(objectUrl);
      }, 'image/jpeg', 0.92);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  };

  useEffect(() => {
    if (scale <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [scale]);

  useEffect(() => {
    const image = imageRef.current;

    if (!image || preview?.type !== 'image') {
      return undefined;
    }

    const handleWheel = (event) => {
      event.preventDefault();
      setScale((current) => clampScale(current + (event.deltaY < 0 ? 0.15 : -0.15)));
    };

    image.addEventListener('wheel', handleWheel, { passive: false });
    return () => image.removeEventListener('wheel', handleWheel);
  }, [activePreview?.url, preview?.type]);

  useEffect(() => {
    if (!isPanning) {
      return undefined;
    }

    const stopPanning = () => setIsPanning(false);
    window.addEventListener('mouseup', stopPanning);
    return () => window.removeEventListener('mouseup', stopPanning);
  }, [isPanning]);
  const replyTo = message.replyTo?.messageId ? message.replyTo : null;
  return (
    <div
      className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'} ${highlighted ? 'message-flash' : ''}`}
      id={message._id ? `message-${message._id}` : undefined}
      ref={messageRef}
    >
      {!isOwn && message.anonymousAvatar ? (
        <div
          className="mr-2 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default text-[12px] font-semibold uppercase text-white shadow-card"
          style={{ backgroundColor: message.anonymousAvatar.color || '#245143' }}
          title={message.anonymousAvatar.label || 'Room participant'}
        >
          {(message.anonymousAvatar.label || 'GU').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase()}
        </div>
      ) : null}
      <div className="relative max-w-full">
      <div
        className={`min-w-[96px] ${hasAttachments ? 'max-w-[92vw] sm:max-w-[420px]' : 'max-w-[82vw] sm:max-w-[70%]'} rounded-lg border border-border-default px-3 py-2.5 shadow-card sm:px-4 sm:py-3 ${
          isOwn ? 'rounded-br-sm bg-bubble-own text-text-primary' : 'rounded-bl-sm bg-white text-text-primary'
        }`}
      >
        {message.isPinned ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-primary">Pinned</span>
          </div>
        ) : null}
        {replyTo ? (
          <button
            className={`mb-3 flex w-full min-w-0 gap-2 rounded border-l-[3px] border-brand-primary px-2.5 py-2 text-left transition hover:bg-brand-subtle ${
              isOwn ? 'bg-white/65' : 'bg-bg-secondary'
            }`}
            onClick={() => onReplyPreviewClick?.(replyTo.messageId)}
            type="button"
          >
            {replyTo.contentType === 'image' ? (
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded bg-bg-tertiary">
                {replyTo.mediaUrl ? <img alt="" className="h-full w-full object-cover" src={replyTo.mediaUrl} /> : null}
              </span>
            ) : null}
            {replyTo.contentType === 'file' ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-bg-tertiary text-brand-primary">
                <FileText size={17} strokeWidth={1.5} />
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-text-primary">{replyTo.senderName}</span>
              <span className="mt-0.5 line-clamp-2 text-[12px] leading-[1.35] text-text-secondary">
                {replyTo.contentType === 'image' ? 'Photo' : replyTo.contentType === 'file' ? 'File' : replyTo.contentPreview || 'Message'}
              </span>
            </span>
          </button>
        ) : null}
        {message.statusContext?.statusId ? (
          <div className="mb-3 overflow-hidden rounded-lg bg-white">
            <div className="flex gap-3 p-2">
              {message.statusContext.type === 'image' ? (
                <img alt="Status preview" className="h-16 w-16 shrink-0 rounded-md object-cover" src={message.statusContext.mediaUrl} />
              ) : null}
              {message.statusContext.type === 'video' ? (
                <video className="h-16 w-16 shrink-0 rounded-md bg-brand-primary object-cover" src={message.statusContext.mediaUrl} />
              ) : null}
              {message.statusContext.type === 'text' ? (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-brand-primary px-2 text-center text-[11px] font-medium text-white">
                  {(message.statusContext.text || 'Status').slice(0, 36)}
                </div>
              ) : null}
              <div className="min-w-0 flex-1 py-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">Status reply</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-[1.4] text-text-primary">
                  {message.statusContext.type === 'text' ? message.statusContext.text || 'Text status' : message.statusContext.type === 'image' ? 'Photo status' : 'Video status'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {message.msg ? <p className={`whitespace-pre-wrap break-words text-[14px] leading-[1.65] ${isCallSystemMessage ? 'text-center' : ''}`}>{message.msg}</p> : null}
        {stickerAttachments.length ? (
          <div className={`${message.msg ? 'mt-3' : ''} flex flex-wrap gap-2`}>
            {stickerAttachments.map((attachment, index) => (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/70 text-5xl shadow-sm"
                key={`${attachment.value || attachment.url}-${index}`}
              >
                {attachment.value || '😀'}
              </div>
            ))}
          </div>
        ) : null}
        {hasAttachments ? (
          <div className={`${message.msg ? 'mt-3' : ''} space-y-2`}>
            {gifAttachments.length ? (
              <div className="grid grid-cols-1 gap-2">
                {gifAttachments.map((attachment) => (
                  <img
                    alt="GIF"
                    className="max-h-72 w-full rounded-lg object-cover"
                    key={attachment.gifUrl || attachment.previewUrl}
                    src={attachment.gifUrl || attachment.previewUrl}
                  />
                ))}
              </div>
            ) : null}
            {imageAttachments.length ? (
              <div className={`relative grid overflow-hidden rounded-lg bg-white/70 ${imageAttachments.length > 1 ? 'grid-cols-2 gap-1 p-1' : 'grid-cols-1'}`}>
                {imageAttachments.length > 1 ? (
                  <span className="absolute right-2 top-2 z-[1] rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white">
                    {imageAttachments.length} photos
                  </span>
                ) : null}
                {imageAttachments.map((attachment, index) => (
                  <button className="group/media relative block w-full overflow-hidden" key={attachment.url} onClick={() => openImagePreview(index)} type="button">
                    <img
                      alt="Sent image"
                      className={`${imageAttachments.length > 1 ? 'h-28 rounded-md' : 'h-52 rounded-lg'} w-full object-cover`}
                      src={attachment.url}
                    />
                    <span className="absolute inset-0 hidden items-center justify-center bg-black/20 text-white group-hover/media:flex">
                      <Eye size={22} strokeWidth={1.5} />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {otherAttachments.map((attachment) => (
              <div className="overflow-hidden rounded-lg bg-white/70" key={attachment.url}>
                {attachment.type === 'video' ? (
                  <MediaPlayer compact onExpand={() => setPreview(attachment)} src={attachment.url} type="video" />
                ) : null}
                {attachment.type === 'audio' ? (
                  <div className="p-3">
                    <MediaPlayer src={attachment.url} type="audio" />
                  </div>
                ) : null}
                {attachment.type === 'document' ? (
                  <a
                    className="flex min-w-0 items-center gap-3 p-3 text-text-primary transition hover:bg-brand-subtle"
                    href={attachment.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="shrink-0 text-brand-primary" size={24} strokeWidth={1.5} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">Document</span>
                      <span className="block text-[12px] text-text-secondary">Open file</span>
                    </span>
                    <Download className="shrink-0 text-text-secondary" size={16} strokeWidth={1.5} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {(message.reactions || []).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.reactions.map((reaction) => (
              <button
                className="rounded-full border border-border-default bg-brand-subtle px-2.5 py-1 text-[12px] font-medium text-text-primary"
                key={`${reaction.emoji}-${reaction.count}`}
                onClick={() => onToggleReaction?.(message, reaction.emoji)}
                type="button"
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-end gap-2 text-[12px] text-text-secondary">
          <span>{formatDate(message.createdAt)}</span>
          {readByOther ? <span>read</span> : null}
        </div>
      </div>

      {(canReply || canReact || canPin || canDelete) ? (
      <div className={`absolute -top-3 z-10 hidden max-w-[calc(100vw-24px)] items-center rounded-full border border-border-default bg-white p-1 shadow-card group-hover:flex ${isOwn ? 'right-1 sm:right-2' : 'left-1 sm:left-2'}`}>
        {canReply ? (
          <button
            className="group/action relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-subtle hover:text-brand-primary"
            onClick={() => onReply?.(message)}
            type="button"
          >
            <Reply size={16} strokeWidth={1.5} />
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[11px] font-medium text-text-primary shadow-card group-hover/action:block">
              Reply
            </span>
          </button>
        ) : null}

        {canReact ? (
        <div className="relative">
          <button
            className="group/action relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-subtle hover:text-brand-primary"
            onClick={(event) => {
              setPickerAnchor(messageRef.current);
              setPickerBoundary(event.currentTarget.closest('[data-chat-conversation-area]'));
              setPickerTrigger(event.currentTarget);
              setPickerOpen((current) => !current);
            }}
            type="button"
          >
            <Smile size={16} strokeWidth={1.5} />
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[11px] font-medium text-text-primary shadow-card group-hover/action:block">
              React
            </span>
          </button>
          <EmojiPicker
            anchorEl={pickerAnchor}
            boundaryEl={pickerBoundary}
            onClose={() => setPickerOpen(false)}
            onSelect={(emoji) => {
              onReact?.(message, emoji);
            }}
            open={pickerOpen}
            triggerEl={pickerTrigger}
          />
        </div>
        ) : null}

        {canPin ? (
          <button
            className="group/action relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-subtle hover:text-brand-primary"
            onClick={() => onPin?.(message)}
            type="button"
          >
            <Pin size={16} strokeWidth={1.5} />
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[11px] font-medium text-text-primary shadow-card group-hover/action:block">
              {message.isPinned ? 'Unpin' : 'Pin'}
            </span>
          </button>
        ) : null}

        {canDelete ? (
          <button
            className="group/action relative flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-subtle hover:text-brand-primary"
            onClick={() => onDelete?.(message)}
            type="button"
          >
            <Trash2 size={16} strokeWidth={1.5} />
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[11px] font-medium text-text-primary shadow-card group-hover/action:block">
              Delete
            </span>
          </button>
        ) : null}
      </div>
      ) : null}
      </div>
      {preview ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-2 py-4 sm:px-4 sm:py-6" onClick={closePreview}>
          <div className="relative flex h-[min(85vh,720px)] w-[min(85vw,960px)] items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <div className="absolute right-2 top-2 z-10 flex items-center gap-2 sm:right-0 sm:top-0 sm:-translate-y-3 sm:translate-x-3">
              {preview.type === 'image' ? (
                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-text-primary shadow-card" onClick={downloadImageAsJpg} type="button">
                  <Download size={18} strokeWidth={1.5} />
                </button>
              ) : null}
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-text-primary shadow-card"
                onClick={closePreview}
                type="button"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            {preview.type === 'image' && preview.items?.length > 1 ? (
              <>
                <button
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text-primary shadow-card"
                  onClick={() => {
                    goToPreviewImage((previewIndex - 1 + preview.items.length) % preview.items.length);
                  }}
                  type="button"
                >
                  <ChevronLeft size={22} strokeWidth={1.5} />
                </button>
                <button
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text-primary shadow-card"
                  onClick={() => {
                    goToPreviewImage((previewIndex + 1) % preview.items.length);
                  }}
                  type="button"
                >
                  <ChevronRight size={22} strokeWidth={1.5} />
                </button>
                <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[12px] font-medium text-white">
                  {previewIndex + 1} / {preview.items.length}
                </span>
              </>
            ) : null}
            {preview.type === 'image' ? (
              <div className="h-full w-full overflow-hidden rounded-lg bg-black/30">
                <img
                  alt="Attachment preview"
                  className={`block h-full w-full select-none object-contain transition-transform ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  draggable={false}
                  onMouseDown={(event) => {
                    if (scale <= 1) {
                      return;
                    }

                    setIsPanning(true);
                    dragRef.current = {
                      startX: event.clientX,
                      startY: event.clientY,
                      x: pan.x,
                      y: pan.y,
                    };
                  }}
                  onMouseMove={(event) => {
                    if (!isPanning || scale <= 1) {
                      return;
                    }

                    setPan({
                      x: dragRef.current.x + event.clientX - dragRef.current.startX,
                      y: dragRef.current.y + event.clientY - dragRef.current.startY,
                    });
                  }}
                  onMouseUp={() => setIsPanning(false)}
                  onTouchEnd={() => {
                    setIsPanning(false);
                    pinchRef.current = { distance: 0, scale: 1 };
                  }}
                  onTouchMove={(event) => {
                    if (event.touches.length === 2) {
                      event.preventDefault();
                      const distance = Math.hypot(
                        event.touches[0].clientX - event.touches[1].clientX,
                        event.touches[0].clientY - event.touches[1].clientY
                      );

                      if (!pinchRef.current.distance) {
                        pinchRef.current = { distance, scale };
                        return;
                      }

                      setScale(clampScale(pinchRef.current.scale + (distance - pinchRef.current.distance) / 240));
                      return;
                    }

                    if (event.touches.length === 1 && isPanning && scale > 1) {
                      event.preventDefault();
                      setPan({
                        x: dragRef.current.x + event.touches[0].clientX - dragRef.current.startX,
                        y: dragRef.current.y + event.touches[0].clientY - dragRef.current.startY,
                      });
                    }
                  }}
                  onTouchStart={(event) => {
                    if (event.touches.length === 2) {
                      const distance = Math.hypot(
                        event.touches[0].clientX - event.touches[1].clientX,
                        event.touches[0].clientY - event.touches[1].clientY
                      );
                      pinchRef.current = { distance, scale };
                      return;
                    }

                    if (event.touches.length === 1 && scale > 1) {
                      setIsPanning(true);
                      dragRef.current = {
                        startX: event.touches[0].clientX,
                        startY: event.touches[0].clientY,
                        x: pan.x,
                        y: pan.y,
                      };
                    }
                  }}
                  ref={imageRef}
                  src={activePreview?.url}
                  style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center center', touchAction: 'none' }}
                />
              </div>
            ) : null}
            {preview.type === 'video' ? <MediaPlayer src={preview.url} type="video" /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
