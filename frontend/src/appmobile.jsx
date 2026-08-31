import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, Typography, Button, Paper, Box, TextField, 
  Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, 
  DialogActions, Alert, Chip, AppBar, Toolbar, IconButton,
  BottomNavigation, BottomNavigationAction
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import Login from './login';
import AddHostel from './addhostel';
import MyBookings from './MyBookings';
import Reviews from './Reviews';
import AdminDashboard from './AdminDashboard';

function HomePage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState('Kumasi, Tanoso');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Booking dialog states
  const [bookingDialog, setBookingDialog] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hostels`);
      const data = await res.json();
      setHostels(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const handleBookNow = (hostel) => {
    setBookingDialog(hostel);
    setCheckInDate('');
    setCheckOutDate('');
    setGuests(1);
    setBookingError('');
    setBookingSuccess('');
  };

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBookingError('Please login first');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      setBookingError('Check-out date must be after check-in date');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostel_id: bookingDialog.id,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          guests: guests
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book');
      
      setBookingSuccess('🎉 Booking confirmed!');
      setTimeout(() => {
        setBookingDialog(null);
        window.location.href = '/my-bookings';
      }, 1500);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHostels = hostels.filter(hostel =>
    hostel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hostel.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="min-h-screen bg-gray-50 p-0 max-w-full">
      {/* Header */}
      <Box className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-b-3xl shadow-lg">
        <Box className="flex justify-between items-center">
          <Box>
            <Typography variant="caption" className="text-blue-200">
              Current Location
            </Typography>
            <Typography variant="h6" className="font-bold flex items-center gap-1">
               {location}
            </Typography>
          </Box>
          {user ? (
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="text-blue-200">
                 {user.full_name?.split(' ')[0]}
              </Typography>
              <Button variant="text" size="small" onClick={handleLogout} className="text-white">
                Logout
              </Button>
            </Box>
          ) : (
            <Link to="/login">
              <Button variant="contained" size="small" className="bg-white text-blue-600">
                Login
              </Button>
            </Link>
          )}
        </Box>
      </Box>

      {/* Hero Section */}
      <Box className="px-4 -mt-2">
        <Paper className="p-4 rounded-2xl shadow-lg bg-white">
          <Typography variant="h5" className="font-bold text-gray-800">
            Let's find you the best home
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            {hostels.length} hostels available near you
          </Typography>
        </Paper>
      </Box>

      {/* Search */}
      <Box className="px-4 mt-4">
        <TextField
          fullWidth
          placeholder="Search any place..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white rounded-full"
          InputProps={{
            startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            className: "rounded-full"
          }}
        />
      </Box>

      {/* Hostels Grid */}
      <Box className="px-4 mt-4 pb-24">
        {loading ? (
          <Typography className="text-center text-gray-500">Loading hostels...</Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredHostels.length === 0 ? (
              <Grid item xs={12}>
                <Typography className="text-center text-gray-500 py-8">
                  No hostels found. Try a different search!
                </Typography>
              </Grid>
            ) : (
              filteredHostels.map((hostel) => (
                <Grid item xs={12} sm={6} key={hostel.id}>
                  <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <Typography variant="h6" className="font-bold text-blue-600 text-sm">
                        {hostel.name}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 text-xs">
                         {hostel.city}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 text-xs">
                         ${hostel.price_per_month}/month
                      </Typography>
                      <Typography variant="body2" className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {hostel.description || 'No description available'}
                      </Typography>
                      
                      {/* Rating */}
                      <Box className="flex items-center gap-1 mt-2">
                        <StarIcon className="text-yellow-500 text-sm" />
                        <Typography variant="caption" className="font-bold">
                          {hostel.rating || 'New'}
                        </Typography>
                        <Typography variant="caption" className="text-gray-400">
                          ({hostel.total_reviews || 0} reviews)
                        </Typography>
                      </Box>

                      {(user?.role === 'student' || user?.role === 'admin') && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          fullWidth
                          className="mt-2 bg-blue-600 hover:bg-blue-700 rounded-full text-xs"
                          onClick={() => handleBookNow(hostel)}
                        >
                          Book Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Box>

      {/* Booking Dialog */}
      <Dialog 
        open={!!bookingDialog} 
        onClose={() => setBookingDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="text-blue-600 font-bold">
           Book {bookingDialog?.name}
        </DialogTitle>
        <DialogContent>
          {bookingError && (
            <Alert severity="error" className="mb-4">{bookingError}</Alert>
          )}
          {bookingSuccess && (
            <Alert severity="success" className="mb-4">{bookingSuccess}</Alert>
          )}
          
          <Box className="mt-2 space-y-4">
            <Typography variant="body2" className="text-gray-600">
               Price: ${bookingDialog?.price_per_month}/month
            </Typography>
            
            <TextField
              fullWidth
              label="Check-in Date"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              required
            />
            
            <TextField
              fullWidth
              label="Check-out Date"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: checkInDate || new Date().toISOString().split('T')[0] }}
              required
            />
            
            <TextField
              fullWidth
              label="Number of Guests"
              type="number"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(null)}>Cancel</Button>
          <Button 
            onClick={handleConfirmBooking} 
            variant="contained" 
            className="bg-green-600 hover:bg-green-700"
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function MainLayout() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (newValue) => {
    setValue(newValue);
    const routes = ['/', '/my-bookings', '/reviews', '/profile'];
    navigate(routes[newValue]);
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/add-hostel" element={<AddHostel />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<div>Profile Page</div>} />
        <Route path="/reviews" element={<div>Reviews Page</div>} />
      </Routes>

      {/* Bottom Navigation */}
      <Paper 
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
        className="rounded-t-2xl"
      >
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            handleNavigation(newValue);
          }}
          className="h-16"
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Bookings" icon={<BookOnlineIcon />} />
          <BottomNavigationAction label="Reviews" icon={<StarIcon />} />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;