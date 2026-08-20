import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Alert,
  Tabs, Tab, InputAdornment, IconButton, Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import GitHubIcon from '@mui/icons-material/GitHub';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin
      ? { email, password }
      : { email, password, full_name: fullName };

    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Login successful! Redirecting...');
        if (onLogin) onLogin(data.user);
        setTimeout(() => window.location.href = '/', 1000);
      } else {
        setSuccess('Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
        setFullName('');
        setEmail('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `${API_URL}/api/auth/${provider}`;
  };

  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 0);
    setError('');
    setSuccess('');
    setPassword('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Paper
        sx={{
          maxWidth: 450,
          width: '100%',
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          background: 'rgba(255,255,255,0.95)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
            Hostel<span style={{ color: '#e94560' }}>Finder</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#8892b0', mt: 0.5 }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Typography>
        </Box>

        <Tabs
          value={isLogin ? 0 : 1}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              sx={{ mb: 2.5 }}
            />
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#e94560',
              borderRadius: 50,
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#8892b0', px: 2 }}>
              OR CONTINUE WITH
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleSocialLogin('google')}
              sx={{ borderRadius: 50, px: 3 }}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => handleSocialLogin('github')}
              sx={{ borderRadius: 50, px: 3 }}
            >
              GitHub
            </Button>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#8892b0' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setPassword('');
              }}
              style={{ color: '#e94560', fontWeight: 600, textDecoration: 'none', marginLeft: '4px' }}
            >
              {isLogin ? 'Register' : 'Sign In'}
            </a>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;