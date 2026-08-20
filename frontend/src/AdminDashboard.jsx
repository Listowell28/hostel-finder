import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, IconButton, Tab, Tabs, CircularProgress,
  Avatar, Divider
} from '@mui/material';
import {
  People, Hotel, BookOnline, Star, Delete, Edit,
  CheckCircle, Cancel, Pending, Refresh,
  Bed as BedIcon
} from '@mui/icons-material';
import RoomManager from './RoomManager';

const API_URL = 'http://localhost:5000';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [selectedHostelName, setSelectedHostelName] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetch(`${API_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const usersRes = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      const hostelsRes = await fetch(`${API_URL}/api/admin/hostels`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!hostelsRes.ok) throw new Error('Failed to fetch hostels');
      const hostelsData = await hostelsRes.json();
      setHostels(hostelsData);

      const bookingsRes = await fetch(`${API_URL}/api/admin/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      setLoading(false);
    } catch (err) {
      console.error('❌ Dashboard error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: selectedRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User role updated successfully');
      setDialogOpen(false);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateBookingStatus = async () => {
    if (!selectedBooking) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/${selectedBooking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: bookingStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Booking status updated successfully');
      setDialogOpen(false);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User deleted successfully');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHostel = async (hostelId) => {
    if (!confirm('Delete this hostel?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/hostels/${hostelId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Hostel deleted successfully');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusChip = (status) => {
    const configs = {
      confirmed: { icon: <CheckCircle />, label: 'Confirmed', color: 'success' },
      pending: { icon: <Pending />, label: 'Pending', color: 'warning' },
      cancelled: { icon: <Cancel />, label: 'Cancelled', color: 'error' },
      completed: { icon: <CheckCircle />, label: 'Completed', color: 'info' }
    };
    const config = configs[status] || configs.pending;
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" sx={{ fontWeight: 600 }} />;
  };

  const getRoleChip = (role) => {
    const colors = { admin: 'error', owner: 'primary', student: 'success' };
    return <Chip label={role} color={colors[role] || 'default'} size="small" />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPrice = (price) => {
    return `GH₵${parseFloat(price)?.toFixed(2) || '0.00'}`;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress sx={{ color: '#e94560' }} /></Box>;
  }

  if (user.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Paper sx={{ p: 6, borderRadius: 4 }}>
          <Typography variant="h5" sx={{ color: '#e94560', fontWeight: 700 }}>⛔ Admin Access Required</Typography>
          <Typography variant="body1" sx={{ color: '#8892b0', mt: 2 }}>You need admin privileges to view this page.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>📊 Admin <span style={{ color: '#e94560' }}>Dashboard</span></Typography>
            <Typography variant="body2" sx={{ color: '#8892b0' }}>Manage your platform efficiently</Typography>
          </Box>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchDashboardData} sx={{ bgcolor: '#e94560', borderRadius: 50, px: 4, '&:hover': { bgcolor: '#c73652' } }}>Refresh</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {stats && (
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Users</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.stats.totalUsers}</Typography></Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><People /></Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #e94560, #c73652)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Hostels</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.stats.totalHostels}</Typography></Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Hotel /></Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #2d3436, #636e72)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Bookings</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.stats.totalBookings}</Typography></Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><BookOnline /></Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #f9a825, #f57f17)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box><Typography variant="caption" sx={{ opacity: 0.7 }}>Total Reviews</Typography><Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.stats.totalReviews}</Typography></Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Star /></Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#e94560' }, '& .MuiTabs-indicator': { backgroundColor: '#e94560' } }}>
            <Tab label={`👥 Users (${users.length})`} />
            <Tab label={`🏠 Hostels (${hostels.length})`} />
            <Tab label={`📅 Bookings (${bookings.length})`} />
            <Tab label={`🛏️ Rooms`} />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow><TableCell sx={{ fontWeight: 700 }}>User</TableCell><TableCell sx={{ fontWeight: 700 }}>Email</TableCell><TableCell sx={{ fontWeight: 700 }}>Role</TableCell><TableCell sx={{ fontWeight: 700 }}>Joined</TableCell><TableCell sx={{ fontWeight: 700 }}>Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Avatar sx={{ bgcolor: '#e94560', width: 32, height: 32, fontSize: 14 }}>{u.full_name?.charAt(0) || 'U'}</Avatar><Typography sx={{ fontWeight: 500 }}>{u.full_name}</Typography></Box></TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleChip(u.role)}</TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setSelectedUser(u); setSelectedRole(u.role); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteUser(u.id)} sx={{ color: '#e94560' }}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow><TableCell sx={{ fontWeight: 700 }}>Name</TableCell><TableCell sx={{ fontWeight: 700 }}>City</TableCell><TableCell sx={{ fontWeight: 700 }}>Price</TableCell><TableCell sx={{ fontWeight: 700 }}>Owner</TableCell><TableCell sx={{ fontWeight: 700 }}>Rating</TableCell><TableCell sx={{ fontWeight: 700 }}>Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {hostels.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{h.name}</TableCell>
                    <TableCell>{h.city}</TableCell>
                    <TableCell>{formatPrice(h.price_per_year)}</TableCell>
                    <TableCell>{h.owner_name || 'N/A'}</TableCell>
                    <TableCell>⭐ {h.rating || 'New'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" variant="contained" onClick={() => { setSelectedHostelId(h.id); setSelectedHostelName(h.name); setTabValue(3); }} sx={{ bgcolor: '#0f3460', borderRadius: 50, px: 2, py: 0.5, fontSize: '0.7rem', '&:hover': { bgcolor: '#1a1a2e' } }}>🛏️ Rooms</Button>
                        <IconButton size="small" onClick={() => handleDeleteHostel(h.id)} sx={{ color: '#e94560' }}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow><TableCell sx={{ fontWeight: 700 }}>User</TableCell><TableCell sx={{ fontWeight: 700 }}>Hostel</TableCell><TableCell sx={{ fontWeight: 700 }}>Check-in</TableCell><TableCell sx={{ fontWeight: 700 }}>Check-out</TableCell><TableCell sx={{ fontWeight: 700 }}>Total</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell><TableCell sx={{ fontWeight: 700 }}>Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.user_name}</TableCell>
                    <TableCell>{b.hostel_name}</TableCell>
                    <TableCell>{formatDate(b.check_in_date)}</TableCell>
                    <TableCell>{formatDate(b.check_out_date)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#e94560' }}>{formatPrice(b.total_price)}</TableCell>
                    <TableCell>{getStatusChip(b.status)}</TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setSelectedBooking(b); setBookingStatus(b.status); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 3 && (
          <Box sx={{ mt: 3 }}>
            {selectedHostelId ? (
              <RoomManager hostelId={selectedHostelId} hostelName={selectedHostelName} />
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <BedIcon sx={{ fontSize: 48, color: '#8892b0', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#1a1a2e', fontWeight: 600 }}>No Hostel Selected</Typography>
                <Typography sx={{ color: '#8892b0', mt: 1 }}>Go to the <strong>"Hostels"</strong> tab and click the <strong>"Rooms"</strong> button on any hostel to manage its rooms.</Typography>
                <Button variant="contained" onClick={() => setTabValue(1)} sx={{ mt: 2, bgcolor: '#e94560', borderRadius: 50, px: 4, '&:hover': { bgcolor: '#c73652' } }}>Go to Hostels</Button>
              </Paper>
            )}
          </Box>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>{selectedUser ? 'Update User Role' : 'Update Booking Status'}</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 2 }}>Update role for <strong>{selectedUser.full_name}</strong></Typography>
                <TextField select fullWidth label="Role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <MenuItem value="student">Student</MenuItem><MenuItem value="owner">Owner</MenuItem><MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Box>
            )}
            {selectedBooking && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 2 }}>Update status for <strong>{selectedBooking.hostel_name}</strong></Typography>
                <TextField select fullWidth label="Status" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                  <MenuItem value="pending">Pending</MenuItem><MenuItem value="confirmed">Confirmed</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem><MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={selectedUser ? handleUpdateUserRole : handleUpdateBookingStatus} sx={{ bgcolor: '#e94560' }}>Update</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default AdminDashboard;