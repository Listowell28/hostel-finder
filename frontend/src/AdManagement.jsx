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
  Grid  // ✅ ADDED Grid HERE
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    position: 'homepage',
    price: '',
    active: true
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
      link: '',
      position: 'homepage',
      price: '',
      active: true
    });
    setEditingAd(null);
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setForm(ad);
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
                      {ad.image && (
                        <img src={ad.image} alt={ad.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                      )}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{ad.title}</Typography>
                        <Typography variant="caption" sx={{ color: '#8892b0' }}>{ad.description?.slice(0, 50)}</Typography>
                      </Box>
                    </Box>
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
            <TextField
              label="Image URL"
              fullWidth
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://example.com/ad-image.jpg"
            />
            <TextField
              label="Link URL"
              fullWidth
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://hostel.com"
            />
            <TextField
              select
              label="Position"
              fullWidth
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="homepage">Homepage</option>
              <option value="sidebar">Sidebar</option>
              <option value="search">Search Results</option>
              <option value="details">Hostel Details</option>
            </TextField>
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