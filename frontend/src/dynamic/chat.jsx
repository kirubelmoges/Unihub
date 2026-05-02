import { useState, useContext, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../static/context";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.timeout = 7200000;

// CSRF Token handling
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') return value;
  }
  return null;
};

// Request interceptor
axios.interceptors.request.use(
  config => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 403 && !error.config._retry) {
      error.config._retry = true;
      try {
        await axios.get('/auth/csrf/');
        const newToken = getCsrfToken();
        if (newToken) {
          error.config.headers['X-CSRFToken'] = newToken;
          return axios(error.config);
        }
      } catch (refreshError) {
        console.error('Failed to refresh CSRF token:', refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default function Chat() {
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // UI State
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showStartPrivateChat, setShowStartPrivateChat] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinRoomMessage, setJoinRoomMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  
  // Data States
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [websocket, setWebsocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [participants, setParticipants] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [uploadTimeRemaining, setUploadTimeRemaining] = useState('');
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // File browser state
  const [roomFiles, setRoomFiles] = useState({
    images: [],
    documents: [],
    videos: [],
    others: []
  });
  
  // Data from API
  const [users, setUsers] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  
  // Create Group/Channel State
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    room_type: 'group',
    privacy_level: 'public',
    only_owner_can_post: false,
    selectedMembers: []
  });
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadCancelRef = useRef(null);
  const messageSendTimeoutRef = useRef(null);

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    try {
      await axios.get('/auth/csrf/');
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users/');
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch chat rooms from API
  const fetchChatRooms = async () => {
    try {
      const response = await axios.get('/api/chat/rooms/');
      
      const groups = response.data.filter(room => room.room_type !== 'private');
      const privateRooms = response.data.filter(room => room.room_type === 'private');
      
      setGroupChats(groups.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        room_type: room.room_type,
        privacy_level: room.privacy_level,
        only_owner_can_post: room.only_owner_can_post,
        user_role: room.user_role,
        user_join_status: room.user_join_status,
        lastMessage: room.last_message?.content || 'No messages yet',
        lastMessageType: room.last_message?.type,
        time: room.last_message?.timestamp ? formatTime(room.last_message.timestamp) : '',
        unread: 0,
        members: room.members?.length || 0,
        members_list: room.members || [],
        pending_requests: room.pending_requests || [],
        invite_code: room.invite_code
      })));
      
      setPrivateChats(privateRooms.map(room => {
        const otherParticipant = room.members?.find(m => m.user.id !== user?.id);
        return {
          id: room.id,
          name: otherParticipant?.user.full_name || otherParticipant?.user.username || 'Unknown',
          username: otherParticipant?.user.username || '',
          avatar: otherParticipant?.user.profile?.image || null,
          lastMessage: room.last_message?.content || 'Start a conversation',
          time: room.last_message?.timestamp ? formatTime(room.last_message.timestamp) : '',
          unread: 0,
          online: false,
          roomId: room.id,
          participant: otherParticipant?.user
        };
      }));
      
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }
  };

  // Fetch user profile and initial data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        await fetchCsrfToken();
        const response = await axios.get('/profile/');
        setUserProfile(response.data.profile);
        await fetchUsers();
        await fetchChatRooms();
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!user || !selectedRoomId || !selectedRoomDetails) return;

    const roomName = selectedRoomDetails?.name;
    if (!roomName) return;
    
    const wsUrl = `ws://localhost:8000/ws/chat/${roomName}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      fetchMessages(selectedRoomId);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = (event) => {
      setConnected(false);
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            setWebsocket(null);
          }
        }, 3000);
      }
    };

    ws.onerror = () => setError('WebSocket connection error');

    setWebsocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1000);
    };
  }, [selectedRoomId, selectedRoomDetails?.name]);

  // Fetch messages for selected room
  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(`/api/chat/rooms/${roomId}/messages/`);
      setMessages(response.data);
      
      // Organize files by type
      const files = {
        images: [],
        documents: [],
        videos: [],
        others: []
      };
      
      response.data.forEach(msg => {
        if (msg.message_type === 'file' && msg.file_name) {
          const fileType = msg.file_type || '';
          if (fileType.startsWith('image/')) {
            files.images.push(msg);
          } else if (fileType.startsWith('video/')) {
            files.videos.push(msg);
          } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('sheet')) {
            files.documents.push(msg);
          } else {
            files.others.push(msg);
          }
        }
      });
      
      setRoomFiles(files);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'recent_messages':
        setMessages(data.messages);
        break;
      case 'chat_message':
        setMessages(prev => {
          if (prev.some(msg => msg.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            message: data.message,
            username: data.username,
            full_name: data.full_name || data.username,
            user_id: data.user_id,
            profile_image: data.profile_image,
            timestamp: data.timestamp,
            type: 'chat'
          }];
        });
        break;
      case 'file_message':
        setMessages(prev => {
          if (prev.some(msg => msg.id === data.id)) return prev;
          const newMsg = {
            id: data.id,
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size,
            file_type: data.file_type,
            username: data.username,
            full_name: data.full_name || data.username,
            user_id: data.user_id,
            profile_image: data.profile_image,
            timestamp: data.timestamp,
            type: 'file'
          };
          
          // Update file browser
          const fileType = data.file_type || '';
          if (fileType.startsWith('image/')) {
            setRoomFiles(prev => ({ ...prev, images: [...prev.images, newMsg] }));
          } else if (fileType.startsWith('video/')) {
            setRoomFiles(prev => ({ ...prev, videos: [...prev.videos, newMsg] }));
          } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('sheet')) {
            setRoomFiles(prev => ({ ...prev, documents: [...prev.documents, newMsg] }));
          } else {
            setRoomFiles(prev => ({ ...prev, others: [...prev.others, newMsg] }));
          }
          
          return [...prev, newMsg];
        });
        break;
      case 'system_message':
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: data.message,
          username: 'System',
          full_name: data.full_name || 'System',
          timestamp: data.timestamp,
          type: 'system'
        }]);
        break;
      case 'typing_indicator':
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing && data.user_id !== user?.id) newSet.add(data.user);
          else newSet.delete(data.user);
          return newSet;
        });
        break;
      case 'participants_update':
        setParticipants(data.participants);
        break;
      default:
        console.log('Unknown message type:', data);
    }
  };

  // Create new group/channel
  const handleCreateRoom = async () => {
    if (!newRoom.name.trim() || newRoom.selectedMembers.length === 0) return;
    
    try {
      const response = await axios.post('/api/chat/rooms/create/', {
        name: newRoom.name,
        description: newRoom.description,
        room_type: newRoom.room_type,
        privacy_level: newRoom.privacy_level,
        only_owner_can_post: newRoom.only_owner_can_post,
        members: newRoom.selectedMembers.map(m => m.id)
      });
      
      if (response.data.success) {
        const newRoomData = response.data.room;
        
        setGroupChats(prev => [...prev, {
          id: newRoomData.id,
          name: newRoomData.name,
          description: newRoomData.description,
          room_type: newRoomData.room_type,
          privacy_level: newRoomData.privacy_level,
          only_owner_can_post: newRoomData.only_owner_can_post,
          user_role: 'owner',
          lastMessage: 'Room created',
          time: 'now',
          unread: 0,
          members: newRoomData.members?.length || 0,
          members_list: newRoomData.members || [],
          pending_requests: [],
          invite_code: newRoomData.invite_code
        }]);
        
        setShowCreateGroup(false);
        setNewRoom({
          name: '',
          description: '',
          room_type: 'group',
          privacy_level: 'public',
          only_owner_can_post: false,
          selectedMembers: []
        });
        
        if (response.data.invite_code) alert(`Room created! Invite code: ${response.data.invite_code}`);
        
        setSelectedRoomId(newRoomData.id);
        setSelectedRoomDetails(newRoomData);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  // Join room with invite code
  const handleJoinWithCode = async () => {
    if (!joinRoomCode.trim()) return;
    
    try {
      const roomsResponse = await axios.get('/api/chat/rooms/');
      const roomWithCode = roomsResponse.data.find(room => room.invite_code === joinRoomCode);
      
      if (!roomWithCode) {
        setError('No room found with this invite code');
        return;
      }
      
      const response = await axios.post(`/api/chat/rooms/${roomWithCode.id}/join/`, {
        message: joinRoomMessage
      });
      
      if (response.data.success) {
        setShowJoinRoomModal(false);
        setJoinRoomCode('');
        setJoinRoomMessage('');
        
        if (response.data.message === 'Join request sent') {
          alert('Join request sent! Please wait for approval.');
        } else {
          await fetchChatRooms();
          setSelectedRoomId(roomWithCode.id);
          setSelectedRoomDetails(roomWithCode);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    }
  };

  // Approve join request
  const handleApproveRequest = async (requestId, action) => {
    try {
      const response = await axios.post(`/api/chat/requests/${requestId}/approve/`, { action });
      if (response.data.success) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        if (selectedRoomDetails) {
          const roomResponse = await axios.get(`/api/chat/rooms/${selectedRoomDetails.id}/`);
          setSelectedRoomDetails(roomResponse.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request');
    }
  };

  // Start private chat with user
  const handleStartPrivateChat = async (otherUser) => {
    try {
      const existingChat = privateChats.find(chat => chat.participant?.id === otherUser.id);
      
      if (existingChat) {
        setSelectedRoomId(existingChat.roomId);
        setSelectedRoomDetails(existingChat);
        fetchMessages(existingChat.roomId);
        return;
      }
      
      const response = await axios.post('/api/chat/rooms/create/', {
        name: `private-${user.id}-${otherUser.id}`,
        room_type: 'private',
        privacy_level: 'private',
        members: [otherUser.id]
      });
      
      const newPrivateChat = {
        id: response.data.room.id,
        name: otherUser.full_name || otherUser.username,
        username: otherUser.username,
        avatar: otherUser.profile?.image,
        lastMessage: 'Start a conversation',
        time: 'now',
        unread: 0,
        online: false,
        roomId: response.data.room.id,
        participant: otherUser
      };
      
      setPrivateChats(prev => [...prev, newPrivateChat]);
      setSelectedRoomId(response.data.room.id);
      setSelectedRoomDetails(newPrivateChat);
      setShowStartPrivateChat(false);
    } catch (err) {
      setError('Failed to start private chat');
    }
  };

  // Join room
  const joinRoom = async (room) => {
    try {
      setSelectedRoomId(room.id);
      setSelectedRoomDetails(room);
      if (room.pending_requests?.length > 0) setPendingRequests(room.pending_requests);
      const response = await axios.get(`/api/chat/rooms/${room.id}/`);
      setSelectedRoomDetails(response.data);
    } catch (err) {
      console.error('Error joining room:', err);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    if (!selectedRoomDetails) return;
    try {
      await axios.post(`/api/chat/rooms/${selectedRoomDetails.id}/leave/`);
      setSelectedRoomId(null);
      setSelectedRoomDetails(null);
      setMessages([]);
      setRoomFiles({ images: [], documents: [], videos: [], others: [] });
      await fetchChatRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave room');
    }
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !websocket || websocket.readyState !== WebSocket.OPEN || isSending) return;
    
    setIsSending(true);
    if (messageSendTimeoutRef.current) clearTimeout(messageSendTimeoutRef.current);
    
    websocket.send(JSON.stringify({ type: 'chat_message', message: inputMessage.trim() }));
    setInputMessage('');
    setShowEmojiPicker(false);
    
    messageSendTimeoutRef.current = setTimeout(() => setIsSending(false), 500);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
    return '📎';
  };

  // Check if file is an image
  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  // Handle file click
  const handleFileClick = (fileUrl, fileName, fileType, messageId) => {
    if (isImageFile(fileType)) {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
      setPreviewImage(fullUrl);
      setShowImagePreview(true);
    } else {
      downloadFile(fileUrl, fileName, messageId);
    }
  };

  // Download file
  const downloadFile = async (fileUrl, fileName, messageId) => {
    try {
      setDownloadingFile(messageId);
      setDownloadProgress(0);
      
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:8000${fileUrl}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      
      if (!response.ok) throw new Error(`Download failed with status: ${response.status}`);
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        if (total > 0) setDownloadProgress(Math.round((receivedLength * 100) / total));
      }
      
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      const blob = new Blob([chunksAll]);
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(downloadLink.href);
      }, 100);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download ${fileName}. Error: ${err.message}`);
    } finally {
      setDownloadingFile(null);
      setDownloadProgress(0);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedRoomDetails || uploadingFile) return;

    const MAX_SIZE = 3 * 1024 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      setError(`File too large. Maximum size is 3GB. Your file is ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
      return;
    }

    if (file.size > 1 * 1024 * 1024 * 1024) {
      if (!window.confirm(`File size is ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB. This may take several minutes. Continue?`)) return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadSpeed('');
    setUploadTimeRemaining('');
    setError(null);
    setUploadStartTime(Date.now());
    setTotalBytes(file.size);
    setUploadedBytes(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', selectedRoomDetails.id);

    const controller = new AbortController();
    uploadCancelRef.current = controller;

    try {
      const response = await axios({
        method: 'post',
        url: '/api/chat/upload/',
        data: formData,
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            setUploadedBytes(progressEvent.loaded);
            
            const timeElapsed = (Date.now() - uploadStartTime) / 1000;
            if (timeElapsed > 0) {
              const loadedMB = progressEvent.loaded / (1024 * 1024);
              const speed = loadedMB / timeElapsed;
              setUploadSpeed(speed.toFixed(2));
              
              const remainingMB = (progressEvent.total - progressEvent.loaded) / (1024 * 1024);
              const timeRemaining = remainingMB / speed;
              if (timeRemaining > 0 && isFinite(timeRemaining)) {
                if (timeRemaining > 3600) setUploadTimeRemaining(`${Math.round(timeRemaining / 3600)} hours`);
                else if (timeRemaining > 60) setUploadTimeRemaining(`${Math.round(timeRemaining / 60)} minutes`);
                else setUploadTimeRemaining(`${Math.round(timeRemaining)} seconds`);
              }
            }
          }
        },
        timeout: 7200000,
      });

      if (response.data.success) {
        if (websocket?.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: 'file_message',
            file_data: {
              file_url: response.data.file_url,
              file_name: response.data.file_name,
              file_size: response.data.file_size,
              file_type: response.data.file_type
            }
          }));
        }
        setShowFileUpload(false);
        setUploadProgress(0);
      }
    } catch (err) {
      if (axios.isCancel(err)) setError('Upload cancelled');
      else if (err.code === 'ECONNABORTED') setError('Upload timed out. Please try again with a smaller file.');
      else if (err.response?.status === 403) {
        setError('CSRF error. Refreshing token...');
        await fetchCsrfToken();
      } else if (err.response?.data?.error) setError(err.response.data.error);
      else setError('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      uploadCancelRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    if (uploadCancelRef.current) {
      uploadCancelRef.current.abort();
      setUploadingFile(false);
      setUploadProgress(0);
      setError('Upload cancelled');
    }
  };

  // Handle typing
  const handleTyping = (isTyping) => {
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    handleTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleTyping(false), 1000);
  };

  // Format helpers
  const formatTime = (timestamp) => {
    try { return format(new Date(timestamp), 'HH:mm'); } catch { return ''; }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return format(date, 'MMM dd, yyyy');
    } catch { return ''; }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  // Filter users for starting private chats
  const filteredUsers = users.filter(u => 
    !privateChats.some(chat => chat.participant?.id === u.id) &&
    (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // ========== AUTHENTICATION CHECK ==========
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg font-medium">Loading your chats...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-8">You need to be logged in to access the chat.</p>
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 text-gray-800">
      {/* Left Sidebar - Chat List */}
      <div className={`${showMobileSidebar ? 'fixed inset-0 z-30' : 'hidden'} md:relative md:flex w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex-col`}>
        {/* Overlay for mobile */}
        {showMobileSidebar && (
          <div 
            className="absolute inset-0 bg-black/50 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
        
        <div className="relative bg-white/80 backdrop-blur-sm w-80 h-full flex flex-col">
          {/* User Profile Header */}
          <div className="p-4 bg-white/90 border-b border-gray-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {userProfile?.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{userProfile?.full_name || user.username}</h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-gray-500">online</span>
              </div>
            </div>
            <button 
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-2 flex gap-2">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium shadow-md"
            >
              <span>➕</span> Create
            </button>
            <button
              onClick={() => setShowJoinRoomModal(true)}
              className="flex-1 bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-700 text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium border border-gray-200"
            >
              <span>🔗</span> Join
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'groups' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👥 Groups
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'private' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              💬 Private
            </button>
          </div>

          {/* Chat List Header */}
          <div className="p-4 flex justify-between items-center">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {activeTab === 'groups' ? `Groups & Channels (${groupChats.length})` : `Private Chats (${privateChats.length})`}
            </h4>
            {activeTab === 'groups' && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-100 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
              >
                +
              </button>
            )}
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2">
            {activeTab === 'groups' && groupChats.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-3">👥</p>
                <p className="mb-2">No groups yet</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  Create your first group
                </button>
              </div>
            )}
            
            {activeTab === 'groups' && groupChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  joinRoom(chat);
                  setShowMobileSidebar(false);
                }}
                className={`p-3 mb-1 flex gap-3 rounded-xl cursor-pointer transition-all ${
                  selectedRoomId === chat.id 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 shadow-md' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                    chat.room_type === 'channel' 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-br from-emerald-500 to-green-500'
                  }`}>
                    {chat.room_type === 'channel' ? '📢' : '#'}
                  </div>
                  {chat.privacy_level !== 'public' && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs border-2 border-white shadow-sm">
                      🔒
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate text-gray-800">
                      {chat.name}
                      {chat.room_type === 'channel' && <span className="text-xs text-purple-500 ml-1">📢</span>}
                    </span>
                    <span className="text-xs text-gray-400">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500 truncate">
                      {chat.lastMessageType === 'file' ? '📎 File' : chat.lastMessage}
                    </span>
                    {chat.user_role === 'owner' && (
                      <span className="text-xs text-amber-500" title="Owner">👑</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{chat.members} members</span>
                    {chat.pending_requests?.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {chat.pending_requests.length} pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'private' && privateChats.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-3">💬</p>
                <p className="mb-2">No private chats yet</p>
                <button
                  onClick={() => setShowStartPrivateChat(true)}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  Start a private chat
                </button>
              </div>
            )}
            
            {activeTab === 'private' && privateChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  joinRoom(chat);
                  setShowMobileSidebar(false);
                }}
                className={`p-3 mb-1 flex gap-3 rounded-xl cursor-pointer transition-all ${
                  selectedRoomId === chat.id 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 shadow-md' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {chat.name.charAt(0)}
                  </div>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate text-gray-800">{chat.name}</span>
                    <span className="text-xs text-gray-400">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500 truncate">{chat.lastMessage}</span>
                    {chat.unread > 0 && (
                      <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{chat.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
        {selectedRoomDetails ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  ☰
                </button>
                
                {activeTab === 'private' ? (
                  <>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-md">
                        {selectedRoomDetails.name.charAt(0)}
                      </div>
                      {selectedRoomDetails.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">{selectedRoomDetails.name}</h2>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        {selectedRoomDetails.online ? 'online' : 'offline'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      selectedRoomDetails.room_type === 'channel' 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-br from-emerald-500 to-green-500'
                    }`}>
                      {selectedRoomDetails.room_type === 'channel' ? '📢' : '#'}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-800">{selectedRoomDetails.name}</h2>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">{participants.length} participants</span>
                        {selectedRoomDetails.privacy_level !== 'public' && (
                          <span className="text-amber-600">🔒 {selectedRoomDetails.privacy_level}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFileBrowserOpen(!fileBrowserOpen)}
                  className={`w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors ${
                    fileBrowserOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Files"
                >
                  📁
                </button>
                
                {selectedRoomDetails.pending_requests?.length > 0 && (
                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700 relative"
                  >
                    <span>⏳</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {selectedRoomDetails.pending_requests.length}
                    </span>
                  </button>
                )}
                
                <button className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                  ℹ️
                </button>
                
                {activeTab === 'groups' && (
                  <button
                    onClick={leaveRoom}
                    className="w-8 h-8 rounded-xl hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                    title="Leave room"
                  >
                    🚪
                  </button>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 mx-4 mt-2 rounded-xl flex items-center gap-3">
                <span>⚠️</span>
                <span className="flex-1 text-sm">{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p>Connecting to chat...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex justify-center my-6">
                        <span className="px-4 py-1.5 bg-white/80 backdrop-blur-sm text-gray-500 text-xs rounded-full border border-gray-200 shadow-sm">
                          {date}
                        </span>
                      </div>

                      {/* Messages */}
                      {dateMessages.map((msg) => (
                        <div key={msg.id} className={`flex mb-4 ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            {msg.type !== 'system' && (
                              <div className={`flex-shrink-0 ${msg.user_id === user?.id ? 'ml-3' : 'mr-3'}`}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                  {msg.full_name?.charAt(0) || msg.username?.charAt(0)}
                                </div>
                              </div>
                            )}
                            
                            {/* Message Content */}
                            <div className="flex flex-col">
                              {/* Username */}
                              {msg.type !== 'system' && msg.user_id !== user?.id && (
                                <span className="text-xs text-gray-500 mb-1 ml-1">
                                  {msg.full_name || msg.username}
                                </span>
                              )}
                              
                              {/* Message Bubble */}
                              {msg.type === 'system' ? (
                                <div className="bg-gray-100 text-gray-500 text-sm px-4 py-2 rounded-2xl border border-dashed border-gray-300 shadow-sm">
                                  {msg.message}
                                  <span className="text-xs text-gray-400 ml-2">{formatTime(msg.timestamp)}</span>
                                </div>
                              ) : msg.type === 'file' ? (
                                <div 
                                  onClick={() => handleFileClick(msg.file_url, msg.file_name, msg.file_type, msg.id)}
                                  className={`p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md ${
                                    msg.user_id === user?.id 
                                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                      : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-none border border-gray-200'
                                  }`}
                                >
                                  {isImageFile(msg.file_type) ? (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">🖼️</span>
                                        <span className="text-sm font-medium truncate flex-1">{msg.file_name}</span>
                                        <span className="text-xs opacity-75 bg-black/20 px-2 py-1 rounded-full">
                                          {formatFileSize(msg.file_size)}
                                        </span>
                                      </div>
                                      <img 
                                        src={msg.file_url.startsWith('http') ? msg.file_url : `http://localhost:8000${msg.file_url}`}
                                        alt={msg.file_name}
                                        className="max-w-full max-h-48 rounded-xl object-contain bg-black/10"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50" y="50" font-size="14" text-anchor="middle" fill="%236b7280" dy=".3em">Image Error</text></svg>';
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getFileIcon(msg.file_type)}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{msg.file_name}</p>
                                        <p className="text-xs opacity-75">{formatFileSize(msg.file_size)}</p>
                                      </div>
                                      <span className="text-xl">
                                        {downloadingFile === msg.id ? '⏳' : '⬇️'}
                                      </span>
                                    </div>
                                  )}
                                  {downloadingFile === msg.id && !isImageFile(msg.file_type) && (
                                    <div className="mt-3">
                                      <div className="w-full bg-black/20 rounded-full h-1.5">
                                        <div 
                                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                          style={{ width: `${downloadProgress}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-300 mt-1 text-center">{downloadProgress}%</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className={`p-3 rounded-2xl shadow-md ${
                                  msg.user_id === user?.id 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                    : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-none border border-gray-200'
                                }`}>
                                  <p className="text-sm leading-relaxed">{msg.message}</p>
                                </div>
                              )}
                              
                              {/* Timestamp */}
                              {msg.user_id === user?.id && (
                                <span className="text-xs text-gray-400 mt-1 mr-1 text-right">
                                  {formatTime(msg.timestamp)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />

                  {/* Upload Progress */}
                  {uploadingFile && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Uploading file...</span>
                        <span className="text-sm text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Speed: {uploadSpeed || '0'} MB/s</span>
                        <span>{formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}</span>
                        <span>{uploadTimeRemaining || 'calculating...'}</span>
                      </div>
                      <button 
                        onClick={cancelUpload}
                        className="mt-3 text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg w-full"
                      >
                        Cancel Upload
                      </button>
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center gap-3 text-gray-500 text-sm bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 w-fit shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                      <span>{Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  📎
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-xl"
                >
                  😊
                </button>
                
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeTab === 'private' ? selectedRoomDetails.name : '#' + selectedRoomDetails.name}`}
                  className="flex-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                />
                
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  📤
                </button>
              </form>

              {/* File Upload Options */}
              {showFileUpload && (
                <div className="absolute bottom-20 left-4 z-50 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-gray-200 shadow-2xl w-80">
                  <h3 className="text-gray-800 font-semibold mb-3">Upload File</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {!uploadingFile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all mb-3 font-medium shadow-md"
                      >
                        Choose File
                      </button>
                      <div className="text-xs text-gray-500 space-y-1.5">
                        <p className="flex items-center gap-2">
                          <span className="text-amber-500">⚠️</span>
                          <span>Maximum file size: <span className="text-amber-600 font-bold">3GB</span></span>
                        </p>
                        <p>• Images: JPG, PNG, GIF, WebP</p>
                        <p>• Videos: MP4, AVI, MKV, MOV</p>
                        <p>• Documents: PDF, DOC, XLS, PPT</p>
                        <p>• Archives: ZIP, RAR, 7Z</p>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowFileUpload(false)}
                    className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 z-50">
                  <EmojiPicker
                    onEmojiClick={(e) => {
                      setInputMessage(prev => prev + e.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-7xl mb-6">💬</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">Welcome to Chat</h3>
              <p className="text-gray-500 mb-6">Select a conversation to start messaging</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all hover:scale-105 font-medium shadow-lg"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowStartPrivateChat(true)}
                  className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 px-6 py-3 rounded-xl transition-all hover:scale-105 font-medium shadow-md border border-gray-200"
                >
                  Start Private Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - File Browser */}
      {fileBrowserOpen && selectedRoomDetails && (
        <div className="fixed md:relative right-0 top-0 w-80 h-full bg-white/95 backdrop-blur-md border-l border-gray-200 flex flex-col z-40 shadow-2xl">
          <div className="p-4 bg-white/90 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📁</span> Room Files
            </h3>
            <button
              onClick={() => setFileBrowserOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Images Section */}
            {roomFiles.images.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>🖼️</span> Images ({roomFiles.images.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {roomFiles.images.map(img => (
                    <div
                      key={img.id}
                      onClick={() => handleFileClick(img.file_url, img.file_name, img.file_type, img.id)}
                      className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all hover:scale-105 shadow-sm"
                    >
                      <img
                        src={img.file_url.startsWith('http') ? img.file_url : `http://localhost:8000${img.file_url}`}
                        alt={img.file_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-size="14" text-anchor="middle" fill="%239ca3af" dy=".3em">Image</text></svg>';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Videos Section */}
            {roomFiles.videos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>🎥</span> Videos ({roomFiles.videos.length})
                </h4>
                <div className="space-y-2">
                  {roomFiles.videos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => downloadFile(video.file_url, video.file_name, video.id)}
                      className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎥</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-800">{video.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(video.file_size)}</p>
                        </div>
                        <span className="text-xl">⬇️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Documents Section */}
            {roomFiles.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>📄</span> Documents ({roomFiles.documents.length})
                </h4>
                <div className="space-y-2">
                  {roomFiles.documents.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => downloadFile(doc.file_url, doc.file_name, doc.id)}
                      className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-800">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                        </div>
                        <span className="text-xl">⬇️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Files Section */}
            {roomFiles.others.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>📁</span> Other Files ({roomFiles.others.length})
                </h4>
                <div className="space-y-2">
                  {roomFiles.others.map(file => (
                    <div
                      key={file.id}
                      onClick={() => downloadFile(file.file_url, file.file_name, file.id)}
                      className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-800">{file.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                        </div>
                        <span className="text-xl">⬇️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {roomFiles.images.length === 0 && roomFiles.videos.length === 0 && 
             roomFiles.documents.length === 0 && roomFiles.others.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-5xl mb-4">📁</p>
                <p>No files in this room yet</p>
                <p className="text-xs mt-2">Upload files to see them here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-200 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Room</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Room Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1 cursor-pointer border border-gray-200">
                  <input
                    type="radio"
                    name="room_type"
                    value="group"
                    checked={newRoom.room_type === 'group'}
                    onChange={(e) => setNewRoom({...newRoom, room_type: e.target.value})}
                    className="accent-indigo-600"
                  />
                  <span>Group Chat</span>
                </label>
                <label className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1 cursor-pointer border border-gray-200">
                  <input
                    type="radio"
                    name="room_type"
                    value="channel"
                    checked={newRoom.room_type === 'channel'}
                    onChange={(e) => setNewRoom({...newRoom, room_type: e.target.value})}
                    className="accent-indigo-600"
                  />
                  <span>Channel</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Privacy</label>
              <select
                value={newRoom.privacy_level}
                onChange={(e) => setNewRoom({...newRoom, privacy_level: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              >
                <option value="public">🌍 Public - Anyone can join</option>
                <option value="private">🔒 Private - Requires approval</option>
                <option value="hidden">👁️ Hidden - Invite only</option>
              </select>
            </div>

            {newRoom.room_type === 'channel' && (
              <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoom.only_owner_can_post}
                    onChange={(e) => setNewRoom({...newRoom, only_owner_can_post: e.target.checked})}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Only owner can post messages</span>
                </label>
              </div>
            )}
            
            <div className="mb-4">
              <input
                type="text"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                placeholder="Room name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            
            <div className="mb-4">
              <textarea
                value={newRoom.description}
                onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                placeholder="Description (optional)"
                rows="2"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">Select Members</label>
              <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-2 border border-gray-200">
                {users.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No users available</p>
                )}
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={newRoom.selectedMembers.some(m => m.id === u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRoom({...newRoom, selectedMembers: [...newRoom.selectedMembers, u]});
                        } else {
                          setNewRoom({...newRoom, selectedMembers: newRoom.selectedMembers.filter(m => m.id !== u.id)});
                        }
                      }}
                      className="accent-indigo-600"
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{u.full_name || u.username}</p>
                      <p className="text-xs text-gray-500">{u.profile?.university || 'No university'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCreateRoom}
                disabled={!newRoom.name.trim() || newRoom.selectedMembers.length === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewRoom({ name: '', description: '', room_type: 'group', privacy_level: 'public', only_owner_can_post: false, selectedMembers: [] });
                }}
                className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinRoomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Join Room</h2>
            <div className="mb-4">
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <textarea
                value={joinRoomMessage}
                onChange={(e) => setJoinRoomMessage(e.target.value)}
                placeholder="Why do you want to join? (Optional)"
                rows="3"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleJoinWithCode}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md"
              >
                Join Room
              </button>
              <button
                onClick={() => {
                  setShowJoinRoomModal(false);
                  setJoinRoomCode('');
                  setJoinRoomMessage('');
                }}
                className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequestsModal && pendingRequests.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Join Requests</h2>
            <div className="text-sm text-gray-600 mb-4">
              {selectedRoomDetails?.user_role === 'owner' || selectedRoomDetails?.user_role === 'admin' ? (
                <span className="text-emerald-600 flex items-center gap-1">✅ You can approve/reject requests</span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">⚠️ Only owners and admins can approve requests</span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingRequests.map(request => (
                <div key={request.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {request.user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{request.user?.full_name || request.user?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">@{request.user?.username || 'unknown'}</p>
                    </div>
                  </div>
                  {request.message && (
                    <p className="text-sm text-gray-600 mb-2 p-2 bg-white rounded-lg border border-gray-200">
                      "{request.message}"
                    </p>
                  )}
                  {(selectedRoomDetails?.user_role === 'owner' || selectedRoomDetails?.user_role === 'admin') ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id, 'approve')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id, 'reject')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-2">Waiting for owner/admin approval</p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRequestsModal(false)}
              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Start Private Chat Modal */}
      {showStartPrivateChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Start Private Chat</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No users found</p>
              )}
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.full_name || u.username}</p>
                      <p className="text-xs text-gray-500">{u.profile?.university || 'No university'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartPrivateChat(u)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowStartPrivateChat(false);
                setSearchQuery('');
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button 
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
            >
              ✕
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-center mt-2 text-sm opacity-70">Click outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}