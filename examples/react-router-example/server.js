import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, HEAD, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Upload-Offset, Upload-Length, Tus-Resumable, Upload-Metadata, Content-Type');
  res.header('Access-Control-Expose-Headers', 'Upload-Offset, Upload-Length, Tus-Resumable, Location');
  next();
});

// TUS protocol implementation
app.options('/api/upload', (req, res) => {
  res.header('Tus-Resumable', '1.0.0');
  res.header('Tus-Version', '1.0.0');
  res.header('Tus-Extension', 'creation,expiration');
  res.status(204).send();
});

app.options('/api/upload/:uploadId', (req, res) => {
  res.header('Tus-Resumable', '1.0.0');
  res.header('Tus-Version', '1.0.0');
  res.header('Tus-Extension', 'creation,expiration');
  res.status(204).send();
});

// Create upload
app.post('/api/upload', (req, res) => {
  const uploadLength = req.headers['upload-length'];
  
  if (!uploadLength) {
    return res.status(400).send('Upload-Length header is required');
  }

  // Generate unique upload ID
  const uploadId = Date.now().toString() + Math.random().toString(36).substring(2);
  const filePath = path.join(uploadsDir, uploadId);
  
  // Create empty file
  fs.writeFileSync(filePath, '');
  
  res.header('Tus-Resumable', '1.0.0');
  res.header('Location', `/api/upload/${uploadId}`);
  res.status(201).send();
});

// Get upload status
app.head('/api/upload/:uploadId', (req, res) => {
  const uploadId = req.params.uploadId;
  const filePath = path.join(uploadsDir, uploadId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Upload not found');
  }

  const stats = fs.statSync(filePath);
  
  res.header('Tus-Resumable', '1.0.0');
  res.header('Upload-Offset', stats.size.toString());
  res.header('Cache-Control', 'no-store');
  res.status(200).send();
});

// Upload data
app.patch('/api/upload/:uploadId', (req, res) => {
  const uploadId = req.params.uploadId;
  const filePath = path.join(uploadsDir, uploadId);
  const offset = parseInt(req.headers['upload-offset'] || '0');
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Upload not found');
  }

  const chunks = [];
  
  req.on('data', (chunk) => {
    chunks.push(chunk);
  });
  
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      
      // Append data to file
      const fd = fs.openSync(filePath, 'r+');
      fs.writeSync(fd, buffer, 0, buffer.length, offset);
      fs.closeSync(fd);
      
      const newOffset = offset + buffer.length;
      
      res.header('Tus-Resumable', '1.0.0');
      res.header('Upload-Offset', newOffset.toString());
      res.status(204).send();
      
      console.log(`Upload progress: ${uploadId} - ${newOffset} bytes`);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).send('Upload failed');
    }
  });
});

app.listen(PORT, () => {
  console.log(`TUS server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
});
