import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  InputAdornment,
  Paper,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function ModernHeader({ user, onMenuClick, darkMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Detecting your location...');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // ✅ Detect user location
  const detectLocation = () => {
    setIsLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocation('Kumasi, Ghana');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const city = data.city || data.locality || 'Your Location';
          const country = data.countryName || '';
          setLocation(`${city}, ${country}`);
          setIsLocating(false);
        } catch (err) {
          console.error('Location error:', err);
          setLocation('Kumasi, Ghana');
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation('Kumasi, Ghana');
        setIsLocating(false);
        setLocationError('Location access denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ✅ Detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <Box
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)' 
          : 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 3, sm: 4 },
        pb: { xs: 3, sm: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -150,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.06)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.04)',
          pointerEvents: 'none'
        }}
      />

      {/* ✅ Top Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2.5, sm: 3 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left: Menu + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{ color: 'white', p: 0.5 }}
          >
            <MenuIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </IconButton>
          
          <Typography
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              letterSpacing: '-0.5px'
            }}
          >
            Hostel<span style={{ color: '#e94560' }}>Finder</span>
          </Typography>
        </Box>

        {/* Right: User Avatar or Login */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user ? (
            <Avatar
              src={user.avatar}
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                bgcolor: '#e94560',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.15)',
                fontSize: '14px',
                fontWeight: 600
              }}
              onClick={() => navigate('/profile')}
            >
              {user.full_name?.charAt(0) || 'U'}
            </Avatar>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: '#e94560',
                borderRadius: '50px',
                px: { xs: 2, sm: 3 },
                py: 0.8,
                fontSize: { xs: '11px', sm: '13px' },
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#c73652' }
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Box>

      {/* ✅ Location Section */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon sx={{ color: '#e94560', fontSize: { xs: 20, sm: 24 } }} />
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {isLocating ? (
              <>
                <CircularProgress size={14} sx={{ color: 'rgba(255,255,255,0.5)' }} />
                Detecting your location...
              </>
            ) : (
              location
            )}
            <IconButton
              size="small"
              onClick={detectLocation}
              sx={{
                color: 'rgba(255,255,255,0.4)',
                p: 0.3,
                '&:hover': { color: '#e94560' }
              }}
            >
              <MyLocationIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Typography>
        </Box>

        {/* ✅ Welcome Text */}
        <Typography
          variant="h5"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            mt: 1,
            lineHeight: 1.2
          }}
        >
          Let's find you <br />
          <span style={{ color: '#e94560' }}>the best home</span>
        </Typography>
      </Box>

      {/* ✅ Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 0.8, sm: 1 },
          borderRadius: '60px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          zIndex: 1,
          mt: 1
        }}
      >
        <TextField
          fullWidth
          placeholder="Search any place"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: 20, sm: 22 } }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              '&::placeholder': {
                color: 'rgba(255,255,255,0.3)'
              }
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.8, sm: 1 }
            }
          }}
        />
      </Paper>
    </Box>
  );
}

export default ModernHeader;