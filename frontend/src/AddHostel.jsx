import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Alert,
  Grid, Chip, Divider, CircularProgress, InputAdornment
} from '@mui/material';
import {
  Home as HomeIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  BedroomParent as BedIcon
} from '@mui/icons-material';
import ImageUpload from './ImageUpload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AddHostel({ onHostelAdded }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    description: '',
    price_per_year: '',
    amenities: ''
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagesUploaded = (uploadedImages) => {
    setImages(uploadedImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    const amenitiesArray = form.amenities.split(',').map(a => a.trim()).filter(a => a);

   // In AddHostel.jsx - handleSubmit
const hostelData = {
  name: form.name,
  address: form.address,
  city: form.city,
  state: form.state,
  zip_code: form.zip_code,
  description: form.description,
  price_per_year: parseFloat(form.price_per_year),
  amenities: amenitiesArray,
  images: images  // ✅ This should be an array of URLs
};

// ✅ Log to see what's being sent
console.log('📤 Sending images:', images);

    try {
      const res = await fetch(`${API_URL}/api/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hostelData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add hostel');

      setSuccess('🎉 Hostel added successfully!');
      setForm({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        description: '',
        price_per_year: '',
        amenities: ''
      });
      setImages([]);
      if (onHostelAdded) onHostelAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '800px', mx: 'auto' }}>
        
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            🏠 Add <span style={{ color: '#e94560' }}>New Hostel</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#8892b0', mt: 1 }}>
            Fill in the details below to list your hostel
          </Typography>
          <Divider sx={{ mt: 3 }} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hostel Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Zip Code"
                name="zip_code"
                value={form.zip_code}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Year (GH₵)"
                name="price_per_year"
                type="number"
                value={form.price_per_year}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amenities (comma separated)"
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="WiFi, Kitchen, Laundry, Parking, Pool"
                helperText="Separate each amenity with a comma"
              />
              {form.amenities && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {form.amenities.split(',').map((item, index) => {
                    const trimmed = item.trim();
                    if (trimmed) {
                      return (
                        <Chip
                          key={index}
                          label={trimmed}
                          size="small"
                          sx={{ bgcolor: '#f0f2f5' }}
                        />
                      );
                    }
                    return null;
                  })}
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 1 }}>
                  📸 Hostel Images
                </Typography>
                <ImageUpload
                  onImagesUploaded={handleImagesUploaded}
                  existingImages={images}
                  maxImages={10}
                />
              </Box>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 4,
              bgcolor: '#e94560',
              borderRadius: 50,
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '➕ Add Hostel'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default AddHostel;