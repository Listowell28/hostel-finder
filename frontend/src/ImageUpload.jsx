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
  const [images, setImages] = useState(
    existingImages.map(img => {
      if (img && typeof img === 'string') {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        const cleanPath = img.startsWith('/') ? img : `/${img}`;
        return `${API_URL}${cleanPath}`;
      }
      return img;
    })
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}`);
        setUploading(false);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File too large: ${file.name}`);
        setUploading(false);
        return;
      }
      formData.append('images', file);
    }

    try {
      console.log('📤 Uploading to:', `${API_URL}/api/upload/multiple`);
      
      const response = await fetch(`${API_URL}/api/upload/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('✅ Upload response:', data);

      // ✅ Get image URLs from response
      const imageUrls = data.imageUrls || data.images?.map(img => img.url) || [];
      
      if (imageUrls.length === 0) {
        throw new Error('No images returned from server');
      }

      console.log('📸 Image URLs:', imageUrls);

      const newImages = [...images, ...imageUrls];
      setImages(newImages);
      setSuccess(`Uploaded ${files.length} image(s)`);

      if (onImagesUploaded) {
        onImagesUploaded(newImages);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    if (onImagesUploaded) {
      onImagesUploaded(newImages);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hostel Images
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
          disabled={uploading || images.length >= maxImages}
        />
        
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography variant="body1" color="text.secondary">
          Drag & drop images here, or click to select
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports JPG, PNG, GIF, WebP (Max 5MB each)
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
          {images.length} / {maxImages} images used
        </Typography>

        {uploading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Uploading...
            </Typography>
          </Box>
        )}

        {images.length < maxImages && !uploading && (
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            SELECT IMAGES
          </Button>
        )}
      </Box>

      {images.length > 0 && (
        <ImageList cols={3} rowHeight={150} sx={{ mt: 2 }}>
          {images.map((image, index) => (
            <ImageListItem key={index} sx={{ position: 'relative' }}>
              <img
                src={image}
                alt={`Hostel image ${index + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150x150/1a1a2e/ffffff?text=Error';
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: '#e94560',
                  color: 'white',
                  '&:hover': { bgcolor: '#c73692' }
                }}
                size="small"
                onClick={() => handleRemoveImage(index)}
                disabled={uploading}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Paper>
  );
}

export default ImageUpload;