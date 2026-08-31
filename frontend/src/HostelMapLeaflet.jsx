import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [6.7, -1.6];
const defaultZoom = 12;

function HostelMapLeaflet({ hostels }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const getHostelPosition = (hostel) => {
    // If hostel has lat/lng, use them
    if (hostel.latitude && hostel.longitude) {
      return [hostel.latitude, hostel.longitude];
    }
    // Otherwise generate near Ghana
    const baseLat = 6.7;
    const baseLng = -1.6;
    const offset = (hostel.id * 0.015) % 0.12;
    return [baseLat + offset - 0.06, baseLng + offset * 0.7 - 0.04];
  };

  return (
    <Box sx={{ height: 450, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
      <MapContainer
        center={userLocation || defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Circle
            center={userLocation}
            radius={100}
            pathOptions={{
              color: '#e94560',
              fillColor: '#e94560',
              fillOpacity: 0.15
            }}
          />
        )}
        
        {userLocation && (
          <Marker position={userLocation}>
            <Popup> You are here</Popup>
          </Marker>
        )}
        
        {hostels.map((hostel) => {
          const position = getHostelPosition(hostel);
          return (
            <Marker key={hostel.id} position={position}>
              <Popup>
                <Box sx={{ maxWidth: 200 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    {hostel.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8892b0' }}>
                     {hostel.city}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e94560', fontWeight: 600 }}>
                    GH₵{hostel.price_per_month}/month
                  </Typography>
                  {hostel.rating > 0 && (
                    <Typography variant="body2">⭐ {hostel.rating}</Typography>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{
                      mt: 1,
                      bgcolor: '#e94560',
                      borderRadius: 50,
                      '&:hover': { bgcolor: '#c73652' }
                    }}
                    href={`/#hostel-${hostel.id}`}
                  >
                    View Details
                  </Button>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
}

export default HostelMapLeaflet;