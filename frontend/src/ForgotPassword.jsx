import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ForgotPassword() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const steps = ['Verify Email', 'Verify Phone', 'Reset Password'];

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setVerificationId(data.verificationId);
      setSuccess('✅ OTP sent to your email!');
      setActiveStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code,
          verificationId 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      setSuccess('✅ OTP verified!');
      setActiveStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code,
          newPassword 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccess('✅ Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');

      setSuccess('✅ New OTP sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      {/* Decorative Background */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.04,
          fontSize: { xs: '80px', sm: '120px' },
          fontWeight: 900,
          color: 'white',
          letterSpacing: '5px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        RESET PASSWORD
      </Box>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 450 },
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
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '1.8rem' }
            }}
          >
            🔐 Reset Password
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            We'll help you reset your password
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 3,
            '& .MuiStepLabel-label': {
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem'
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: '#e94560'
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: '#4caf50'
            },
            '& .MuiStepIcon-root': {
              color: 'rgba(255,255,255,0.1)'
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#e94560'
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#4caf50'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Step 1: Email */}
        {activeStep === 0 && (
          <form onSubmit={handleSendOTP}>
            <TextField
              fullWidth
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#e94560' }
                }
              }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
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
                '&:hover': { bgcolor: '#c73652' },
                '&:disabled': { bgcolor: 'rgba(233,69,96,0.3)' }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send OTP'}
            </Button>

            <Button
              fullWidth
              onClick={() => navigate('/login')}
              sx={{
                mt: 2,
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: 'white' }
              }}
            >
              Back to Login
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {activeStep === 1 && (
          <form onSubmit={handleVerifyOTP}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              Enter the 6-digit code sent to your email
            </Typography>

            <TextField
              fullWidth
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputProps={{ maxLength: 6 }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#e94560' }
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
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
                '&:hover': { bgcolor: '#c73652' },
                '&:disabled': { bgcolor: 'rgba(233,69,96,0.3)' }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
              <Button
                onClick={handleResendOTP}
                disabled={loading}
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: 'white' },
                  fontSize: '0.8rem'
                }}
              >
                Resend OTP
              </Button>
              <Button
                onClick={() => setActiveStep(0)}
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  '&:hover': { color: 'white' },
                  fontSize: '0.8rem'
                }}
              >
                Change Email
              </Button>
            </Box>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {activeStep === 2 && (
          <form onSubmit={handleResetPassword}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              Create a new password for your account
            </Typography>

            <TextField
              fullWidth
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#e94560' }
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: 'rgba(255,255,255,0.3)', mr: 1 }} />
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
                '&:hover': { bgcolor: '#c73652' },
                '&:disabled': { bgcolor: 'rgba(233,69,96,0.3)' }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reset Password'}
            </Button>

            <Button
              fullWidth
              onClick={() => navigate('/login')}
              sx={{
                mt: 2,
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: 'white' }
              }}
            >
              Back to Login
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default ForgotPassword;