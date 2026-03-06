import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to check user role
const checkUser = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ code: 401, msg: 'Invalid token' });
  }
};

router.use(checkUser);

// Get user stats
router.get('/stats', (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    // Get user's rid
    const userStmt = db.prepare('SELECT rid FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { rid: string } | undefined;
    
    if (!user || !user.rid) {
      return res.json({
        code: 200,
        msg: 'Success',
        data: {
          today_clicks: 0,
          today_orders: 0,
          today_commission: 0,
          month_commission: 0,
        }
      });
    }

    const rid = user.rid;
    
    // Get today's start and end time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString().replace('T', ' ').substring(0, 19);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString().replace('T', ' ').substring(0, 19);

    // Get month's start and end time
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().replace('T', ' ').substring(0, 19);

    // Today's orders count
    const todayOrdersStmt = db.prepare('SELECT COUNT(*) as count FROM orders WHERE rid = ? AND order_time >= ? AND order_time < ?');
    const todayOrders = (todayOrdersStmt.get(rid, todayStart, todayEnd) as any).count;

    // Today's estimated commission (for user, it's their split of the service fee or actual commission? Let's assume they get a split of the service fee)
    // Actually, the prompt says "预估佣金" (estimated commission). Let's just sum estimated_commission for now, or maybe estimated_service_fee.
    // The user is a group leader (团长), so they get the service fee.
    const todayCommStmt = db.prepare('SELECT SUM(estimated_service_fee) as total FROM orders WHERE rid = ? AND order_time >= ? AND order_time < ? AND status != \'invalid\' AND status != \'refunded\'');
    const todayComm = (todayCommStmt.get(rid, todayStart, todayEnd) as any).total || 0;

    // Month's estimated commission
    const monthCommStmt = db.prepare('SELECT SUM(estimated_service_fee) as total FROM orders WHERE rid = ? AND order_time >= ? AND status != \'invalid\' AND status != \'refunded\'');
    const monthComm = (monthCommStmt.get(rid, monthStartStr) as any).total || 0;

    res.json({
      code: 200,
      msg: 'Success',
      data: {
        today_clicks: 0, // We don't track clicks yet
        today_orders: todayOrders,
        today_commission: todayComm,
        month_commission: monthComm,
      }
    });
  } catch (err: any) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ code: 500, msg: 'Server error' });
  }
});

// Get user orders
router.get('/orders', (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { page = 1, size = 10 } = req.query;
    
    // Get user's rid
    const userStmt = db.prepare('SELECT rid FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { rid: string } | undefined;
    
    if (!user || !user.rid) {
      return res.json({
        code: 200,
        msg: 'Success',
        data: {
          list: [],
          total: 0,
          page: Number(page),
          size: Number(size)
        }
      });
    }

    const rid = user.rid;
    
    const query = 'SELECT * FROM orders WHERE rid = ? ORDER BY order_time DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(size);
    
    const stmt = db.prepare(query);
    const orders = stmt.all(rid, Number(size), offset);

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM orders WHERE rid = ?');
    const total = (countStmt.get(rid) as any).total;

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
  } catch (err: any) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ code: 500, msg: 'Server error' });
  }
});

export default router;
