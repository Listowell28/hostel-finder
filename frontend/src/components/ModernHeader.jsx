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
        background: darkMode 
          ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)' 
          : 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        px: { xs: 2, sm: 3 },
        pt: { xs: 1.5, sm: 2 },
        pb: { xs: 2, sm: 2.5 },
        borderRadius: { xs: '20px', sm: '28px' },
        mx: { xs: 1, sm: 2 },
        mt: { xs: 1, sm: 2 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative circles - subtle */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.06)',
          pointerEvents: 'none'
        }}
      />

      {/* ✅ TOP BAR - Compact */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 1.5, sm: 2 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left: Menu + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{ color: 'white', p: 0.5 }}
          >
            <MenuIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </IconButton>
          
          <Typography
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              letterSpacing: '-0.3px'
            }}
          >
            Hostel<span style={{ color: '#e94560' }}>Finder</span>
          </Typography>
        </Box>

        {/* Right: User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <Avatar
              src={user.avatar}
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                bgcolor: '#e94560',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.12)',
                fontSize: '12px'
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

      {/* ✅ LOCATION + WELCOME - Compact */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <LocationIcon sx={{ color: '#e94560', fontSize: { xs: 16, sm: 18 } }} />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {isLocating ? (
              <>
                <CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.4)' }} />
                Detecting...
              </>
            ) : (
              location
            )}
            <IconButton
              size="small"
              onClick={detectLocation}
              sx={{
                color: 'rgba(255,255,255,0.3)',
                p: 0.2,
                '&:hover': { color: '#e94560' }
              }}
            >
              <MyLocationIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Typography>
        </Box>

        <Typography
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.3rem' },
            mt: 0.3,
            lineHeight: 1.2
          }}
        >
          Let's find you <br />
          <span style={{ color: '#e94560' }}>the best home</span>
        </Typography>
      </Box>

      {/* ✅ SEARCH BAR - Compact */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 0.5, sm: 0.8 },
          borderRadius: '50px',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          zIndex: 1
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
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: { xs: 18, sm: 20 } }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              '&::placeholder': {
                color: 'rgba(255,255,255,0.3)'
              }
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              px: { xs: 1, sm: 1.5 },
              py: { xs: 0.5, sm: 0.8 }
            }
          }}
        />
      </Paper>

      {/* ✅ CATEGORY PILLS - Compact */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.8,
          flexWrap: 'wrap',
          mt: { xs: 1.5, sm: 2 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {[
          { name: 'All', icon: '🏠' },
          { name: 'Hostels', icon: '🏘️' },
          { name: 'Homestels', icon: '🏡' }
        ].map((category) => (
          <Button
            key={category.name}
            size="small"
            sx={{
              borderRadius: '50px',
              bgcolor: 'rgba(255,255,255,0.06)',
              color: 'white',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.3, sm: 0.5 },
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              fontWeight: 500,
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.04)',
              '&:hover': {
                bgcolor: 'rgba(233,69,96,0.2)',
                borderColor: '#e94560'
              }
            }}
          >
            <span style={{ marginRight: '4px' }}>{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export default ModernHeader;