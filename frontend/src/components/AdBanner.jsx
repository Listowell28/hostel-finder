import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdBanner({ position = 'homepage', darkMode }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchAds();
  }, [position]);

  useEffect(() => {
    // Auto-rotate slides every 8 seconds if not playing video
    if (ads.length > 1 && isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [ads.length, isPlaying]);

  useEffect(() => {
    // ✅ Play video when it becomes visible
    const currentAd = ads[currentIndex];
    if (currentAd?.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentIndex, ads]);

  const fetchAds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ads?position=${position}`);
      const data = await res.json();
      
      // ✅ Process ads - ensure full URLs
      const processedAds = data.map(ad => ({
        ...ad,
        image: ad.image && !ad.image.startsWith('http') 
          ? `${API_URL}${ad.image}` 
          : ad.image,
        video_url: ad.video_url && !ad.video_url.startsWith('http')
          ? `${API_URL}${ad.video_url}`
          : ad.video_url,
        type: ad.video_url ? 'video' : (ad.type || 'image')
      }));
      
      setAds(processedAds);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setIsPlaying(true);
  };

  const handleAdClick = () => {
    const ad = ads[currentIndex];
    if (ad.link) {
      // Track click
      fetch(`${API_URL}/api/ads/${ad.id}/click`, { method: 'POST' });
      window.open(ad.link, '_blank');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ✅ Handle video end
  const handleVideoEnd = () => {
    // Move to next ad
    if (ads.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const ad = ads[currentIndex];
  const isVideo = ad.type === 'video' || ad.video_url;

  return (
    <Paper
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
        border: '1px solid rgba(233,69,96,0.15)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(233,69,96,0.15)'
        }
      }}
    >
      {/* Sponsored Badge */}
      <Chip
        label="Sponsored"
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '0.6rem',
          zIndex: 10,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* ✅ Media Content */}
      <Box
        onClick={!isVideo ? handleAdClick : undefined}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 160, sm: 180, md: 200 },
          cursor: isVideo ? 'default' : 'pointer',
          overflow: 'hidden',
          bgcolor: '#000'
        }}
      >
        {isVideo && ad.video_url ? (
          // ✅ Video Player - FIXED
          <>
            <video
              ref={videoRef}
              src={ad.video_url}
              poster={ad.image || ''}
              muted={isMuted}
              autoPlay
              playsInline
              loop={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onClick={(e) => e.stopPropagation()}
              onEnded={handleVideoEnd}
              onError={(e) => {
                console.error(' Video error:', e);
                // Fallback to image if video fails
              }}
            />
            
            {/* Video Controls Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                zIndex: 5
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  width: 32,
                  height: 32
                }}
              >
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  width: 32,
                  height: 32
                }}
              >
                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeIcon fontSize="small" />}
              </IconButton>

              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  px: 1,
                  py: 0.3,
                  borderRadius: 1,
                  fontSize: '0.6rem'
                }}
              >
                {isPlaying ? '▶ Playing' : '⏸ Paused'}
              </Typography>

              {/* ✅ Click to view ad */}
              {ad.link && (
                <Button
                  size="small"
                  sx={{
                    ml: 'auto',
                    color: 'white',
                    bgcolor: 'rgba(233,69,96,0.8)',
                    borderRadius: 50,
                    px: 2,
                    py: 0.3,
                    fontSize: '0.6rem',
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(233,69,96,1)' }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick();
                  }}
                >
                  Learn More →
                </Button>
              )}
            </Box>

            {/* Video Duration Badge */}
            <Chip
              label=" Video Ad"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                fontSize: '0.6rem',
                zIndex: 5
              }}
            />
          </>
        ) : (
          // ✅ Image Display
          <img
            src={ad.image || 'https://placehold.co/800x200/e94560/white?text=Ad'}
            alt={ad.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease'
            }}
            onError={(e) => {
              e.target.src = 'https://placehold.co/800x200/e94560/white?text=Ad';
            }}
          />
        )}

        {/* Gradient Overlay for Text */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: isVideo ? '40%' : '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            pointerEvents: 'none'
          }}
        />

        {/* Ad Text Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 3,
            pointerEvents: 'none'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            {ad.title}
          </Typography>
          {ad.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {ad.description}
            </Typography>
          )}
          {!isVideo && (
            <Button
              size="small"
              sx={{
                mt: 0.5,
                color: '#e94560',
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: 50,
                px: 2,
                py: 0.3,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'none',
                pointerEvents: 'auto',
                '&:hover': { bgcolor: 'white' }
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAdClick();
              }}
            >
              Learn More →
            </Button>
          )}
        </Box>
      </Box>

      {/* Navigation Arrows */}
      {ads.length > 1 && (
        <>
          <IconButton
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              width: { xs: 28, sm: 36 },
              height: { xs: 28, sm: 36 }
            }}
          >
            <PrevIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              width: { xs: 28, sm: 36 },
              height: { xs: 28, sm: 36 }
            }}
          >
            <NextIcon fontSize="small" />
          </IconButton>

          {/* Dot Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              gap: 0.5
            }}
          >
            {ads.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); setIsPlaying(true); }}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? '#e94560' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default AdBanner;