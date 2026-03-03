import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, size = 20 } = req.query;
  
  const query = 'SELECT * FROM activities WHERE status = \'active\' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(size);
  
  const stmt = db.prepare(query);
  const activities = stmt.all(Number(size), offset);

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM activities WHERE status = \'active\'');
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

export default router;
