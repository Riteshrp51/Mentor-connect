import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';
import {
  MessageSquare,
  Search,
  Send,
  RefreshCw,
  ArrowLeft,
  Calendar,
  CheckCheck,
  Check,
  Smile,
  Info,
  Paperclip,
  User,
  Mail,
  Briefcase,
  MapPin,
  Sparkles,
  Award,
  X,
  FileText,
  Video as VideoIcon,
  Download,
  Maximize2,
  File,
} from 'lucide-react';
import MentorProfileModal from '../components/MentorProfileModal';
import './MessagesPage.css';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [previewMediaModal, setPreviewMediaModal] = useState(null);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // WhatsApp-Style Contact Info Drawer state (closed by default; user opens via Info button)
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [selectedMentorForModal, setSelectedMentorForModal] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileAttachmentInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const urlRequestId = searchParams.get('requestId');
  const urlConvId = searchParams.get('conversationId');

  // Auto-scroll to bottom of message list
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Helper to reliably get the other participant in a conversation
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants || !Array.isArray(conv.participants)) return null;

    const myId = (user?._id || user?.id || '')?.toString();

    // 1. Primary: Match by ID inequality
    if (myId) {
      const otherById = conv.participants.find((p) => {
        const pId = (p?._id || p?.id || (typeof p === 'string' ? p : ''))?.toString();
        return pId && pId !== myId;
      });
      if (otherById) return otherById;
    }

    // 2. Role-based matching (Student always talks to Mentor, Mentor always talks to Student)
    if (user?.role === 'student') {
      const mentorP = conv.participants.find((p) => p?.role === 'mentor');
      if (mentorP) return mentorP;
      if (conv.mentorshipRequestId?.mentorId) return conv.mentorshipRequestId.mentorId;
    }

    if (user?.role === 'mentor') {
      const studentP = conv.participants.find((p) => p?.role === 'student');
      if (studentP) return studentP;
      if (conv.mentorshipRequestId?.studentId) return conv.mentorshipRequestId.studentId;
    }

    // 3. Fallback
    return conv.participants.length > 1 ? conv.participants[1] : conv.participants[0];
  };

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/conversations');
      if (res.data && res.data.status === 'success') {
        const fetched = res.data.data || [];
        setConversations(fetched);
        return fetched;
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
    return [];
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoadingConversations(true);
      const list = await fetchConversations();

      // If requestId is in URL, fetch or create conversation for it
      if (urlRequestId) {
        try {
          const res = await api.get(`/api/conversations/request/${urlRequestId}`);
          if (res.data && res.data.status === 'success') {
            const matchedConv = res.data.data;
            setActiveConversation(matchedConv);
            fetchConversations();
            return;
          }
        } catch (err) {
          console.error('Error resolving conversation by request:', err);
        }
      }

      // If conversationId is in URL, match it
      if (urlConvId && list.length > 0) {
        const matched = list.find((c) => c._id === urlConvId);
        if (matched) {
          setActiveConversation(matched);
          return;
        }
      }

      // Default to first conversation if available on desktop
      if (window.innerWidth > 768 && list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
      }
    };

    init();
  }, [urlRequestId, urlConvId]);

  // 2. Fetch messages for active conversation
  const fetchMessages = async (convId, isInitial = false) => {
    if (!convId) return;
    try {
      if (isInitial) setLoadingMessages(true);
      const res = await api.get(`/api/conversations/${convId}/messages`);
      if (res.data && res.data.status === 'success') {
        setMessages(res.data.data || []);
        // Reset unread count for this conversation in state
        setConversations((prev) =>
          prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
        );
        window.dispatchEvent(new Event('unread_counts_updated'));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (isInitial) setLoadingMessages(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  };

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation?._id) {
      fetchMessages(activeConversation._id, true);
      setSelectedAttachments([]);
      setTypingUsers({});
    } else {
      setMessages([]);
    }
  }, [activeConversation?._id]);

  // 3. Real-Time WebSockets Integration via Socket.io
  useEffect(() => {
    if (!activeConversation?._id) return;

    const convId = activeConversation._id;

    // Join the socket room for this active conversation
    socket.emit('join_conversation', convId);

    const handleReceiveMessage = (newMsg) => {
      if (newMsg.conversationId === convId) {
        setMessages((prev) => {
          // Prevent duplicates if already present
          if (prev.some((m) => m._id === newMsg._id)) return prev;

          // If there's an optimistic temp message from me, replace it
          const tempIndex = prev.findIndex(
            (m) => m._id?.startsWith('temp-') && m.text === newMsg.text
          );
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = newMsg;
            return updated;
          }

          return [...prev, newMsg];
        });

        // Mark as read on server since active conversation is open
        api.patch(`/api/conversations/${convId}/read`).catch(() => {});
        setConversations((prev) =>
          prev.map((c) =>
            c._id === convId
              ? {
                  ...c,
                  unreadCount: 0,
                  lastMessage: {
                    text: newMsg.text || (newMsg.attachments?.length > 0 ? '📎 Attachment' : ''),
                    sender: newMsg.sender?._id || newMsg.sender,
                    sentAt: newMsg.createdAt,
                  },
                }
              : c
          )
        );
        window.dispatchEvent(new Event('unread_counts_updated'));
        setTimeout(() => scrollToBottom(true), 30);
      } else {
        // Increment unread count for the other conversation
        setConversations((prev) =>
          prev.map((c) =>
            c._id === newMsg.conversationId
              ? {
                  ...c,
                  unreadCount: (c.unreadCount || 0) + 1,
                  lastMessage: {
                    text: newMsg.text || (newMsg.attachments?.length > 0 ? '📎 Attachment' : ''),
                    sender: newMsg.sender?._id || newMsg.sender,
                    sentAt: newMsg.createdAt,
                  },
                }
              : c
          )
        );
        window.dispatchEvent(new Event('unread_counts_updated'));
      }
    };

    const handleUserTyping = ({ conversationId, user: typingUser }) => {
      if (conversationId === convId && typingUser) {
        const myId = (user?._id || user?.id || '')?.toString();
        const tId = (typingUser._id || typingUser.id || '')?.toString();
        if (tId && tId !== myId) {
          setTypingUsers((prev) => ({ ...prev, [tId]: typingUser.name || 'Participant' }));
        }
      }
    };

    const handleUserStopTyping = ({ conversationId, user: typingUser }) => {
      if (conversationId === convId && typingUser) {
        const tId = (typingUser._id || typingUser.id || '')?.toString();
        if (tId) {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[tId];
            return next;
          });
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', convId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [activeConversation?._id, user]);

  // Handle File Selection for attachments (Photos, PDFs, Videos, Documents)
  const handleFileAttachmentSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is larger than the 25MB limit.`);
        return;
      }

      let mediaType = 'document';
      const type = file.type || '';
      const name = file.name.toLowerCase();

      if (type.startsWith('image/')) {
        mediaType = 'image';
      } else if (type.startsWith('video/')) {
        mediaType = 'video';
      } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
        mediaType = 'pdf';
      } else if (type.startsWith('audio/')) {
        mediaType = 'audio';
      } else {
        mediaType = 'document';
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSelectedAttachments((prev) => [
            ...prev,
            {
              fileUrl: reader.result,
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              mediaType,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setSelectedAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 4. Send a new message (text + attachments)
  const handleSendMessage = async (customText) => {
    const textToSend = typeof customText === 'string' ? customText : messageInput;
    const hasAttachments = selectedAttachments.length > 0;
    const trimmed = textToSend.trim();

    if ((!trimmed && !hasAttachments) || !activeConversation?._id || sendingMessage) return;

    const attachmentsToSend = [...selectedAttachments];
    setMessageInput('');
    setSelectedAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Stop typing immediately
    if (activeConversation?._id) {
      socket.emit('stop_typing', {
        conversationId: activeConversation._id,
        user: { _id: user?._id || user?.id, name: user?.name },
      });
    }

    const myId = user?._id || user?.id;

    // Optimistic message addition for instantaneous UI response
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConversation._id,
      sender: {
        _id: myId,
        id: myId,
        name: user?.name,
        profileImage: user?.profileImage,
        role: user?.role,
      },
      text: trimmed,
      attachments: attachmentsToSend,
      createdAt: new Date().toISOString(),
      readBy: [myId],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 10);

    try {
      setSendingMessage(true);
      const res = await api.post(`/api/conversations/${activeConversation._id}/messages`, {
        text: trimmed,
        attachments: attachmentsToSend,
      });

      if (res.data && res.data.status === 'success') {
        const savedMsg = res.data.data;
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMsg._id ? savedMsg : m))
        );

        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    text: trimmed || (attachmentsToSend.length > 0 ? '📎 Attachment' : ''),
                    sender: myId,
                    sentAt: new Date(),
                  },
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
    } finally {
      setSendingMessage(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea and emit typing events
  const handleTextareaChange = (e) => {
    setMessageInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    if (activeConversation?._id) {
      socket.emit('typing', {
        conversationId: activeConversation._id,
        user: { _id: user?._id || user?.id, name: user?.name },
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: activeConversation._id,
          user: { _id: user?._id || user?.id, name: user?.name },
        });
      }, 1500);
    }
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    if (activeConversation?._id) {
      await fetchMessages(activeConversation._id, false);
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const seen = new Set();
    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv);
      const otherId = other?._id || other?.id || conv._id;
      if (seen.has(otherId)) return false;
      seen.add(otherId);

      const name = other?.name || '';
      const topic = conv.mentorshipRequestId?.topic || '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || topic.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, user]);

  const activeOtherParticipant = getOtherParticipant(activeConversation);

  // Extract other participant profile data for WhatsApp drawer
  const otherRole = activeOtherParticipant?.role;
  const isOtherMentor = otherRole === 'mentor';
  const mentorProfile = activeOtherParticipant?.mentorProfile;
  const mentorCompany = mentorProfile?.company || activeOtherParticipant?.company || 'Company';
  const mentorDomain = mentorProfile?.domain || activeOtherParticipant?.domain || 'Software Engineering';
  const mentorRating = mentorProfile?.rating?.average || 5.0;
  const mentorReviews = mentorProfile?.rating?.count || 0;
  const mentorLocation = mentorProfile?.location || 'Remote (Global)';
  const mentorBio =
    mentorProfile?.bio ||
    activeOtherParticipant?.bio ||
    'Experienced mentor supporting student development, technical interviews, and career navigation.';
  const mentorSkills = mentorProfile?.expertise || mentorProfile?.skills || ['System Design', 'DSA', 'React'];

  // Date label formatter for WhatsApp-style day divider
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Time formatter
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div className="messages-page-wrapper">
      <div className="messages-layout">
        {/* ====================================================================
            LEFT SIDEBAR: WhatsApp-Style Chats List
            ==================================================================== */}
        <div className={`messages-sidebar ${activeConversation ? 'hidden-mobile' : ''}`}>
          <div className="messages-sidebar-header">
            <div className="sidebar-title-row">
              <h2 className="sidebar-title">
                Chats
              </h2>
              <button
                type="button"
                className="header-action-btn"
                onClick={handleManualRefresh}
                title="Refresh Conversations"
              >
                <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              </button>
            </div>

            <div className="messages-search-box">
              <Search size={15} className="messages-search-icon" />
              <input
                type="text"
                placeholder="Search or start new chat"
                className="messages-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-list">
            {loadingConversations ? (
              <div className="conversations-loading-state">
                <RefreshCw size={20} className="spinning" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="conversations-empty-state">
                <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {conversations.length === 0 ? 'No conversations yet' : 'No matching chats'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {conversations.length === 0
                    ? user?.role === 'student'
                      ? 'Find mentors and submit a request to chat.'
                      : 'Accept incoming student requests to start chatting.'
                    : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?._id === conv._id;
                const otherName = other?.name || 'Mentor / Student';
                const otherAvatar =
                  other?.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                const lastMsgText = conv.lastMessage?.text || 'Mentorship conversation started';
                const lastMsgTime = conv.lastMessage?.sentAt ? formatTime(conv.lastMessage.sentAt) : '';
                const unreadCount = conv.unreadCount || 0;

                return (
                  <div
                    key={conv._id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveConversation(conv);
                      setSearchParams({ conversationId: conv._id });
                      setConversations((prev) =>
                        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
                      );
                      api.patch(`/api/conversations/${conv._id}/read`).catch(() => {});
                      window.dispatchEvent(new Event('unread_counts_updated'));
                    }}
                  >
                    <div className="conversation-avatar-box">
                      <img src={otherAvatar} alt={otherName} className="conversation-avatar-img" />
                      <span className="online-indicator-dot" />
                    </div>

                    <div className="conversation-item-details">
                      <div className="conversation-top-row">
                        <span className="conversation-name">{otherName}</span>
                        {lastMsgTime && <span className="conversation-timestamp">{lastMsgTime}</span>}
                      </div>

                      <div className="conversation-bottom-row">
                        <p className="conversation-last-message" title={lastMsgText}>
                          {lastMsgText}
                        </p>
                        {unreadCount > 0 && (
                          <span className="conversation-unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ====================================================================
            CENTER CHAT AREA: WhatsApp-Style Messages Window
            ==================================================================== */}
        {activeConversation ? (
          <div className="chat-main-area">
            {/* Chat Top Header */}
            <div className="chat-header">
              <div className="chat-header-user-info">
                <button
                  type="button"
                  className="back-to-list-btn"
                  onClick={() => setActiveConversation(null)}
                  title="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>

                <div
                  className="clickable-header-user"
                  onClick={() => setShowContactInfo((prev) => !prev)}
                  title="Click to view contact info"
                >
                  <div className="chat-header-avatar-box">
                    <img
                      src={
                        activeOtherParticipant?.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={activeOtherParticipant?.name || 'Contact'}
                      className="chat-header-avatar"
                    />
                    <span className="online-indicator-dot small" />
                  </div>

                  <div className="chat-header-text">
                    <h3 className="chat-header-name">
                      {activeOtherParticipant?.name || 'Participant'}
                    </h3>
                    <div className="chat-header-status">
                      <span className="status-dot" />
                      <span>
                        {typingNames.length > 0
                          ? `${typingNames.join(', ')} is typing...`
                          : isOtherMentor
                          ? `${mentorCompany} • ${mentorDomain}`
                          : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <button
                  type="button"
                  className="header-action-btn"
                  onClick={handleManualRefresh}
                  title="Refresh Conversation"
                >
                  <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm header-action-btn-pill"
                  onClick={() => navigate(user?.role === 'student' ? '/student/sessions' : '/mentor/sessions')}
                  title="Schedule a session"
                >
                  <Calendar size={14} />
                  <span>Session</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm header-action-btn-pill"
                  onClick={() => {
                    const roomCode = `mc-${activeConversation._id.slice(-6)}`;
                    navigate(user?.role === 'student' ? `/student/sessions?room=${roomCode}` : `/mentor/sessions?room=${roomCode}`);
                  }}
                  title="Start instant 1:1 video call"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <VideoIcon size={14} />
                  <span>Video Call</span>
                </button>

                <button
                  type="button"
                  className={`header-action-btn ${showContactInfo ? 'active-info-btn' : ''}`}
                  onClick={() => setShowContactInfo((prev) => !prev)}
                  title={showContactInfo ? 'Hide Contact Info' : 'Show Contact Info'}
                >
                  <Info size={17} />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="chat-messages-container">
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={18} className="spinning" style={{ margin: '0 auto 8px auto' }} />
                  <span style={{ fontSize: '13px' }}>Loading message history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Smile size={32} style={{ opacity: 0.5, margin: '0 auto 10px auto' }} />
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    No messages yet
                  </p>
                  <p style={{ fontSize: '13px', maxWidth: '340px', margin: '0 auto' }}>
                    Send a message or share files/photos to start chatting!
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const currentUserId = (user?._id || user?.id || '')?.toString();
                  const senderId = (msg.sender?._id || msg.sender?.id || msg.sender || '')?.toString();
                  const isSentByMe = Boolean(
                    currentUserId &&
                    senderId &&
                    senderId === currentUserId
                  );

                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateDivider =
                    !prevMsg ||
                    new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                  const attachments = msg.attachments || [];

                  return (
                    <div key={msg._id || index} className="message-item-wrapper">
                      {showDateDivider && (
                        <div className="chat-date-divider">
                          <span className="chat-date-pill">{formatDateLabel(msg.createdAt)}</span>
                        </div>
                      )}

                      <div className={`message-row ${isSentByMe ? 'sent' : 'received'}`}>
                        <div className="message-bubble">
                          {/* Rich Attachments List */}
                          {attachments.length > 0 && (
                            <div className="msg-attachments-container">
                              {attachments.map((att, attIdx) => {
                                if (att.mediaType === 'image') {
                                  return (
                                    <div
                                      key={attIdx}
                                      className="msg-attachment-image"
                                      onClick={() => setPreviewMediaModal(att)}
                                      title="Click to expand"
                                    >
                                      <img src={att.fileUrl} alt={att.fileName || 'Photo'} />
                                      <div className="att-image-overlay">
                                        <Maximize2 size={16} />
                                      </div>
                                    </div>
                                  );
                                }

                                if (att.mediaType === 'video') {
                                  return (
                                    <div key={attIdx} className="msg-attachment-video">
                                      <video controls src={att.fileUrl} />
                                    </div>
                                  );
                                }

                                if (att.mediaType === 'pdf') {
                                  return (
                                    <a
                                      key={attIdx}
                                      href={att.fileUrl}
                                      download={att.fileName || 'document.pdf'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="msg-attachment-doc pdf"
                                    >
                                      <div className="doc-icon-box pdf">
                                        <FileText size={20} />
                                      </div>
                                      <div className="doc-info-text">
                                        <span className="doc-name">{att.fileName || 'Document.pdf'}</span>
                                        <span className="doc-meta">
                                          {formatFileSize(att.fileSize)} • PDF Document
                                        </span>
                                      </div>
                                      <Download size={16} className="doc-download-icon" />
                                    </a>
                                  );
                                }

                                return (
                                  <a
                                    key={attIdx}
                                    href={att.fileUrl}
                                    download={att.fileName || 'attachment'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="msg-attachment-doc generic"
                                  >
                                    <div className="doc-icon-box generic">
                                      <File size={20} />
                                    </div>
                                    <div className="doc-info-text">
                                      <span className="doc-name">{att.fileName || 'File attachment'}</span>
                                      <span className="doc-meta">{formatFileSize(att.fileSize)}</span>
                                    </div>
                                    <Download size={16} className="doc-download-icon" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && (
                            <span className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                              {msg.text}
                            </span>
                          )}

                          {/* Interactive Video Call Join Card if message contains Room Code */}
                          {(() => {
                            const roomMatch = msg.text?.match(/mc-\d{4,6}/i);
                            if (roomMatch) {
                              const extractedCode = roomMatch[0].toLowerCase();
                              const rolePath = user?.role === 'student' ? 'student' : 'mentor';
                              return (
                                <div
                                  style={{
                                    marginTop: '8px',
                                    padding: '8px 10px',
                                    backgroundColor: 'rgba(79, 70, 229, 0.12)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(79, 70, 229, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <VideoIcon size={14} style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontSize: '12px', fontWeight: '700' }}>
                                      Room: <code style={{ color: 'var(--primary)' }}>{extractedCode}</code>
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/${rolePath}/sessions?room=${extractedCode}`)}
                                    className="btn btn-primary btn-sm"
                                    style={{
                                      fontSize: '11px',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <VideoIcon size={12} />
                                    Join Video Call
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <span className="message-meta">
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {isSentByMe && (
                              <span className="message-status">
                                {msg.readBy && msg.readBy.length > 1 ? (
                                  <CheckCheck size={14} className="check-read" />
                                ) : (
                                  <Check size={14} className="check-sent" />
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Real-time typing bubble */}
              {typingNames.length > 0 && (
                <div className="message-row received">
                  <div className="typing-indicator-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-text-label">{typingNames.join(', ')} is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Attachments Preview Shelf (Above Composer) */}
            {selectedAttachments.length > 0 && (
              <div className="attachment-preview-bar">
                <div className="attachment-preview-list">
                  {selectedAttachments.map((att, idx) => (
                    <div key={idx} className="attachment-preview-chip">
                      {att.mediaType === 'image' ? (
                        <img src={att.fileUrl} alt={att.fileName} className="preview-chip-thumb" />
                      ) : att.mediaType === 'pdf' ? (
                        <FileText size={18} style={{ color: '#ef4444' }} />
                      ) : att.mediaType === 'video' ? (
                        <VideoIcon size={18} style={{ color: '#3b82f6' }} />
                      ) : (
                        <File size={18} style={{ color: 'var(--primary)' }} />
                      )}
                      <div className="preview-chip-details">
                        <span className="chip-name">{att.fileName}</span>
                        <span className="chip-size">{formatFileSize(att.fileSize)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="preview-chip-remove"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp-style Composer */}
            <div className="chat-composer-area">
              <input
                type="file"
                ref={fileAttachmentInputRef}
                multiple
                accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                onChange={handleFileAttachmentSelect}
                style={{ display: 'none' }}
              />

              <form
                className="composer-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <div className="composer-left-actions">
                  <button
                    type="button"
                    className="composer-icon-btn"
                    title="Emoji"
                    onClick={() => setMessageInput((prev) => prev + ' 😊 ')}
                  >
                    <Smile size={20} />
                  </button>

                  <button
                    type="button"
                    className="composer-icon-btn"
                    title="Attach Photos, PDFs, Videos, or Documents"
                    onClick={() => fileAttachmentInputRef.current?.click()}
                  >
                    <Paperclip size={19} />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  className="composer-textarea"
                  placeholder={
                    selectedAttachments.length > 0
                      ? 'Add a caption or send...'
                      : 'Type a message...'
                  }
                  rows={1}
                  value={messageInput}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                />

                <div className="composer-actions">
                  <button
                    type="submit"
                    className="send-msg-btn"
                    disabled={(!messageInput.trim() && selectedAttachments.length === 0) || sendingMessage}
                    title="Send Message"
                  >
                    {sendingMessage ? (
                      <RefreshCw size={17} className="spinning" />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Empty Chat State when no conversation is selected */
          <div className="empty-chat-state">
            <div className="empty-chat-icon-box">
              <MessageSquare size={36} />
            </div>
            <h3 className="empty-chat-title">Select a Mentorship Conversation</h3>
            <p className="empty-chat-subtitle">
              Choose an active conversation from the sidebar to chat in real-time, share files, PDFs, videos, and collaborate on your learning goals.
            </p>
            {conversations.length === 0 && user?.role === 'student' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/student/mentors')}
              >
                Find a Mentor
              </button>
            )}
          </div>
        )}

        {/* ====================================================================
            RIGHT SIDEBAR: WhatsApp-Style Contact & Profile Info Drawer
            ==================================================================== */}
        {activeConversation && showContactInfo && activeOtherParticipant && (
          <div className="whatsapp-contact-info-panel">
            {/* Drawer Header */}
            <div className="contact-info-header">
              <div className="contact-info-title-group">
                <button
                  type="button"
                  className="contact-info-close-btn"
                  onClick={() => setShowContactInfo(false)}
                  title="Close Contact Info"
                >
                  <X size={18} />
                </button>
                <h3>Contact Info</h3>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="contact-info-scroll-body">
              {/* Profile Hero Section */}
              <div className="contact-info-hero-card">
                <div className="contact-info-avatar-wrapper">
                  <img
                    src={
                      activeOtherParticipant.profileImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={activeOtherParticipant.name}
                    className="contact-info-avatar"
                  />
                  <span className="contact-info-online-badge" />
                </div>

                <h2 className="contact-info-name">{activeOtherParticipant.name}</h2>

                <span className={`contact-info-role-badge ${activeOtherParticipant.role}`}>
                  {isOtherMentor ? '🌟 Verified Mentor' : '🎓 Mentee Student'}
                </span>

                {isOtherMentor ? (
                  <p className="contact-info-headline">
                    <strong>{mentorCompany}</strong> • {mentorDomain}
                  </p>
                ) : (
                  <p className="contact-info-headline">
                    {activeOtherParticipant.email || 'student@university.edu'}
                  </p>
                )}

                {/* Quick Action Buttons */}
                <div className="contact-info-quick-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(user?.role === 'student' ? '/student/sessions' : '/mentor/sessions')}
                  >
                    <Calendar size={14} />
                    Schedule Session
                  </button>

                  {isOtherMentor && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMentorForModal(activeOtherParticipant)}
                    >
                      <User size={14} />
                      Full Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Mentorship Focus / Request Context */}
              {activeConversation.mentorshipRequestId?.topic && (
                <div className="contact-info-section">
                  <span className="section-label">Active Mentorship Focus</span>
                  <div className="topic-highlight-card">
                    <div className="topic-badge">
                      <Sparkles size={13} />
                      <span>Current Focus</span>
                    </div>
                    <h4>{activeConversation.mentorshipRequestId.topic}</h4>
                    {activeConversation.mentorshipRequestId.message && (
                      <p>"{activeConversation.mentorshipRequestId.message}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* About & Bio */}
              <div className="contact-info-section">
                <span className="section-label">About</span>
                <p className="about-text">{mentorBio}</p>
              </div>

              {/* Mentor Specific Information */}
              {isOtherMentor && (
                <>
                  <div className="contact-info-section">
                    <span className="section-label">Overview & Seniority</span>
                    <div className="meta-list">
                      <div className="meta-item">
                        <Briefcase size={15} />
                        <span>{mentorCompany}</span>
                      </div>
                      <div className="meta-item">
                        <MapPin size={15} />
                        <span>{mentorLocation}</span>
                      </div>
                      <div className="meta-item">
                        <Award size={15} />
                        <span>{mentorProfile?.experienceYears || 5}+ Years Experience</span>
                      </div>
                      <div className="meta-item">
                        <Sparkles size={15} style={{ color: '#f59e0b' }} />
                        <span>
                          <strong>{mentorRating}</strong> ({mentorReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="contact-info-section">
                    <span className="section-label">Skills & Expertise</span>
                    <div className="skills-badge-list">
                      {mentorSkills.map((skill, i) => (
                        <span key={i} className="skill-badge-item">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Contact Information */}
              <div className="contact-info-section">
                <span className="section-label">Email Address</span>
                <div className="meta-item email-box">
                  <Mail size={15} />
                  <span>{activeOtherParticipant.email || 'Email hidden'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Media Lightbox Modal */}
      {previewMediaModal && (
        <div
          className="media-lightbox-overlay"
          onClick={() => setPreviewMediaModal(null)}
        >
          <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setPreviewMediaModal(null)}
            >
              <X size={20} />
            </button>

            {previewMediaModal.mediaType === 'image' && (
              <img
                src={previewMediaModal.fileUrl}
                alt={previewMediaModal.fileName}
                className="lightbox-image"
              />
            )}

            <div className="lightbox-footer">
              <span className="lightbox-filename">{previewMediaModal.fileName}</span>
              <a
                href={previewMediaModal.fileUrl}
                download={previewMediaModal.fileName}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Full Mentor Profile Modal */}
      <MentorProfileModal
        mentor={selectedMentorForModal}
        isOpen={Boolean(selectedMentorForModal)}
        onClose={() => setSelectedMentorForModal(null)}
        onRequestMentorship={() => {
          setSelectedMentorForModal(null);
          navigate(user?.role === 'student' ? '/student/sessions' : '/mentor/sessions');
        }}
      />
    </div>
  );
};

export default MessagesPage;
