import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', (req, res) => {
  const { phone, code, password } = req.body;

  // In a real app, verify SMS code or password here
  // For this demo, we'll just check if the user exists or create them
  
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user) {
    if (phone === 'admin') {
      // Super admin is created in initDb
      return res.status(401).json({ code: 401, msg: 'Invalid credentials' });
    }
    // Auto-register for demo purposes
    const stmt = db.prepare('INSERT INTO users (phone, nickname, status) VALUES (?, ?, ?)');
    const info = stmt.run(phone, `User_${phone.substring(7)}`, 'pending');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  if (user.status === 'blacklisted') {
    return res.status(403).json({ code: 403, msg: 'Account is blacklisted' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
        rid: user.rid
      }
    }
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ code: 404, msg: 'User not found' });
    if (user.status === 'blacklisted') return res.status(403).json({ code: 403, msg: 'Account is blacklisted' });
    
    // Remove sensitive info (password if we had one)

    res.json({ code: 200, msg: 'Success', data: user });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(401).json({ code: 401, msg: 'Invalid token' });
  }
});

router.put('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { nickname, wechat, jd_union_id } = req.body;
    
    const stmt = db.prepare(`
      UPDATE users 
      SET nickname = ?, wechat = ?, jd_union_id = ?, status = 'pending', reject_reason = NULL
      WHERE id = ?
    `);
    stmt.run(nickname, wechat, jd_union_id, decoded.id);

    res.json({ code: 200, msg: 'Profile updated, waiting for admin approval' });
  } catch (err) {
    console.error('Error in /profile:', err);
    res.status(500).json({ code: 500, msg: 'Internal server error' });
  }
});

export default router;
