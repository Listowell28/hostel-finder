import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Hotel as HotelIcon,
  Star as StarIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  SquareFoot as SquareFootIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HorizontalHostelScroll({ hostels, title, darkMode }) {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = isMobile ? 280 : 350;
      const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      // Update arrow visibility
      setTimeout(() => {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      }, 100);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const getImageUrl = (hostel) => {
    if (hostel.images && hostel.images.length > 0) {
      const img = hostel.images[0];
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads')) return `${API_URL}${img}`;
      return img;
    }
    return null;
  };

  if (!hostels || hostels.length === 0) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 4 }}>
      {/* Header with Title and View All */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: darkMode ? 'white' : '#1a1a2e',
            fontSize: { xs: '1rem', sm: '1.2rem' }
          }}
        >
          {title || 'Popular Properties'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#e94560',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          View All →
        </Typography>
      </Box>

      {/* Scroll Container */}
      <Box sx={{ position: 'relative' }}>
        {/* Left Arrow */}
        {showLeftArrow && (
          <IconButton
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: { xs: -8, sm: -12 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: darkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: darkMode ? '#2d2d2d' : '#f5f5f5' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ArrowBackIcon sx={{ color: '#e94560' }} />
          </IconButton>
        )}

        {/* Scrollable Cards */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            display: 'flex',
            gap: { xs: 2, sm: 2.5 },
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 2,
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': {
              height: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: darkMode ? '#2d2d2d' : '#f0f0f0',
              borderRadius: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#e94560',
              borderRadius: '10px'
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#e94560 #f0f0f0'
          }}
        >
          {hostels.map((hostel) => (
            <Box
              key={hostel.id}
              sx={{
                flex: '0 0 auto',
                width: { xs: '85%', sm: 280, md: 300 },
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-8px)' }
                }
              }}
              onClick={() => navigate(`/hostel/${hostel.id}`)}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(233,69,96,0.12)'
                  }
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                  {getImageUrl(hostel) ? (
                    <img
                      src={getImageUrl(hostel)}
                      alt={hostel.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: darkMode ? '#2d2d2d' : '#f0f2f5'
                      }}
                    >
                      <HotelIcon sx={{ fontSize: 40, color: darkMode ? '#444' : '#ccc' }} />
                    </Box>
                  )}

                  {/* Price Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    GH₵{hostel.price_per_year || 0}/yr
                  </Box>

                  {/* Rating Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffd700',
                      px: 1,
                      py: 0.3,
                      borderRadius: 1.5,
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3
                    }}
                  >
                    <StarIcon sx={{ fontSize: 12, color: '#ffd700' }} />
                    {hostel.rating || '4.9'}
                  </Box>

                  {/* Available Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      bgcolor: hostel.available !== false ? 'rgba(76,175,80,0.85)' : 'rgba(233,69,96,0.85)',
                      color: 'white',
                      px: 1,
                      py: 0.3,
                      borderRadius: 1.5,
                      fontSize: '9px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {hostel.available !== false ? 'Available' : 'Full'}
                  </Box>
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: darkMode ? 'white' : '#1a1a2e',
                      fontSize: '0.95rem',
                      mb: 0.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {hostel.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#8892b0',
                      fontSize: '0.7rem',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    📍 {hostel.city || 'Kumasi'}
                  </Typography>

                  {/* Amenities - Small */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(hostel.amenities || ['WiFi', 'Parking']).slice(0, 3).map((amenity, i) => (
                      <Chip
                        key={i}
                        label={amenity}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.55rem',
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : '#f5f7fa',
                          color: darkMode ? '#b0b0b0' : '#6b7a8f'
                        }}
                      />
                    ))}
                    {(hostel.amenities || []).length > 3 && (
                      <Chip
                        label={`+${(hostel.amenities || []).length - 3}`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.55rem',
                          bgcolor: '#e94560',
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Right Arrow */}
        {showRightArrow && (
          <IconButton
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: { xs: -8, sm: -12 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: darkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: darkMode ? '#2d2d2d' : '#f5f5f5' },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <ArrowForwardIcon sx={{ color: '#e94560' }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

export default HorizontalHostelScroll;