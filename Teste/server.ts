import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes for File Uploads
  app.post('/api/upload', (req, res, next) => {
    console.log('Recebendo requisição de upload...');
    next();
  }, upload.single('file'), async (req: any, res: any) => {
    console.log('Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum');
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    try {
      const isImage = req.file.mimetype.startsWith('image/');
      const extension = path.extname(req.file.originalname) || (isImage ? '.webp' : '');
      const fileName = `file_${Date.now()}${isImage ? '.webp' : extension}`;
      const filePath = path.join(uploadsDir, fileName);

      if (isImage) {
        await sharp(req.file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);
      } else {
        fs.writeFileSync(filePath, req.file.buffer);
      }

      res.json({ url: `/uploads/${fileName}` });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({ error: 'Erro ao processar arquivo' });
    }
  });

  // Serve uploads folder
  app.use('/uploads', express.static(uploadsDir));

  // Global error handler for API routes
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
