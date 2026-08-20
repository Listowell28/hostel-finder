import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, Badge,
  Divider, Chip, AppBar, Toolbar, CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

function Chat({ currentUser, onClose }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    connectSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // Filter out current user
      setUsers(data.filter(u => u.id !== currentUser.id));
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const connectSocket = () => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      newSocket.emit('user-join', currentUser.id);
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('receive-message', (data) => {
      setMessages(prev => [...prev, {
        ...data,
        isMine: false
      }]);
    });

    newSocket.on('user-typing', (data) => {
      setTypingUser(data.senderName);
      setTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
        setTypingUser('');
      }, 2000);
    });

    newSocket.on('user-stopped-typing', () => {
      setTyping(false);
      setTypingUser('');
    });

    newSocket.on('chat-history', (history) => {
      const formatted = history.map(msg => ({
        ...msg,
        isMine: msg.sender_id === currentUser.id,
        senderName: msg.sender_id === currentUser.id ? 'You' : selectedUser?.full_name
      }));
      setMessages(formatted);
      setLoading(false);
    });

    setSocket(newSocket);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessages([]);
    setLoading(true);
    if (socket) {
      socket.emit('get-chat-history', {
        userId: currentUser.id,
        otherUserId: user.id
      });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      message: newMessage,
      senderName: currentUser.full_name
    };

    // Add message locally immediately
    setMessages(prev => [...prev, {
      ...messageData,
      isMine: true,
      pending: true,
      timestamp: new Date().toISOString()
    }]);

    if (socket) {
      socket.emit('send-message', messageData);
    }

    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && selectedUser && e.target.value.length > 0) {
      socket.emit('typing', {
        receiverId: selectedUser.id,
        senderName: currentUser.full_name
      });
    } else if (socket && selectedUser) {
      socket.emit('stop-typing', {
        receiverId: selectedUser.id
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: { xs: '95%', sm: 400 },
        height: 550,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 9999,
        overflow: 'hidden',
        bgcolor: 'white'
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
          px: 2,
          py: 1
        }}
      >
        <Toolbar variant="dense" sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon sx={{ color: 'white' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {selectedUser ? selectedUser.full_name : 'Chat'}
            </Typography>
            {selectedUser && onlineUsers.includes(selectedUser.id) && (
              <Chip
                label="Online"
                size="small"
                sx={{ bgcolor: '#4caf50', color: 'white', height: 20, fontSize: '10px' }}
              />
            )}
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* User List or Chat */}
      {!selectedUser ? (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Select a user to chat
          </Typography>
          <List>
            {users.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#8892b0', py: 4 }}>
                No other users found
              </Typography>
            ) : (
              users.map((user) => (
                <ListItem
                  button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  sx={{ borderRadius: 2, '&:hover': { bgcolor: '#f5f7fa' } }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!onlineUsers.includes(user.id)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: '#e94560' }}>
                        {getInitials(user.full_name)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText primary={user.full_name} secondary={user.email} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      ) : (
        <>
          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#e94560' }} />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#8892b0' }}>
                  No messages yet. Start chatting!
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
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                      }}
                    >
                      {!msg.isMine && (
                        <Typography variant="caption" sx={{ display: 'block', color: '#8892b0', mb: 0.5 }}>
                          {msg.senderName || 'User'}
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
                        {msg.created_at ? formatTime(msg.created_at) : 'Sending...'}
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
          <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
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
                    bgcolor: '#f5f7fa'
                  }
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
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
    </Paper>
  );
}

export default Chat;