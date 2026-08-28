// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModernHeader from './components/ModernHeader';
import MobileSidebar from './components/MobileSidebar';
import CategoryFilter from './components/CategoryFilter';
import HorizontalHostelScroll from './components/HorizontalHostelScroll';
import AdBanner from './components/AdBanner';
import {
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  CardMedia,
  Rating,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HotelIcon from '@mui/icons-material/Hotel';
import ReviewsIcon from '@mui/icons-material/Reviews';
import ChatIcon from '@mui/icons-material/Chat';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import { Menu, MenuItem } from '@mui/material';

// ===== IMPORT COMPONENTS =====
import Login from './login';
import AddHostel from './AddHostel';
import MyBookings from './MyBookings';
import Reviews from './reviews';
import AdminDashboard from './AdminDashboard';
import MyProperties from './MyProperties';
import Profile from './Profile';
import LanguageSwitcher from './languageswitcher';
import HostelMapLeaflet from './HostelMapLeaflet';
import SocialCallback from './SocialCallback';
import Chat from './Chat';
import HostelDetails from './HostelDetails';
import LoadingScreen from './components/LoadingScreen';
import BookingDetails from './BookingDetails';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// BACK TO HOME BUTTON
// ============================================
const BackToHomeButton = () => {
  const locationPath = useLocation();
  const navigate = useNavigate();

  if (locationPath.pathname === '/') return null;

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => navigate('/')}
      startIcon={<span>←</span>}
      sx={{
        borderRadius: 50,
        borderColor: '#e94560',
        color: '#e94560',
        px: 2,
        py: 0.5,
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'none',
        '&:hover': {
          bgcolor: 'rgba(233,69,96,0.05)',
          borderColor: '#c73652'
        }
      }}
    >
      Back to Home
    </Button>
  );
};

// ============================================
// HOME PAGE COMPONENT
// ============================================
function HomePage() {
  const { t } = useTranslation();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState('Kumasi, Ghana');
  const [showMap, setShowMap] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(null);
  
  // ✅ CATEGORY STATE
  const [selectedCategory, setSelectedCategory] = useState('all');

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
}
  // ===== MENU STATE =====
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ===== BOOKING STATE =====
  const [bookingDialog, setBookingDialog] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roomType, setRoomType] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
    handleMenuClose();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchHostels();
    
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const fetchHostels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels`);
      const data = await res.json();
      setHostels(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setLoading(false);
    }
  };

  const fetchRooms = async (hostelId) => {
    try {
      const res = await fetch(`${API_URL}/api/hostels/${hostelId}/rooms`);
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    handleMenuClose();
    window.location.href = '/';
  };

  const handleBookNow = (hostel) => {
    console.log('📖 Book Now clicked for:', hostel.name);
    setBookingDialog(hostel);
    setPhoneNumber('');
    setRoomType('');
    setGuests(1);
    setBookingError('');
    setBookingSuccess('');
    setSelectedRoom(null);
    fetchRooms(hostel.id);
  };

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
      setBookingError('Please enter a valid Ghana phone number (e.g., 0244123456)');
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
          hostel_id: bookingDialog.id,
          phone_number: phoneNumber,
          room_type: roomType,
          guests: guestsCount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');

      setBookingSuccess('Booking confirmed!');
      setTimeout(() => {
        setBookingDialog(null);
        setSelectedRoom(null);
        setRooms([]);
        setPhoneNumber('');
        setRoomType('');
        window.location.href = '/my-bookings';
      }, 1500);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // ✅ FILTERED HOSTELS WITH CATEGORY
  const getFilteredHostels = () => {
    let filtered = hostels;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(hostel =>
        hostel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hostel.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hostel => 
        hostel.category === selectedCategory
      );
    }
    
    return filtered;
  };

  const filteredHostels = getFilteredHostels();

  // ============================================
// ✅ LUXURY HOSTEL CARD - FIXED BOOK NOW
// ============================================
const HostelCard = ({ hostel }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getImageUrl = () => {
    if (hostel.images && hostel.images.length > 0) {
      const img = hostel.images[0];
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads')) return `${API_URL}${img}`;
      return img;
    }
    return null;
  };

  const displayAmenities = hostel.amenities && hostel.amenities.length > 0 
    ? hostel.amenities 
    : ['Free WiFi', 'Parking', 'Air Conditioning', 'TV', 'Kitchen'];

  const roomCount = hostel.rooms?.length || Math.floor(Math.random() * 5) + 1;
  const bathroomCount = Math.floor(roomCount / 2) + 1;
  const sqft = (roomCount * 150) + 50;

  const handleCardClick = (e) => {
    if (e.target.closest('button')) {
      return;
    }
    navigate(`/hostel/${hostel.id}`);
  };

  const onBookNow = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🔄 Book Now clicked for:', hostel.name);
    if (hostel.available !== false) {
      handleBookNow(hostel);
    } else {
      alert('This hostel is currently unavailable.');
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: 420,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 60px rgba(233,69,96,0.15)',
          '& .hostel-image-overlay': {
            opacity: 1,
          }
        }
      }}
    >
      {/* Image Section */}
      <Box sx={{ 
        position: 'relative', 
        height: 200,
        flexShrink: 0,
        bgcolor: darkMode ? '#2d2d2d' : '#f0f2f5',
        overflow: 'hidden'
      }}>
        {getImageUrl() ? (
          <>
            <img
              src={getImageUrl()}
              alt={hostel.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s ease'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Box
              className="hostel-image-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                size="medium"
                sx={{
                  bgcolor: '#e94560',
                  borderRadius: 50,
                  px: 4,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#c73652' }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/hostel/${hostel.id}`);
                }}
              >
                View Details
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: darkMode ? '#2d2d2d' : '#f0f2f5'
          }}>
            <HotelIcon sx={{ fontSize: 60, color: darkMode ? '#444' : '#ccc' }} />
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 4,
            fontWeight: 700,
            fontSize: '15px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.2
          }}
        >
          GH₵{hostel.price_per_year || 100}
          <Typography
            component="span"
            sx={{
              fontSize: '15px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.7)',
              ml: 0.5
            }}
          >
            / year
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: '#ffd700',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <StarIcon sx={{ fontSize: 14, color: '#ffd700' }} />
          {hostel.rating || '4.9'}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            bgcolor: hostel.available !== false ? 'rgba(76,175,80,0.9)' : 'rgba(233,69,96,0.9)',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: '10px',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {hostel.available !== false ? 'Available' : 'Unavailable'}
        </Box>
      </Box>

      {/* Content Section */}
      <CardContent sx={{ 
        p: 2.5,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: darkMode ? '#1e1e1e' : '#ffffff'
      }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: darkMode ? 'white' : '#1a1a2e',
              fontSize: '1.1rem',
              mb: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {hostel.name}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: '#e94560',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              mb: 1
            }}
          >
            {hostel.category || 'Deluxe Room'} • {hostel.type || 'Premium'}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            mb: 1.5,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BedIcon sx={{ fontSize: 16, color: '#8892b0' }} />
              <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#6b7a8f', fontSize: '0.85rem' }}>
                {roomCount} {roomCount === 1 ? 'Bed' : 'Beds'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BathtubIcon sx={{ fontSize: 16, color: '#8892b0' }} />
              <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#6b7a8f', fontSize: '0.85rem' }}>
                {bathroomCount} {bathroomCount === 1 ? 'Bath' : 'Baths'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SquareFootIcon sx={{ fontSize: 16, color: '#8892b0' }} />
              <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#6b7a8f', fontSize: '0.85rem' }}>
                {sqft} sqft
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {displayAmenities.slice(0, 4).map((amenity, i) => (
              <Chip
                key={i}
                label={amenity}
                size="small"
                sx={{
                  bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : '#f5f7fa',
                  color: darkMode ? '#b0b0b0' : '#6b7a8f',
                  fontSize: '0.65rem',
                  height: 24,
                  fontWeight: 500,
                  borderRadius: 1.5,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
            {displayAmenities.length > 4 && (
              <Chip
                label={`+${displayAmenities.length - 4}`}
                size="small"
                sx={{
                  bgcolor: '#e94560',
                  color: 'white',
                  fontSize: '0.65rem',
                  height: 24,
                  fontWeight: 600,
                  borderRadius: 1.5
                }}
              />
            )}
          </Box>
        </Box>

        {/* Book Now Button */}
        {user ? (
          (user?.role === 'student' || user?.role === 'admin' || user?.role === 'owner') && (
            <Button
              fullWidth
              variant="contained"
              size="medium"
              onClick={onBookNow}
              sx={{
                bgcolor: hostel.available !== false ? '#e94560' : '#666',
                borderRadius: 50,
                py: 1.2,
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                letterSpacing: '0.3px',
                '&:hover': { 
                  bgcolor: hostel.available !== false ? '#c73652' : '#555',
                  boxShadow: '0 4px 20px rgba(233,69,96,0.4)'
                },
                mt: 1,
                position: 'relative',
                zIndex: 10,
                touchAction: 'manipulation',
                cursor: hostel.available !== false ? 'pointer' : 'not-allowed',
                '&:active': {
                  transform: 'scale(0.97)'
                }
              }}
            >
              {hostel.available !== false ? '✦ Book Now' : 'Not Available'}
            </Button>
          )
        ) : (
          <Link to="/login" style={{ width: '100%', textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              sx={{
                borderRadius: 50,
                py: 1.2,
                borderColor: '#e94560',
                color: '#e94560',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(233,69,96,0.05)',
                  borderColor: '#c73652',
                  boxShadow: '0 4px 20px rgba(233,69,96,0.15)'
                },
                mt: 1
              }}
            >
              Login to Book
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

  // ============================================
  // THREE-DOT MENU ITEMS
  // ============================================
  const getMenuItems = () => {
    const items = [];

    items.push({
      label: darkMode ? 'Light Mode' : 'Dark Mode',
      icon: darkMode ? <Brightness7Icon /> : <Brightness4Icon />,
      action: 'darkMode'
    });

    items.push({ divider: true });

    items.push({
      label: 'WhatsApp Us',
      icon: <WhatsAppIcon sx={{ color: '#25D366' }} />,
      action: 'whatsapp',
      className: 'menu-item-whatsapp'
    });

    items.push({
      label: 'Call Us',
      icon: <PhoneIcon sx={{ color: '#e94560' }} />,
      action: 'call',
      className: 'menu-item-call'
    });

    items.push({ divider: true });

    if (user) {
      items.push(
        { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
        { label: 'My Bookings', icon: <BookOnlineIcon />, path: '/my-bookings' }
      );

      if (user?.role === 'owner' || user?.role === 'admin') {
        items.push({ label: 'My Properties', icon: <HotelIcon />, path: '/my-properties' });
      }

      if (user?.role === 'admin') {
        items.push({ label: 'Admin Dashboard', icon: <DashboardIcon />, path: '/admin' });
      }

      items.push(
        { divider: true },
        { label: 'Logout', icon: <span>🚪</span>, action: 'logout', className: 'menu-item-danger' }
      );
    } else {
      items.push(
        { label: 'Login', icon: <PersonIcon />, path: '/login' },
        { label: 'Register', icon: <span>📝</span>, path: '/register' }
      );
    }

    return items;
  };

  // ============================================
  // DEVELOPER INFO COMPONENT
  // ============================================
  const DeveloperInfo = () => (
    <Box sx={{ 
      textAlign: 'center', 
      py: 2, 
      mt: 2,
      borderTop: '1px solid rgba(0,0,0,0.08)',
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#8892b0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          '&:hover': { color: '#e94560' }
        }}
        onClick={() => setShowDeveloperInfo(!showDeveloperInfo)}
      >
        👨‍💻 About the Developer {showDeveloperInfo ? '▲' : '▼'}
      </Typography>

      {showDeveloperInfo && (
        <Box sx={{ 
          mt: 2,
          pt: 2,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 50, height: 50, border: '2px solid #e94560', bgcolor: '#e94560', fontSize: 20 }}>LA</Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a2e' }}>Listowell Appiah</Typography>
              <Typography variant="caption" sx={{ color: '#e94560', fontWeight: 600 }}>(Full Stack Developer)</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#6b7a8f', maxWidth: 500, mx: 'auto', mb: 2 }}>
            Passionate developer dedicated to creating innovative solutions. Built this platform to help students in Kumasi find comfortable and affordable accommodation easily.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <a href="https://github.com/listowell28" target="_blank" rel="noopener noreferrer" style={{ color: '#8892b0', textDecoration: 'none', fontSize: '13px' }}>GitHub</a>
            <a href="mailto:alistowell28@gmail.com" style={{ color: '#8892b0', textDecoration: 'none', fontSize: '13px' }}>Email</a>
            <a href="https://linkedin.com/in/listowell28" target="_blank" rel="noopener noreferrer" style={{ color: '#8892b0', textDecoration: 'none', fontSize: '13px' }}>LinkedIn</a>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ============================================
  // ⏳ LOADING SCREEN
  // ============================================
  if (isAppLoading) {
    return <LoadingScreen />;
  }

  // ============================================
  // RENDER - MOBILE VIEW
  // ============================================
  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#121212' : '#f5f7fa', pb: 8 }}>
        {/* ✅ Modern Header - Fully Rounded with Background Image */}
        <ModernHeader 
          user={user} 
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
        />

        {/* ✅ SEARCH BAR - SEPARATED FROM HEADER */}
        <Box sx={{ px: { xs: 2, sm: 3 }, mt: 2 }}>
          <Paper
            sx={{
              p: { xs: 0.8, sm: 1 },
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              bgcolor: darkMode ? '#1e1e1e' : 'white',
              border: '1px solid rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TextField
              fullWidth
              placeholder="Search hostels, homestels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8892b0', fontSize: '20px' }} />
                  </InputAdornment>
                ),
                sx: {
                  px: 1.5,
                  py: 0.8,
                  color: darkMode ? 'white' : '#1a1a2e',
                  fontSize: '0.9rem'
                }
              }}
            />
          </Paper>
        </Box>

        {/* Mobile Sidebar */}
        <MobileSidebar 
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          handleLogout={handleLogout}
          navigate={navigate}
        />

        {/* ✅ CATEGORY FILTER */}
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* ✅ AD BANNER - ADDED HERE (After Category Filter) */}
        <Box sx={{ px: 2, mt: 1 }}>
          <AdBanner position="homepage" darkMode={darkMode} />
        </Box>

        {/* ✅ HORIZONTAL SCROLL - POPULAR PROPERTIES (ALL HOSTELS) */}
        {!loading && filteredHostels.length > 0 && (
          <HorizontalHostelScroll
            hostels={filteredHostels.slice(0, 10)}
            title="Popular Properties"
            darkMode={darkMode}
          />
        )}

        {/* ✅ REGULAR PROPERTY CARDS - Full Width */}
        <Box sx={{ px: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e', mb: 2, fontSize: '1rem' }}>
            All Properties
          </Typography>
          
          {loading ? (
            <Typography sx={{ textAlign: 'center', color: '#8892b0', py: 4 }}>Loading hostels...</Typography>
          ) : filteredHostels.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#8892b0', py: 4 }}>
              No properties found
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredHostels.slice(0, 6).map((hostel) => (
                <Grid item xs={12} key={hostel.id}>
                  <HostelCard hostel={hostel} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Bottom Navigation */}
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.05)',
            bgcolor: darkMode ? '#1e1e1e' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            zIndex: 1000
          }}
        >
          <BottomNavigation
            value={0}
            onChange={(event, newValue) => {
              if (newValue === 0) navigate('/');
              else if (newValue === 1) navigate('/');
              else if (newValue === 2) navigate('/profile');
            }}
            sx={{ height: 56, bgcolor: 'transparent' }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} sx={{ color: '#e94560' }} />
            <BottomNavigationAction label="Search" icon={<SearchIcon />} sx={{ color: '#8892b0' }} />
            <BottomNavigationAction label="Profile" icon={<PersonIcon />} sx={{ color: '#8892b0' }} />
          </BottomNavigation>
        </Paper>

        {/* ✅ BOOKING DIALOG - MOBILE (Booking First, Then Payment) */}
        <Dialog
          open={!!bookingDialog}
          onClose={() => {
            setBookingDialog(null);
            setSelectedRoom(null);
            setPhoneNumber('');
            setRoomType('');
            setGuests(1);
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
            Book {bookingDialog?.name}
          </DialogTitle>
          
          <DialogContent>
            {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
            {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#8892b0' }}>
                  Price: GH₵{bookingDialog?.price_per_year}/year
                </Typography>
                <Chip
                  label={bookingDialog?.available !== false ? "Available" : "Unavailable"}
                  color={bookingDialog?.available !== false ? "success" : "error"}
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
                          {type === '1 in a room' ? '🛏️' : type === '2 in a room' ? '🛏️🛏️' : '🛏️🛏️🛏️'}
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
                setBookingDialog(null);
                setSelectedRoom(null);
                setPhoneNumber('');
                setRoomType('');
                setGuests(1);
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

        {/* ✅ DEVELOPER INFO */}
        <DeveloperInfo />
      </Box>
    );
  }

  // ============================================
  // RENDER - DESKTOP VIEW
  // ============================================
 return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: darkMode ? '#121212' : '#f5f7fa' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            border: 'none',
            bgcolor: darkMode ? '#1a1a2e' : '#1a1a2e',
            color: 'white',
            px: 2,
            py: 3
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, px: 2 }}>
          <Avatar src="/logo.png" sx={{ width: 40, height: 40, border: '2px solid #e94560' }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Hostel<span style={{ color: '#e94560' }}>Finder</span></Typography>
        </Box>

        <List>
          <ListItem button component={Link} to="/" sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.1)' } }}>
            <ListItemIcon><DashboardIcon sx={{ color: '#e94560' }} /></ListItemIcon>
            <ListItemText primary="Dashboard" sx={{ '& .MuiTypography-root': { color: 'white', fontWeight: 600 } }} />
          </ListItem>
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <ListItem button component={Link} to="/my-properties" sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.1)' } }}>
              <ListItemIcon><HotelIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
              <ListItemText primary="My Properties" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
            </ListItem>
          )}
          <ListItem button component={Link} to="/my-bookings" sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.1)' } }}>
            <ListItemIcon><BookOnlineIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
            <ListItemText primary="My Bookings" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
          </ListItem>
          <ListItem button component={Link} to="/reviews" sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.1)' } }}>
            <ListItemIcon><ReviewsIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
            <ListItemText primary="Reviews" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
          </ListItem>
          {user?.role === 'admin' && (
            <ListItem button component={Link} to="/admin" sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.1)' } }}>
              <ListItemIcon><DashboardIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
              <ListItemText primary="Admin" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box sx={{ mt: 'auto', p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#e94560' }}>{user?.full_name?.charAt(0) || 'U'}</Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.full_name || 'Guest User'}</Typography>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>{user?.role || 'Not logged in'}</Typography>
            </Box>
          </Box>
          {user ? (
            <Button fullWidth variant="outlined" size="small" onClick={handleLogout} sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {t('nav.logout')}
            </Button>
          ) : (
            <Link to="/login">
              <Button fullWidth variant="contained" size="small" sx={{ mt: 2, bgcolor: '#e94560' }}>
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src="/logo.png" sx={{ width: 50, height: 50, border: '2px solid #e94560' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>
                Hostel<span style={{ color: '#e94560' }}>Finder</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#8892b0' }}>
                Find your perfect hostel near campus
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton onClick={handleMenuClick} sx={{ color: darkMode ? 'white' : '#1a1a2e' }}><MoreVertIcon /></IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  mt: 1,
                  minWidth: 200,
                  bgcolor: darkMode ? '#1e1e1e' : 'white',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                }
              }}
            >
              {getMenuItems().map((item, index) => (
                item.divider ? <Divider key={index} /> : (
                  <MenuItem
                    key={index}
                    onClick={() => {
                      handleMenuClose();
                      if (item.action === 'darkMode') toggleDarkMode();
                      else if (item.action === 'whatsapp') window.open('https://wa.me/233595023480', '_blank');
                      else if (item.action === 'call') window.location.href = 'tel:+233507194524';
                      else if (item.action === 'logout') handleLogout();
                      else if (item.path) navigate(item.path);
                    }}
                    sx={{
                      color: darkMode ? 'white' : '#1a1a2e',
                      '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                      ...(item.className === 'menu-item-danger' && { color: '#e94560', '&:hover': { bgcolor: 'rgba(233,69,96,0.08)' } }),
                      ...(item.className === 'menu-item-whatsapp' && { '&:hover': { bgcolor: 'rgba(37,211,102,0.08)' } }),
                      ...(item.className === 'menu-item-call' && { '&:hover': { bgcolor: 'rgba(233,69,96,0.08)' } })
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </MenuItem>
                )
              ))}
            </Menu>

            <BackToHomeButton />
            <LanguageSwitcher />

            <Button variant="text" onClick={() => setShowMap(!showMap)} sx={{ color: '#e94560', fontWeight: 600 }}>
              {showMap ? ' List View' : ' Map View'}
            </Button>

            <TextField
              placeholder={t('search.placeholder')}
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                bgcolor: darkMode ? '#1e1e1e' : 'white',
                borderRadius: 50,
                '& .MuiOutlinedInput-root': { borderRadius: 50 }
              }}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: '#8892b0', mr: 1 }} /> }}
            />

            {(user?.role === 'admin' || user?.role === 'owner') && (
              <Link to="/add-hostel">
                <Button variant="contained" sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', borderRadius: 50, px: 4, fontWeight: 700 }}>
                  + Add Hostel
                </Button>
              </Link>
            )}

            <IconButton onClick={() => navigate('/profile')} sx={{ width: 44, height: 44, bgcolor: 'rgba(233,69,96,0.1)' }}>
              <Avatar src={user?.avatar || ''} sx={{ width: 36, height: 36, bgcolor: '#e94560' }}>
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Box>

        {/* ✅ CATEGORY FILTER - DESKTOP VIEW */}
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* ✅ AD BANNER - DESKTOP (ADDED HERE) */}
        <Box sx={{ px: 2, mt: 2, maxWidth: '1200px', mx: 'auto' }}>
          <AdBanner position="homepage" darkMode={darkMode} />
        </Box>

        {showMap && <Box sx={{ mb: 4 }}><HostelMapLeaflet hostels={filteredHostels} /></Box>}

        {!showMap && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: darkMode ? '#1e1e1e' : 'white' }}>
                <Typography variant="body2" sx={{ color: '#8892b0' }}>Total Properties</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>{hostels.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: darkMode ? '#1e1e1e' : 'white' }}>
                <Typography variant="body2" sx={{ color: '#8892b0' }}>Available Now</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>
                  {hostels.filter(h => h.available !== false).length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: darkMode ? '#1e1e1e' : 'white' }}>
                <Typography variant="body2" sx={{ color: '#8892b0' }}>Avg Rating</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>
                  {(() => {
                    const validRatings = hostels.filter(h => h.rating && !isNaN(h.rating) && h.rating > 0);
                    if (validRatings.length === 0) return '0.0';
                    const total = validRatings.reduce((acc, h) => acc + parseFloat(h.rating), 0);
                    return (total / validRatings.length).toFixed(1);
                  })()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: darkMode ? '#1e1e1e' : 'white' }}>
                <Typography variant="body2" sx={{ color: '#8892b0' }}>Total Reviews</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>
                  {hostels.reduce((acc, h) => acc + (h.review_count || 0), 0)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {!showMap && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e', mb: 3 }}>
              {selectedCategory === 'all' ? '✦ Luxury Properties' : 
               selectedCategory === 'hostel' ? '✦ Hostels' : '✦ Homestels'}
            </Typography>
            {loading ? (
              <Typography sx={{ textAlign: 'center', color: '#8892b0', py: 4 }}>Loading hostels...</Typography>
            ) : filteredHostels.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#8892b0', py: 4 }}>
                No {selectedCategory !== 'all' ? selectedCategory : ''} properties found
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {filteredHostels.map((hostel) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={hostel.id}>
                    <HostelCard hostel={hostel} />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>

      {/* Booking Dialog - Desktop */}
      <Dialog
        open={!!bookingDialog}
        onClose={() => {
          setBookingDialog(null);
          setSelectedRoom(null);
          setPhoneNumber('');
          setRoomType('');
          setGuests(1);
          setBookingError('');
          setBookingSuccess('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#1a1a2e', fontWeight: 700 }}>
           Book {bookingDialog?.name}
        </DialogTitle>
        
        <DialogContent>
          {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
          {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bookingSuccess}</Alert>}
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#8892b0' }}>
                Price: GH₵{bookingDialog?.price_per_year}/year
              </Typography>
              <Chip 
                label={bookingDialog?.available !== false ? "Available" : "Unavailable"} 
                color={bookingDialog?.available !== false ? "success" : "error"} 
                size="small" 
              />
            </Box>

            <TextField
              label=" Phone Number"
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
                        {type === '1 in a room' ? '🛏️' : type === '2 in a room' ? '🛏️🛏️' : '🛏️🛏️🛏️'}
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
              setBookingDialog(null);
              setSelectedRoom(null);
              setPhoneNumber('');
              setRoomType('');
              setGuests(1);
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
            {bookingLoading ? 'Booking...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Button */}
      {user && (
        <IconButton
          onClick={() => setChatOpen(true)}
          sx={{ 
            bgcolor: '#e94560',
            color: 'white',
            '&:hover': { bgcolor: '#c73652' },
            position: 'fixed',
            bottom: { xs: 16, sm: 24, md: 30 },
            right: { xs: 16, sm: 24, md: 30 },
            zIndex: 999,
            width: { xs: 48, sm: 56, md: 56 },
            height: { xs: 48, sm: 56, md: 56 },
            boxShadow: '0 4px 20px rgba(233,69,96,0.4)',
            '&:hover': {
              transform: 'scale(1.05)'
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChatIcon sx={{ fontSize: { xs: 24, sm: 28, md: 28 } }} />
        </IconButton>
      )}
      {chatOpen && user && <Chat currentUser={user} onClose={() => setChatOpen(false)} />}

      <DeveloperInfo />
    </Box>
  );

// ============================================
// MAIN LAYOUT
// ============================================
function MainLayout() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/add-hostel" element={<AddHostel />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/my-properties" element={<MyProperties />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/social-callback" element={<SocialCallback />} />
      <Route path="/hostel/:id" element={<HostelDetails />} />
      <Route path="/booking/:id" element={<BookingDetails />} />
    </Routes>
  );
}

// ============================================
// APP
// ============================================
function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;