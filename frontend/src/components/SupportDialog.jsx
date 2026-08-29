import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Alert,
  Chip,
  Divider,
  Link
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SupportDialog({ open, onClose, darkMode }) {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendSupport = async () => {
    if (!name || !message) {
      setError('Please fill in your name and message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, message })
      });

      if (!res.ok) throw new Error('Failed to send message');
      setSent(true);
      setTimeout(() => {
        onClose();
        setSent(false);
        setName('');
        setEmail('');
        setMessage('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          bgcolor: darkMode ? '#1e1e1e' : '#ffffff'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: darkMode ? 'white' : '#1a1a2e'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            💬 Customer Support
          </Typography>
          <Typography variant="caption" sx={{ color: '#8892b0' }}>
            We're here to help you 24/7
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#8892b0' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {sent && <Alert severity="success" sx={{ mb: 2 }}>✅ Message sent! We'll get back to you soon.</Alert>}

        {/* Quick Support Options */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
            onClick={() => window.open('https://wa.me/233595023480', '_blank')}
            sx={{ borderRadius: 50, flex: 1 }}
          >
            WhatsApp
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhoneIcon sx={{ color: '#e94560' }} />}
            onClick={() => window.location.href = 'tel:+233507194524'}
            sx={{ borderRadius: 50, flex: 1 }}
          >
            Call Us
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon sx={{ color: '#1976d2' }} />}
            onClick={() => window.location.href = 'mailto:alistowell28@gmail.com'}
            sx={{ borderRadius: 50, flex: 1 }}
          >
            Email
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#8892b0' }}>
            OR SEND A MESSAGE
          </Typography>
        </Divider>

        <TextField
          fullWidth
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Your Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="How can we help you?"
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question..."
        />

        <Box sx={{ mt: 2 }}>
          <Chip
            label="Response time: < 1 hour"
            size="small"
            sx={{ bgcolor: '#4caf50', color: 'white' }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: '#8892b0' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSendSupport}
          disabled={sending || sent}
          startIcon={<SendIcon />}
          sx={{
            bgcolor: '#e94560',
            borderRadius: 50,
            px: 4,
            '&:hover': { bgcolor: '#c73652' }
          }}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SupportDialog;