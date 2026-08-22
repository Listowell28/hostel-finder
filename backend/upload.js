const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for memory storage (temporary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMultiple = upload.array('images', 10);

// Upload to Supabase Storage
const uploadToSupabase = async (file) => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  
  const { data, error } = await supabase.storage
    .from('hostel-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600'
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('hostel-images')
    .getPublicUrl(fileName);

  return publicUrl;
};

module.exports = { upload, uploadMultiple, uploadToSupabase };