import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, Chip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Add as AddIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000';

function MyProperties() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }
    fetchMyHostels();
  }, []);

  const fetchMyHostels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hostels`);
      const data = await res.json();
      const myHostels = data.filter(h => h.owner_id === user.id);
      setHostels(myHostels);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setError('Failed to fetch hostels');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/hostels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Hostel deleted successfully');
      fetchMyHostels();
      setDeleteDialog(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels/${editDialog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update');
      setSuccess('Hostel updated successfully');
      fetchMyHostels();
      setEditDialog(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return `GH₵${isNaN(num) ? '0.00' : num.toFixed(2)}/year`;
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
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '1200px', mx: 'auto' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
              🏠 My <span style={{ color: '#e94560' }}>Properties</span>
            </Typography>
            <Typography variant="body2" sx={{ color: '#8892b0' }}>
              {hostels.length} property{hostels.length !== 1 ? 's' : ''} listed
            </Typography>
          </Box>
          <Button
            variant="contained"
            href="/add-hostel"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#e94560',
              borderRadius: 50,
              px: 4,
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            Add New
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {hostels.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <HomeIcon sx={{ fontSize: 64, color: '#e94560', opacity: 0.3, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 1 }}>No Properties Yet</Typography>
            <Typography variant="body1" sx={{ color: '#8892b0', mb: 3 }}>You haven't listed any properties. Start by adding your first hostel!</Typography>
            <Button variant="contained" href="/add-hostel" startIcon={<AddIcon />} sx={{ bgcolor: '#e94560', borderRadius: 50, px: 4, py: 1.5, '&:hover': { bgcolor: '#c73652' } }}>List Your First Property</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {hostels.map((hostel) => (
              <Grid item xs={12} sm={6} lg={4} key={hostel.id}>
                <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } }}>
                  <Box sx={{ height: 140, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip label={`⭐ ${hostel.rating || 'New'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                      <Chip label={formatPrice(hostel.price_per_year)} size="small" sx={{ bgcolor: '#e94560', color: 'white' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{hostel.name}</Typography>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#8892b0' }} />
                      <Typography variant="body2" sx={{ color: '#8892b0' }}>{hostel.city}, {hostel.state || 'Ghana'}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#6b7a8f', mb: 2 }}>{hostel.description?.slice(0, 80) || 'No description'}</Typography>
                    {hostel.images && hostel.images.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, overflowX: 'auto' }}>
                        {hostel.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt={hostel.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                        ))}
                        {hostel.images.length > 3 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                            <Typography variant="caption" sx={{ color: '#8892b0' }}>+{hostel.images.length - 3}</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small" fullWidth onClick={() => { setEditDialog(hostel); setEditForm(hostel); }} startIcon={<EditIcon />} sx={{ borderRadius: 50 }}>Edit</Button>
                      <Button variant="outlined" size="small" fullWidth color="error" onClick={() => setDeleteDialog(hostel)} startIcon={<DeleteIcon />} sx={{ borderRadius: 50 }}>Delete</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Delete Property</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteDialog?.id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField label="Name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
              <TextField label="Price (GH₵/year)" type="number" value={editForm.price_per_year || ''} onChange={(e) => setEditForm({ ...editForm, price_per_year: parseFloat(e.target.value) })} fullWidth />
              <TextField label="Description" multiline rows={4} value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleEdit} variant="contained" sx={{ bgcolor: '#e94560' }}>Save</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default MyProperties;