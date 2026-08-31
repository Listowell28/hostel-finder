import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, TextField, Avatar, Divider, Alert, CircularProgress,
  IconButton, InputAdornment, Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: ''
  });
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'student'
      });
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data }));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.user }));

      setUser(data.user);
      setSuccess('Profile updated successfully!');
      setEditMode(false);

      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedUser = { ...user, avatar: event.target.result };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Avatar updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      owner: 'primary',
      student: 'success'
    };
    return colors[role] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '800px', mx: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            👤 My <span style={{ color: '#e94560' }}>Profile</span>
          </Typography>
          <Chip 
            label={user?.role?.toUpperCase() || 'STUDENT'}
            color={getRoleColor(user?.role)}
            sx={{ fontWeight: 600, textTransform: 'uppercase' }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Profile Picture */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={user?.avatar || ''}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#e94560',
                fontSize: 48,
                fontWeight: 700,
                boxShadow: '0 8px 30px rgba(233,69,96,0.3)',
                border: '4px solid white'
              }}
            >
              {getInitials(user?.full_name)}
            </Avatar>
            <IconButton
              onClick={handleAvatarClick}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: '#e94560',
                color: 'white',
                '&:hover': { bgcolor: '#c73652' },
                boxShadow: '0 4px 15px rgba(233,69,96,0.4)'
              }}
              size="small"
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#8892b0', mt: 1 }}>
            Click the camera icon to change photo
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Profile Info */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                Personal Information
              </Typography>
              {!editMode ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setEditMode(true)}
                  startIcon={<EditIcon />}
                  sx={{
                    bgcolor: '#e94560',
                    borderRadius: 50,
                    px: 3,
                    '&:hover': { bgcolor: '#c73652' }
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        full_name: user?.full_name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        role: user?.role || 'student'
                      });
                    }}
                    startIcon={<CancelIcon />}
                    sx={{ borderRadius: 50 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={<SaveIcon />}
                    sx={{
                      bgcolor: '#e94560',
                      borderRadius: 50,
                      px: 3,
                      '&:hover': { bgcolor: '#c73652' }
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Full Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={!editMode}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#8892b0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .Mui-disabled': { bgcolor: '#f8f9fa' }
              }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#8892b0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .Mui-disabled': { bgcolor: '#f8f9fa' }
              }}
            />
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              placeholder="e.g. 233507194524"
              helperText="Required for SMS notifications"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#8892b0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .Mui-disabled': { bgcolor: '#f8f9fa' }
              }}
            />
          </Grid>

          {/* Role */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: '#8892b0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .Mui-disabled': { bgcolor: '#f8f9fa' }
              }}
            />
          </Grid>
        </Grid>

        {/* SMS Info Box */}
        <Box sx={{ mt: 4, p: 3, bgcolor: formData.phone ? '#e8f5e9' : '#fff3e0', borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: formData.phone ? '#2e7d32' : '#e65100', display: 'flex', alignItems: 'center', gap: 1 }}>
            📱 SMS Notifications
          </Typography>
          <Typography variant="body2" sx={{ color: formData.phone ? '#2e7d32' : '#e65100', mt: 0.5 }}>
            {formData.phone ? (
              <> You will receive SMS notifications on <strong>{formData.phone}</strong></>
            ) : (
              <> Add your phone number to receive booking confirmations and updates via SMS</>
            )}
          </Typography>
          {!formData.phone && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setEditMode(true)}
              sx={{ mt: 1, bgcolor: '#e65100', borderRadius: 50, '&:hover': { bgcolor: '#bf360c' } }}
            >
              Add Phone Number
            </Button>
          )}
        </Box>

        {/* Account Stats */}
        <Divider sx={{ my: 4 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#e94560' }}>
                {user?.role === 'admin' ? '👑' : user?.role === 'owner' ? '🏠' : '🎓'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                Account Type
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                {user?.role?.toUpperCase() || 'STUDENT'}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f3460' }}>
                
              </Typography>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                Member Since
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                {new Date(user?.created_at || Date.now()).toLocaleDateString()}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f9a825' }}>
                
              </Typography>
              <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
                Reviews Given
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                0
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Profile;