import express from 'express';
import db from '../db.js';
import { callJdApi } from '../utils/jdApi.js';

const router = express.Router();

// 获取 access_token
function getAccessToken() {
  const auth = db.prepare('SELECT access_token, expires_at FROM jd_auth ORDER BY id DESC LIMIT 1').get();
  
  if (!auth) {
    throw new Error('未授权京东联盟账号');
  }

  const expiresAt = new Date(auth.expires_at);
  if (expiresAt < new Date()) {
    throw new Error('授权已过期，请重新授权');
  }

  return auth.access_token;
}

// 同步订单数据
router.post('/sync', async (req, res) => {
  try {
    const accessToken = getAccessToken();
    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      return res.status(500).json({ code: 500, msg: '未配置京东联盟API密钥' });
    }

    const { startTime, endTime, pageNo = 1, pageSize = 500 } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, msg: '请提供开始时间和结束时间' });
    }

    // 调用京东联盟订单查询接口
    const paramJson = {
      orderReq: {
        pageNo,
        pageSize,
        type: 1, // 1:推广订单
        startTime,
        endTime,
        childUnionId: 0,
        key: '' // 工具商订单查询key，可为空
      }
    };

    const jdRes = await callJdApi(
      'jd.union.open.order.row.query',
      paramJson,
      appKey,
      appSecret,
      accessToken
    );

    const responseKey = 'jd_union_open_order_row_query_responce';
    if (!jdRes[responseKey] || !jdRes[responseKey].queryResult) {
      console.error('JD API Error:', jdRes);
      return res.status(500).json({ code: 500, msg: '获取订单数据失败', details: jdRes });
    }

    const resultStr = jdRes[responseKey].queryResult;
    const resultObj = JSON.parse(resultStr);

    if (resultObj.code !== 200 || !resultObj.data) {
      return res.status(500).json({ code: 500, msg: resultObj.message || '获取订单数据失败' });
    }

    // 保存订单到数据库
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO orders 
      (order_id, parent_id, product_id, product_name, shop_id, shop_name, status, 
       order_time, finish_time, rid, union_id, product_type, 
       estimated_commission, actual_commission, estimated_service_fee, actual_service_fee, 
       service_fee_rate, split_rate, quantity, return_quantity, frozen_quantity, 
       cp_act_id, owner, main_sku_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let syncCount = 0;
    for (const order of resultObj.data) {
      // 根据 validCode 判断订单状态
      let status = 'paid';
      if (order.validCode === 15) status = 'completed';
      else if (order.validCode === 17) status = 'refunded';
      else if (order.validCode === 2) status = 'invalid';

      insertStmt.run(
        order.orderId,
        order.parentId || null,
        order.productId || null,
        order.skuName,
        order.shopId || null,
        order.shopName || null,
        status,
        order.orderTime ? new Date(order.orderTime).toISOString() : null,
        order.finishTime ? new Date(order.finishTime).toISOString() : null,
        order.rid || null,
        order.unionId || null,
        order.productType || null,
        order.estimateCosPrice || 0,
        order.actualCosPrice || 0,
        0, // estimated_service_fee 后续计算
        0, // actual_service_fee 后续计算
        0, // service_fee_rate 从商品表获取
        0, // split_rate 从配置获取
        order.skuNum || 0,
        order.skuReturnNum || 0,
        order.skuFrozenNum || 0,
        order.cpActId || null,
        order.owner || null,
        order.mainSkuId || null
      );
      syncCount++;
    }

    res.json({
      code: 200,
      msg: 'Success',
      data: {
        syncCount,
        hasMore: resultObj.data.length >= pageSize,
        pageNo
      }
    });
  } catch (err: any) {
    console.error('Sync orders error:', err);
    res.status(500).json({ code: 500, msg: err.message || '同步订单失败' });
  }
});

export default router;

