import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function LiveChat({ user, darkMode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [supportOnline, setSupportOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect to socket
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      query: { userId: user?.id || 'guest' }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🟢 Connected to chat support');
      setIsConnected(true);
      if (user) {
        newSocket.emit('user-join', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Disconnected from chat support');
      setIsConnected(false);
    });

    newSocket.on('receive-support-message', (data) => {
      setMessages(prev => [...prev, { ...data, isMine: false }]);
      setUnreadCount(prev => prev + 1);
      scrollToBottom();
    });

    newSocket.on('support-typing', (data) => {
      setTyping(true);
      setTypingUser(data.senderName);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
        setTypingUser('');
      }, 2000);
    });

    newSocket.on('support-stopped-typing', () => {
      setTyping(false);
      setTypingUser('');
    });

    newSocket.on('support-online-status', (status) => {
      setSupportOnline(status);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      senderId: user?.id || 'guest',
      senderName: user?.full_name || 'Guest User',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isSupport: false
    };

    setMessages(prev => [...prev, { ...messageData, isMine: true }]);
    socket.emit('send-support-message', messageData);
    setNewMessage('');
    setUnreadCount(0);
    scrollToBottom();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && e.target.value.length > 0) {
      socket.emit('support-typing', {
        senderName: user?.full_name || 'Guest User',
        isSupport: false
      });
    } else if (socket) {
      socket.emit('support-stopped-typing');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setOpen(false);
    setUnreadCount(0);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Get user initial
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <Fab
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 9999,
          bgcolor: '#e94560',
          color: 'white',
          '&:hover': { bgcolor: '#c73652' },
          width: { xs: 56, sm: 64 },
          height: { xs: 56, sm: 64 },
          boxShadow: '0 4px 20px rgba(233,69,96,0.4)'
        }}
      >
        <Badge
          color="error"
          badgeContent={unreadCount}
          invisible={unreadCount === 0 || open}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#e94560',
              color: 'white',
              fontWeight: 'bold'
            }
          }}
        >
          {supportOnline ? (
            <ChatIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          ) : (
            <SupportAgentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          )}
        </Badge>
      </Fab>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: { xs: 0, sm: 80 },
            right: { xs: 0, sm: 24 },
            top: { xs: 0, sm: 'auto' },
            left: { xs: 0, sm: 'auto' },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '80vh' },
            width: { xs: '100%', sm: 400 },
            borderRadius: { xs: 0, sm: 4 },
            overflow: 'hidden',
            bgcolor: darkMode ? '#1a1a2e' : '#ffffff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: darkMode ? '#1a1a2e' : '#1a1a2e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#e94560', width: 40, height: 40 }}>
              <SupportAgentIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {supportOnline ? '💬 Live Support' : 'Support Team'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: supportOnline ? '#4caf50' : '#e94560'
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {supportOnline ? 'Online' : 'Away'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={handleMinimize}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {isMinimized ? <span>□</span> : <span>_</span>}
            </IconButton>
            <IconButton
              onClick={handleClose}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        {!isMinimized && (
          <>
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                bgcolor: darkMode ? '#121212' : '#f5f7fa',
                minHeight: 300,
                maxHeight: 400
              }}
            >
              {!isConnected ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#e94560' }} />
                  <Typography variant="body2" sx={{ color: '#8892b0', mt: 2 }}>
                    Connecting to support...
                  </Typography>
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SupportAgentIcon sx={{ fontSize: 48, color: '#8892b0', opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ color: '#8892b0', mt: 2 }}>
                    {supportOnline 
                      ? 'Send us a message and we\'ll help you!' 
                      : 'Leave a message and we\'ll get back to you.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
                        mb: 1.5
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '80%',
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: msg.isMine ? '#e94560' : 'white',
                          color: msg.isMine ? 'white' : '#1a1a2e',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          ...(darkMode && !msg.isMine && {
                            bgcolor: '#2d2d2d',
                            color: 'white'
                          })
                        }}
                      >
                        {!msg.isMine && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: '#8892b0',
                              mb: 0.5,
                              fontWeight: 600
                            }}
                          >
                            {msg.senderName || 'Support'}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {msg.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            color: msg.isMine ? 'rgba(255,255,255,0.7)' : '#8892b0',
                            fontSize: '10px',
                            mt: 0.5
                          }}
                        >
                          {msg.timestamp ? formatTime(msg.timestamp) : new Date().toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {typing && typingUser && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                      <Typography variant="caption" sx={{ color: '#8892b0' }}>
                        {typingUser} is typing...
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>

            {/* Input */}
            <Box
              sx={{
                p: 2,
                bgcolor: darkMode ? '#1e1e1e' : 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 50,
                      bgcolor: darkMode ? '#2d2d2d' : '#f5f7fa'
                    }
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  sx={{
                    bgcolor: '#e94560',
                    color: 'white',
                    '&:hover': { bgcolor: '#c73652' },
                    '&:disabled': { bgcolor: '#ddd' }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Dialog>
    </>
  );
}

export default LiveChat;