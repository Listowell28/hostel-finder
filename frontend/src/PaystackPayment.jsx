import { useState } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Alert, Divider, Chip
} from '@mui/material';

function PaystackPayment({ bookingId, amount, email, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = 'http://localhost:5000';

  const handlePay = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      console.log('💳 Initializing payment...');
      console.log('Booking ID:', bookingId);
      console.log('Amount:', amount);
      console.log('Email:', email);

      // Initialize payment
      const res = await fetch(`${API_URL}/api/paystack/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          amount: parseFloat(amount),
          email: email || 'customer@example.com'
        })
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const data = await res.json();
      console.log('📡 Payment data:', data);

      if (!data.authorization_url) {
        throw new Error('No authorization URL received');
      }

      // Open Paystack popup
      const paystackPopup = window.open(
        data.authorization_url,
        '_blank',
        'width=600,height=700,scrollbars=yes'
      );

      if (!paystackPopup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Poll for payment completion
      const checkPayment = setInterval(async () => {
        try {
          console.log('🔍 Checking payment status...');
          const verifyRes = await fetch(`${API_URL}/api/paystack/verify/${data.reference}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const verifyData = await verifyRes.json();
          console.log('📡 Verification data:', verifyData);

          if (verifyData.success) {
            clearInterval(checkPayment);
            setSuccess('✅ Payment successful! Booking confirmed.');
            setTimeout(() => {
              if (onSuccess) onSuccess(verifyData.bookingId);
            }, 1500);
          }
        } catch (err) {
          console.error('Verification error:', err);
        }
      }, 3000);

    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format price
  const formattedPrice = parseFloat(amount).toFixed(2);

  return (
    <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2 }}>
        💳 Pay with Paystack
      </Typography>
      <Typography variant="body2" sx={{ color: '#8892b0', mb: 3 }}>
        Pay securely with card, mobile money, or bank transfer
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Amount: GH₵{formattedPrice}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="💳 Card" size="small" sx={{ bgcolor: '#e94560', color: 'white' }} />
          <Chip label="📱 Mobile Money" size="small" sx={{ bgcolor: '#0f3460', color: 'white' }} />
          <Chip label="🏦 Bank Transfer" size="small" sx={{ bgcolor: '#2d3436', color: 'white' }} />
        </Box>
        <Divider sx={{ mt: 2 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onCancel}
          sx={{ borderRadius: 50 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handlePay}
          disabled={loading}
          sx={{
            bgcolor: '#e94560',
            borderRadius: 50,
            '&:hover': { bgcolor: '#c73652' }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Pay Now'}
        </Button>
      </Box>
    </Paper>
  );
}

export default PaystackPayment;