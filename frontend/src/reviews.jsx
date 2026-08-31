// frontend/src/reviews.jsx
import { useState, useEffect } from 'react';
import {
  Box, Typography, Rating, TextField, Button, Alert,
  Avatar, Chip, IconButton, Paper, Collapse
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Reviews({ hostelId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [user, setUser] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (hostelId) {
      fetchReviews();
    }
  }, [hostelId]);

  // ✅ FIXED: Use correct API endpoints
  const fetchReviews = async () => {
    if (!hostelId) {
      setLoading(false);
      return;
    }

    try {
      console.log(' Fetching reviews for hostel:', hostelId);
      
      // ✅ CORRECT endpoint
      const res = await fetch(`${API_URL}/api/reviews/hostel/${hostelId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(' Reviews fetched:', data);
      setReviews(data);

      // Calculate average rating from fetched reviews
      if (data && data.length > 0) {
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        const avg = total / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalReviews(data.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (err) {
      console.error(' Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Submit review to correct endpoint
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to leave a review');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login again');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // ✅ CORRECT endpoint: POST to /api/reviews
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          hostel_id: parseInt(hostelId), 
          rating: parseInt(rating), 
          comment: comment.trim() 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to submit review');

      setSuccess(' Review submitted successfully!');
      setRating(0);
      setComment('');
      setEditingReview(null);
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      console.error(' Submit error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ FIXED: Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login again');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      
      setSuccess(' Review deleted');
      fetchReviews();
    } catch (err) {
      console.error(' Delete error:', err);
      setError(err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setShowForm(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // ✅ If no hostelId, show message
  if (!hostelId) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#8892b0' }}>
          No hostel selected
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" sx={{ color: '#8892b0' }}>Loading reviews...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* Rating Summary - Compact */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Rating value={averageRating} precision={0.5} readOnly size="small" />
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
          {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8892b0' }}>
          ({totalReviews})
        </Typography>
        {user && (
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setShowForm(!showForm);
            }}
            sx={{ ml: 'auto', fontSize: '0.7rem', textTransform: 'none', color: '#e94560' }}
          >
            {showForm ? 'Hide' : 'Write Review'}
          </Button>
        )}
      </Box>

      {/* Write Review Form - Collapsible */}
      <Collapse in={showForm} onClick={(e) => e.stopPropagation()}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          <form onSubmit={handleSubmitReview} onClick={(e) => e.stopPropagation()}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Rate:</Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                size="small"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              size="small"
              sx={{ mt: 1, '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={submitting}
                sx={{ bgcolor: '#e94560', borderRadius: 50, fontSize: '0.7rem' }}
              >
                {submitting ? 'Sending...' : editingReview ? 'Update' : 'Submit'}
              </Button>
              {editingReview && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEditingReview(null);
                    setRating(0);
                    setComment('');
                    setShowForm(false);
                  }}
                  sx={{ borderRadius: 50, fontSize: '0.7rem' }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </form>
        </Paper>
      </Collapse>

      {/* Reviews List - Compact */}
      {reviews.length > 0 ? (
        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
          {reviews.slice(0, 3).map((review) => (
            <Box 
              key={review.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1, 
                py: 0.5, 
                borderBottom: '1px solid #f0f2f5',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: '#e94560' }}>
                {getInitials(review.user_name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    {review.user_name || 'Anonymous'}
                  </Typography>
                  <Rating value={review.rating} readOnly size="small" />
                  <Typography variant="caption" sx={{ color: '#8892b0', fontSize: '0.6rem' }}>
                    {formatDate(review.created_at)}
                  </Typography>
                  {user && (user.id === review.user_id || user.role === 'admin') && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                      {user.id === review.user_id && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); handleEditReview(review); }}
                          sx={{ p: 0.2 }}
                        >
                          <EditIcon sx={{ fontSize: 14, color: '#8892b0' }} />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }}
                        sx={{ p: 0.2 }}
                      >
                        <DeleteIcon sx={{ fontSize: 14, color: '#f44336' }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#6b7a8f', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {review.comment}
                </Typography>
              </Box>
            </Box>
          ))}
          {reviews.length > 3 && (
            <Typography variant="caption" sx={{ color: '#8892b0', display: 'block', textAlign: 'center', py: 0.5 }}>
              +{reviews.length - 3} more {reviews.length - 3 === 1 ? 'review' : 'reviews'}
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: '#8892b0' }}>
          No reviews yet. Be the first!
        </Typography>
      )}
    </Box>
  );
}

export default Reviews;