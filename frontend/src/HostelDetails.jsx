// frontend/src/pages/HostelDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, Grid, Divider,
  Rating, CircularProgress, Alert, IconButton, Container,
  ImageList, ImageListItem, Card, CardContent, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  useMediaQuery, useTheme
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
  CheckCircle as CheckCircleIcon,
  AddPhotoAlternate as AddPhotoIcon
} from '@mui/icons-material';
import ImageGallery from './ImageGallery';
import Reviews from './reviews.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ✅ BOOKING STATE
  const [bookingDialog, setBookingDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // ✅ IMAGE UPLOAD STATE
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  // ✅ OPEN BOOKING DIALOG
  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookingDialog(true);
    setPhoneNumber('');
    setRoomType('');
    setBookingError('');
    setBookingSuccess('');
  };

  // ✅ CONFIRM BOOKING
  const handleConfirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBookingError('Please login first');
      return;
    }

    if (!phoneNumber) {
      setBookingError('Please enter your phone number');
      return;
    }

    if (!roomType) {
      setBookingError('Please select a room type');
      return;
    }

    const phoneRegex = /^(0\d{9}|233\d{9})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setBookingError('Please enter a valid Ghana phone number');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      let guestsCount = 1;
      if (roomType === '2 in a room') guestsCount = 2;
      else if (roomType === '3 in a room') guestsCount = 3;

      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostel_id: hostel.id,
          phone_number: phoneNumber,
          room_type: roomType,
          guests: guestsCount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');

      setBookingSuccess('✅ Booking confirmed!');
      setTimeout(() => {
        setBookingDialog(false);
        setPhoneNumber('');
        setRoomType('');
        navigate('/my-bookings');
      }, 1500);

    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // ✅ HANDLE IMAGE UPLOAD
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setUploadError('Please login first');
      return;
    }

    setUploadingImages(true);
    setUploadError('');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await fetch(`${API_URL}/api/upload/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Get image URLs from response
      const imageUrls = data.imageUrls || data.images?.map(img => img.url) || [];
      
      // Update hostel with new images
      const updatedHostel = {
        ...hostel,
        images: [...(hostel.images || []), ...imageUrls]
      };

      // Save to database
      const updateRes = await fetch(`${API_URL}/api/hostels/${hostel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          images: updatedHostel.images
        })
      });

      if (!updateRes.ok) throw new Error('Failed to update hostel');

      setHostel(updatedHostel);
      alert(' Images uploaded successfully!');

    } catch (err) {
      setUploadError(err.message);
      alert(' Upload failed: ' + err.message);
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
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
      {/* Header */}
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
        {/* Price & Book Now */}
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
                (user.role === 'student' || user.role === 'admin' || user.role === 'owner') && (
                  <Button
                    variant="contained"
                    onClick={handleBookNow}
                    disabled={hostel.available === false}
                    sx={{
                      bgcolor: hostel.available !== false ? '#e94560' : '#666',
                      borderRadius: 50,
                      px: 4,
                      '&:hover': { bgcolor: hostel.available !== false ? '#c73652' : '#555' },
                      fontWeight: 600
                    }}
                  >
                    {hostel.available !== false ? 'Book Now' : 'Not Available'}
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

        {/* Rooms Section */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
           Available Rooms
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
                    {room.available > 0 && (user?.role === 'student' || user?.role === 'admin' || user?.role === 'owner') && (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        size="small" 
                        sx={{ mt: 2, bgcolor: '#e94560', borderRadius: 50, '&:hover': { bgcolor: '#c73652' } }} 
                        onClick={handleBookNow}
                      >
                        Book This Room
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ✅ IMAGE GALLERY WITH UPLOAD BUTTON */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
           Hostel Images
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          {/* Upload Button */}
          {user && (user.role === 'owner' || user.role === 'admin') && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddPhotoIcon />}
                disabled={uploadingImages}
                sx={{
                  borderRadius: 50,
                  borderColor: '#e94560',
                  color: '#e94560',
                  '&:hover': { bgcolor: 'rgba(233,69,96,0.05)', borderColor: '#c73652' }
                }}
              >
                {uploadingImages ? 'Uploading...' : 'Add More Images'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              {uploadError && (
                <Typography variant="caption" sx={{ color: '#e94560', ml: 2 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}

          {/* Image Grid */}
          {hostel.images && hostel.images.length > 0 ? (
            <ImageList cols={isMobile ? 2 : 3} rowHeight={180} gap={12} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              {hostel.images.map((image, index) => {
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
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography sx={{ color: '#8892b0' }}>No images available for this hostel</Typography>
            </Paper>
          )}
        </Box>

        {/* About Section */}
        <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>About this place</Typography>
          <Typography variant="body1" sx={{ color: '#6b7a8f', lineHeight: 1.8 }}>{hostel.description || 'No description available'}</Typography>
        </Paper>

        {/* Amenities Section */}
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

        {/* Location Section */}
        <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Location</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ color: '#e94560' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{hostel.address}, {hostel.city}, {hostel.state || 'Ghana'}</Typography>
          </Box>
          {hostel.zip_code && <Typography variant="body2" sx={{ color: '#8892b0', mt: 0.5 }}>Zip Code: {hostel.zip_code}</Typography>}
        </Paper>

        {/* Reviews Section */}
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

      {/* ✅ BOOKING DIALOG */}
      <Dialog
        open={bookingDialog}
        onClose={() => {
          setBookingDialog(false);
          setPhoneNumber('');
          setRoomType('');
          setBookingError('');
          setBookingSuccess('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            margin: { xs: 0, sm: 2 },
            maxHeight: '90vh',
            position: 'fixed',
            bottom: { xs: 0, sm: 'auto' },
            top: { xs: 'auto', sm: 'auto' },
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a2e', fontWeight: 700 }}>
          Book {hostel?.name}
        </DialogTitle>
        
        <DialogContent>
          {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
          {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#8892b0' }}>
                Price: GH₵{hostel?.price_per_year}/year
              </Typography>
              <Chip
                label={hostel?.available !== false ? "Available" : "Unavailable"}
                color={hostel?.available !== false ? "success" : "error"}
                size="small"
              />
            </Box>

            <TextField
              label="Phone Number"
              type="tel"
              fullWidth
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0244123456"
              helperText="Enter your phone number for booking confirmation"
              required
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Select Room Type
              </Typography>
              <Grid container spacing={1}>
                {['1 in a room', '2 in a room', '3 in a room'].map((type) => (
                  <Grid item xs={4} key={type}>
                    <Card
                      onClick={() => setRoomType(type)}
                      sx={{
                        cursor: 'pointer',
                        border: roomType === type ? '2px solid #e94560' : '1px solid #ddd',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        bgcolor: roomType === type ? 'rgba(233,69,96,0.05)' : 'white',
                        '&:hover': {
                          borderColor: '#e94560',
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#e94560' }}>
                        {type === '1 in a room' ? '' : type === '2 in a room' ? '' : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {type}
                      </Typography>
                      {roomType === type && (
                        <Typography variant="caption" sx={{ color: '#e94560', display: 'block' }}>
                          Selected
                        </Typography>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {!roomType && (
                <Typography variant="caption" sx={{ color: '#e94560', display: 'block', mt: 1 }}>
                  Please select a room type
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setBookingDialog(false);
              setPhoneNumber('');
              setRoomType('');
              setBookingError('');
              setBookingSuccess('');
            }}
            sx={{ color: '#8892b0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmBooking}
            disabled={bookingLoading || !phoneNumber || !roomType}
            sx={{
              background: 'linear-gradient(135deg, #e94560, #c73652)',
              borderRadius: 50,
              px: 4,
              fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, #c73652, #a82842)' }
            }}
          >
            {bookingLoading ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Gallery */}
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