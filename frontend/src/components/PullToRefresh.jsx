import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function PullToRefresh({ children, onRefresh, loading }) {
  const [pullStartY, setPullStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  // Check if at top of page
  const isAtTop = () => {
    return window.scrollY <= 0;
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    if (!isAtTop()) return;
    touchStartY.current = e.touches[0].clientY;
    setPullStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    // Only allow pull down
    if (diff > 0 && isAtTop()) {
      e.preventDefault();
      const offset = Math.min(diff * 0.5, 100); // Max pull distance
      setPullOffset(offset);
      
      // If pulled far enough, show release message
      if (offset > 80) {
        // Ready to refresh
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    setIsPulling(false);
    
    // If pulled more than 80px, trigger refresh
    if (pullOffset > 80 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullOffset(0);
  };

  // Clean up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchStartHandler = (e) => {
      if (isAtTop() && e.target.closest('.no-pull')) return;
      handleTouchStart(e);
    };

    const touchMoveHandler = (e) => {
      if (isAtTop() && e.target.closest('.no-pull')) return;
      handleTouchMove(e);
    };

    const touchEndHandler = () => {
      handleTouchEnd();
    };

    container.addEventListener('touchstart', touchStartHandler, { passive: true });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler, { passive: true });

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [isPulling, pullOffset, isRefreshing]);

  // Get refresh status
  const getRefreshStatus = () => {
    if (isRefreshing) return 'Refreshing...';
    if (pullOffset > 80) return 'Release to refresh!';
    if (pullOffset > 0) return 'Pull down to refresh...';
    return '';
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        touchAction: 'pan-y'
      }}
    >
      {/* Pull to refresh indicator */}
      {pullOffset > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: Math.min(pullOffset + 20, 100),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            bgcolor: 'transparent',
            transform: `translateY(${Math.min(pullOffset - 20, 0)}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.8,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={20} sx={{ color: '#e94560' }} />
            ) : pullOffset > 80 ? (
              <Box sx={{ fontSize: '20px', color: '#4caf50' }}>⬇️</Box>
            ) : (
              <Box sx={{ fontSize: '20px', color: '#8892b0' }}>⬇️</Box>
            )}
            <Typography
              variant="caption"
              sx={{
                color: isRefreshing ? '#e94560' : pullOffset > 80 ? '#4caf50' : '#8892b0',
                fontWeight: 600,
                fontSize: '12px'
              }}
            >
              {isRefreshing ? ' Updating...' : pullOffset > 80 ? ' Release to refresh' : '⬇ Pull to refresh'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}

export default PullToRefresh;