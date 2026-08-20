import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem, Box, Tooltip } from '@mui/material';
import { useState } from 'react';
import TranslateIcon from '@mui/icons-material/Translate';

const languages = {
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  zh: { name: '中文', flag: '🇨🇳' },
};

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const currentLang = languages[i18n.language] || languages.en;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (langCode) => {
    console.log('🔄 Changing language to:', langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    handleClose();
    // Reload page to apply all translations
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  return (
    <Box>
      <Tooltip title={t('language.change') || 'Change Language'}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleClick}
          startIcon={<TranslateIcon />}
          sx={{
            borderRadius: 50,
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: '12px',
            '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          {currentLang.flag} {currentLang.name}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {Object.entries(languages).map(([code, lang]) => (
          <MenuItem
            key={code}
            onClick={() => changeLanguage(code)}
            selected={i18n.language === code}
            sx={i18n.language === code ? { bgcolor: 'rgba(233,69,96,0.1)' } : {}}
          >
            <span style={{ marginRight: 8 }}>{lang.flag}</span>
            {lang.name}
            {i18n.language === code && (
              <span style={{ color: '#e94560', marginLeft: 8 }}>✓</span>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default LanguageSwitcher;