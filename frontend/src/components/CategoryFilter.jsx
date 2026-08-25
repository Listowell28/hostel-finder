import { useState } from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

function CategoryFilter({ selectedCategory, onCategoryChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const categories = [
    { value: 'all', label: 'All'},
    { value: 'hostel', label: 'Hostels'},
    { value: 'homestel', label: 'Homestels'},
  ];

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mt: 2, mb: 1 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: '60px',
          background: 'rgba(0,0,0,0.03)',
          display: 'inline-flex',
          width: '100%',
          maxWidth: '500px',
          mx: 'auto',
          justifyContent: 'center'
        }}
      >
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={(e, value) => {
            if (value !== null) {
              onCategoryChange(value);
            }
          }}
          sx={{
            width: '100%',
            '& .MuiToggleButton-root': {
              borderRadius: '50px !important',
              px: { xs: 2, sm: 3 },
              py: { xs: 0.8, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              fontWeight: 600,
              textTransform: 'none',
              border: 'none',
              flex: 1,
              color: '#8892b0',
              '&.Mui-selected': {
                bgcolor: '#e94560',
                color: 'white',
                '&:hover': {
                  bgcolor: '#c73652'
                }
              },
              '&:hover': {
                bgcolor: 'rgba(233,69,96,0.08)'
              }
            }
          }}
        >
          {categories.map((cat) => (
            <ToggleButton key={cat.value} value={cat.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>
    </Box>
  );
}

export default CategoryFilter;