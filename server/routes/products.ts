import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, size = 20, category, minCommission, maxCommission, minService, maxService, sort } = req.query;
  
  let query = 'SELECT * FROM products WHERE status = "active"';
  const params: any[] = [];

  if (minCommission) {
    query += ' AND commission_rate >= ?';
    params.push(minCommission);
  }
  if (maxCommission) {
    query += ' AND commission_rate <= ?';
    params.push(maxCommission);
  }
  
  if (sort === 'commission_desc') {
    query += ' ORDER BY commission_rate DESC';
  } else if (sort === 'service_desc') {
    query += ' ORDER BY system_service_fee DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const offset = (Number(page) - 1) * Number(size);
  query += ` LIMIT ? OFFSET ?`;
  params.push(Number(size), offset);

  const stmt = db.prepare(query);
  const products = stmt.all(...params);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM products WHERE status = "active"');
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

router.post('/convert', (req, res) => {
  const { url, type } = req.body;
  // In a real app, this would call JD Union API to generate a custom link
  // For this demo, we'll mock the conversion
  
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });

  // Fetch product to get promotion copy
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(url) as any;

  // Mock JD link generation
  const mockLink = `https://u.jd.com/${Math.random().toString(36).substring(7)}`;
  
  let content = mockLink;
  if (type === 'all') {
    if (product && product.promotion_copy) {
      content = `${product.promotion_copy}\n抢购链接：${mockLink}`;
    } else {
      content = `【京东】超级好物推荐\n券后价：${product ? product.price : '9.9'}元\n抢购链接：${mockLink}`;
    }
  }
  
  res.json({
    code: 200,
    msg: 'Success',
    data: {
      url: mockLink,
      content
    }
  });
});

export default router;
