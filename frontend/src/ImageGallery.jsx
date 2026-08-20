import { useState, useEffect } from 'react';
import {
  Box, Dialog, DialogContent, IconButton, Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

function ImageGallery({ images, open, onClose, hostelName, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') onClose();
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.95)',
          borderRadius: 0,
          height: '100vh',
          maxHeight: '100vh',
          margin: 0,
          width: '100%',
          maxWidth: '100%'
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          position: 'relative',
          bgcolor: 'rgba(0,0,0,0.95)'
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: 'white',
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Image Counter */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.5)',
            px: 2,
            py: 0.5,
            borderRadius: 20
          }}
        >
          <Typography variant="body2">
            {currentIndex + 1} / {images.length}
          </Typography>
        </Box>

        {/* Hostel Name */}
        {hostelName && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              px: 3,
              py: 1,
              borderRadius: 20
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {hostelName}
            </Typography>
          </Box>
        )}

        {/* Main Image */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4
          }}
        >
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8
            }}
          />
        </Box>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              zIndex: 10,
              overflowX: 'auto',
              maxWidth: '80%',
              p: 1,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 2
            }}
          >
            {images.map((img, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                sx={{
                  width: 60,
                  height: 60,
                  border: idx === currentIndex ? '2px solid #e94560' : '2px solid transparent',
                  borderRadius: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  flexShrink: 0,
                  '&:hover': { opacity: 0.8 }
                }}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ImageGallery;