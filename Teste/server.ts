import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(process.cwd(), 'uploads');
const projectsDir = path.join(uploadsDir, 'projects');
const invoicesDir = path.join(uploadsDir, 'invoices');

[uploadsDir, projectsDir, invoicesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
  app.post('/api/upload', upload.single('file'), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    try {
      const category = req.body.category || '';
      const targetDir = category === 'projects' ? projectsDir : (category === 'invoices' ? invoicesDir : uploadsDir);
      
      const isImage = req.file.mimetype.startsWith('image/');
      const originalName = req.file.originalname;
      const extension = path.extname(originalName) || (isImage ? '.webp' : '');
      const baseName = path.basename(originalName, extension).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${baseName}_${Date.now()}${isImage ? '.webp' : extension}`;
      const filePath = path.join(targetDir, fileName);

      if (isImage) {
        await sharp(req.file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);
      } else {
        fs.writeFileSync(filePath, req.file.buffer);
      }

      const relativeUrl = category ? `/uploads/${category}/${fileName}` : `/uploads/${fileName}`;
      res.json({ url: relativeUrl, name: originalName });
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

  // Determinar se estamos em desenvolvimento ou produção
  const isDev = process.env.NODE_ENV === 'development';
  console.log(`Modo: ${isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);

  // Vite middleware for development
  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite não encontrado. Tentando rodar em modo produção...');
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function serveStatic(app: any) {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.error('ERRO: Pasta "dist" não encontrada. Execute "npm run build" primeiro.');
  }
}

startServer();
