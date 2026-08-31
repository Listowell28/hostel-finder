import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

function SocialCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');

    console.log(' Token:', token ? 'Present' : 'Missing');
    console.log(' User:', userParam ? 'Present' : 'Missing');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log(' User data:', user);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to home
        navigate('/', { replace: true });
        window.location.reload();
      } catch (err) {
        console.error('❌ Error parsing user data:', err);
        setError('Failed to process login. Please try again.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } else {
      console.error('❌ Missing token or user data');
      setError('Missing login data. Please try again.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
  }, [location, navigate]);

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f7fa',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fa'
      }}
    >
      <CircularProgress sx={{ color: '#e94560', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#1a1a2e' }}>
        Logging you in...
      </Typography>
      <Typography variant="body2" sx={{ color: '#8892b0', mt: 1 }}>
        Please wait while we redirect you
      </Typography>
    </Box>
  );
}

export default SocialCallback;