import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        onClick={() => setDarkMode(!darkMode)}
        sx={{
          color: darkMode ? '#ffd700' : '#1a1a2e',
          transition: 'all 0.3s ease',
          bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'rotate(30deg)',
            bgcolor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
          }
        }}
      >
        {darkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeToggle;