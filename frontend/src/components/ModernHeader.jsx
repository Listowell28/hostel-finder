import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Menu as MenuIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function ModernHeader({ user, onMenuClick, darkMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [location, setLocation] = useState('Detecting...');
  const [isLocating, setIsLocating] = useState(false);

  const detectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocation('Kumasi, Ghana');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          setLocation(`${data.city || 'Kumasi'}, ${data.countryName || 'Ghana'}`);
        } catch {
          setLocation('Kumasi, Ghana');
        }
        setIsLocating(false);
      },
      () => {
        setLocation('Kumasi, Ghana');
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '50vh', sm: '45vh', md: '40vh' },
        display: 'flex',
        alignItems: 'center',
        background: darkMode
          ? 'linear-gradient(135deg, rgba(10,10,26,0.85) 0%, rgba(26,26,46,0.9) 100%)'
          : 'linear-gradient(135deg, rgba(15,12,41,0.8) 0%, rgba(48,43,99,0.85) 50%, rgba(36,36,62,0.9) 100%)',
        overflow: 'hidden',
        // ✅ FULLY ROUNDED EDGES - ALL CORNERS
        borderRadius: { xs: '24px', sm: '32px', md: '40px' },
        mx: { xs: 1.5, sm: 2, md: 3 },
        mt: { xs: 1, sm: 2, md: 2 },
        mb: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/house-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          zIndex: 0,
          // ✅ ROUNDED CORNERS FOR BACKGROUND TOO
          borderRadius: { xs: '24px', sm: '32px', md: '40px' }
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
          zIndex: 1,
          borderRadius: { xs: '24px', sm: '32px', md: '40px' }
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 3, sm: 4 }
        }}
      >
        {/* Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onMenuClick} sx={{ color: 'white' }}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
              Hostel<span style={{ color: '#e94560' }}>Finder</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <Avatar
                onClick={() => navigate('/profile')}
                sx={{ bgcolor: '#e94560', cursor: 'pointer', width: 40, height: 40 }}
              >
                {user.full_name?.charAt(0) || 'U'}
              </Avatar>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: '#e94560',
                  borderRadius: '50px',
                  px: 3,
                  py: 1,
                  '&:hover': { bgcolor: '#c73652' }
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Box>

        {/* Hero Content */}
        <Box sx={{ maxWidth: '800px', mx: 'auto', textAlign: 'center' }}>
          {/* Small Tag */}
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              fontWeight: 500,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              mb: 1.5
            }}
          >
            Premium Properties • Trusted Service
          </Typography>

          {/* Main Heading */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.8rem', sm: '3rem', md: '3.8rem' },
              fontWeight: 800,
              color: 'white',
              mb: 1.5,
              lineHeight: 1.1,
              textShadow: '0 4px 30px rgba(0,0,0,0.3)'
            }}
          >
            FIND YOUR <br />
            <span style={{ color: '#e94560' }}>DREAM HOSTEL</span>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '0.8rem', sm: '1rem' },
              fontWeight: 300,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Discover the best hostels and homestels in Kumasi, Ghana.
          </Typography>

          {/* Location Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.6,
              borderRadius: '50px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}
          >
            <LocationIcon sx={{ color: '#e94560', fontSize: '16px' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {isLocating ? 'Detecting...' : location}
            </Typography>
            <IconButton
              size="small"
              onClick={detectLocation}
              sx={{ color: 'rgba(255,255,255,0.3)', p: 0.2 }}
            >
              <MyLocationIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ModernHeader;