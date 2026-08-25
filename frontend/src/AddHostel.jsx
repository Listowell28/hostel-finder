import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Alert,
  Grid, Chip, Divider, CircularProgress, FormControl,
  FormLabel, RadioGroup, FormControlLabel, Radio,
  Switch, FormControlLabel as SwitchLabel
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
    amenities: '',
    available: true,
    category: 'hostel'  // ✅ Added category
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

    const hostelData = {
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      description: form.description,
      price_per_year: parseFloat(form.price_per_year),
      amenities: amenitiesArray,
      images: images,
      available: form.available !== false,
      category: form.category  // ✅ Send category
    };

    console.log('📤 Sending:', hostelData);

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
        amenities: '',
        available: true,
        category: 'hostel'
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
            {/* ✅ CATEGORY SELECTION */}
            <Grid item xs={12}>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormLabel component="legend" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 1 }}>
                  Property Type
                </FormLabel>
                <RadioGroup
                  row
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  sx={{ gap: 2 }}
                >
                  <FormControlLabel
                    value="hostel"
                    control={<Radio sx={{ color: '#e94560', '&.Mui-checked': { color: '#e94560' } }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '20px' }}>🏘️</span>
                        <span>Hostel</span>
                      </Box>
                    }
                    sx={{
                      border: form.category === 'hostel' ? '2px solid #e94560' : '1px solid #ddd',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      width: 'auto',
                      bgcolor: form.category === 'hostel' ? 'rgba(233,69,96,0.05)' : 'transparent'
                    }}
                  />
                  <FormControlLabel
                    value="homestel"
                    control={<Radio sx={{ color: '#e94560', '&.Mui-checked': { color: '#e94560' } }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '20px' }}>🏡</span>
                        <span>Homestel</span>
                      </Box>
                    }
                    sx={{
                      border: form.category === 'homestel' ? '2px solid #e94560' : '1px solid #ddd',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      width: 'auto',
                      bgcolor: form.category === 'homestel' ? 'rgba(233,69,96,0.05)' : 'transparent'
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

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

            {/* ✅ AVAILABILITY TOGGLE */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 2,
                bgcolor: '#f5f7fa',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    📌 Availability Status
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8892b0' }}>
                    {form.available !== false ? 'Hostel will be visible and bookable' : 'Hostel will be hidden as unavailable'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600,
                    color: form.available !== false ? '#4caf50' : '#e94560'
                  }}>
                    {form.available !== false ? '✅ Available' : '❌ Unavailable'}
                  </Typography>
                  <Switch
                    checked={form.available !== false}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                </Box>
              </Box>
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