import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  IconButton,
  InputAdornment,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Menu as MenuIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function ModernHeader({ user, onMenuClick, darkMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { name: 'Hostel' },
    { name: 'Homestel'},
    
  ];

  return (
    <Box
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 3 },
        pb: { xs: 2.5, sm: 3.5 },
        borderBottomLeftRadius: { xs: '24px', sm: '32px' },
        borderBottomRightRadius: { xs: '24px', sm: '32px' },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.08)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Bar - WITH LOGO AND LOCATION */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 2.5 },
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {/* Left: Menu + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onMenuClick} sx={{ color: 'white', p: 0.5 }}>
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* ✅ LOGO - Your actual logo image */}
            <Avatar 
              src="/logo.png" 
              sx={{ 
                width: 32, 
                height: 32, 
                border: '2px solid rgba(255,255,255,0.2)',
                bgcolor: 'transparent'
              }} 
            />
            <Typography
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                display: { xs: 'block', sm: 'block' }
              }}
            >
              Hostel<span style={{ color: '#e94560' }}>Finder</span>
            </Typography>
          </Box>
        </Box>

        {/* Center: Location */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.8rem'
          }}
        >
          <LocationIcon sx={{ fontSize: 25 }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Kumasi-Tanoso, Ghana
          </Typography>
        </Box>

        {/* Right: Language + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Language */}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              display: { xs: 'none', sm: 'block' },
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ENGLISH
          </Typography>

          {user ? (
            <Avatar
              src={user.avatar}
              sx={{
                width: 30,
                height: 30,
                bgcolor: '#e94560',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.15)',
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
                px: 2,
                py: 0.5,
                fontSize: '11px',
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

      {/* Welcome Section with Location */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: 1.5 }}>
        <Typography
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            lineHeight: 1.2
          }}
        >
          <br />
          <span style={{ color: '#e94560' }}></span> 
        </Typography>
        
        {/* ✅ Location under welcome text */}
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            mt: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <LocationIcon sx={{ fontSize: 25, color: 'rgba(255,255,255,0.5)' }} />
          Kumasi-Tanoso, Ghana
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            mt: 0.2
          }}
        >
          Where comfort meets convenience
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 0.8, sm: 1 },
          borderRadius: '50px',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          mb: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        <TextField
          fullWidth
          placeholder="Search any place..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              fontSize: '0.85rem',
              '&::placeholder': {
                color: 'rgba(255,255,255,0.4)'
              }
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              px: 1.5,
              py: 0.5
            }
          }}
        />
      </Paper>

      {/* Category Chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}
      >
        {categories.map((category) => (
          <Chip
            key={category.name}
            icon={<span style={{ fontSize: '14px' }}>{category.icon}</span>}
            label={category.name}
            onClick={() => console.log('Filter by:', category.name)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: 'white',
              px: 0.5,
              py: 1,
              borderRadius: '50px',
              fontSize: '0.7rem',
              height: 28,
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.06)',
              '&:hover': {
                bgcolor: 'rgba(233,69,96,0.25)',
                borderColor: '#e94560'
              },
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '14px',
                marginLeft: '6px'
              },
              '& .MuiChip-label': {
                padding: '0 8px',
                fontSize: '0.7rem'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default ModernHeader;