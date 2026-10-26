import React, { useEffect, useRef, useState } from 'react';
import socket from '../socket';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  PhoneOff,
  MessageSquare,
  FileText,
  Copy,
  Check,
  Send,
  Download,
  Users,
  Sparkles,
  Maximize2
} from 'lucide-react';
import './VideoCallRoom.css';

// Public STUN servers for NAT Traversal
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

const VideoCallRoom = ({ session, user, onClose }) => {
  const roomCode = String(session?.roomCode || 'mc-live').trim().toLowerCase();
  const sessionTopic = session?.topic || '1-on-1 Mentorship Session';

  // Streams & WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcRef = useRef(null);
  const queuedCandidatesRef = useRef([]);

  // Call states
  const [remotePeer, setRemotePeer] = useState(null);
  const [peerSocketId, setPeerSocketId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'waiting'
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // In-Call Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteMediaState, setRemoteMediaState] = useState({ audio: true, video: true });

  // Sidebar Tabs (Chat & Notes)
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'notes'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem(`mentorconnect_notes_${roomCode}`) || '';
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Save notes locally
  useEffect(() => {
    localStorage.setItem(`mentorconnect_notes_${roomCode}`, notes);
  }, [notes, roomCode]);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to create or get RTCPeerConnection
  const getOrCreatePeerConnection = (targetSocketId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    // Attach local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote track received
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        setHasRemoteVideo(true);
        setConnectionStatus('connected');
      }
    };

    // Relay local ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && targetSocketId) {
        socket.emit('call_user_signal', {
          roomCode,
          toSocketId: targetSocketId,
          signal: { type: 'ice-candidate', candidate: event.candidate },
          fromUser: {
            _id: user?._id || user?.id,
            name: user?.name,
            role: user?.role,
            profileImage: user?.profileImage,
          },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('reconnecting');
      }
    };

    return pc;
  };

  // Drain any queued ICE candidates once remote description is set
  const drainQueuedCandidates = async (pc) => {
    if (queuedCandidatesRef.current.length > 0) {
      for (const candidate of queuedCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding queued ICE candidate:', err);
        }
      }
      queuedCandidatesRef.current = [];
    }
  };

  // Main WebRTC Initialization Lifecycle
  useEffect(() => {
    let isMounted = true;

    const initMediaAndSocket = async () => {
      try {
        // 1. Acquire Local Camera and Microphone
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
        } catch (mediaErr) {
          console.warn('Could not get video/audio with ideal constraints, trying fallback:', mediaErr);
          // Fallback to basic audio/video or audio-only
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (audioOnlyErr) {
            console.warn('Video not available, falling back to audio only:', audioOnlyErr);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setIsCameraOff(true);
          }
        }

        if (!isMounted) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Join Video Room via Socket.io
        const userInfo = {
          _id: user?._id || user?.id,
          name: user?.name || 'User',
          role: user?.role || 'student',
          profileImage: user?.profileImage || '',
        };

        socket.emit('join_video_room', {
          roomCode,
          user: userInfo,
        });

        // 3. Socket event: room_users (peers already waiting in the room)
        socket.on('call_room_users', async ({ peers = [] }) => {
          if (peers.length > 0) {
            const firstPeer = peers[0];
            setPeerSocketId(firstPeer.socketId);
            setRemotePeer(firstPeer.user);
            setConnectionStatus('connecting');

            // As caller, initiate the WebRTC offer
            const pc = getOrCreatePeerConnection(firstPeer.socketId);
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              socket.emit('call_user_signal', {
                roomCode,
                toSocketId: firstPeer.socketId,
                signal: { type: 'offer', sdp: offer },
                fromUser: userInfo,
              });
            } catch (err) {
              console.error('Failed to create/send WebRTC offer:', err);
            }
          } else {
            setConnectionStatus('waiting');
          }
        });

        // 4. Socket event: peer_joined_call (someone joined while we were in room)
        socket.on('peer_joined_call', async ({ socketId, user: joinedUser }) => {
          setPeerSocketId(socketId);
          setRemotePeer(joinedUser);
          setConnectionStatus('connecting');

          // Existing peer creates the SDP offer
          const pc = getOrCreatePeerConnection(socketId);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('call_user_signal', {
              roomCode,
              toSocketId: socketId,
              signal: { type: 'offer', sdp: offer },
              fromUser: userInfo,
            });
          } catch (err) {
            console.error('Failed to create SDP offer upon peer join:', err);
          }
        });

        // 5. Socket event: receive_call_signal (Offer, Answer, ICE Candidate)
        socket.on('receive_call_signal', async ({ signal, fromSocketId, fromUser }) => {
          setPeerSocketId(fromSocketId);
          if (fromUser) setRemotePeer(fromUser);

          const pc = getOrCreatePeerConnection(fromSocketId);

          if (signal.type === 'offer') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await drainQueuedCandidates(pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socket.emit('call_user_signal', {
                roomCode,
                toSocketId: fromSocketId,
                signal: { type: 'answer', sdp: answer },
                fromUser: userInfo,
              });
            } catch (err) {
              console.error('Error handling SDP offer:', err);
            }
          } else if (signal.type === 'answer') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await drainQueuedCandidates(pc);
              setConnectionStatus('connected');
            } catch (err) {
              console.error('Error handling SDP answer:', err);
            }
          } else if (signal.type === 'ice-candidate') {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (err) {
                console.warn('Error adding ICE candidate:', err);
              }
            } else {
              queuedCandidatesRef.current.push(signal.candidate);
            }
          }
        });

        // 6. Socket event: peer_media_toggled
        socket.on('peer_media_toggled', ({ mediaType, enabled }) => {
          setRemoteMediaState((prev) => ({
            ...prev,
            [mediaType]: enabled,
          }));
        });

        // 7. Socket event: in-call message
        socket.on('receive_call_message', (msg) => {
          setChatMessages((prev) => [...prev, msg]);
          if (!isSidebarOpen || activeTab !== 'chat') {
            setUnreadChatCount((prev) => prev + 1);
          }
        });

        // 8. Socket event: peer_left_call
        socket.on('peer_left_call', () => {
          setRemotePeer(null);
          setPeerSocketId(null);
          setHasRemoteVideo(false);
          setConnectionStatus('waiting');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
        });
      } catch (err) {
        console.error('WebRTC initialization error:', err);
      }
    };

    initMediaAndSocket();

    return () => {
      isMounted = false;

      // Clean up socket events
      socket.emit('leave_video_room', { roomCode });
      socket.off('call_room_users');
      socket.off('peer_joined_call');
      socket.off('receive_call_signal');
      socket.off('peer_media_toggled');
      socket.off('receive_call_message');
      socket.off('peer_left_call');

      // Stop local camera/mic stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Stop screen sharing tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Close RTCPeerConnection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [roomCode]);

  // Media Controls: Mic Mute / Unmute
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsMicMuted(newMuted);
        socket.emit('call_media_toggle', {
          roomCode,
          mediaType: 'audio',
          enabled: !newMuted,
        });
      }
    }
  };

  // Media Controls: Camera On / Off
  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newOff = !videoTrack.enabled;
        setIsCameraOff(newOff);
        socket.emit('call_media_toggle', {
          roomCode,
          mediaType: 'video',
          enabled: !newOff,
        });
      }
    }
  };

  // Media Controls: Screen Share
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenStreamRef.current = screenStream;

        // Replace outgoing video track in WebRTC sender
        const sender = pcRef.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Preview screen share in local PiP
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);

        // When user stops sharing using the browser's native floating bar
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn('Screen share canceled or denied:', err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender && camTrack) {
      sender.replaceTrack(camTrack);
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
  };

  // In-Call Chat submission
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const message = {
      sender: user?.name || 'User',
      senderId: user?._id || user?.id,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('send_call_message', { roomCode, message });
    setChatInput('');
  };

  // Copy Meeting Link to clipboard
  const handleCopyLink = () => {
    const rolePrefix = user?.role === 'mentor' ? 'mentor' : 'student';
    const link = `${window.location.origin}/${rolePrefix}/sessions?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download Notes
  const handleDownloadNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentorconnect-session-notes-${roomCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        {/* Call Header Topbar */}
        <div className="video-call-topbar">
          <div className="call-header-info">
            <div className="call-live-indicator">
              <span className="call-pulse-dot" />
              <span>LIVE</span>
            </div>

            <div className="call-title-text">{sessionTopic}</div>

            <div
              className="call-room-code-tag"
              onClick={handleCopyLink}
              title="Click to copy room code & invite link"
            >
              <span>Room: {roomCode}</span>
              {copiedLink ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </div>
          </div>

          <div className="call-topbar-right">
            <div className="call-timer-badge">⏱️ {formatTimer(callDuration)}</div>

            {connectionStatus === 'connected' ? (
              <div className="call-status-pill connected">
                <span className="call-pulse-dot" />
                <span>HD Connected</span>
              </div>
            ) : (
              <div className="call-status-pill waiting">
                <span>Waiting for participant...</span>
              </div>
            )}
          </div>
        </div>

        {/* Call Main Body (Video Stage + Sidebar) */}
        <div className={`video-call-body ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
          {/* Main Stage (Remote Video or Waiting State) */}
          <div className="call-video-stage">
            {/* Live Remote WebRTC Video Feed */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="call-remote-video"
              style={{
                display: hasRemoteVideo && remoteMediaState.video ? 'block' : 'none',
              }}
            />

            {/* Placeholder when remote peer is not connected OR remote camera is off */}
            {(!hasRemoteVideo || !remoteMediaState.video) && (
              <div className="call-remote-placeholder">
                <div className="call-avatar-wrapper">
                  <div className="call-radar-ring" />
                  <img
                    src={
                      remotePeer?.profileImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt="Participant"
                    className="call-avatar-img"
                  />
                </div>

                <div className="call-waiting-title">
                  {remotePeer
                    ? `${remotePeer.name} (${remoteMediaState.video ? 'Connecting video...' : 'Camera Off'})`
                    : 'Waiting for participant to join...'}
                </div>

                <p className="call-waiting-desc">
                  Share this room code with the student or mentor to connect instantly in real time with high-definition audio & video.
                </p>

                <div className="call-share-box">
                  <code>{roomCode}</code>
                  <button type="button" onClick={handleCopyLink}>
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Picture-in-Picture Local Self Video */}
            <div className="call-pip-container">
              {isCameraOff ? (
                <div className="call-pip-cam-off">
                  <CameraOff size={20} />
                  <span>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="call-local-video"
                />
              )}
              <div className="call-pip-name-tag">You ({user?.name ? user.name.split(' ')[0] : 'Me'})</div>
            </div>
          </div>

          {/* In-Call Notes & Chat Sidebar */}
          {isSidebarOpen && (
            <div className="call-sidebar-drawer">
              <div className="call-sidebar-tabs">
                <button
                  type="button"
                  className={`call-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('chat');
                    setUnreadChatCount(0);
                  }}
                >
                  <MessageSquare size={14} />
                  <span>In-Call Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="call-badge-count">{unreadChatCount}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`call-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  <FileText size={14} />
                  <span>Session Notes</span>
                </button>
              </div>

              {activeTab === 'chat' ? (
                <>
                  <div className="call-chat-scroll">
                    {chatMessages.length === 0 ? (
                      <div className="call-chat-empty">
                        <MessageSquare size={32} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
                        <p>No messages yet.</p>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Send links, questions, or code snippets here.
                        </span>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMine = msg.senderId === (user?._id || user?.id);
                        return (
                          <div key={i} className={`call-msg-bubble ${isMine ? 'mine' : ''}`}>
                            <div className="call-msg-header">
                              <span className="call-msg-sender">{isMine ? 'You' : msg.sender}</span>
                              <span>{msg.time}</span>
                            </div>
                            <div className="call-msg-text">{msg.text}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form className="call-chat-input-form" onSubmit={handleSendChat}>
                    <input
                      type="text"
                      className="call-chat-input"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="call-chat-send-btn" title="Send message">
                      <Send size={15} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="call-notes-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                      Key Takeaways & Action Items
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadNotes}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', color: '#00b4d8', padding: '2px 8px' }}
                    >
                      <Download size={13} style={{ marginRight: '4px' }} />
                      Save
                    </button>
                  </div>

                  <textarea
                    className="call-notes-textarea"
                    placeholder="Document interview feedback, resume changes, or career roadmap items discussed during this call..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Control Dock */}
        <div className="video-call-controls">
          {/* Mic Button */}
          <button
            type="button"
            className={`call-btn ${isMicMuted ? 'btn-off' : ''}`}
            onClick={handleToggleMic}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            className={`call-btn ${isCameraOff ? 'btn-off' : ''}`}
            onClick={handleToggleCamera}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            className={`call-btn ${isScreenSharing ? 'btn-active-green' : ''}`}
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            <ScreenShare size={20} />
          </button>

          {/* Toggle Sidebar (Chat / Notes) */}
          <button
            type="button"
            className={`call-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle In-Call Chat & Notes"
          >
            <MessageSquare size={20} />
            {unreadChatCount > 0 && !isSidebarOpen && (
              <span className="call-badge-count">{unreadChatCount}</span>
            )}
          </button>

          {/* Leave Call Button */}
          <button type="button" className="call-leave-btn" onClick={onClose} title="Leave Session">
            <PhoneOff size={18} />
            <span>Leave Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;
