import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../../../services/socket';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

const initialCall = {
  callId: null,
  direction: null,
  peer: null,
  peerId: null,
  reason: '',
  receiverId: null,
  roomId: null,
  startedAt: null,
  state: 'idle',
};

export const useWebRTCCall = (currentUser) => {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const callRef = useRef(initialCall);
  const [call, setCallState] = useState(initialCall);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lastCallEvent, setLastCallEvent] = useState(null);

  const setCall = useCallback((next) => {
    callRef.current = typeof next === 'function' ? next(callRef.current) : next;
    setCallState(callRef.current);
  }, []);

  const attachStream = useCallback((stream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
  }, []);

  const getLocalStream = useCallback(async (facingMode = 'user') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode },
    });
    attachStream(stream);
    return stream;
  }, [attachStream]);

  const createPeerConnection = useCallback(async (roomId) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = peerConnection;

    const stream = localStreamRef.current || (await getLocalStream());
    stream.getTracks().forEach((track) => {
      const sender = peerConnection.addTrack(track, stream);
      if (track.kind === 'video' && sender.getParameters) {
        const parameters = sender.getParameters();
        parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
        parameters.encodings[0].maxBitrate = 700000;
        sender.setParameters(parameters).catch(() => {});
      }
    });

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    return peerConnection;
  }, [getLocalStream]);

  const cleanupCall = useCallback((reason = '') => {
    stopMedia();
    setMuted(false);
    setCameraOff(false);
    setDuration(0);
    setCall({ ...initialCall, reason });
  }, [setCall, stopMedia]);

  const startCall = useCallback(async (receiver) => {
    if (!receiver?.userId && !receiver?.id && !receiver?._id) {
      return;
    }

    setCall({
      ...initialCall,
      direction: 'outgoing',
      peer: receiver,
      receiverId: receiver.userId || receiver.id || receiver._id,
      state: 'calling',
    });
    socket.emit('call-user', {
      receiverId: receiver.userId || receiver.id || receiver._id,
    });
  }, [setCall]);

  const acceptCall = useCallback(async () => {
    const active = callRef.current;
    await getLocalStream();
    setCall((current) => ({ ...current, state: 'connected', startedAt: Date.now() }));
    socket.emit('accept-call', {
      callId: active.callId,
      callerId: active.peerId,
      roomId: active.roomId,
    });
  }, [getLocalStream, setCall]);

  const rejectCall = useCallback(() => {
    const active = callRef.current;
    socket.emit('reject-call', {
      callId: active.callId,
      callerId: active.peerId,
      roomId: active.roomId,
    });
    cleanupCall('rejected');
  }, [cleanupCall]);

  const endCall = useCallback((reason = 'ended') => {
    const active = callRef.current;
    const connectedSeconds = active.startedAt ? Math.floor((Date.now() - active.startedAt) / 1000) : 0;
    setLastCallEvent({
      callId: active.callId,
      duration: connectedSeconds,
      id: Date.now(),
      peer: active.peer,
      reason,
      state: active.state,
    });
    socket.emit('end-call', {
      callId: active.callId,
      reason,
      roomId: active.roomId,
    });
    cleanupCall(reason);
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    const enabled = muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMuted(!muted);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const enabled = cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraOff(!cameraOff);
  }, [cameraOff]);

  const switchCamera = useCallback(async () => {
    const currentStream = localStreamRef.current;
    const currentTrack = currentStream?.getVideoTracks()[0];
    const currentFacingMode = currentTrack?.getSettings?.().facingMode;
    const nextFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    const nextStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: nextFacingMode },
    });
    const nextTrack = nextStream.getVideoTracks()[0];
    const sender = peerConnectionRef.current?.getSenders().find((entry) => entry.track?.kind === 'video');

    if (sender && nextTrack) {
      await sender.replaceTrack(nextTrack);
    }

    if (currentStream && currentTrack && nextTrack) {
      currentStream.removeTrack(currentTrack);
      currentTrack.stop();
      currentStream.addTrack(nextTrack);
      attachStream(currentStream);
    } else if (nextTrack) {
      const stream = new MediaStream([nextTrack]);
      attachStream(stream);
    }
  }, [attachStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!currentUser?.id || !socket.connected) {
      return undefined;
    }

    socket.emit('register', { userId: currentUser.id });
    return undefined;
  }, [currentUser?.id]);

  useEffect(() => {
    const handleIncomingCall = ({ callId, caller, callerId, roomId }) => {
      setCall({
        ...initialCall,
        callId,
        direction: 'incoming',
        peer: caller,
        peerId: callerId,
        roomId,
        state: 'ringing',
      });
    };

    const handleCallRinging = ({ callId, roomId }) => {
      setCall((current) => ({
        ...current,
        callId,
        roomId,
        state: 'ringing',
      }));
    };

    const handleCallAccepted = async ({ callId, roomId }) => {
      const active = callRef.current;
      setCall((current) => ({ ...current, callId, roomId, state: 'connected', startedAt: current.startedAt || Date.now() }));

      if (active.direction === 'outgoing') {
        const stream = localStreamRef.current || (await getLocalStream());
        attachStream(stream);
        const peerConnection = await createPeerConnection(roomId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, roomId });
      }
    };

    const handleOffer = async ({ offer, roomId }) => {
      const peerConnection = await createPeerConnection(roomId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, roomId });
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!peerConnectionRef.current || !candidate) return;
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const publishCallEvent = ({ duration: nextDuration, peer, reason = 'ended' } = {}) => {
      const active = callRef.current;
      const connectedSeconds = typeof nextDuration === 'number'
        ? nextDuration
        : active.startedAt
          ? Math.floor((Date.now() - active.startedAt) / 1000)
          : 0;

      setLastCallEvent({
        callId: active.callId,
        duration: connectedSeconds,
        id: Date.now(),
        peer: peer || active.peer,
        reason,
        state: active.state,
      });
    };

    const handleCallEnded = (payload = {}) => {
      publishCallEvent(payload);
      cleanupCall(payload.reason || 'ended');
    };
    const handleCallRejected = (payload = {}) => {
      publishCallEvent({ ...payload, reason: 'rejected' });
      cleanupCall('rejected');
    };
    const handleCallError = ({ message }) => {
      setCall((current) => ({ ...current, reason: message || 'Unable to start call', state: 'ended' }));
      window.setTimeout(() => cleanupCall(message), 1600);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-ringing', handleCallRinging);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-error', handleCallError);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-ringing', handleCallRinging);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-error', handleCallError);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [attachStream, cleanupCall, createPeerConnection, getLocalStream, setCall]);

  useEffect(() => {
    if (call.state !== 'connected' || !call.startedAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - call.startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [call.startedAt, call.state]);

  useEffect(() => () => stopMedia(), [stopMedia]);

  return {
    acceptCall,
    call,
    cameraOff,
    duration,
    endCall,
    localStream,
    localVideoRef,
    muted,
    rejectCall,
    remoteStream,
    remoteVideoRef,
    startCall,
    switchCamera,
    toggleCamera,
    toggleMute,
    lastCallEvent,
  };
};
