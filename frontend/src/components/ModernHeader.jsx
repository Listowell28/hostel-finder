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
    { name: 'Rental Hostel' },
    { name: 'Homestel' },
    { name: 'Apartment' },
    { name: 'Rooms' }
  ];

  return (
    <Box
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        px: { xs: 3, sm: 4, md: 6 },
        pt: { xs: 3, sm: 4, md: 5 },
        pb: { xs: 4, sm: 5, md: 6 },
        borderBottomLeftRadius: { xs: 0, sm: '40px' },
        borderBottomRightRadius: { xs: 0, sm: '40px' },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.1)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.08)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 3, sm: 4 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left: Logo + Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              onClick={onMenuClick}
              sx={{ color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: '#e94560',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              H
            </Box>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              sx={{
                color: 'white',
                fontWeight: 700,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Hostel<span style={{ color: '#e94560' }}>Finder</span>
            </Typography>
          </Box>
        </Box>

        {/* Right: User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Location */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              color: 'rgba(255,255,255,0.7)'
            }}
          >
            <LocationIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">Kumasi, Ghana</Typography>
          </Box>

          {/* Language */}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              display: { xs: 'none', sm: 'block' },
              cursor: 'pointer'
            }}
          >
            ENGLISH
          </Typography>

          {/* User Avatar */}
          {user ? (
            <Avatar
              src={user.avatar}
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#e94560',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
              onClick={() => navigate('/profile')}
            >
              {user.full_name?.charAt(0) || 'U'}
            </Avatar>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: '#e94560',
                borderRadius: '50px',
                px: 3,
                py: 1,
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

      {/* Welcome Section */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
            mb: 1
          }}
        >
          Discover <br />
          <span style={{ color: '#e94560' }}>Your New</span> Space
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          Where comfort meets convenience
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: '60px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3,
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
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '&::placeholder': {
                color: 'rgba(255,255,255,0.5)'
              }
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              px: 2,
              py: 1
            }
          }}
        />
      </Paper>

      {/* Category Chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}
      >
        {categories.map((category) => (
          <Chip
            key={category.name}
            icon={<span>{category.icon}</span>}
            label={category.name}
            onClick={() => console.log('Filter by:', category.name)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white',
              px: 1,
              py: 2,
              borderRadius: '50px',
              fontSize: '0.8rem',
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.08)',
              '&:hover': {
                bgcolor: 'rgba(233,69,96,0.3)',
                borderColor: '#e94560'
              },
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '1rem'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default ModernHeader;