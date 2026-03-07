import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// Middleware to check user role
const checkUser = (req: any, res: any, next: any) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
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

// 获取用户订单明细
router.get('/orders', (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: '未登录' });
    }

    // 获取用户的 RID
    const user = db.prepare('SELECT rid FROM users WHERE id = ?').get(userId);
    if (!user || !user.rid) {
      return res.json({ code: 200, msg: 'Success', data: [] });
    }

    const { page = 1, size = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(size);

    // 查询该用户 RID 的所有订单（处理浮点数格式的RID）
    const orders = db.prepare(`
      SELECT 
        order_id as orderId,
        parent_id as parentId,
        order_time as orderTime,
        finish_time as finishTime,
        union_id as unionId,
        product_id as skuId,
        product_name as skuName,
        shop_name as shopName,
        quantity as skuNum,
        return_quantity as skuReturnNum,
        frozen_quantity as skuFrozenNum,
        estimated_commission as estimateCosPrice,
        actual_commission as actualCosPrice,
        status as validCode,
        finish_time as payMonth,
        cp_act_id as cpActId,
        rid
      FROM orders
      WHERE CAST(rid AS INTEGER) = CAST(? AS INTEGER)
      ORDER BY order_time DESC
      LIMIT ? OFFSET ?
    `).all(user.rid, Number(size), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE CAST(rid AS INTEGER) = CAST(? AS INTEGER)').get(user.rid);

    res.json({
      code: 200,
      msg: 'Success',
      data: {
        list: orders,
        total: total.count,
        page: Number(page),
        size: Number(size)
      }
    });
  } catch (err: any) {
    console.error('Get user orders error:', err);
    res.status(500).json({ code: 500, msg: err.message || '获取订单失败' });
  }
});

// 获取商品看板
router.get('/product-stats', (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: '未登录' });
    }

    // 获取用户的 RID
    const user = db.prepare('SELECT rid FROM users WHERE id = ?').get(userId);
    if (!user || !user.rid) {
      return res.json({ code: 200, msg: 'Success', data: [] });
    }

    // 按商品ID聚合数据（处理浮点数格式的RID）
    const stats = db.prepare(`
      SELECT 
        CASE 
          WHEN owner = 'g' THEN main_sku_id
          ELSE product_id
        END as productId,
        product_name as productName,
        COUNT(DISTINCT order_id) as orderCount,
        SUM(quantity) as totalQuantity,
        SUM(estimated_commission) as totalEstimateCommission,
        SUM(actual_commission) as totalActualCommission
      FROM orders
      WHERE CAST(rid AS INTEGER) = CAST(? AS INTEGER)
      GROUP BY productId
      ORDER BY totalEstimateCommission DESC
    `).all(user.rid);

    // 计算服务费
    const result = stats.map((item: any) => {
      // 从商品表获取服务费比例
      const product = db.prepare('SELECT system_service_fee FROM products WHERE id = ?').get(item.productId);
      const serviceFeeRate = product?.system_service_fee || 0;

      return {
        ...item,
        estimateServiceFee: (item.totalEstimateCommission * serviceFeeRate / 100).toFixed(2),
        actualServiceFee: (item.totalActualCommission * serviceFeeRate / 100).toFixed(2)
      };
    });

    res.json({
      code: 200,
      msg: 'Success',
      data: result
    });
  } catch (err: any) {
    console.error('Get product stats error:', err);
    res.status(500).json({ code: 500, msg: err.message || '获取商品看板失败' });
  }
});

// 获取店铺看板
router.get('/shop-stats', (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: '未登录' });
    }

    // 获取用户的 RID
    const user = db.prepare('SELECT rid FROM users WHERE id = ?').get(userId);
    if (!user || !user.rid) {
      return res.json({ code: 200, msg: 'Success', data: [] });
    }

    // 按店铺ID聚合数据（处理浮点数格式的RID）
    const stats = db.prepare(`
      SELECT 
        shop_id as shopId,
        shop_name as shopName,
        COUNT(DISTINCT order_id) as orderCount,
        SUM(quantity) as totalQuantity,
        SUM(estimated_commission) as totalEstimateCommission,
        SUM(actual_commission) as totalActualCommission
      FROM orders
      WHERE CAST(rid AS INTEGER) = CAST(? AS INTEGER)
      GROUP BY shop_id
      ORDER BY totalEstimateCommission DESC
    `).all(user.rid);

    // 计算服务费（需要按订单逐个计算）
    const result = stats.map((item: any) => {
      const orders = db.prepare(`
        SELECT 
          product_id,
          estimated_commission,
          actual_commission
        FROM orders
        WHERE CAST(rid AS INTEGER) = CAST(? AS INTEGER) AND shop_id = ?
      `).all(user.rid, item.shopId);

      let estimateServiceFee = 0;
      let actualServiceFee = 0;

      orders.forEach((order: any) => {
        const product = db.prepare('SELECT system_service_fee FROM products WHERE id = ?').get(order.product_id);
        const serviceFeeRate = product?.system_service_fee || 0;
        
        estimateServiceFee += order.estimated_commission * serviceFeeRate / 100;
        actualServiceFee += order.actual_commission * serviceFeeRate / 100;
      });

      return {
        ...item,
        estimateServiceFee: estimateServiceFee.toFixed(2),
        actualServiceFee: actualServiceFee.toFixed(2)
      };
    });

    res.json({
      code: 200,
      msg: 'Success',
      data: result
    });
  } catch (err: any) {
    console.error('Get shop stats error:', err);
    res.status(500).json({ code: 500, msg: err.message || '获取店铺看板失败' });
  }
});

export default router;
