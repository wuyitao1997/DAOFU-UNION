import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { callJdApi } from '../utils/jdApi.js';

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
  const pendingUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = \'pending\'').get().count;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const activeProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = \'active\'').get().count;
  
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
    
    if (!rid || !/^\d{5}$/.test(rid)) {
      return res.status(400).json({ code: 400, msg: 'RID必须是5位纯数字' });
    }

    // Check if RID is unique
    const existing = db.prepare('SELECT id FROM users WHERE rid = ? AND id != ?').get(rid, id);
    if (existing) {
      return res.status(400).json({ code: 400, msg: '该RID已被分配，请使用其他RID' });
    }
    
    const stmt = db.prepare('UPDATE users SET status = \'normal\', rid = ? WHERE id = ?');
    stmt.run(rid, id);
    
    res.json({ code: 200, msg: 'User approved' });
  } catch (err: any) {
    console.error('Error approving user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

router.put('/users/:id/rid', (req, res) => {
  try {
    if ((req as any).user.role !== 'super_admin' && (req as any).user.role !== 'admin') return res.status(403).json({ code: 403, msg: 'Forbidden' });
    
    const { id } = req.params;
    const { rid } = req.body;
    
    if (!rid || !/^\d{5}$/.test(rid)) {
      return res.status(400).json({ code: 400, msg: 'RID必须是5位纯数字' });
    }

    // Check if RID is unique
    const existing = db.prepare('SELECT id FROM users WHERE rid = ? AND id != ?').get(rid, id);
    if (existing) {
      return res.status(400).json({ code: 400, msg: '该RID已被分配，请使用其他RID' });
    }
    
    const stmt = db.prepare('UPDATE users SET rid = ? WHERE id = ?');
    stmt.run(rid, id);
    
    res.json({ code: 200, msg: 'RID updated successfully' });
  } catch (err: any) {
    console.error('Error updating user RID:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

router.put('/users/:id/reject', (req, res) => {
  try {
    if ((req as any).user.role !== 'super_admin' && (req as any).user.role !== 'admin') return res.status(403).json({ code: 403, msg: 'Forbidden' });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    const stmt = db.prepare('UPDATE users SET status = \'rejected\', reject_reason = ? WHERE id = ?');
    stmt.run(reason, id);
    
    res.json({ code: 200, msg: 'User rejected' });
  } catch (err: any) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Products
router.get('/products/jd-info/:id', async (req, res) => {
  console.log('Received request for JD info:', req.params.id);
  try {
    const { id } = req.params;
    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      return res.status(500).json({ code: 500, msg: '系统未配置京东联盟API密钥' });
    }

    // 使用 jd.union.open.goods.bigfield.query 接口
    const paramJson = {
      goodsReq: {
        skuIds: [Number(id)],
        sceneId: 2  // 使用SKU ID查询，需要权限
      }
    };

    const jdRes = await callJdApi('jd.union.open.goods.bigfield.query', paramJson, appKey, appSecret);
    
    const responseKey = 'jd_union_open_goods_bigfield_query_responce';
    if (!jdRes[responseKey] || !jdRes[responseKey].queryResult) {
       console.error('JD API Error:', jdRes);
       return res.status(500).json({ code: 500, msg: '获取京东商品信息失败', details: jdRes });
    }

    const resultStr = jdRes[responseKey].queryResult;
    const resultObj = JSON.parse(resultStr);

    if (resultObj.code === 403) {
       return res.status(403).json({ code: 403, msg: '京东联盟API无访问权限，请在京东联盟控制台申请【商品详情查询】权限。', details: resultObj.message });
    }

    if (resultObj.code !== 200 || !resultObj.data || resultObj.data.length === 0) {
       return res.status(500).json({ code: 500, msg: resultObj.message || '未找到该商品信息' });
    }

    const goodsInfo = resultObj.data[0];
    
    // 提取字段（bigfield接口字段结构不同）
    const title = goodsInfo.skuName;
    const image_url = goodsInfo.imageInfo?.imageList?.[0]?.url;
    const price = goodsInfo.priceInfo?.price;
    const commission_rate = goodsInfo.commissionInfo?.commissionShare || 0;
    const service_rate = goodsInfo.commissionInfo?.plusCommissionShare || 0;
    const start_time = goodsInfo.commissionInfo?.startTime || null;
    const end_time = goodsInfo.commissionInfo?.endTime || null;
    
    res.json({ 
      code: 200, 
      msg: 'Success', 
      data: { 
        title, 
        image_url,
        price,
        commission_rate,
        service_rate,
        start_time,
        end_time
      } 
    });
  } catch (err: any) {
    console.error('Error fetching JD info:', err);
    res.status(500).json({ code: 500, msg: err.message || 'Failed to fetch JD info' });
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
  const { id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy, image_url } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO products (id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, source, promotion_copy, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)
  `);
  
  stmt.run(id, title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy, image_url);
  
  res.json({ code: 200, msg: 'Product added' });
});

router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy, image_url } = req.body;
    
    const stmt = db.prepare(`
      UPDATE products 
      SET title = ?, shop_name = ?, original_price = ?, price = ?, commission_rate = ?, system_service_fee = ?, start_time = ?, end_time = ?, memo = ?, promotion_copy = ?, image_url = ?
      WHERE id = ?
    `);
    
    stmt.run(title, shop_name, original_price, price, commission_rate, system_service_fee, start_time, end_time, memo, promotion_copy, image_url, id);
    
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

router.delete('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists and is inactive
    const product = db.prepare('SELECT status FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ code: 404, msg: 'Product not found' });
    }
    
    if (product.status !== 'inactive') {
      return res.status(400).json({ code: 400, msg: 'Only inactive products can be deleted' });
    }
    
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    
    res.json({ code: 200, msg: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
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

const syncOrdersJob = async () => {
  try {
    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      console.log('Auto-sync skipped: JD API keys not configured');
      return;
    }

    // Default to last 20 minutes for auto-sync
    const now = new Date();
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60000);
    
    const formatTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const startTime = formatTime(twentyMinsAgo);
    const endTime = formatTime(now);

    let pageIndex = 1;
    let hasMore = true;
    let totalSynced = 0;

    const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const upsertOrderStmt = db.prepare(`
      INSERT INTO orders (
        order_id, parent_id, product_id, product_name, shop_id, shop_name, status, 
        order_time, finish_time, rid, union_id, product_type, 
        estimated_commission, actual_commission, estimated_service_fee, actual_service_fee, 
        service_fee_rate, split_rate, quantity, return_quantity, frozen_quantity, 
        cp_act_id, owner, main_sku_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET
        status = excluded.status,
        finish_time = excluded.finish_time,
        estimated_commission = excluded.estimated_commission,
        actual_commission = excluded.actual_commission,
        estimated_service_fee = excluded.estimated_service_fee,
        actual_service_fee = excluded.actual_service_fee,
        return_quantity = excluded.return_quantity,
        frozen_quantity = excluded.frozen_quantity
    `);

    while (hasMore) {
      const paramJson = {
        orderReq: {
          pageIndex,
          pageSize: 500,
          type: 3, // 3: Update time
          startTime,
          endTime
        }
      };

      const jdRes = await callJdApi('jd.union.open.order.row.query', paramJson, appKey, appSecret);
      const responseKey = 'jd_union_open_order_row_query_responce';
      
      if (!jdRes[responseKey] || !jdRes[responseKey].queryResult) {
        console.error('Auto-sync JD API Error:', jdRes);
        return;
      }

      const resultStr = jdRes[responseKey].queryResult;
      const resultObj = JSON.parse(resultStr);

      if (resultObj.code !== 200) {
        console.error('Auto-sync JD API Error:', resultObj.message);
        return;
      }

      const orders = resultObj.data || [];
      
      for (const order of orders) {
        const rid = order.ext1 || '';
        
        let status = 'invalid';
        if (order.validCode === 16) status = 'paid';
        else if (order.validCode === 17) status = 'completed';
        else if (order.validCode === 18) status = 'refunded';

        const product = getProductStmt.get(order.skuId);
        let serviceFeeRate = 0;
        let estimatedServiceFee = 0;
        let actualServiceFee = 0;
        
        if (product) {
          serviceFeeRate = product.system_service_fee || 0;
          estimatedServiceFee = (order.estimateCosPrice * serviceFeeRate) / 100;
          actualServiceFee = ((order.actualCosPrice || 0) * serviceFeeRate) / 100;
        }

        const mainSkuId = order.owner === 'g' 
          ? (order.mainSkuId ? order.mainSkuId.toString() : order.skuId.toString())
          : (order.productId ? order.productId.toString() : order.skuId.toString());

        upsertOrderStmt.run(
          order.orderId ? order.orderId.toString() : '',
          order.parentId ? order.parentId.toString() : null,
          order.skuId ? order.skuId.toString() : '',
          order.skuName || '',
          order.shopId ? order.shopId.toString() : null,
          order.shopName || '',
          status,
          order.orderTime || null,
          order.finishTime || null,
          rid,
          order.unionId ? order.unionId.toString() : null,
          'jd',
          order.estimateFee || 0,
          order.actualFee || 0,
          estimatedServiceFee,
          actualServiceFee,
          serviceFeeRate,
          0,
          order.skuNum || 1,
          order.skuReturnNum || 0,
          order.skuFrozenNum || 0,
          order.cpActId ? order.cpActId.toString() : null,
          order.owner || '',
          mainSkuId
        );
        totalSynced++;
      }

      if (orders.length < 500) {
        hasMore = false;
      } else {
        pageIndex++;
      }
    }
    console.log(`Auto-sync completed: ${totalSynced} orders synced.`);
  } catch (err) {
    console.error('Error in auto-sync orders:', err);
  }
};

// Start cron job (every 10 minutes)
setInterval(syncOrdersJob, 10 * 60 * 1000);

router.post('/orders/sync', async (req, res) => {
  try {
    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      return res.status(500).json({ code: 500, msg: '系统未配置京东联盟API密钥' });
    }

    // Default to last 30 minutes if not provided
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000);
    
    const formatTime = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const startTime = req.body.startTime || formatTime(thirtyMinsAgo);
    const endTime = req.body.endTime || formatTime(now);

    let pageIndex = 1;
    let hasMore = true;
    let totalSynced = 0;

    const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const upsertOrderStmt = db.prepare(`
      INSERT INTO orders (
        order_id, parent_id, product_id, product_name, shop_id, shop_name, status, 
        order_time, finish_time, rid, union_id, product_type, 
        estimated_commission, actual_commission, estimated_service_fee, actual_service_fee, 
        service_fee_rate, split_rate, quantity, return_quantity, frozen_quantity, 
        cp_act_id, owner, main_sku_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_id) DO UPDATE SET
        status = excluded.status,
        finish_time = excluded.finish_time,
        estimated_commission = excluded.estimated_commission,
        actual_commission = excluded.actual_commission,
        estimated_service_fee = excluded.estimated_service_fee,
        actual_service_fee = excluded.actual_service_fee,
        return_quantity = excluded.return_quantity,
        frozen_quantity = excluded.frozen_quantity
    `);

    while (hasMore) {
      const paramJson = {
        orderReq: {
          pageIndex,
          pageSize: 500,
          type: 3, // 3: Update time
          startTime,
          endTime
        }
      };

      const jdRes = await callJdApi('jd.union.open.order.row.query', paramJson, appKey, appSecret);
      const responseKey = 'jd_union_open_order_row_query_responce';
      
      if (!jdRes[responseKey] || !jdRes[responseKey].getResult) {
        console.error('JD API Error:', jdRes);
        return res.status(500).json({ code: 500, msg: '获取京东订单失败' });
      }

      const resultStr = jdRes[responseKey].getResult;
      const resultObj = JSON.parse(resultStr);

      if (resultObj.code !== 200) {
        return res.status(500).json({ code: 500, msg: resultObj.message || '获取京东订单失败' });
      }

      const orders = resultObj.data || [];
      
      for (const order of orders) {
        const rid = order.ext1 || '';
        
        // Map JD order status
        // validCode: 15.待付款,16.已付款,17.已完成,18.已退款
        let status = 'invalid';
        if (order.validCode === 16) status = 'paid';
        else if (order.validCode === 17) status = 'completed';
        else if (order.validCode === 18) status = 'refunded';

        // Calculate fees based on product info
        const product = getProductStmt.get(order.skuId);
        let serviceFeeRate = 0;
        let estimatedServiceFee = 0;
        let actualServiceFee = 0;
        
        if (product) {
          serviceFeeRate = product.system_service_fee || 0;
          estimatedServiceFee = (order.estimateCosPrice * serviceFeeRate) / 100;
          actualServiceFee = ((order.actualCosPrice || 0) * serviceFeeRate) / 100;
        }

        const mainSkuId = order.owner === 'g' 
          ? (order.mainSkuId ? order.mainSkuId.toString() : order.skuId.toString())
          : (order.productId ? order.productId.toString() : order.skuId.toString());

        upsertOrderStmt.run(
          order.orderId ? order.orderId.toString() : '',
          order.parentId ? order.parentId.toString() : null,
          order.skuId ? order.skuId.toString() : '',
          order.skuName || '',
          order.shopId ? order.shopId.toString() : null,
          order.shopName || '',
          status,
          order.orderTime || null,
          order.finishTime || null,
          rid,
          order.unionId ? order.unionId.toString() : null,
          'jd',
          order.estimateFee || 0,
          order.actualFee || 0,
          estimatedServiceFee,
          actualServiceFee,
          serviceFeeRate,
          0,
          order.skuNum || 1,
          order.skuReturnNum || 0,
          order.skuFrozenNum || 0,
          order.cpActId ? order.cpActId.toString() : null,
          order.owner || '',
          mainSkuId
        );
        totalSynced++;
      }

      if (orders.length < 500) {
        hasMore = false;
      } else {
        pageIndex++;
      }
    }

    res.json({ code: 200, msg: `成功同步 ${totalSynced} 条订单`, data: { totalSynced } });
  } catch (err) {
    console.error('Error syncing orders:', err);
    res.status(500).json({ code: 500, msg: 'Server error' });
  }
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
