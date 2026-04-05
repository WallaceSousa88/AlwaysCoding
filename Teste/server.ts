import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { WebSocketServer, WebSocket } from 'ws';
import AdmZip from 'adm-zip';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use caminho absoluto para garantir que o DB fique sempre na pasta do projeto
const dbPath = path.join(__dirname, 'inventory.db');
let db = new Database(dbPath);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Opcional, mas recomendado para performance/confiabilidade em apps web
try {
  db.pragma('journal_mode = WAL');
} catch {}

// Initialize Database (APENAS SQL aqui dentro)
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'un',
      cost_price REAL DEFAULT 0,
      quantity REAL DEFAULT 0,
      min_quantity REAL,
      photo TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_product_name ON products(name);

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_cliente TEXT DEFAULT 'PF',
      name TEXT NOT NULL,
      cpf TEXT,
      rg TEXT,
      data_nascimento TEXT,
      razao_social TEXT,
      cnpj TEXT,
      nome_fantasia TEXT,
      ie TEXT,
      im TEXT,
      contato_responsavel TEXT,
      endereco TEXT,
      complemento TEXT,
      bairro TEXT,
      cep TEXT,
      cidade TEXT,
      telefone1 TEXT,
      telefone2 TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT DEFAULT 'PF',
      name TEXT,
      cpf TEXT,
      rg TEXT,
      data_nascimento TEXT,
      razao_social TEXT,
      cnpj TEXT,
      nome_fantasia TEXT,
      ie TEXT,
      im TEXT,
      contato_responsavel TEXT,
      endereco TEXT,
      complemento TEXT,
      bairro TEXT,
      cep TEXT,
      cidade TEXT,
      telefone1 TEXT,
      telefone2 TEXT,
      email TEXT,
      website TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      asset_number TEXT UNIQUE,
      category TEXT,
      purchase_date TEXT,
      purchase_value REAL,
      depreciation_type TEXT,
      depreciation_percentage REAL,
      photo TEXT,
      status TEXT DEFAULT 'ATIVO',
      disposal_type TEXT,
      disposal_date TEXT,
      disposal_value REAL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ORDENS DE PRODUÇÃO',
      client_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      type TEXT CHECK(type IN ('IN', 'OUT')),
      quantity REAL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      supplier_id INTEGER,
      doc_number TEXT,
      issue_date TEXT,
      location TEXT,
      unit_price REAL,
      reason TEXT,
      destination TEXT,
      xml TEXT,
      invoice_pdf TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migrations (para bancos antigos que não tinham colunas)
  try { db.exec("ALTER TABLE clients ADD COLUMN tipo_cliente TEXT DEFAULT 'PF'"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN cpf TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN rg TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN data_nascimento TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN razao_social TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN cnpj TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN nome_fantasia TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN ie TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN im TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN contato_responsavel TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN endereco TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN complemento TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN bairro TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN cep TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN cidade TEXT"); } catch {}
  try { db.exec("ALTER TABLE clients ADD COLUMN telefone1 TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN tipo TEXT DEFAULT 'PF'"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN cpf TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN rg TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN data_nascimento TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN razao_social TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN cnpj TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN nome_fantasia TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN ie TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN im TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN contato_responsavel TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN endereco TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN complemento TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN bairro TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN cep TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN cidade TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN telefone1 TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN telefone2 TEXT"); } catch {}
  try { db.exec("ALTER TABLE suppliers ADD COLUMN website TEXT"); } catch {}

  // Seed initial data if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)').run('Admin', 'admin@example.com', 'Admin');
    db.prepare('INSERT INTO locations (name) VALUES (?)').run('Almoxarifado Central');
    
    db.prepare('INSERT INTO units (name) VALUES (?)').run('UN');
    db.prepare('INSERT INTO units (name) VALUES (?)').run('MT');
    db.prepare('INSERT INTO units (name) VALUES (?)').run('KG');
    db.prepare('INSERT INTO units (name) VALUES (?)').run('PC');
    db.prepare('INSERT INTO units (name) VALUES (?)').run('CX');
  }
}

// WebSocket Server
let wss: WebSocketServer;
const clients = new Set<WebSocket>();

function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function logAction(userId: number, action: string, details: string) {
  try {
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)').run(userId, action, details);
    broadcast({ type: 'AUDIT_LOG_UPDATED' });
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

// Helper for async routes
const wrapAsync = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Middleware to convert all string inputs to uppercase (except specific fields)
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const excludeFields = ['photo', 'email', 'issue_date', 'date'];
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && !excludeFields.includes(key)) {
          req.body[key] = req.body[key].toUpperCase();
        }
      });
    }
    next();
  });

  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.get('/api/movements', wrapAsync((req: any, res: any) => {
    const movements = db.prepare(`
      SELECT m.*, strftime('%Y-%m-%dT%H:%M:%SZ', m.date) as date, p.name as product_name, s.name as supplier_name
      FROM movements m
      JOIN products p ON m.product_id = p.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      ORDER BY m.date DESC
    `).all();
    res.json(movements);
  }));

  app.get('/api/stats', wrapAsync((req: any, res: any) => {
    const totalProducts = db.prepare('SELECT count(*) as count FROM products').get() as any;
    const lowStock = db.prepare('SELECT count(*) as count FROM products WHERE quantity <= min_quantity').get() as any;
    const activeOrders = db.prepare("SELECT count(*) as count FROM orders WHERE status != 'CONCLUIDO'").get() as any;
    const totalInventoryValue = db.prepare('SELECT SUM(quantity * cost_price) as total FROM products').get() as any;
    
    const stockByCategory = db.prepare(`
      SELECT category, SUM(quantity * cost_price) as total_value
      FROM products
      GROUP BY category
      ORDER BY total_value DESC
    `).all();

    const topProducts = db.prepare(`
      SELECT name, quantity
      FROM products
      ORDER BY quantity DESC
      LIMIT 5
    `).all();

    const stockStatus = db.prepare(`
      SELECT 
        SUM(CASE WHEN quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN quantity > min_quantity OR min_quantity IS NULL THEN 1 ELSE 0 END) as normal_stock
      FROM products
    `).get() as any;

    const recentMovements = db.prepare(`
      SELECT m.*, strftime('%Y-%m-%dT%H:%M:%SZ', m.date) as date, p.name as product_name
      FROM movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.date DESC
      LIMIT 5
    `).all();

    res.json({
      totalProducts: totalProducts.count,
      lowStock: lowStock.count,
      activeOrders: activeOrders.count,
      totalInventoryValue: totalInventoryValue.total || 0,
      stockByCategory,
      topProducts,
      stockStatus: [
        { name: 'Estoque Baixo', value: stockStatus.low_stock || 0 },
        { name: 'Normal', value: stockStatus.normal_stock || 0 }
      ],
      recentMovements
    });
  }));

  app.get('/api/products', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM products').all());
  }));

  app.post('/api/products', upload.single('photo'), wrapAsync(async (req: any, res: any) => {
    const { name, category, unit, quantity, min_quantity } = req.body;
    const upperName = name?.toUpperCase();

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(upperName);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um produto cadastrado com este nome.' });
    }

    const upperCategory = category?.toUpperCase();
    const upperUnit = unit?.toUpperCase();
    let photo = null;

    if (req.file) {
      const sanitizedName = (upperName || 'product').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}_${Date.now()}.webp`;
      const filepath = path.join(uploadsDir, filename);
      
      await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toFile(filepath);
      
      photo = `/uploads/${filename}`;
    }

    const result = db.prepare(`
      INSERT INTO products (name, category, unit, quantity, min_quantity, photo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(upperName, upperCategory, upperUnit, quantity || 0, min_quantity === '' || min_quantity === undefined ? null : min_quantity, photo);

    logAction(1, 'CREATE_PRODUCT', `Produto: ${upperName}`);
    res.json({ id: result.lastInsertRowid });
  }));

  app.put('/api/products/:id', upload.single('photo'), wrapAsync(async (req: any, res: any) => {
    const { id } = req.params;
    const { name, category, unit, quantity, min_quantity } = req.body;
    const upperName = name?.toUpperCase();

    // Check for duplicate name (excluding current product)
    const existing = db.prepare('SELECT id FROM products WHERE name = ? AND id != ?').get(upperName, id);
    if (existing) {
      return res.status(400).json({ error: 'Já existe outro produto cadastrado com este nome.' });
    }

    const upperCategory = category?.toUpperCase();
    const upperUnit = unit?.toUpperCase();
    
    let photo = req.body.photo; // Keep existing if no new file
    
    if (req.file) {
      const sanitizedName = (upperName || 'product').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}_${Date.now()}.webp`;
      const filepath = path.join(uploadsDir, filename);
      
      await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toFile(filepath);
      
      photo = `/uploads/${filename}`;
    }

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, unit = ?, quantity = ?, min_quantity = ?, photo = ?
      WHERE id = ?
    `).run(upperName, upperCategory, upperUnit, quantity, min_quantity === '' || min_quantity === undefined ? null : min_quantity, photo, id);

    logAction(1, 'UPDATE_PRODUCT', `Produto ID: ${id}, Nome: ${upperName}`);
    broadcast({ type: 'INVENTORY_UPDATED' });
    res.json({ success: true });
  }));

  app.delete('/api/products/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;

    const movements = db.prepare('SELECT count(*) as count FROM movements WHERE product_id = ?').get(id) as { count: number };
    if (movements.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir um produto que possui movimentações de estoque.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    logAction(1, 'DELETE_PRODUCT', `Produto ID: ${id}`);
    broadcast({ type: 'INVENTORY_UPDATED' });
    res.json({ success: true });
  }));

  app.get('/api/products/:id/movements', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const movements = db.prepare(`
      SELECT m.*, strftime('%Y-%m-%dT%H:%M:%SZ', m.date) as date, s.name as supplier_name
      FROM movements m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.product_id = ?
      ORDER BY m.date DESC
    `).all(id);

    res.json(movements);
  }));

  app.get('/api/clients', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM clients').all());
  }));

  app.post('/api/clients', wrapAsync((req: any, res: any) => {
    const { 
      tipo_cliente, name, cpf, rg, data_nascimento, 
      razao_social, cnpj, nome_fantasia, ie, im, contato_responsavel,
      endereco, complemento, bairro, cep, cidade, telefone1, telefone2, email 
    } = req.body;
    
    const result = db.prepare(`
      INSERT INTO clients (
        tipo_cliente, name, cpf, rg, data_nascimento, 
        razao_social, cnpj, nome_fantasia, ie, im, contato_responsavel,
        endereco, complemento, bairro, cep, cidade, telefone1, telefone2, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tipo_cliente, name, cpf, rg, data_nascimento, 
      razao_social, cnpj, nome_fantasia, ie, im, contato_responsavel,
      endereco, complemento, bairro, cep, cidade, telefone1, telefone2, email
    );
    
    logAction(1, 'CREATE_CLIENT', `Cliente: ${name || razao_social}`);
    res.json({ id: result.lastInsertRowid });
  }));

  app.put('/api/clients/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const { 
      tipo_cliente, name, cpf, rg, data_nascimento, 
      razao_social, cnpj, nome_fantasia, ie, im, contato_responsavel,
      endereco, complemento, bairro, cep, cidade, telefone1, telefone2, email 
    } = req.body;
    
    db.prepare(`
      UPDATE clients SET 
        tipo_cliente = ?, name = ?, cpf = ?, rg = ?, data_nascimento = ?, 
        razao_social = ?, cnpj = ?, nome_fantasia = ?, ie = ?, im = ?, contato_responsavel = ?,
        endereco = ?, complemento = ?, bairro = ?, cep = ?, cidade = ?, telefone1 = ?, telefone2 = ?, email = ?
      WHERE id = ?
    `).run(
      tipo_cliente, name, cpf, rg, data_nascimento, 
      razao_social, cnpj, nome_fantasia, ie, im, contato_responsavel,
      endereco, complemento, bairro, cep, cidade, telefone1, telefone2, email,
      id
    );
    
    logAction(1, 'UPDATE_CLIENT', `Cliente ID: ${id}, Nome: ${name || razao_social}`);
    res.json({ success: true });
  }));

  app.delete('/api/clients/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    logAction(1, 'DELETE_CLIENT', `Cliente ID: ${id}`);
    res.json({ success: true });
  }));

  app.get('/api/suppliers', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM suppliers').all());
  }));

  app.post('/api/suppliers', wrapAsync((req: any, res: any) => {
    const supplierFields = [
      'tipo', 'name', 'cpf', 'rg', 'data_nascimento',
      'razao_social', 'cnpj', 'nome_fantasia', 'ie', 'im',
      'contato_responsavel', 'endereco', 'complemento', 'bairro',
      'cep', 'cidade', 'telefone1', 'telefone2', 'email', 'website'
    ];
    const data = req.body;
    const activeFields = supplierFields.filter(f => data[f] !== undefined);
    const placeholders = activeFields.map(() => '?').join(', ');
    const values = activeFields.map(f => data[f]);
    
    const result = db.prepare(`INSERT INTO suppliers (${activeFields.join(', ')}) VALUES (${placeholders})`).run(...values);
    logAction(1, 'CREATE_SUPPLIER', `Fornecedor: ${data.name || data.razao_social}`);
    res.json({ id: result.lastInsertRowid, ...data });
  }));

  app.put('/api/suppliers/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const supplierFields = [
      'tipo', 'name', 'cpf', 'rg', 'data_nascimento',
      'razao_social', 'cnpj', 'nome_fantasia', 'ie', 'im',
      'contato_responsavel', 'endereco', 'complemento', 'bairro',
      'cep', 'cidade', 'telefone1', 'telefone2', 'email', 'website'
    ];
    const data = req.body;
    const activeFields = supplierFields.filter(f => data[f] !== undefined);
    const setClause = activeFields.map(f => `${f} = ?`).join(', ');
    const values = activeFields.map(f => data[f]);
    
    db.prepare(`UPDATE suppliers SET ${setClause} WHERE id = ?`).run(...values, id);
    logAction(1, 'UPDATE_SUPPLIER', `Fornecedor ID: ${id}`);
    res.json({ success: true });
  }));

  app.delete('/api/suppliers/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    logAction(1, 'DELETE_SUPPLIER', `Fornecedor ID: ${id}`);
    res.json({ success: true });
  }));

  app.get('/api/locations', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM locations').all());
  }));

  app.get('/api/units', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM units').all());
  }));

  app.post('/api/locations', wrapAsync((req: any, res: any) => {
    const { name } = req.body;
    const result = db.prepare('INSERT INTO locations (name) VALUES (?)').run(name);
    logAction(1, 'CREATE_LOCATION', `Local: ${name}`);
    res.json({ id: result.lastInsertRowid, name });
  }));

  app.post('/api/units', wrapAsync((req: any, res: any) => {
    const { name } = req.body;
    const result = db.prepare('INSERT INTO units (name) VALUES (?)').run(name);
    logAction(1, 'CREATE_UNIT', `Unidade: ${name}`);
    res.json({ id: result.lastInsertRowid, name });
  }));

  app.put('/api/locations/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const { name } = req.body;
    db.prepare('UPDATE locations SET name = ? WHERE id = ?').run(name, id);
    logAction(1, 'UPDATE_LOCATION', `Local ID: ${id}, Nome: ${name}`);
    res.json({ success: true });
  }));

  app.get('/api/assets', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM assets').all());
  }));

  app.post('/api/assets', wrapAsync((req: any, res: any) => {
    const { name, code, status } = req.body;
    const result = db.prepare('INSERT INTO assets (name, code, status) VALUES (?, ?, ?)').run(name, code, status);
    logAction(1, 'CREATE_ASSET', `Patrimônio: ${name}, Código: ${code}`);
    res.json({ id: result.lastInsertRowid });
  }));

  app.put('/api/assets/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const { name, code, status } = req.body;
    db.prepare('UPDATE assets SET name = ?, code = ?, status = ? WHERE id = ?').run(name, code, status, id);
    logAction(1, 'UPDATE_ASSET', `Patrimônio ID: ${id}, Nome: ${name}`);
    res.json({ success: true });
  }));

  app.delete('/api/assets/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
    logAction(1, 'DELETE_ASSET', `Patrimônio ID: ${id}`);
    res.json({ success: true });
  }));

  app.get('/api/categories', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM categories').all());
  }));

  app.post('/api/categories', wrapAsync((req: any, res: any) => {
    const { name } = req.body;
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    logAction(1, 'CREATE_CATEGORY', `Categoria: ${name}`);
    res.json({ id: result.lastInsertRowid, name });
  }));

  app.put('/api/categories/:id', wrapAsync((req: any, res: any) => {
    const { id } = req.params;
    const { name } = req.body;
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    logAction(1, 'UPDATE_CATEGORY', `Categoria ID: ${id}, Nome: ${name}`);
    res.json({ success: true });
  }));

  app.post('/api/inventory/in', wrapAsync((req: any, res: any) => {
    const { product_id, quantity, supplier_id, doc_number, issue_date, location, unit_price, xml, invoice_pdf } = req.body;

    const transaction = db.transaction(() => {
      // Insert movement
      db.prepare(`
        INSERT INTO movements (product_id, type, quantity, supplier_id, doc_number, issue_date, location, unit_price, xml, invoice_pdf)
        VALUES (?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(product_id, quantity, supplier_id, doc_number, issue_date, location, unit_price, xml, invoice_pdf);

      // Calculate new average cost price
      const avgData = db.prepare(`
        SELECT AVG(unit_price) as avg_price 
        FROM movements 
        WHERE product_id = ? AND type = 'IN' AND unit_price > 0
      `).get(product_id) as { avg_price: number | null };

      const newAvgPrice = avgData.avg_price || unit_price;

      // Update product with new quantity and average cost price
      db.prepare('UPDATE products SET quantity = quantity + ?, cost_price = ? WHERE id = ?')
        .run(quantity, newAvgPrice, product_id);
    });

    transaction();
    logAction(1, 'STOCK_IN', `Produto ID: ${product_id}, Qtd: ${quantity}, Doc: ${doc_number}`);
    broadcast({ type: 'INVENTORY_UPDATED' });
    res.json({ success: true });
  }));

  app.post('/api/products/import', wrapAsync((req: any, res: any) => {
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: 'Dados do CSV não fornecidos' });

    const lines = csvData.split('\n');
    if (lines.length < 2) return res.status(400).json({ error: 'Arquivo CSV vazio ou sem dados' });

    const results: any[] = [];
    const errors: any[] = [];

    const transaction = db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by semicolon as requested
        const parts = line.split(';').map((p: string) => p.trim());
        if (parts.length < 3) {
          errors.push(`Linha ${i + 1}: Formato inválido (esperado: NOME;CATEGORIA;UNIDADE)`);
          continue;
        }

        const [name, category, unit] = parts;
        if (!name) {
          errors.push(`Linha ${i + 1}: Nome do produto é obrigatório`);
          continue;
        }

        const upperName = name.toUpperCase();
        const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(upperName);
        if (existing) {
          errors.push(`Linha ${i + 1} (${name}): Produto já cadastrado`);
          continue;
        }

        // Check/Create category
        const categoryName = category || 'SEM CATEGORIA';
        const categoryExists = db.prepare('SELECT id FROM categories WHERE name = ?').get(categoryName) as { id: number } | undefined;
        if (!categoryExists) {
          db.prepare('INSERT INTO categories (name) VALUES (?)').run(categoryName);
        }

        try {
          db.prepare('INSERT INTO products (name, category, unit, quantity, cost_price, min_quantity) VALUES (?, ?, ?, 0, 0, NULL)')
            .run(name, categoryName, unit || 'un');
          results.push({ name, category: categoryName, unit: unit || 'un' });
        } catch (err: any) {
          errors.push(`Linha ${i + 1} (${name}): ${err.message}`);
        }
      }
    });

    transaction();
    logAction(1, 'IMPORT_PRODUCTS', `Importados ${results.length} produtos via CSV`);
    broadcast({ type: 'INVENTORY_UPDATED' });
    res.json({ success: true, imported: results.length, errors });
  }));

  app.get('/api/financial/entries', wrapAsync((req: any, res: any) => {
    const entries = db.prepare(`
      SELECT m.*, strftime('%Y-%m-%dT%H:%M:%SZ', m.date) as date, p.name as product_name, s.name as supplier_name
      FROM movements m
      JOIN products p ON m.product_id = p.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.type = 'IN'
      ORDER BY m.issue_date DESC, m.date DESC
    `).all();
    res.json(entries);
  }));

  app.post('/api/inventory/out', wrapAsync((req: any, res: any) => {
    const { product_id, quantity, reason, destination } = req.body;

    const product = db.prepare('SELECT quantity FROM products WHERE id = ?').get(product_id) as any;
    if (!product || product.quantity < quantity) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO movements (product_id, type, quantity, reason, destination)
        VALUES (?, 'OUT', ?, ?, ?)
      `).run(product_id, quantity, reason, destination);

      db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?')
        .run(quantity, product_id);
    });

    transaction();
    logAction(1, 'STOCK_OUT', `Produto ID: ${product_id}, Qtd: ${quantity}, Motivo: ${reason}`);
    broadcast({ type: 'INVENTORY_UPDATED' });
    res.json({ success: true });
  }));

  // Assets API
  app.get('/api/assets', wrapAsync((req: any, res: any) => {
    res.json(db.prepare('SELECT * FROM assets').all());
  }));

  app.post('/api/assets', upload.single('photo'), wrapAsync(async (req: any, res: any) => {
    const { description, asset_number, category, purchase_date, purchase_value, depreciation_type, depreciation_percentage } = req.body;
    let photoPath = null;

    if (req.file) {
      const fileName = `asset_${Date.now()}.webp`;
      const filePath = path.join(uploadsDir, fileName);
      await sharp(req.file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
      photoPath = `/uploads/${fileName}`;
    }

    const result = db.prepare(`
      INSERT INTO assets (description, asset_number, category, purchase_date, purchase_value, depreciation_type, depreciation_percentage, photo, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO')
    `).run(description, asset_number, category, purchase_date, purchase_value, depreciation_type, depreciation_percentage, photoPath);

    logAction(1, 'CREATE_ASSET', `Patrimônio: ${description}`);
    broadcast({ type: 'ASSETS_UPDATED' });
    res.json({ id: result.lastInsertRowid });
  }));

  app.put('/api/assets/:id', upload.single('photo'), wrapAsync(async (req: any, res: any) => {
    const { description, asset_number, category, purchase_date, purchase_value, depreciation_type, depreciation_percentage, photo } = req.body;
    let photoPath = photo;

    if (req.file) {
      const fileName = `asset_${Date.now()}.webp`;
      const filePath = path.join(uploadsDir, fileName);
      await sharp(req.file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
      photoPath = `/uploads/${fileName}`;
    }

    db.prepare(`
      UPDATE assets
      SET description = ?, asset_number = ?, category = ?, purchase_date = ?, purchase_value = ?, depreciation_type = ?, depreciation_percentage = ?, photo = ?
      WHERE id = ?
    `).run(description, asset_number, category, purchase_date, purchase_value, depreciation_type, depreciation_percentage, photoPath, req.params.id);

    logAction(1, 'UPDATE_ASSET', `Patrimônio ID: ${req.params.id}`);
    broadcast({ type: 'ASSETS_UPDATED' });
    res.json({ success: true });
  }));

  app.post('/api/assets/:id/disposal', wrapAsync((req: any, res: any) => {
    const { disposal_type, disposal_date, disposal_value } = req.body;
    db.prepare(`
      UPDATE assets
      SET status = 'BAIXADO', disposal_type = ?, disposal_date = ?, disposal_value = ?
      WHERE id = ?
    `).run(disposal_type, disposal_date, disposal_value, req.params.id);

    logAction(1, 'ASSET_DISPOSAL', `Baixa Patrimônio ID: ${req.params.id}, Tipo: ${disposal_type}`);
    broadcast({ type: 'ASSETS_UPDATED' });
    res.json({ success: true });
  }));

  app.delete('/api/assets/:id', wrapAsync((req: any, res: any) => {
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    logAction(1, 'DELETE_ASSET', `Patrimônio ID: ${req.params.id}`);
    broadcast({ type: 'ASSETS_UPDATED' });
    res.json({ success: true });
  }));

  app.get('/api/orders', wrapAsync((req: any, res: any) => {
    res.json(
      db.prepare("SELECT o.*, strftime('%Y-%m-%dT%H:%M:%SZ', o.created_at) as created_at, c.name as client_name FROM orders o LEFT JOIN clients c ON o.client_id = c.id").all()
    );
  }));

  app.post('/api/orders', wrapAsync((req: any, res: any) => {
    const { title, description, client_id, status, details } = req.body;
    const detailsString = typeof details === 'string' ? details : (details ? JSON.stringify(details) : null);
    
    const result = db.prepare(`
      INSERT INTO orders (title, description, client_id, status, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, client_id, status || 'ORDENS DE PRODUÇÃO', detailsString);
    
    logAction(1, 'CREATE_ORDER', `Ordem: ${title}`);
    broadcast({ type: 'ORDER_UPDATED' });
    res.json({ id: result.lastInsertRowid });
  }));

  app.put('/api/orders/:id', wrapAsync((req: any, res: any) => {
    const { title, description, client_id, status, details } = req.body;
    const oldOrder = db.prepare('SELECT details FROM orders WHERE id = ?').get(req.params.id) as { details: string } | undefined;
    
    const detailsString = typeof details === 'string' ? details : (details ? JSON.stringify(details) : null);
    const detailsObj = typeof details === 'string' ? (details ? JSON.parse(details) : null) : details;

    db.prepare(`
      UPDATE orders
      SET title = ?, description = ?, client_id = ?, status = ?, details = ?
      WHERE id = ?
    `).run(title, description, client_id, status, detailsString, req.params.id);
    
    // Check if a checklist item was completed
    if (oldOrder && detailsObj && detailsObj.completed_items) {
      try {
        const oldDetails = oldOrder.details ? JSON.parse(oldOrder.details) : {};
        const oldCompleted = oldDetails.completed_items || [];
        const newCompleted = detailsObj.completed_items || [];
        
        if (newCompleted.length > oldCompleted.length) {
          const added = newCompleted.filter((item: string) => !oldCompleted.includes(item));
          added.forEach((item: string) => {
            const [section, itemName] = item.split('|');
            logAction(1, 'CHECKLIST_COMPLETED', `Ordem ID: ${req.params.id}, Item: ${itemName} (${section})`);
          });
        } else {
          logAction(1, 'UPDATE_ORDER', `Ordem ID: ${req.params.id}`);
        }
      } catch (e) {
        logAction(1, 'UPDATE_ORDER', `Ordem ID: ${req.params.id}`);
      }
    } else {
      logAction(1, 'UPDATE_ORDER', `Ordem ID: ${req.params.id}`);
    }

    broadcast({ type: 'ORDER_UPDATED' });
    res.json({ success: true });
  }));

  app.delete('/api/orders/:id', wrapAsync((req: any, res: any) => {
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    logAction(1, 'DELETE_ORDER', `Ordem ID: ${req.params.id}`);
    broadcast({ type: 'ORDER_UPDATED' });
    res.json({ success: true });
  }));

  app.patch('/api/orders/:id', wrapAsync((req: any, res: any) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    logAction(1, 'UPDATE_ORDER_STATUS', `Ordem ID: ${req.params.id}, Status: ${status}`);
    broadcast({ type: 'ORDER_UPDATED', id: req.params.id, status });
    res.json({ success: true });
  }));

  app.get('/api/backup', wrapAsync((req: any, res: any) => {
    const zip = new AdmZip();
    // Adiciona o arquivo do banco ao ZIP
    zip.addLocalFile(dbPath);
    
    // Adiciona a pasta de uploads ao ZIP se ela existir
    if (fs.existsSync(uploadsDir)) {
      zip.addLocalFolder(uploadsDir, 'uploads');
    }
    
    const buffer = zip.toBuffer();
    const fileName = `backup_skysmart_${new Date().toISOString().split('T')[0]}.zip`;
    
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);
    
    logAction(1, 'DATABASE_BACKUP', 'Backup do banco de dados realizado');
  }));

  app.post('/api/restore', upload.single('backup'), wrapAsync(async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo de backup não fornecido' });

    try {
      const zip = new AdmZip(req.file.buffer);
      const zipEntries = zip.getEntries();
      
      // Verifica se o ZIP contém o arquivo do banco
      const hasDbFile = zipEntries.some(entry => entry.entryName === 'inventory.db');
      if (!hasDbFile) {
        return res.status(400).json({ error: 'Arquivo de backup inválido (inventory.db não encontrado)' });
      }

      // Fecha a conexão atual
      db.close();

      // Extrai os arquivos
      // Para o banco de dados, extraímos para o diretório raiz
      zip.extractEntryTo('inventory.db', __dirname, false, true);
      
      // Para a pasta de uploads, extraímos se existir no ZIP
      const hasUploads = zipEntries.some(entry => entry.entryName.startsWith('uploads/'));
      if (hasUploads) {
        zip.extractEntryTo('uploads/', __dirname, true, true);
      }

      // Reabre a conexão
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');

      logAction(1, 'DATABASE_RESTORE', 'Restauração do banco de dados realizada via importação');
      broadcast({ type: 'DATABASE_RESTORED' });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Erro na restauração:', error);
      // Tenta reabrir a conexão se falhou no meio
      try {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
      } catch {}
      res.status(500).json({ error: 'Erro ao restaurar banco de dados: ' + error.message });
    }
  }));

  app.get('/api/audit-logs', wrapAsync((req: any, res: any) => {
    const logs = db.prepare(`
      SELECT al.*, strftime('%Y-%m-%dT%H:%M:%SZ', al.created_at) as created_at, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  }));

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Ocorreu um erro interno no servidor.' 
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

startServer();
