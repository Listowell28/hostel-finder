import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Star as StarIcon,
  Verified as VerifiedIcon,
  Diamond as DiamondIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PremiumManager() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('premium');
  const [processing, setProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user.role !== 'admin' && user.role !== 'owner') {
      setError('You need admin or owner access');
      setLoading(false);
      return;
    }
    fetchMyHostels();
  }, []);

  const fetchMyHostels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // Filter hostels owned by user or all if admin
      const filtered = user.role === 'admin' 
        ? data 
        : data.filter(h => h.owner_id === user.id);
      setHostels(filtered);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch hostels');
      setLoading(false);
    }
  };

  const handleUpgrade = (hostel) => {
    setSelectedHostel(hostel);
    setSelectedTier(hostel.is_premium ? hostel.premium_tier : 'premium');
    setDialogOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/premium/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelId: selectedHostel.id,
          tier: selectedTier
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upgrade');

      setSuccess(`✅ Hostel upgraded to ${selectedTier.toUpperCase()}!`);
      setDialogOpen(false);
      fetchMyHostels();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getBadge = (tier) => {
    if (tier === 'vip') {
      return {
        icon: <DiamondIcon sx={{ fontSize: 16, color: '#ffd700' }} />,
        label: 'VIP',
        color: '#ffd700',
        bgcolor: 'rgba(255,215,0,0.15)'
      };
    }
    if (tier === 'premium') {
      return {
        icon: <StarIcon sx={{ fontSize: 16, color: '#e94560' }} />,
        label: 'Premium',
        color: '#e94560',
        bgcolor: 'rgba(233,69,96,0.15)'
      };
    }
    return {
      icon: null,
      label: 'Free',
      color: '#8892b0',
      bgcolor: 'transparent'
    };
  };

  const getPrice = (tier) => {
    if (tier === 'vip') return 'GH₵250/month';
    if (tier === 'premium') return 'GH₵100/month';
    return 'Free';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  if (user.role !== 'admin' && user.role !== 'owner') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">You need owner or admin access to manage premium listings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            💎 Premium Listings
          </Typography>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            Upgrade your hostels to get featured and attract more bookings
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Total Listings</Typography>
              <Typography variant="h4">{hostels.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Premium Listings</Typography>
              <Typography variant="h4">{hostels.filter(h => h.is_premium).length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>VIP Listings</Typography>
              <Typography variant="h4">{hostels.filter(h => h.premium_tier === 'vip').length}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Hostel List */}
        <Grid container spacing={3}>
          {hostels.map((hostel) => {
            const badge = getBadge(hostel.premium_tier);
            const isPremium = hostel.is_premium;

            return (
              <Grid item xs={12} sm={6} md={4} key={hostel.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: isPremium ? `2px solid ${badge.color}` : '1px solid #eee',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      height: 100,
                      background: isPremium 
                        ? `linear-gradient(135deg, ${badge.color}22, ${badge.color}44)`
                        : '#f5f7fa',
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                        {hostel.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8892b0' }}>
                        {hostel.city}, {hostel.state || 'Ghana'}
                      </Typography>
                    </Box>
                    <Chip
                      icon={badge.icon}
                      label={badge.label}
                      size="small"
                      sx={{
                        bgcolor: badge.bgcolor,
                        color: badge.color,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#8892b0' }}>
                        Price: <strong>GH₵{hostel.price_per_year}/year</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8892b0' }}>
                        {hostel.available !== false ? '🟢 Available' : '🔴 Unavailable'}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#8892b0' }}>
                          Current Plan
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: badge.color }}>
                          {badge.label || 'Free'}
                        </Typography>
                      </Box>

                      {isPremium ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleUpgrade(hostel)}
                          sx={{ borderRadius: 50, px: 3 }}
                        >
                          Change Plan
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleUpgrade(hostel)}
                          sx={{
                            bgcolor: '#e94560',
                            borderRadius: 50,
                            px: 3,
                            '&:hover': { bgcolor: '#c73652' }
                          }}
                        >
                          Upgrade Now
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Upgrade Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          Upgrade {selectedHostel?.name}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#8892b0', mb: 2 }}>
              Choose a plan to upgrade your listing
            </Typography>

            <Grid container spacing={2}>
              {/* Premium Plan */}
              <Grid item xs={12} sm={6}>
                <Card
                  onClick={() => setSelectedTier('premium')}
                  sx={{
                    cursor: 'pointer',
                    border: selectedTier === 'premium' ? '2px solid #e94560' : '1px solid #ddd',
                    borderRadius: 3,
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StarIcon sx={{ color: '#e94560' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      Premium
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#e94560' }}>
                    GH₵100
                    <Typography variant="caption" sx={{ color: '#8892b0' }}>/month</Typography>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Featured on homepage
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Premium badge
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Basic analytics
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* VIP Plan */}
              <Grid item xs={12} sm={6}>
                <Card
                  onClick={() => setSelectedTier('vip')}
                  sx={{
                    cursor: 'pointer',
                    border: selectedTier === 'vip' ? '2px solid #ffd700' : '1px solid #ddd',
                    borderRadius: 3,
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Chip
                    label="BEST VALUE"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: '#ffd700',
                      color: '#1a1a2e',
                      fontWeight: 700,
                      fontSize: '0.55rem'
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DiamondIcon sx={{ color: '#ffd700' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      VIP
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffd700' }}>
                    GH₵250
                    <Typography variant="caption" sx={{ color: '#8892b0' }}>/month</Typography>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Top featured placement
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ VIP badge
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Advanced analytics
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6b7a8f' }}>
                      ✅ Priority support
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpgrade}
            disabled={processing}
            sx={{
              bgcolor: '#e94560',
              borderRadius: 50,
              px: 4,
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            {processing ? 'Processing...' : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PremiumManager;