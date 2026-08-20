import {
  Dialog, DialogContent, DialogTitle, Typography, Button,
  Chip, Rating, Box, IconButton, Divider, useMediaQuery, useTheme
} from '@mui/material';
import { Close as CloseIcon, LocationOn } from '@mui/icons-material';

function QuickViewModal({ hostel, open, onClose, onBookNow }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!hostel) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontWeight: 700,
        color: '#1a1a2e'
      }}>
        {hostel.name}
        <IconButton onClick={onClose} sx={{ color: '#8892b0' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Image */}
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              mb: 2,
              position: 'relative'
            }}
          >
            <img
              src={hostel.images?.[0] || 'https://placehold.co/600x400/e94560/white?text=No+Image'}
              alt={hostel.name}
              style={{
                width: '100%',
                height: isMobile ? 180 : 220,
                objectFit: 'cover'
              }}
            />
            {hostel.rating >= 4.5 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: '#e94560',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                🔥 Trending
              </Box>
            )}
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: '#8892b0' }} />
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {hostel.city}, {hostel.state || 'Ghana'}
            </Typography>
          </Box>

          {/* Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Rating value={parseFloat(hostel.rating) || 0} readOnly size="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {hostel.rating || 'New'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8892b0' }}>
              ({hostel.total_reviews || 0} reviews)
            </Typography>
          </Box>

          {/* Description */}
          <Typography variant="body2" sx={{ color: '#6b7a8f', mb: 2 }}>
            {hostel.description || 'No description available'}
          </Typography>

          {/* Amenities */}
          {hostel.amenities && hostel.amenities.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
              {hostel.amenities.slice(0, 4).map((a, i) => (
                <Chip key={i} label={a} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.65rem' }} />
              ))}
              {hostel.amenities.length > 4 && (
                <Chip label={`+${hostel.amenities.length - 4}`} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.65rem' }} />
              )}
            </Box>
          )}

          {/* Price */}
          <Typography variant="h5" sx={{ color: '#e94560', fontWeight: 700 }}>
            GH₵{hostel.price_per_year}
            <Typography variant="caption" sx={{ color: '#8892b0', fontWeight: 400 }}>
              /year
            </Typography>
          </Typography>

          {/* Book Now Button */}
          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: '#e94560',
              borderRadius: 50,
              py: 1.5,
              fontWeight: 600,
              '&:hover': { bgcolor: '#c73652' }
            }}
            onClick={() => {
              onClose();
              if (onBookNow) onBookNow(hostel);
            }}
          >
            Book Now
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default QuickViewModal;