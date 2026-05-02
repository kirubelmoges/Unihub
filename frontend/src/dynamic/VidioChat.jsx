import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../static/context";

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

const VidioChat = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // States
  const [mode, setMode] = useState('home');
  const [roomToken, setRoomToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [devicesAvailable, setDevicesAvailable] = useState({ camera: false, mic: false });
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const [fullScreenUser, setFullScreenUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [showParticipants, setShowParticipants] = useState(false);
  const [layout, setLayout] = useState('grid');
  const [audioLevels, setAudioLevels] = useState({});
  const [mirrorLocalVideo, setMirrorLocalVideo] = useState(true); // Toggle for local video mirroring
  
  // Refs
  const localVideoRef = useRef();
  const remoteVideosRef = useRef({});
  const wsRef = useRef();
  const peersRef = useRef({});
  const localStreamRef = useRef();
  const pendingCandidatesRef = useRef({});
  const chatContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const videoGridRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalyserRef = useRef(null);

  // Get user media on mount with proper camera orientation
  useEffect(() => {
    if (!user) return;
    
    const getMedia = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        const hasMic = devices.some(device => device.kind === 'audioinput');
        
        setDevicesAvailable({ camera: hasCamera, mic: hasMic });
        
        if (!hasCamera && !hasMic) {
          setCameraError('No camera or microphone found. You can still join audio-only.');
          return;
        }
        
        const constraints = {
          video: hasCamera ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            advanced: [{ width: 1280, height: 720 }]
          } : false,
          audio: hasMic ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Initially disable tracks (muted by default)
        stream.getVideoTracks().forEach(track => {
          track.enabled = false;
        });
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        
        localStreamRef.current = stream;
        setLocalStreamReady(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Setup audio analysis for visual feedback
        setupAudioAnalysis(stream);
        
        setCameraError('');
        
      } catch (err) {
        console.error('Error accessing media devices:', err);
        handleMediaError(err);
      }
    };

    getMedia();

    return () => {
      cleanupMedia();
    };
  }, [user]);

  // Setup audio analysis for visual feedback
  const setupAudioAnalysis = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioAnalyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(audioAnalyserRef.current);
      audioAnalyserRef.current.fftSize = 256;
      
      const bufferLength = audioAnalyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (audioAnalyserRef.current && audioEnabled) {
          audioAnalyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevels(prev => ({ ...prev, local: average }));
        }
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('Audio analysis setup failed:', err);
    }
  };

  const handleMediaError = (err) => {
    if (err.name === 'NotAllowedError') {
      setCameraError('Camera/Microphone access denied. Please allow permissions.');
    } else if (err.name === 'NotFoundError') {
      setCameraError('No camera/microphone found. You can join audio-only.');
    } else {
      setCameraError('Could not access camera/microphone. Please check your devices.');
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Create room
  const createRoom = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/vidiochat/api/rooms/create/', {
        name: roomName
      });
      
      if (response.data.success) {
        setRoomToken(response.data.room.token);
        setIsCreator(true);
        setMode('in-call');
      }
    } catch (err) {
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Join room
  const joinRoom = async () => {
    if (!inputToken.trim() || inputToken.length !== 8) {
      setError('Please enter a valid 8-character token');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`/vidiochat/api/rooms/join/${inputToken}/`);
      
      if (response.data.success) {
        setRoomToken(inputToken);
        setRoomName(response.data.room.name || '');
        setIsCreator(false);
        setMode('in-call');
      }
    } catch (err) {
      setError('Room not found or expired');
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket
  const connectToRoom = (token) => {
    const wsUrl = `ws://localhost:8000/ws/conference/${token}/`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError('');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSignalingMessage(data);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      if (mode === 'in-call' && user) {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectToRoom(token);
          }
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };
  };

  // WebSocket connection effect
  useEffect(() => {
    if (!user || mode !== 'in-call' || !roomToken) {
      return;
    }

    connectToRoom(roomToken);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [mode, roomToken, user]);

  // Handle signaling messages
  const handleSignalingMessage = (data) => {
    console.log('Received message:', data.type);
    
    switch (data.type) {
      case 'room_info':
        setCurrentUserId(data.you.id);
        setParticipants(data.participants || []);
        break;

      case 'user_joined':
        setParticipants(prev => {
          const exists = prev.some(p => p.id === data.user.id);
          if (exists) return prev;
          return [...prev, data.user];
        });
        
        if (data.user.id !== currentUserId) {
          createPeerConnection(data.user.id, true);
        }
        break;

      case 'user_left':
        setParticipants(prev => prev.filter(p => p.id !== data.user_id));
        setRaisedHands(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user_id);
          return newSet;
        });
        
        if (peersRef.current[data.user_id]) {
          peersRef.current[data.user_id].close();
          delete peersRef.current[data.user_id];
        }
        
        removeRemoteVideo(data.user_id);
        
        if (fullScreenUser === data.user_id) {
          setFullScreenUser(null);
        }
        break;

      case 'offer':
        handleOffer(data);
        break;

      case 'answer':
        handleAnswer(data);
        break;

      case 'ice-candidate':
        handleIceCandidate(data);
        break;

      case 'raise-hand':
        setRaisedHands(prev => new Set(prev).add(data.user.id));
        // Auto remove after 10 seconds
        setTimeout(() => {
          setRaisedHands(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.user.id);
            return newSet;
          });
        }, 10000);
        break;

      case 'chat':
        handleChatMessage(data);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleChatMessage = (data) => {
    const messageId = `${data.user.id}-${data.timestamp}`;
    
    if (!processedMessageIds.current.has(messageId)) {
      processedMessageIds.current.add(messageId);
      
      const newMessage = {
        id: messageId,
        user: data.user.id === currentUserId ? 'You' : data.user.name,
        message: data.message,
        timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: data.user.id === currentUserId
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      if (!showChat && data.user.id !== currentUserId) {
        setNewMessageCount(prev => prev + 1);
      }
    }
  };

  // WebRTC peer connection
  const createPeerConnection = (targetId, isInitiator = false) => {
    if (peersRef.current[targetId]) {
      return peersRef.current[targetId];
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate,
          target: targetId
        }));
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetId}:`, peer.connectionState);
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        setTimeout(() => {
          if (peersRef.current[targetId]) {
            createPeerConnection(targetId, true);
          }
        }, 2000);
      }
    };

    // Handle remote stream
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const videoElement = document.getElementById(`remote-${targetId}`);
      
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Create offer if initiator
    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'offer',
              data: peer.localDescription,
              target: targetId
            }));
          }
        })
        .catch(err => console.error('Error creating offer:', err));
    }

    peersRef.current[targetId] = peer;
    return peer;
  };

  // Handle offer
  const handleOffer = async (data) => {
    const targetId = data.from.id;
    
    try {
      let peer = peersRef.current[targetId];
      
      if (!peer) {
        peer = createPeerConnection(targetId, false);
      }
      
      await peer.setRemoteDescription(new RTCSessionDescription(data.data));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          data: peer.localDescription,
          target: targetId
        }));
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Handle answer
  const handleAnswer = async (data) => {
    const targetId = data.from.id;
    
    try {
      const peer = peersRef.current[targetId];
      if (peer && peer.signalingState === 'have-local-offer') {
        await peer.setRemoteDescription(new RTCSessionDescription(data.data));
        
        // Add any pending candidates
        if (pendingCandidatesRef.current[targetId]) {
          for (const candidate of pendingCandidatesRef.current[targetId]) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          }
          delete pendingCandidatesRef.current[targetId];
        }
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = (data) => {
    const targetId = data.from.id;
    
    const peer = peersRef.current[targetId];
    
    if (peer && peer.remoteDescription) {
      peer.addIceCandidate(new RTCIceCandidate(data.data))
        .catch(err => console.error('Error adding ICE candidate:', err));
    } else {
      if (!pendingCandidatesRef.current[targetId]) {
        pendingCandidatesRef.current[targetId] = [];
      }
      pendingCandidatesRef.current[targetId].push(data.data);
    }
  };

  // Remove remote video
  const removeRemoteVideo = (userId) => {
    const container = document.getElementById(`container-${userId}`);
    if (container) {
      container.remove();
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const newAudioState = !audioEnabled;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newAudioState;
      });
      setAudioEnabled(newAudioState);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mute-status',
          audio_muted: !newAudioState,
          video_muted: !videoEnabled
        }));
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const newVideoState = !videoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
      setVideoEnabled(newVideoState);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mute-status',
          audio_muted: !audioEnabled,
          video_muted: !newVideoState
        }));
      }
    }
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        message: inputMessage.trim()
      }));
      setInputMessage('');
    }
  };

  // Raise hand
  const raiseHand = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'raise-hand'
      }));
    }
  };

  // Set full screen
  const setFullScreen = (userId) => {
    if (fullScreenUser === userId) {
      setFullScreenUser(null);
      setLayout('grid');
    } else {
      setFullScreenUser(userId);
      setLayout('spotlight');
    }
  };

  // Leave room
  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setMode('home');
    setRoomToken('');
    setParticipants([]);
    setMessages([]);
    setConnected(false);
    setAudioEnabled(false);
    setVideoEnabled(false);
    setFullScreenUser(null);
    setShowChat(false);
    setNewMessageCount(0);
    setIsCreator(false);
    setCurrentUserId(null);
    setRaisedHands(new Set());
    processedMessageIds.current.clear();
    peersRef.current = {};
    pendingCandidatesRef.current = {};
  };

  // Copy token
  const copyToken = () => {
    navigator.clipboard.writeText(roomToken).then(() => {
      setError('Token copied to clipboard!');
      setTimeout(() => setError(''), 3000);
    });
  };

  // Toggle chat
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setNewMessageCount(0);
    }
  };

  // Toggle participants panel
  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  };

  // Toggle mirror mode
  const toggleMirror = () => {
    setMirrorLocalVideo(!mirrorLocalVideo);
  };

  // Calculate grid layout
  const getGridLayout = () => {
    if (layout === 'spotlight' && fullScreenUser) {
      return 'grid-cols-1 grid-rows-1';
    }
    
    const count = participants.length + 1;
    
    if (count === 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-2 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  // Get participant name
  const getParticipantName = (participant) => {
    return participant.full_name || participant.username || 'Anonymous';
  };

  // ========== AUTHENTICATION CHECK ==========
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-8">Please log in to join the video conference</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Home screen
  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-gray-200 shadow-2xl">
          {/* User Profile */}
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 font-semibold">{user.full_name || user.username}</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Ready to connect
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Video Conference
          </h1>
          <p className="text-gray-500 text-center mb-8">Connect with up to 8 people</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {cameraError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl mb-6 flex items-center gap-3">
              <span className="text-xl">📹</span>
              <span>{cameraError}</span>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Create Room */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-indigo-500">🎥</span>
                Create New Room
              </h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (optional)"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 mb-4 focus:border-indigo-400 focus:outline-none transition-all"
              />
              <button
                onClick={createRoom}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">or</span>
              </div>
            </div>
            
            {/* Join Room */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-emerald-500">🔗</span>
                Join Existing Room
              </h2>
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                placeholder="Enter 8-character token"
                maxLength="8"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-center uppercase mb-4 focus:border-emerald-400 focus:outline-none transition-all tracking-widest font-mono"
              />
              <button
                onClick={joinRoom}
                disabled={loading || inputToken.length !== 8}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>

          {/* Device Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Camera</span>
              <span className={devicesAvailable.camera ? 'text-emerald-500' : 'text-red-500'}>
                {devicesAvailable.camera ? '✅ Available' : '❌ Not found'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Microphone</span>
              <span className={devicesAvailable.mic ? 'text-emerald-500' : 'text-red-500'}>
                {devicesAvailable.mic ? '✅ Available' : '❌ Not found'}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Camera and microphone start muted for privacy
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Video call screen
  const participantCount = participants.length + 1;
  const gridLayout = getGridLayout();

  return (
    <div className="h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 rounded-xl shadow-md">
            <span className="font-mono text-sm font-bold tracking-wider text-white">{roomToken}</span>
          </div>
          <button
            onClick={copyToken}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Copy token"
          >
            <span className="text-lg">📋</span>
          </button>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-600">{connected ? 'Connected' : 'Reconnecting...'}</span>
          </div>
          
          {/* Participant Count */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-gray-600 text-sm">👥</span>
            <span className="text-sm font-medium text-gray-800">{participantCount}</span>
          </div>
          
          {isCreator && (
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm flex items-center gap-1">
              <span>👑</span>
              Creator
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mirror Toggle Button */}
          <button
            onClick={toggleMirror}
            className={`p-2.5 rounded-xl transition-all ${
              mirrorLocalVideo ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title={mirrorLocalVideo ? 'Mirror mode on' : 'Mirror mode off'}
          >
            <span className="text-lg">🔄</span>
          </button>

          {/* Participants Button */}
          <button
            onClick={toggleParticipants}
            className={`p-2.5 rounded-xl transition-all ${
              showParticipants ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title="Participants"
          >
            👥
          </button>
          
          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
          >
            <span>📞</span>
            Leave
          </button>
        </div>
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 flex items-center gap-2 text-sm flex-shrink-0">
          <span className="text-lg">⚠️</span>
          <span className="flex-1">{error}</span>
          <button 
            onClick={() => setError('')} 
            className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Video Grid */}
        <div className={`flex-1 ${showParticipants ? 'mr-80' : ''} transition-all duration-300`}>
          <div 
            ref={videoGridRef}
            className={`grid gap-3 p-3 h-full ${gridLayout} ${participantCount > 6 ? 'overflow-y-auto' : 'overflow-hidden'}`}
          >
            {/* Local Video - Mirrored for natural self-view */}
            <div 
              className={`
                relative bg-white rounded-2xl overflow-hidden border-2 transition-all shadow-lg
                ${videoEnabled ? 'border-indigo-400' : 'border-gray-200'}
                ${fullScreenUser === 'local' ? 'fixed inset-4 z-40 m-0' : 'h-full'}
                group
              `}
            >
              <div className="w-full h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: mirrorLocalVideo ? 'scaleX(-1)' : 'none' }}
                />
              </div>
              
              {/* Video Off Overlay */}
              {!videoEnabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-3xl text-gray-500">📹</span>
                  </div>
                </div>
              )}
              
              {/* Participant Info */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 border border-gray-200 shadow-sm">
                  <span>You</span>
                  {isCreator && <span className="text-amber-600">👑</span>}
                  {!videoEnabled && <span className="text-red-500">📹</span>}
                  {!audioEnabled && <span className="text-red-500">🎤</span>}
                  {audioEnabled && audioLevels.local > 10 && (
                    <span className="text-emerald-500 animate-pulse">🔊</span>
                  )}
                </div>
              </div>
              
              {/* Controls Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setFullScreen('local')}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 p-2 rounded-xl transition-all shadow-sm"
                  title={fullScreenUser === 'local' ? 'Exit full screen' : 'Full screen'}
                >
                  {fullScreenUser === 'local' ? '✕' : '⤢'}
                </button>
              </div>
            </div>
            
            {/* Remote Videos - Normal orientation (not mirrored) */}
            {participants.map(p => (
              <div 
                key={p.id} 
                className={`
                  relative bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg
                  ${fullScreenUser === p.id ? 'fixed inset-4 z-40 m-0' : 'h-full'}
                  group
                `}
              >
                <div className="w-full h-full">
                  <video
                    id={`remote-${p.id}`}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Participant Info */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 border border-gray-200 shadow-sm">
                    <span>{getParticipantName(p)}</span>
                    {raisedHands.has(p.id) && (
                      <span className="text-amber-600 animate-bounce">✋</span>
                    )}
                  </div>
                </div>
                
                {/* Controls Overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {isCreator && (
                    <button
                      onClick={() => setFullScreen(p.id)}
                      className="bg-indigo-600/80 backdrop-blur-sm hover:bg-indigo-700 text-white p-2 rounded-xl transition-all shadow-sm"
                      title="Give full screen"
                    >
                      👑
                    </button>
                  )}
                  <button
                    onClick={() => setFullScreen(p.id)}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 p-2 rounded-xl transition-all shadow-sm"
                    title={fullScreenUser === p.id ? 'Exit full screen' : 'Full screen'}
                  >
                    {fullScreenUser === p.id ? '✕' : '⤢'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 flex flex-col shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>👥</span>
                Participants ({participantCount})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {/* You */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 text-sm font-medium">You</span>
                    {isCreator && <span className="text-amber-600 text-xs">👑</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {!videoEnabled && <span className="text-red-500">📹 Off</span>}
                    {!audioEnabled && <span className="text-red-500">🎤 Muted</span>}
                  </div>
                </div>
              </div>
              
              {/* Other Participants */}
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-bold">
                    {getParticipantName(p).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 text-sm font-medium">{getParticipantName(p)}</span>
                      {raisedHands.has(p.id) && (
                        <span className="text-amber-600 text-xs animate-bounce">✋</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Widget */}
        {showChat && (
          <div className="fixed bottom-24 right-4 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 z-50">
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 rounded-t-2xl border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>💬</span>
                Chat ({messages.length})
              </h3>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="h-80 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 && (
                <div className="text-center mt-8">
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Be the first to say hello! 👋</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.isOwn ? 'bg-indigo-600' : 'bg-gray-100'} rounded-2xl px-4 py-2`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-semibold ${msg.isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}>
                        {msg.user}:
                      </span>
                      <span className="text-xs text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className={`text-sm break-words ${msg.isOwn ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-all flex items-center gap-1 shadow-md"
                >
                  <span>📤</span>
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-200 px-4 py-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-xl transition-all shadow-md ${
              audioEnabled 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
            } text-white`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
            disabled={!connected || !localStreamRef.current}
          >
            <span className="text-xl">{audioEnabled ? '🎤' : '🔇'}</span>
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-xl transition-all shadow-md ${
              videoEnabled 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
            } text-white`}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            disabled={!connected || !localStreamRef.current}
          >
            <span className="text-xl">{videoEnabled ? '📹' : '🚫'}</span>
          </button>
          
          <button
            onClick={raiseHand}
            className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md transition-all"
            title="Raise hand"
            disabled={!connected}
          >
            <span className="text-xl">✋</span>
          </button>
          
          <button
            onClick={leaveRoom}
            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
          >
            <span>📞</span>
            End Call
          </button>

          {/* Chat Button with Badge */}
          <button
            onClick={toggleChat}
            className="relative p-3.5 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md transition-all"
            title="Chat"
          >
            <span className="text-xl">💬</span>
            {newMessageCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VidioChat;