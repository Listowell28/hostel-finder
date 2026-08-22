import { useState, useRef } from 'react';
import {
  Box, Button, Typography, Paper, IconButton, CircularProgress,
  Alert, ImageList, ImageListItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ImageUpload({ onImagesUploaded, existingImages = [], maxImages = 10 }) {
  const [images, setImages] = useState(existingImages || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first to upload images');
      return;
    }

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/upload/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed: ${text || res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.images || data.images.length === 0) {
        throw new Error('No images returned from server');
      }

      // ✅ Get image URLs
      const newImages = data.images.map(img => img.url || img);
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      setSuccess(`${files.length} images uploaded successfully!`);

      if (onImagesUploaded) {
        onImagesUploaded(updatedImages);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    if (onImagesUploaded) {
      onImagesUploaded(newImages);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          border: '2px dashed #ddd',
          textAlign: 'center',
          '&:hover': {
            borderColor: '#e94560',
            bgcolor: 'rgba(233,69,96,0.02)'
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            handleUpload({ target: { files } });
          }
        }}
      >
        <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#8892b0', mb: 1 }} />
        <Typography variant="body1" sx={{ color: '#8892b0' }}>
          Drag & drop images here, or click to select
        </Typography>
        <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
          Supports JPG, PNG, GIF, WebP (Max 5MB each)
        </Typography>
        <Typography variant="caption" sx={{ color: '#8892b0', display: 'block' }}>
          {images.length} / {maxImages} images used
        </Typography>

        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={uploading || images.length >= maxImages}
          sx={{
            mt: 2,
            bgcolor: '#e94560',
            borderRadius: 50,
            px: 4,
            '&:hover': { bgcolor: '#c73652' }
          }}
        >
          {uploading ? 'Uploading...' : 'Select Images'}
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            disabled={uploading || images.length >= maxImages}
          />
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {uploading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress sx={{ color: '#e94560' }} />
          <Typography variant="body2" sx={{ color: '#8892b0', mt: 1 }}>
            Uploading images...
          </Typography>
        </Box>
      )}

      {/* ✅ FIXED: Image Preview with Full URL */}
      {images.length > 0 && (
        <ImageList cols={3} rowHeight={150} sx={{ mt: 2 }}>
              {images.map((image, index) => {
  // Build full URL for preview
       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
       const imageUrl = image && image.startsWith('/uploads')
       ? `${API_URL}${image}`
       : image;

     return (
     <ImageListItem key={index} sx={{ position: 'relative' }}>
      ...
                <img
                  src={imageUrl}
                  alt={`Hostel image ${index + 1}`}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    borderRadius: 8 
                  }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/150x150/e94560/white?text=Error';
                  }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: '#e94560',
                    color: 'white',
                    '&:hover': { bgcolor: '#c73652' },
                    width: 28,
                    height: 28
                  }}
                  size="small"
                  onClick={() => handleRemoveImage(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ImageListItem>
            );
          })}
        </ImageList>
      )}
    </Box>
  );
}

export default ImageUpload;