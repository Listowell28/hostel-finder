import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Switch,
  Grid,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Videocam as VideoIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    video_url: '',
    link: '',
    position: 'homepage',
    price: '',
    active: true,
    type: 'image'
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (user.role !== 'admin') {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAds(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch ads');
      setLoading(false);
    }
  };

  // ✅ Handle file upload for images/videos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please upload an image or video file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/upload/ad`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Set the URL based on file type
      if (isImage) {
        setForm({ ...form, image: data.url, type: 'image' });
        setPreviewUrl(data.url);
      } else if (isVideo) {
        setForm({ ...form, video_url: data.url, type: 'video' });
        setPreviewUrl(data.url);
      }

      setSuccess('✅ File uploaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingAd 
        ? `${API_URL}/api/ads/${editingAd.id}`
        : `${API_URL}/api/ads`;
      
      const method = editingAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Failed to save ad');

      setSuccess(editingAd ? 'Ad updated!' : 'Ad created!');
      setDialogOpen(false);
      fetchAds();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ad?')) return;

    try {
      const res = await fetch(`${API_URL}/api/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Ad deleted!');
      fetchAds();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      image: '',
      video_url: '',
      link: '',
      position: 'homepage',
      price: '',
      active: true,
      type: 'image'
    });
    setPreviewUrl('');
    setEditingAd(null);
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setForm(ad);
    setPreviewUrl(ad.image || ad.video_url || '');
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">You need admin access to manage ads.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              📢 Ad Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              Manage advertisements on your site
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setDialogOpen(true); }}
            sx={{ bgcolor: '#e94560', borderRadius: 50, px: 4 }}
          >
            Create Ad
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Total Ads</Typography>
              <Typography variant="h4">{ads.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Active Ads</Typography>
              <Typography variant="h4">{ads.filter(a => a.active).length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Total Clicks</Typography>
              <Typography variant="h4">{ads.reduce((sum, a) => sum + (a.clicks || 0), 0)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: '#8892b0' }}>Revenue</Typography>
              <Typography variant="h4">GH₵{ads.reduce((sum, a) => sum + (a.price || 0), 0)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Ads Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell>Ad</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Clicks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {ad.image && ad.type !== 'video' ? (
                        <img src={ad.image} alt={ad.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                      ) : ad.video_url ? (
                        <Box sx={{ width: 50, height: 50, bgcolor: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <VideoIcon sx={{ color: 'white' }} />
                        </Box>
                      ) : (
                        <ImageIcon sx={{ color: '#8892b0' }} />
                      )}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{ad.title}</Typography>
                        <Typography variant="caption" sx={{ color: '#8892b0' }}>{ad.description?.slice(0, 50)}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={ad.type || 'image'} 
                      size="small" 
                      icon={ad.type === 'video' ? <VideoIcon /> : <ImageIcon />}
                      sx={{ bgcolor: ad.type === 'video' ? '#1976d2' : '#e94560', color: 'white' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={ad.position} size="small" />
                  </TableCell>
                  <TableCell>GH₵{ad.price}/month</TableCell>
                  <TableCell>{ad.clicks || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={ad.active ? 'Active' : 'Inactive'}
                      color={ad.active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(ad)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(ad.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAd ? 'Edit Ad' : 'Create New Ad'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* ✅ FILE UPLOAD SECTION */}
            <Box sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 3, 
              textAlign: 'center',
              bgcolor: '#f9f9f9'
            }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="ad-file-upload"
                disabled={uploading}
              />
              <label htmlFor="ad-file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  sx={{ borderRadius: 50 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Image or Video'}
                </Button>
              </label>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#8892b0' }}>
                Supports JPG, PNG, GIF, WebP, MP4 (Max 10MB)
              </Typography>
              
              {/* Preview */}
              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  {form.type === 'video' ? (
                    <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  ) : (
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => { setPreviewUrl(''); setForm({ ...form, image: '', video_url: '' }); }}
                    sx={{ mt: 1 }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel>Ad Type</InputLabel>
              <Select
                value={form.type || 'image'}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                label="Ad Type"
              >
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Link URL"
              fullWidth
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://hostel-finder-xi.vercel.app/hostel/7"
            />
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                label="Position"
              >
                <MenuItem value="homepage">Homepage</MenuItem>
                <MenuItem value="sidebar">Sidebar</MenuItem>
                <MenuItem value="search">Search Results</MenuItem>
                <MenuItem value="details">Hostel Details</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Price (GH₵/month)"
              type="number"
              fullWidth
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>Active</Typography>
              <Switch
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ bgcolor: '#e94560' }}>
            {editingAd ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdManagement;