import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  MyLocation as MyLocationIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function ModernHeader({ user, onMenuClick, darkMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
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
        minHeight: { xs: '85vh', sm: '80vh', md: '75vh' },
        display: 'flex',
        alignItems: 'center',
        background: darkMode
          ? 'linear-gradient(160deg, #0a0a1a 0%, #1a1a2e 40%, #16213e 100%)'
          : 'linear-gradient(160deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-40%',
          left: '-20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(233,69,96,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 4, sm: 6 }
        }}
      >
        {/* Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={onMenuClick} sx={{ color: 'white' }}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem' }}>
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 800,
                color: 'white',
                mb: 2,
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #ffffff 0%, #e94560 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Find Your Perfect Space
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                mb: 3,
                fontSize: '1.1rem',
                fontWeight: 300
              }}
            >
              Discover the best hostels and homestels in Kumasi, Ghana
            </Typography>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Paper
              sx={{
                p: { xs: 0.5, sm: 1 },
                borderRadius: '60px',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              <TextField
                fullWidth
                placeholder="Search for hostels, homestels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    px: 2,
                    py: 1,
                    '&::placeholder': { color: 'rgba(255,255,255,0.4)' }
                  }
                }}
              />
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#e94560',
                  borderRadius: '50px',
                  px: { xs: 2, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  '&:hover': { bgcolor: '#c73652' }
                }}
              >
                Search
              </Button>
            </Paper>
          </motion.div>

          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mt: 3,
                px: 2,
                py: 1,
                borderRadius: '50px',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <LocationIcon sx={{ color: '#e94560', fontSize: '18px' }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {isLocating ? 'Detecting...' : location}
              </Typography>
              <IconButton
                size="small"
                onClick={detectLocation}
                sx={{ color: 'rgba(255,255,255,0.4)', p: 0.3 }}
              >
                <MyLocationIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}

export default ModernHeader;