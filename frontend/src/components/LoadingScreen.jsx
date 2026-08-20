// frontend/src/components/LoadingScreen.jsx
import { Box, Typography, CircularProgress, Avatar } from '@mui/material';
import { keyframes } from '@mui/system';

// Animation for the logo
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        zIndex: 9999,
        minHeight: '100vh',
      }}
    >
      {/* Logo with animation */}
      <Box
        sx={{
          animation: `${float} 2s ease-in-out infinite`,
          mb: 3,
        }}
      >
        <Avatar
          src="/logo.jpg"  // ✅ CHANGED TO .jpg
          alt="HostelFinder"
          sx={{
            width: 120,
            height: 120,
            border: '4px solid #e94560',
            animation: `${pulse} 2s ease-in-out infinite`,
            boxShadow: '0 0 50px rgba(233,69,96,0.3)',
          }}
        />
      </Box>

      {/* App Name */}
      <Typography
        variant="h4"
        sx={{
          color: 'white',
          fontWeight: 700,
          mb: 1,
          letterSpacing: 2,
        }}
      >
        Hostel<span style={{ color: '#e94560' }}>Finder</span>
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255,255,255,0.5)',
          mb: 4,
        }}
      >
        Find your perfect hostel near campus
      </Typography>

      {/* Loading spinner */}
      <CircularProgress
        sx={{
          color: '#e94560',
          size: 40,
        }}
      />

      {/* Loading dots */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 3,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#e94560',
              animation: `${pulse} 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default LoadingScreen;