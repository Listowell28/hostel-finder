import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdBanner({ position = 'homepage', darkMode }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAds();
  }, [position]);

  useEffect(() => {
    // Rotate ads every 10 seconds
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [ads]);

  const fetchAds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ads?position=${position}`);
      const data = await res.json();
      setAds(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setLoading(false);
    }
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const ad = ads[currentAdIndex];

  return (
    <Paper
      onClick={() => {
        if (ad.link) {
          window.open(ad.link, '_blank');
          // Track click
          fetch(`${API_URL}/api/ads/${ad.id}/click`, { method: 'POST' });
        }
      }}
      sx={{
        position: 'relative',
        p: 2,
        borderRadius: 3,
        cursor: 'pointer',
        bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        border: '1px solid rgba(233,69,96,0.2)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(233,69,96,0.15)',
          transform: 'scale(1.01)'
        }
      }}
    >
      {/* Ad Label */}
      <Chip
        label="Sponsored"
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: '0.6rem',
          zIndex: 1
        }}
      />

      {/* Ad Content */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {ad.image && (
          <Box
            component="img"
            src={ad.image}
            alt={ad.title}
            sx={{
              width: { xs: 80, sm: 120 },
              height: { xs: 80, sm: 120 },
              objectFit: 'cover',
              borderRadius: 2
            }}
          />
        )}
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: darkMode ? 'white' : '#1a1a2e' }}>
            {ad.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            {ad.description}
          </Typography>
          <Button
            size="small"
            sx={{
              mt: 1,
              color: '#e94560',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Learn More →
          </Button>
        </Box>
      </Box>

      {/* Ad Progress Bar */}
      {ads.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'rgba(233,69,96,0.1)'
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: '#e94560',
              width: `${((currentAdIndex + 1) / ads.length) * 100}%`,
              transition: 'width 1s ease'
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

export default AdBanner;