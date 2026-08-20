// frontend/src/pages/HostelDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, Grid, Divider,
  Rating, CircularProgress, Alert, IconButton, Container,
  ImageList, ImageListItem, Card, CardContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationOnIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  Tv as TvIcon,
  Wifi as WifiIcon,
  FitnessCenter as FitnessCenterIcon,
  Kitchen as KitchenIcon,
  LocalParking as ParkingIcon,
  Star as StarIcon,
  Share as ShareIcon,
  ZoomIn as ZoomInIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ImageGallery from './ImageGallery';
// ✅ IMPORT REVIEWS COMPONENT
import Reviews from './reviews.jsx';

const API_URL = 'http://localhost:5000';

function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchHostelDetails();
    fetchRooms();
  }, [id]);

  const fetchHostelDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels/${id}`);
      if (!res.ok) throw new Error('Hostel not found');
      const data = await res.json();
      setHostel(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels/${id}/rooms`);
      if (!res.ok) throw new Error('No rooms found');
      const data = await res.json();
      setRooms(data);
      setLoadingRooms(false);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setLoadingRooms(false);
    }
  };

  // ✅ FIXED: Navigate to home with hostel ID for booking
  const handleBookNow = () => {
    // Navigate to home page with hostel ID in state
    navigate('/', { state: { bookHostelId: id } });
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': <WifiIcon />,
      'TV': <TvIcon />,
      'Kitchen': <KitchenIcon />,
      'Parking': <ParkingIcon />,
      'Gym': <FitnessCenterIcon />,
      'Bath': <BathtubIcon />,
      'Room': <BedIcon />
    };
    return icons[amenity] || <BedIcon />;
  };

  const getRoomTypeLabel = (type) => {
    const types = {
      'single': 'Single Room',
      'double': 'Double Room',
      'twin': 'Twin Room',
      'dorm': 'Dormitory',
      'suite': 'Suite',
      'studio': 'Studio'
    };
    return types[type] || type;
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      'single': 'primary',
      'double': 'success',
      'twin': 'info',
      'dorm': 'warning',
      'suite': 'error',
      'studio': 'secondary'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  if (error || !hostel) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || 'Hostel not found'}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2, borderRadius: 50 }}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', pb: 4 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          px: 3,
          pt: 3,
          pb: 4,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton sx={{ color: 'white' }}>
            <ShareIcon />
          </IconButton>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {hostel.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <LocationOnIcon sx={{ fontSize: 18, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {hostel.city}, {hostel.state || 'Ghana'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={parseFloat(hostel.rating) || 0} readOnly size="small" sx={{ color: '#ffd700' }} />
            <Typography variant="body2">{hostel.rating || 'New'}</Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {hostel.review_count || 0} reviews
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2 }}>
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#e94560' }}>
                GH₵{hostel.price_per_year}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>
                per year
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {hostel.available !== false ? (
                <Chip label="Available" color="success" sx={{ fontWeight: 600 }} />
              ) : (
                <Chip label="Unavailable" color="error" sx={{ fontWeight: 600 }} />
              )}
              {user ? (
                (user.role === 'student' || user.role === 'admin') && (
                  <Button
                    variant="contained"
                    onClick={handleBookNow}
                    sx={{
                      bgcolor: '#e94560',
                      borderRadius: 50,
                      px: 4,
                      '&:hover': { bgcolor: '#c73652' },
                      fontWeight: 600
                    }}
                  >
                    Book Now
                  </Button>
                )
              ) : (
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: '#e94560',
                    borderRadius: 50,
                    px: 4,
                    '&:hover': { bgcolor: '#c73652' },
                    fontWeight: 600
                  }}
                >
                  Login to Book
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          🛏️ Available Rooms
        </Typography>

        {loadingRooms ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#e94560' }} />
          </Box>
        ) : rooms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, mb: 3 }}>
            <Typography sx={{ color: '#8892b0' }}>
              No rooms available for this hostel yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {rooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } }}>
                  {room.images && room.images.length > 0 ? (
                    <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 150, bgcolor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BedIcon sx={{ fontSize: 48, color: '#8892b0' }} />
                    </Box>
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>{room.name}</Typography>
                      <Chip label={getRoomTypeLabel(room.type)} size="small" color={getRoomTypeColor(room.type)} sx={{ fontSize: '0.65rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 14, color: '#8892b0' }} />
                      <Typography variant="caption" sx={{ color: '#8892b0' }}>Capacity: {room.capacity} guests</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#e94560', fontWeight: 700, mt: 1 }}>
                      GH₵{room.price}
                      <Typography variant="caption" sx={{ color: '#8892b0', fontWeight: 400 }}>/night</Typography>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 14, color: room.available > 0 ? '#4caf50' : '#e94560' }} />
                      <Typography variant="caption" sx={{ color: room.available > 0 ? '#4caf50' : '#e94560' }}>
                        {room.available > 0 ? `${room.available} rooms available` : 'Fully Booked'}
                      </Typography>
                    </Box>
                    {room.amenities && room.amenities.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {room.amenities.slice(0, 3).map((a, i) => (
                          <Chip key={i} label={a} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.6rem' }} />
                        ))}
                        {room.amenities.length > 3 && (
                          <Chip label={`+${room.amenities.length - 3}`} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.6rem' }} />
                        )}
                      </Box>
                    )}
                    {room.available > 0 && (user?.role === 'student' || user?.role === 'admin') && (
                      <Button fullWidth variant="contained" size="small" sx={{ mt: 2, bgcolor: '#e94560', borderRadius: 50, '&:hover': { bgcolor: '#c73652' } }} onClick={handleBookNow}>
                        Book This Room
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ============================================ */}
        {/* 📸 HOSTEL IMAGES - FIXED WITH FULL URL */}
        {/* ============================================ */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          📸 Hostel Images
        </Typography>
        
        {hostel.images && hostel.images.length > 0 ? (
          <ImageList cols={3} rowHeight={180} gap={12} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
            {hostel.images.map((image, index) => {
              // ✅ FIX: Add full URL if image starts with /uploads
              const imageUrl = image && image.startsWith('/uploads') 
                ? `${API_URL}${image}` 
                : image;
              
              return (
                <ImageListItem 
                  key={index} 
                  onClick={() => handleImageClick(index)} 
                  sx={{ 
                    cursor: 'pointer', 
                    overflow: 'hidden', 
                    borderRadius: 2, 
                    transition: 'transform 0.3s ease',
                    '&:hover': { 
                      transform: 'scale(1.05)', 
                      zIndex: 1,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                    } 
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`${hostel.name} ${index + 1}`} 
                    style={{ width: '100%', height: 180, objectFit: 'cover' }} 
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/e94560/white?text=No+Image';
                    }}
                  />
                </ImageListItem>
              );
            })}
          </ImageList>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, mb: 3 }}>
            <Typography sx={{ color: '#8892b0' }}>No images available for this hostel</Typography>
          </Paper>
        )}

        <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>About this place</Typography>
          <Typography variant="body1" sx={{ color: '#6b7a8f', lineHeight: 1.8 }}>{hostel.description || 'No description available'}</Typography>
        </Paper>

        {hostel.amenities && hostel.amenities.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>What this place offers</Typography>
            <Grid container spacing={2}>
              {hostel.amenities.map((amenity, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getAmenityIcon(amenity)}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{amenity}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Location</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ color: '#e94560' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{hostel.address}, {hostel.city}, {hostel.state || 'Ghana'}</Typography>
          </Box>
          {hostel.zip_code && <Typography variant="body2" sx={{ color: '#8892b0', mt: 0.5 }}>Zip Code: {hostel.zip_code}</Typography>}
        </Paper>

        {/* ============================================ */}
        {/* ✅ REVIEWS SECTION */}
        {/* ============================================ */}
        <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            ⭐ Reviews & Ratings
          </Typography>
          <Reviews hostelId={id} />
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')} 
            sx={{ 
              borderRadius: 50, 
              px: 4, 
              borderColor: '#e94560', 
              color: '#e94560', 
              '&:hover': { 
                bgcolor: 'rgba(233,69,96,0.05)', 
                borderColor: '#c73652' 
              } 
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Container>

      {/* ============================================ */}
      {/* ✅ IMAGE GALLERY - FIXED WITH FULL URL */}
      {/* ============================================ */}
      {hostel.images && hostel.images.length > 0 && (
        <ImageGallery 
          images={hostel.images.map(img => 
            img && img.startsWith('/uploads') ? `${API_URL}${img}` : img
          )} 
          open={galleryOpen} 
          onClose={() => setGalleryOpen(false)} 
          hostelName={hostel.name} 
          initialIndex={selectedImageIndex} 
        />
      )}
    </Box>
  );
}

export default HostelDetails;