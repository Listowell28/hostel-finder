const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMultiple = upload.array('images', 10);

const uploadToSupabase = async (file) => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  
  const { error } = await supabase.storage
    .from('hostel-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600'
    });

  if (error) throw error;

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/hostel-images/${fileName}`;
  return publicUrl;
};

module.exports = { upload, uploadMultiple, uploadToSupabase };