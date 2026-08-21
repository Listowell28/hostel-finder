import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Chip, Button, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
  CircularProgress, Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // ✅ Payment states
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Fetching bookings...');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');

      const res = await fetch(`${API_URL}/api/my-bookings`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('📡 Error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('📊 Bookings received:', data);
      setBookings(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching bookings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setBookings(bookings.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
      ));
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ ============================================
  // ✅ PAYMENT FUNCTIONS
  // ✅ ============================================
  const handlePayNow = (booking) => {
    setPaymentDialog(booking);
    setPaymentError('');
  };

  const processPayment = async () => {
    if (!paymentDialog) return;

    setProcessingPayment(true);
    setPaymentError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: paymentDialog.id,
          amount: paymentDialog.total_price || paymentDialog.amount || 100,
          email: user?.email || 'customer@example.com'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      if (data.success && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setPaymentError(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment initialization failed');
    } finally {
      setProcessingPayment(false);
      setPaymentDialog(null);
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
    const config = configs[status] || configs.pending;
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

  const canCancel = (booking) => {
    return booking.status !== 'cancelled' && 
           booking.status !== 'completed' && 
           new Date(booking.check_in_date) > new Date();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '1200px', mx: 'auto' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              📅 My <span style={{ color: '#e94560' }}>Bookings</span>
            </Typography>
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
          <Chip 
            label={`${bookings.filter(b => b.status === 'confirmed').length} Confirmed`}
            sx={{ bgcolor: '#e94560', color: 'white', fontWeight: 600 }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

        {bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 2 }}>
              🏠 No Bookings Yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#8892b0', mb: 4 }}>
              You haven't made any bookings yet. Browse hostels and book your stay!
            </Typography>
            <Button
              variant="contained"
              href="/"
              sx={{
                bgcolor: '#e94560',
                borderRadius: 50,
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#c73652' }
              }}
            >
              🏠 Browse Hostels
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid item xs={12} key={booking.id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      height: 80,
                      background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                      p: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                      {booking.hostel_name || 'Hostel'}
                    </Typography>
                    {getStatusChip(booking.status)}
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ color: '#8892b0', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: '#8892b0' }}>
                              {booking.city || 'N/A'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ color: '#e94560', fontSize: 18 }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                                  Check-in
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(booking.check_in_date)}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ color: '#0f3460', fontSize: 18 }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                                  Check-out
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(booking.check_out_date)}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon sx={{ color: '#8892b0', fontSize: 18 }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                                  Guests
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {booking.guests || 1}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MoneyIcon sx={{ color: '#f9a825', fontSize: 18 }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                                  Total Price
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#e94560' }}>
                                  {formatPrice(booking.total_price)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#8892b0' }}>
                            Booked: {formatDate(booking.created_at)}
                          </Typography>
                          
                          {/* ✅ ACTIONS - WITH PAY NOW BUTTON */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/booking/${booking.id}`)}
                              sx={{ borderRadius: 50 }}
                            >
                              View Details
                            </Button>

                            {/* ✅ PAY NOW BUTTON */}
                            {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PaymentIcon />}
                                onClick={() => handlePayNow(booking)}
                                sx={{
                                  bgcolor: '#0f3460',
                                  borderRadius: 50,
                                  '&:hover': { bgcolor: '#1a1a2e' }
                                }}
                              >
                                Pay Now
                              </Button>
                            )}

                            {canCancel(booking) && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setCancelDialogOpen(true);
                                }}
                                sx={{ borderRadius: 50 }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>

                          {booking.status === 'pending' && (
                            <Chip
                              label="Awaiting Confirmation"
                              size="small"
                              sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
                            />
                          )}
                          {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                            <Chip
                              label="Payment Pending"
                              size="small"
                              sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your booking at <strong>{selectedBooking?.hostel_name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Booking</Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ PAYMENT DIALOG */}
      <Dialog open={!!paymentDialog} onClose={() => setPaymentDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>💳 Complete Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Pay for your booking at:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {paymentDialog?.hostel_name || 'Hostel'}
            </Typography>
            
            <Paper sx={{ p: 3, mt: 2, bgcolor: '#f8f9fa', borderRadius: 3 }}>
              <Typography variant="body2" color="textSecondary">Amount:</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#e94560' }}>
                {formatPrice(paymentDialog?.total_price || paymentDialog?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                You will be redirected to Paystack.
              </Typography>
            </Paper>

            {paymentError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {paymentError}
              </Alert>
            )}

            {processingPayment && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress size={24} sx={{ color: '#e94560' }} />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Redirecting to Paystack...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPaymentDialog(null)} disabled={processingPayment}>
            Cancel
          </Button>
          <Button 
            onClick={processPayment} 
            variant="contained"
            disabled={processingPayment}
            sx={{ bgcolor: '#0f3460', borderRadius: 50, px: 4 }}
          >
            {processingPayment ? 'Processing...' : 'Proceed to Pay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyBookings;