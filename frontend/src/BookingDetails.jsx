// frontend/src/pages/BookingDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, CircularProgress,
  Alert, Divider, Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      console.log(`📡 Fetching booking ${id}...`);
      
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Booking not found');
        } else if (res.status === 401) {
          throw new Error('Please login again');
        } else {
          throw new Error('Failed to fetch booking');
        }
      }
      
      const data = await res.json();
      console.log('✅ Booking data:', data);
      setBooking(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error:', err.message);
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const configs = {
      confirmed: { icon: <CheckCircleIcon />, label: 'Confirmed', color: 'success' },
      pending: { icon: <PendingIcon />, label: 'Pending', color: 'warning' },
      cancelled: { icon: <CancelIcon />, label: 'Cancelled', color: 'error' },
      completed: { icon: <CheckCircleIcon />, label: 'Completed', color: 'info' },
      paid: { icon: <CheckCircleIcon />, label: 'Paid', color: 'success' }
    };
    const config = configs[status?.toLowerCase()] || configs.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="medium"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `GH₵${parseFloat(price)?.toFixed(2) || '0.00'}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/my-bookings')} 
          sx={{ borderRadius: 50, bgcolor: '#e94560' }}
        >
          Back to Bookings
        </Button>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Booking not found</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/my-bookings')} 
          sx={{ borderRadius: 50, bgcolor: '#e94560' }}
        >
          Back to Bookings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '800px', mx: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="text"
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#8892b0' }}
            >
              Back
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              Booking #{booking.id}
            </Typography>
          </Box>
          {getStatusChip(booking.status)}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Hostel Name */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            {booking.hostel_name || 'Hostel'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LocationOnIcon sx={{ fontSize: 18, color: '#8892b0' }} />
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {booking.location || booking.city || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <PhoneIcon sx={{ fontSize: 18, color: '#8892b0' }} />
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {booking.hostel_phone || booking.phone_number || 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Check-in - FIXED: use check_in not check_in_date */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} /> Check-in
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatDate(booking.check_in || booking.check_in_date)}
              </Typography>
            </Box>
          </Grid>

          {/* Check-out - FIXED: use check_out not check_out_date */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} /> Check-out
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatDate(booking.check_out || booking.check_out_date)}
              </Typography>
            </Box>
          </Grid>

          {/* Room Type */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} /> Room Type
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {booking.room_type || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          {/* Guests */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} /> Guests
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {booking.guests || 1}
              </Typography>
            </Box>
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} /> Phone Number
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {booking.phone_number || 'N/A'}
              </Typography>
            </Box>
          </Grid>

          {/* Total Price */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                <MoneyIcon sx={{ fontSize: 16, mr: 0.5 }} /> Total Price
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#e94560' }}>
                {formatPrice(booking.total_price)}
              </Typography>
            </Box>
          </Grid>

          {/* Payment Status */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                Payment Status
              </Typography>
              <Chip
                label={booking.payment_status === 'paid' ? 'Paid ✅' : 'Pending ⏳'}
                color={booking.payment_status === 'paid' ? 'success' : 'warning'}
                sx={{ mt: 0.5, fontWeight: 600 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Special Requests - Only show if exists */}
        {booking.special_requests && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
              Special Requests
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {booking.special_requests}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/my-bookings')}
            sx={{
              bgcolor: '#e94560',
              borderRadius: 50,
              px: 4,
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            View All Bookings
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{
              borderRadius: 50,
              px: 4,
              borderColor: '#8892b0',
              color: '#8892b0'
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default BookingDetails;