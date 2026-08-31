import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Chip, IconButton, MenuItem,
  CircularProgress, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Bed as BedIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const roomTypes = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Room' },
  { value: 'twin', label: 'Twin Room' },
  { value: 'dorm', label: 'Dormitory' },
  { value: 'suite', label: 'Suite' },
  { value: 'studio', label: 'Studio' }
];

function RoomManager({ hostelId, hostelName }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'single',
    price: '',
    capacity: 1,
    available: 0,
    total_rooms: 1,
    description: '',
    amenities: ''
  });

  useEffect(() => {
    fetchRooms();
  }, [hostelId]);

  const fetchRooms = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/hostels/${hostelId}/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRooms(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch rooms');
      setLoading(false);
    }
  };

  const handleOpenDialog = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name || '',
        type: room.type || 'single',
        price: room.price || '',
        capacity: room.capacity || 1,
        available: room.available || 0,
        total_rooms: room.total_rooms || 1,
        description: room.description || '',
        amenities: room.amenities?.join(', ') || ''
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        type: 'single',
        price: '',
        capacity: 1,
        available: 0,
        total_rooms: 1,
        description: '',
        amenities: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    setError('');
    setSuccess('');

    const roomData = {
      ...formData,
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity),
      available: parseInt(formData.available),
      total_rooms: parseInt(formData.total_rooms),
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a)
    };

    try {
      let res;
      if (editingRoom) {
        res = await fetch(`${API_URL}/api/admin/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(roomData)
        });
      } else {
        res = await fetch(`${API_URL}/api/admin/hostels/${hostelId}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(roomData)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(editingRoom ? 'Room updated successfully!' : 'Room added successfully!');
      handleCloseDialog();
      fetchRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Room deleted successfully!');
      fetchRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoomTypeLabel = (type) => {
    const found = roomTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      'single': 'primary',
      'double': 'success',
      'twin': 'info',
      'dorm': 'warning',
      'suite': 'error',
      'studio': 'secondary'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#e94560' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
           Rooms for {hostelName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#e94560',
            borderRadius: 50,
            px: 3,
            '&:hover': { bgcolor: '#c73652' }
          }}
        >
          Add Room
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {rooms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography sx={{ color: '#8892b0' }}>
            No rooms added yet. Click "Add Room" to create one.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {room.name}
                    </Typography>
                    <Chip
                      label={getRoomTypeLabel(room.type)}
                      size="small"
                      color={getRoomTypeColor(room.type)}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MoneyIcon sx={{ fontSize: 16, color: '#e94560' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#e94560' }}>
                        GH₵{room.price}/night
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: '#8892b0' }} />
                      <Typography variant="body2" sx={{ color: '#8892b0' }}>
                        {room.capacity} guests
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`${room.available} / ${room.total_rooms} available`}
                      size="small"
                      color={room.available > 0 ? 'success' : 'error'}
                    />
                  </Box>

                  {room.amenities && room.amenities.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {room.amenities.slice(0, 3).map((a, i) => (
                        <Chip key={i} label={a} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.6rem' }} />
                      ))}
                      {room.amenities.length > 3 && (
                        <Chip label={`+${room.amenities.length - 3}`} size="small" sx={{ bgcolor: '#f0f2f5', fontSize: '0.6rem' }} />
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(room)}
                      sx={{ borderRadius: 50, flex: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(room.id)}
                      sx={{ borderRadius: 50, flex: 1 }}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          {editingRoom ? ' Edit Room' : ' Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Room Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              placeholder="e.g. Standard Single, Deluxe Double"
            />
            
            <TextField
              select
              label="Room Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              fullWidth
            >
              {roomTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Price per Night (GH₵)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              fullWidth
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Capacity (Guests)"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Total Rooms"
                  name="total_rooms"
                  type="number"
                  value={formData.total_rooms}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Available Rooms"
              name="available"
              type="number"
              value={formData.available}
              onChange={handleInputChange}
              fullWidth
              required
              inputProps={{ min: 0, max: formData.total_rooms }}
              helperText="Number of rooms currently available"
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the room..."
            />

            <TextField
              label="Amenities (comma separated)"
              name="amenities"
              value={formData.amenities}
              onChange={handleInputChange}
              fullWidth
              placeholder="WiFi, TV, Air Conditioning, Private Bathroom"
              helperText="Separate each amenity with a comma"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: '#e94560',
              borderRadius: 50,
              px: 4,
              '&:hover': { bgcolor: '#c73652' }
            }}
          >
            {editingRoom ? 'Update Room' : 'Add Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RoomManager;