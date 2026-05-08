import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, SwitchCamera, Video } from 'lucide-react';

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

export default function VideoCallOverlay({
  call,
  cameraOff,
  duration,
  localVideoRef,
  muted,
  onAccept,
  onEnd,
  onReject,
  onSwitchCamera,
  onToggleCamera,
  onToggleMute,
  remoteVideoRef,
}) {
  if (call.state === 'idle') {
    return null;
  }

  const peerName = call.peer?.displayName || call.peer?.name || call.peer?.username || 'Caller';
  const isIncoming = call.state === 'ringing' && call.direction === 'incoming';
  const isConnected = call.state === 'connected';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07110f] p-3 text-white sm:p-5">
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1714] shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <div className="absolute left-4 top-4 z-10">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/55">
            {call.state === 'calling' ? 'Calling' : call.state === 'ringing' ? 'Ringing' : call.state}
          </p>
          <h2 className="font-display text-[24px] font-medium">{peerName}</h2>
          {isConnected ? <p className="mt-1 text-[14px] text-white/65">{formatDuration(duration)}</p> : null}
          {call.reason ? <p className="mt-1 text-[13px] text-white/70">{call.reason}</p> : null}
        </div>

        <video autoPlay className="h-full w-full bg-[#07110f] object-cover" playsInline ref={remoteVideoRef} />
        {!isConnected ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#07110f]">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary text-white">
                <Video size={32} />
              </div>
              <p className="mt-4 text-[18px] font-medium">{isIncoming ? 'Incoming video call' : 'Waiting for answer'}</p>
            </div>
          </div>
        ) : null}

        <video autoPlay className="absolute bottom-24 right-4 h-32 w-24 rounded-xl border border-white/20 bg-black object-cover shadow-[0_16px_50px_rgba(0,0,0,0.35)] sm:h-44 sm:w-32" muted playsInline ref={localVideoRef} />

        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/70 to-transparent px-4 py-5">
          {isIncoming ? (
            <div className="flex gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dc2626] text-white" onClick={onReject} type="button">
                <PhoneOff size={20} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a] text-white" onClick={onAccept} type="button">
                <Phone size={20} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white" onClick={onToggleMute} type="button">
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white" onClick={onToggleCamera} type="button">
                {cameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white" onClick={onSwitchCamera} type="button">
                <SwitchCamera size={20} />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dc2626] text-white" onClick={() => onEnd('ended')} type="button">
                <PhoneOff size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
