import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  BookOnline as BookOnlineIcon,
  Hotel as HotelIcon,
  Dashboard as DashboardIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import LanguageSwitcher from '../languageswitcher';

function MobileSidebar({ 
  open, 
  onClose, 
  user, 
  darkMode, 
  toggleDarkMode, 
  handleLogout, 
  navigate 
}) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: darkMode ? '#1a1a2e' : '#1a1a2e',
          color: 'white',
          boxSizing: 'border-box',
          px: 2,
          py: 3
        }
      }}
    >
      {/* User Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, px: 1 }}>
        <Avatar sx={{ bgcolor: '#e94560', width: 48, height: 48 }}>
          {user?.full_name?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.full_name || 'Guest'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#8892b0' }}>
            {user?.role || 'Not logged in'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      {/* Menu Items */}
      <List>
        <ListItem 
          button 
          onClick={() => { navigate('/'); onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon><HomeIcon sx={{ color: '#e94560' }} /></ListItemIcon>
          <ListItemText primary="Home" sx={{ '& .MuiTypography-root': { color: 'white' } }} />
        </ListItem>

        <ListItem 
          button 
          onClick={() => { navigate('/profile'); onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon><PersonIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
          <ListItemText primary="Profile" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
        </ListItem>

        <ListItem 
          button 
          onClick={() => { navigate('/my-bookings'); onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon><BookOnlineIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
          <ListItemText primary="My Bookings" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
        </ListItem>

        {(user?.role === 'owner' || user?.role === 'admin') && (
          <ListItem 
            button 
            onClick={() => { navigate('/my-properties'); onClose(); }} 
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon><HotelIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
            <ListItemText primary="My Properties" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
          </ListItem>
        )}

        {user?.role === 'admin' && (
          <ListItem 
            button 
            onClick={() => { navigate('/admin'); onClose(); }} 
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon><DashboardIcon sx={{ color: '#8892b0' }} /></ListItemIcon>
            <ListItemText primary="Admin Dashboard" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
          </ListItem>
        )}

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

        <ListItem 
          button 
          onClick={() => { window.open('https://wa.me/233595023480', '_blank'); onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon><WhatsAppIcon sx={{ color: '#25D366' }} /></ListItemIcon>
          <ListItemText primary="WhatsApp Us" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
        </ListItem>

        <ListItem 
          button 
          onClick={() => { window.location.href = 'tel:+233507194524'; onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon><PhoneIcon sx={{ color: '#e94560' }} /></ListItemIcon>
          <ListItemText primary="Call Us" sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} />
        </ListItem>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

        <ListItem 
          button 
          onClick={() => { toggleDarkMode(); onClose(); }} 
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon>
            {darkMode ? 
              <Brightness7Icon sx={{ color: '#8892b0' }} /> : 
              <Brightness4Icon sx={{ color: '#8892b0' }} />
            }
          </ListItemIcon>
          <ListItemText 
            primary={darkMode ? 'Light Mode' : 'Dark Mode'} 
            sx={{ '& .MuiTypography-root': { color: '#8892b0' } }} 
          />
        </ListItem>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

        {user ? (
          <ListItem 
            button 
            onClick={() => { handleLogout(); onClose(); }} 
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon><span style={{ color: '#e94560' }}>🚪</span></ListItemIcon>
            <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { color: '#e94560' } }} />
          </ListItem>
        ) : (
          <ListItem 
            button 
            onClick={() => { navigate('/login'); onClose(); }} 
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon><PersonIcon sx={{ color: '#e94560' }} /></ListItemIcon>
            <ListItemText primary="Login" sx={{ '& .MuiTypography-root': { color: '#e94560' } }} />
          </ListItem>
        )}
      </List>

      {/* Language Switcher at bottom */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <LanguageSwitcher />
      </Box>
    </Drawer>
  );
}

export default MobileSidebar;