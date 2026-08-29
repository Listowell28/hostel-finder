import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ModernLogin({ onLogin }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin
      ? { email, password }
      : { email, password, full_name: fullName, phone };

    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLogin) onLogin(data.user);
        navigate('/');
        window.location.reload();
      } else {
        setSuccess('Account created! Please login.');
        setTimeout(() => {
          setIsLogin(true);
          setPassword('');
          setFullName('');
          setPhone('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/api/auth/github`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 3 }
      }}
    >
      {/* ✅ Logo as Background - Watermark Style */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.04,
          fontSize: { xs: '120px', sm: '200px', md: '300px' },
          fontWeight: 900,
          color: 'white',
          letterSpacing: '10px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        HOSTELFINDER
      </Box>

      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.08)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.05)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 420 },
          borderRadius: { xs: 3, sm: 4 },
          bgcolor: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          p: { xs: 3, sm: 4 },
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)'
        }}
      >
        {/* Decorative line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 4,
            borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, #e94560, #ff6b6b)'
          }}
        />

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            src="/logo.png"
            sx={{
              width: 60,
              height: 60,
              mx: 'auto',
              mb: 1.5,
              border: '2px solid rgba(255,255,255,0.1)',
              bgcolor: 'transparent'
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.5rem', sm: '1.8rem' }
            }}
          >
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              mt: 0.5
            }}
          >
            {isLogin ? 'Sign in to continue' : 'Join us and find your perfect space'}
          </Typography>
        </Box>

        {/* Tabs */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: 'rgba(255,255,255,0.05)',
            borderRadius: 50,
            p: 0.5,
            mb: 3,
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Button
            fullWidth
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            sx={{
              borderRadius: 50,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              color: isLogin ? 'white' : 'rgba(255,255,255,0.4)',
              bgcolor: isLogin ? 'rgba(233,69,96,0.8)' : 'transparent',
              '&:hover': { bgcolor: isLogin ? 'rgba(233,69,96,0.8)' : 'rgba(255,255,255,0.05)' },
              fontSize: '0.85rem'
            }}
          >
            LOGIN
          </Button>
          <Button
            fullWidth
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            sx={{
              borderRadius: 50,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              color: !isLogin ? 'white' : 'rgba(255,255,255,0.4)',
              bgcolor: !isLogin ? 'rgba(233,69,96,0.8)' : 'transparent',
              '&:hover': { bgcolor: !isLogin ? 'rgba(233,69,96,0.8)' : 'rgba(255,255,255,0.05)' },
              fontSize: '0.85rem'
            }}
          >
            REGISTER
          </Button>
        </Box>

        {/* Error/Success */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(233,69,96,0.15)', color: '#e94560' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50' }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField
              fullWidth
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={!isLogin}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#e94560' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#e94560' }
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
              }}
            />
          )}

          {!isLogin && (
            <TextField
              fullWidth
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={!isLogin}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#e94560' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' }
              }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
              }}
            />
          )}

          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#e94560' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' }
            }}
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#e94560' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' }
            }}
            InputProps={{
              startAdornment: <LockIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 50,
              bgcolor: '#e94560',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': { bgcolor: '#c73652', boxShadow: '0 8px 30px rgba(233,69,96,0.3)' },
              '&:disabled': { bgcolor: 'rgba(233,69,96,0.3)' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', px: 2 }}>
            OR CONTINUE WITH
          </Typography>
        </Divider>

        {/* Social Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              borderRadius: 50,
              py: 1.2,
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { borderColor: '#e94560', bgcolor: 'rgba(233,69,96,0.08)' }
            }}
          >
            Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={handleGithubLogin}
            sx={{
              borderRadius: 50,
              py: 1.2,
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { borderColor: '#e94560', bgcolor: 'rgba(233,69,96,0.08)' }
            }}
          >
            GitHub
          </Button>
        </Box>

        // In your Login.jsx or ModernLogin.jsx, add this:

<Box sx={{ textAlign: 'center', mt: 2 }}>
  <Button
    onClick={() => navigate('/forgot-password')}
    sx={{
      color: 'rgba(255,255,255,0.5)',
      fontSize: '0.8rem',
      textTransform: 'none',
      '&:hover': { color: '#e94560' }
    }}
  >
    Forgot Password?
  </Button>
</Box>

        {/* Toggle Login/Register */}
        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <Button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              sx={{
                color: '#e94560',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: 'transparent', color: '#ff6b6b' }
              }}
            >
              {isLogin ? 'Register' : 'Login'}
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default ModernLogin;