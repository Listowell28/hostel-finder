import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PaystackPayment({ 
  bookingId, 
  amount, 
  email, 
  onSuccess, 
  onClose 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  // ✅ Initialize payment
  const initializePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/paystack/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          amount,
          email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // ✅ Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ Handle payment callback (when user returns from Paystack)
  const verifyPayment = async (reference) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/paystack/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        if (onSuccess) onSuccess(data);
        alert(' Payment successful! Your booking is confirmed.');
      } else {
        setError(data.message || 'Payment verification failed');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check if returning from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference');
    
    if (ref) {
      setReference(ref);
      verifyPayment(ref);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
           Complete Payment
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Box sx={{ my: 2 }}>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            Amount to pay:
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            GH₵{amount.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ 
          p: 2, 
          bgcolor: '#f5f7fa', 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <Typography variant="caption" sx={{ color: '#8892b0' }}>
            Secured by Paystack. Your payment is safe and encrypted.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: '#8892b0' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={initializePayment}
          disabled={loading}
          sx={{
            bgcolor: '#e94560',
            borderRadius: 50,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            '&:hover': { bgcolor: '#c73652' }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Pay Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaystackPayment;