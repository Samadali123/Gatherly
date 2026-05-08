import { io } from 'socket.io-client';
import { Camera, CameraOff, Copy, Mic, MicOff, PhoneOff, Shuffle, Video } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

const createAnonymousId = () => {
  const stored = window.localStorage.getItem('gatherly-anonymous-video-id');
  if (stored) return stored;
  const next = `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  window.localStorage.setItem('gatherly-anonymous-video-id', next);
  return next;
};

export default function AnonymousVideoPage() {
  const anonymousId = useMemo(createAnonymousId, []);
  const [searchParams] = useSearchParams();
  const sharedRoomId = searchParams.get('room') || '';
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState('random');
  const [status, setStatus] = useState('Idle');
  const [roomId, setRoomId] = useState(sharedRoomId);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const setLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const closePeer = useCallback((key) => {
    peerConnectionsRef.current.get(key)?.close();
    peerConnectionsRef.current.delete(key);
    setRemoteStreams((current) => current.filter((entry) => entry.key !== key));
  }, []);

  const closeAllPeers = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setRemoteStreams([]);
  }, []);

  const getPeerConnection = useCallback(async (key, room, targetSocketId = null) => {
    if (peerConnectionsRef.current.has(key)) {
      return peerConnectionsRef.current.get(key);
    }

    const socket = socketRef.current;
    const pc = new RTCPeerConnection({ iceServers });
    const stream = await setLocalStream();
    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === 'video' && sender.getParameters) {
        const parameters = sender.getParameters();
        parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
        parameters.encodings[0].maxBitrate = 700000;
        sender.setParameters(parameters).catch(() => {});
      }
    });

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams((current) => {
        const withoutCurrent = current.filter((entry) => entry.key !== key);
        return [...withoutCurrent, { key, stream }];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice-candidate', { candidate: event.candidate, roomId: room, to: targetSocketId || key });
      }
    };

    peerConnectionsRef.current.set(key, pc);
    return pc;
  }, [setLocalStream]);

  const createOffer = useCallback(async (key, room, targetSocketId = null) => {
    const pc = await getPeerConnection(key, room, targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('offer', { offer, roomId: room, to: targetSocketId || key });
  }, [getPeerConnection]);

  useEffect(() => {
    const socket = io('/', {
      auth: { anonymousId, anonymousVideo: true },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setStatus('Connected');
    });
    socket.on('disconnect', () => {
      setConnected(false);
      setStatus('Disconnected');
      closeAllPeers();
    });
    socket.on('waiting-for-match', () => {
      setStatus('Waiting for a random user');
      closeAllPeers();
    });
    socket.on('match-found', async ({ initiator, peerId, peerSocketId, roomId }) => {
      setMode('random');
      setActiveRoomId(roomId);
      setStatus('Matched');
      if (initiator) {
        await createOffer(peerSocketId || peerId, roomId, peerSocketId || peerId);
      }
    });
    socket.on('anonymous-peer-left', () => {
      setStatus('Peer left. Tap Next to match again.');
      closeAllPeers();
    });
    socket.on('room-joined', async ({ peers = [], roomId }) => {
      setMode('room');
      setActiveRoomId(roomId);
      setStatus(`Room ${roomId}`);
      await Promise.all(peers.map((peer) => createOffer(peer.socketId, roomId, peer.socketId)));
    });
    socket.on('room-peer-joined', ({ displayName }) => {
      setStatus(`${displayName || 'A participant'} joined`);
    });
    socket.on('room-peer-left', ({ socketId }) => {
      closePeer(socketId);
    });
    socket.on('offer', async ({ from, offer, roomId }) => {
      const pc = await getPeerConnection(from, roomId, from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId, to: from });
    });
    socket.on('answer', async ({ from, answer }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      closeAllPeers();
    };
  }, [anonymousId, closeAllPeers, closePeer, createOffer, getPeerConnection]);

  useEffect(() => {
    if (sharedRoomId && !activeRoomId) {
      setMode('room');
      setRoomId(sharedRoomId);
      setStatus(`Ready to join ${sharedRoomId}`);
    }
  }, [activeRoomId, sharedRoomId]);

  const joinQueue = async () => {
    await setLocalStream();
    setMode('random');
    setStatus('Finding someone');
    socketRef.current?.emit('join-queue');
  };

  const nextUser = async () => {
    await setLocalStream();
    setStatus('Finding someone new');
    socketRef.current?.emit('next-user');
  };

  const joinRoom = async () => {
    const nextRoomId = roomId.trim() || `room-${Math.random().toString(36).slice(2, 8)}`;
    await setLocalStream();
    closeAllPeers();
    setMode('room');
    setRoomId(nextRoomId);
    socketRef.current?.emit('join-room', { displayName: 'Anonymous', roomId: nextRoomId });
  };

  const leave = () => {
    if (mode === 'room' && activeRoomId) {
      socketRef.current?.emit('leave-room', { roomId: activeRoomId });
    }
    closeAllPeers();
    setActiveRoomId('');
    setStatus('Idle');
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });
    setCameraOff(!cameraOff);
  };

  return (
    <div className="min-h-screen bg-[#07110f] p-3 text-white sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-6xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b1714] shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/55">Anonymous video</p>
            <h1 className="font-display text-[24px] font-medium">Random match and rooms</h1>
            <p className="mt-1 text-[13px] text-white/60">{connected ? status : 'Connecting socket'}</p>
          </div>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white/75" to={sharedRoomId ? `/room/${sharedRoomId}` : '/rooms/new'}>
            Back to room
          </Link>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 text-[14px] font-medium text-white" onClick={joinQueue} type="button">
              <Shuffle size={16} /> Join random user
            </button>
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-[14px] font-medium text-white" onClick={nextUser} type="button">
              Next
            </button>
            <div className="space-y-2 pt-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/50">Room</label>
              <input className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-[14px] text-white outline-none" onChange={(event) => setRoomId(event.target.value)} placeholder="room-code" value={roomId} />
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-[#0b1714]" onClick={joinRoom} type="button">
                <Video size={16} /> Create / Join room
              </button>
              {activeRoomId ? (
                <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-[13px] text-white/75" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/anonymous-video?room=${activeRoomId}`)} type="button">
                  <Copy size={15} /> Copy room link
                </button>
              ) : null}
            </div>
          </aside>

          <section className="relative min-h-[420px] overflow-hidden rounded-xl border border-white/10 bg-black">
            <div className="grid h-full min-h-[420px] grid-cols-1 gap-2 p-2 sm:grid-cols-2">
              {remoteStreams.map((entry) => (
                <RemoteVideo key={entry.key} stream={entry.stream} />
              ))}
              {!remoteStreams.length ? (
                <div className="flex h-full items-center justify-center rounded-lg bg-white/[0.03] text-center text-white/60">
                  {status}
                </div>
              ) : null}
            </div>
            <video autoPlay className="absolute bottom-20 right-4 h-32 w-24 rounded-xl border border-white/20 bg-[#111] object-cover shadow-[0_16px_50px_rgba(0,0,0,0.35)]" muted playsInline ref={localVideoRef} />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-4">
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12" onClick={toggleMute} type="button">
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12" onClick={toggleCamera} type="button">
                {cameraOff ? <CameraOff size={18} /> : <Camera size={18} />}
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dc2626]" onClick={leave} type="button">
                <PhoneOff size={18} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function RemoteVideo({ stream }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <video autoPlay className="h-full min-h-[260px] w-full rounded-lg bg-[#111] object-cover" playsInline ref={ref} />;
}
