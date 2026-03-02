import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ code: 403, msg: 'Forbidden' });
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ code: 401, msg: 'Invalid token' });
  }
};

router.use(checkAdmin);

// Dashboard stats
router.get('/dashboard', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const pendingUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "pending"').get().count;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const activeProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = "active"').get().count;
  
  res.json({
    code: 200,
    msg: 'Success',
    data: {
      totalUsers,
      pendingUsers,
      totalProducts,
      activeProducts,
      totalActivities: 0,
      activeActivities: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalServiceFee: 0
    }
  });
});

// Users
router.get('/users', (req, res) => {
  try {
    const { page = 1, size = 20, status } = req.query;
    
    let query = 'SELECT * FROM users WHERE role = \'user\'';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(size);
    params.push(Number(size), offset);

    const stmt = db.prepare(query);
    const users = stmt.all(...params);

    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = \'user\'';
    const countParams: any[] = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const countStmt = db.prepare(countQuery);
    const total = countStmt.get(...countParams).total;

    res.json({
      code: 200,
      msg: 'Success',
      data: {
        list: users,
        total,
        page: Number(page),
        size: Number(size)
      }
    });
  } catch (err: any) {
    console.error('Error in /admin/users:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

router.put('/users/:id/approve', (req, res) => {
  try {
    if ((req as any).user.role !== 'super_admin' && (req as any).user.role !== 'admin') return res.status(403).json({ code: 403, msg: 'Forbidden' });
    
    const { id } = req.params;
    const { rid } = req.body;
    
    const stmt = db.prepare('UPDATE users SET status = "normal", rid = ? WHERE id = ?');
    stmt.run(rid, id);
    
    res.json({ code: 200, msg: 'User approved' });
  } catch (err: any) {
    console.error('Error approving user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

router.put('/users/:id/reject', (req, res) => {
  try {
    if ((req as any).user.role !== 'super_admin' && (req as any).user.role !== 'admin') return res.status(403).json({ code: 403, msg: 'Forbidden' });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    const stmt = db.prepare('UPDATE users SET status = "rejected", reject_reason = ? WHERE id = ?');
    stmt.run(reason, id);
    
    res.json({ code: 200, msg: 'User rejected' });
  } catch (err: any) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Products
router.get('/products/jd-info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://item.jd.com/${id}.html`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text().replace('【行情 报价 价格 评测】-京东', '').trim();
    
    res.json({ code: 200, msg: 'Success', data: { title } });
  } catch (err) {
    console.error('Error fetching JD info:', err);
    res.status(500).json({ code: 500, msg: 'Failed to fetch JD info' });
  }
});

router.get('/products', (req, res) => {
  const { page = 1, size = 20 } = req.query;
  
  const query = 'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(size);
  
  const stmt = db.prepare(query);
  const products = stmt.all(Number(size), offset);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM products');
  const total = countStmt.get().total;

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      list: products,
      total,
      page: Number(page),
      size: Number(size)
    }
  });
});

router.post('/products', (req, res) => {
  const { id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO products (id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, source, promotion_copy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?)
  `);
  
  stmt.run(id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy);
  
  res.json({ code: 200, msg: 'Product added' });
});

router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy } = req.body;
    
    const stmt = db.prepare(`
      UPDATE products 
      SET title = ?, shop_name = ?, original_price = ?, price = ?, commission_rate = ?, system_service_fee = ?, start_time = ?, end_time = ?, memo = ?, promotion_copy = ?
      WHERE id = ?
    `);
    
    stmt.run(title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy, id);
    
    res.json({ code: 200, msg: 'Product updated' });
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

router.put('/products/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const stmt = db.prepare('UPDATE products SET status = ? WHERE id = ?');
    stmt.run(status, id);
    
    res.json({ code: 200, msg: 'Product status updated' });
  } catch (err: any) {
    console.error('Error updating product status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Activities
router.get('/activities', (req, res) => {
  const { page = 1, size = 20 } = req.query;
  
  const query = 'SELECT * FROM activities ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(size);
  
  const stmt = db.prepare(query);
  const activities = stmt.all(Number(size), offset);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM activities');
  const total = countStmt.get().total;

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      list: activities,
      total,
      page: Number(page),
      size: Number(size)
    }
  });
});

router.post('/activities', (req, res) => {
  const { name, url, avg_commission_rate, avg_system_service_fee, custom_service_rate, start_time, end_time, subsidy, content, image_url, memo } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO activities (name, url, avg_commission_rate, avg_system_service_fee, custom_service_rate, start_time, end_time, subsidy, content, image_url, memo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(name, url, avg_commission_rate, avg_system_service_fee, custom_service_rate, start_time, end_time, subsidy, content, image_url, memo);
  
  res.json({ code: 200, msg: 'Activity added' });
});

// Orders
router.get('/orders', (req, res) => {
  const { page = 1, size = 20 } = req.query;
  
  const query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(size);
  
  const stmt = db.prepare(query);
  const orders = stmt.all(Number(size), offset);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM orders');
  const total = countStmt.get().total;

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      list: orders,
      total,
      page: Number(page),
      size: Number(size)
    }
  });
});

// Settlements
router.get('/settlements', (req, res) => {
  const { page = 1, size = 20 } = req.query;
  
  const query = 'SELECT * FROM settlements ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(size);
  
  const stmt = db.prepare(query);
  const settlements = stmt.all(Number(size), offset);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM settlements');
  const total = countStmt.get().total;

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      list: settlements,
      total,
      page: Number(page),
      size: Number(size)
    }
  });
});

export default router;
