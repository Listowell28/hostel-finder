import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWishlistItems(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch wishlist');
      setLoading(false);
    }
  };

  const removeFromWishlist = async (hostelId) => {
    try {
      const res = await fetch(`${API_URL}/api/wishlist/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hostelId })
      });

      if (!res.ok) throw new Error('Failed to remove');

      setWishlistItems(wishlistItems.filter(item => item.id !== hostelId));
      setSuccess('Removed from wishlist');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getImageUrl = (hostel) => {
    if (hostel.images && hostel.images.length > 0) {
      const img = hostel.images[0];
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads')) return `${API_URL}${img}`;
      return img;
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              ❤️ My Wishlist
            </Typography>
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {wishlistItems.length} saved properties
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderRadius: 50, px: 4 }}
          >
            Browse More
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {wishlistItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FavoriteIcon sx={{ fontSize: 64, color: '#8892b0', opacity: 0.3, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>
              No Saved Properties
            </Typography>
            <Typography variant="body1" sx={{ color: '#8892b0', mb: 3 }}>
              Start exploring and save your favorite hostels!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ bgcolor: '#e94560', borderRadius: 50, px: 4 }}
            >
              Explore Now
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {wishlistItems.map((hostel) => (
              <Grid item xs={12} sm={6} md={4} key={hostel.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 180,
                      bgcolor: '#f0f2f5',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/hostel/${hostel.id}`)}
                  >
                    {getImageUrl(hostel) ? (
                      <img
                        src={getImageUrl(hostel)}
                        alt={hostel.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <FavoriteIcon sx={{ fontSize: 48, color: '#ccc' }} />
                      </Box>
                    )}
                    
                    {/* Price badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      GH₵{hostel.price_per_year}/year
                    </Box>

                    {/* Remove button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(hostel.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        '&:hover': { bgcolor: 'rgba(233,69,96,0.8)' }
                      }}
                    >
                      <DeleteIcon sx={{ color: 'white', fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#1a1a2e',
                        mb: 0.5,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                    >
                      {hostel.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 14, color: '#8892b0' }} />
                      <Typography variant="caption" sx={{ color: '#8892b0' }}>
                        {hostel.city}, {hostel.state || 'Ghana'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <StarIcon sx={{ fontSize: 14, color: '#ffd700' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {hostel.rating || '4.9'}
                        </Typography>
                      </Box>
                      <Chip
                        label={hostel.available !== false ? 'Available' : 'Unavailable'}
                        size="small"
                        color={hostel.available !== false ? 'success' : 'error'}
                        sx={{ fontSize: '0.6rem' }}
                      />
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                      sx={{
                        bgcolor: '#e94560',
                        borderRadius: 50,
                        '&:hover': { bgcolor: '#c73652' }
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}

export default Wishlist;