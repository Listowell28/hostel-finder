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
        minHeight: { xs: '35vh', sm: '30vh', md: '25vh' },
        display: 'flex',
        alignItems: 'center',
        background: darkMode
          ? 'linear-gradient(135deg, rgba(10,10,26,0.85) 0%, rgba(26,26,46,0.9) 100%)'
          : 'linear-gradient(135deg, rgba(15,12,41,0.8) 0%, rgba(48,43,99,0.85) 50%, rgba(36,36,62,0.9) 100%)',
        overflow: 'hidden',
        // ✅ FULL WIDTH - NO MARGINS
        borderRadius: 0,
        mx: 0,
        mt: 0,
        mb: 0,
        width: '100%',
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
          opacity: 0.25,
          zIndex: 0,
          borderRadius: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)',
          zIndex: 1,
          borderRadius: 0
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          px: { xs: 2.5, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5 }
        }}
      >
        {/* Top Bar - Compact */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={onMenuClick} sx={{ color: 'white', p: 0.5 }}>
              <MenuIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
            </IconButton>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              Hostel<span style={{ color: '#e94560' }}>Finder</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {user ? (
              <Avatar
                onClick={() => navigate('/profile')}
                sx={{ bgcolor: '#e94560', cursor: 'pointer', width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 } }}
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
                  px: { xs: 2, sm: 2.5 },
                  py: 0.5,
                  fontSize: { xs: '10px', sm: '12px' },
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

        {/* Hero Content - Small & Cute */}
        <Box sx={{ maxWidth: '700px', mx: 'auto', textAlign: 'center' }}>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: { xs: '0.55rem', sm: '0.65rem' },
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              mb: 0.8
            }}
          >
            ✦ Premium Properties • Trusted Service ✦
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '1.5rem', sm: '2.2rem', md: '2.8rem' },
              fontWeight: 800,
              color: 'white',
              mb: 0.5,
              lineHeight: 1.1,
              textShadow: '0 4px 30px rgba(0,0,0,0.3)'
            }}
          >
            FIND YOUR <span style={{ color: '#e94560' }}>DREAM SPACE</span>
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: { xs: '0.7rem', sm: '0.85rem' },
              fontWeight: 300,
              maxWidth: '500px',
              mx: 'auto',
              mb: 1
            }}
          >
            Discover the best hostels and homestels in Kumasi
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.5,
              py: 0.5,
              borderRadius: '50px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}
          >
            <LocationIcon sx={{ color: '#e94560', fontSize: { xs: 14, sm: 16 } }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
              {isLocating ? 'Detecting...' : location}
            </Typography>
            <IconButton
              size="small"
              onClick={detectLocation}
              sx={{ color: 'rgba(255,255,255,0.3)', p: 0.2 }}
            >
              <MyLocationIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ModernHeader;