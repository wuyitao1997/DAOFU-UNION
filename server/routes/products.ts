import express from 'express';
import db from '../db.js';
import { callJdApi } from '../utils/jdApi.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, size = 20, category, minCommission, maxCommission, minService, maxService, sort } = req.query;
  
  let query = 'SELECT * FROM products WHERE status = \'active\'';
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

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM products WHERE status = \'active\'');
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

router.post('/convert', async (req, res) => {
  const { url, type, customText } = req.body;
  
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ code: 401, msg: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  
  // Get user from token (mocked for now, assuming user ID is 1 or we need to decode token)
  // Since we don't have full auth middleware here, let's just get the first user or decode token
  // For simplicity, let's assume the token is the user ID or we can decode it.
  // Actually, we should decode the JWT token.
  let userId;
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ code: 401, msg: 'Invalid token' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user || !user.rid) {
    return res.status(400).json({ code: 400, msg: '请先完成入驻审核，获取平台分配的RID' });
  }

  // Fetch product to get promotion copy if url is an ID
  let product = null;
  let materialId = url;
  
  // If url is a number or doesn't start with http, assume it's a product ID
  if (!url.startsWith('http')) {
    product = db.prepare('SELECT * FROM products WHERE id = ?').get(url) as any;
    materialId = `https://item.jd.com/${url}.html`;
  }

  // Append user's RID to materialId
  try {
    const urlObj = new URL(materialId);
    urlObj.searchParams.set('rid', user.rid);
    materialId = urlObj.toString();
  } catch (e) {
    // If it's not a valid URL, just append it
    materialId = materialId + (materialId.includes('?') ? '&' : '?') + 'rid=' + user.rid;
  }

  const appKey = process.env.JD_APP_KEY || '3063ae2137fc178f64a10677c71f8db2';
  const appSecret = process.env.JD_APP_SECRET || 'e340bb01536c428a970d596b3a0b65bd';

  try {
    let clickURL = '';

    if (!appKey || !appSecret) {
      // Mock the response for testing if environment variables are not set
      console.warn('JD_APP_KEY or JD_APP_SECRET is not set. Using mock JD API response.');
      clickURL = `https://u.jd.com/${Math.random().toString(36).substring(7)}`;
    } else {
      // Call JD API
      // Parse siteId as number to prevent NumberFormatException
      const positionId = Number(process.env.JD_POSITION_ID || '3103768449');
      if (isNaN(positionId)) {
        return res.status(500).json({ code: 500, msg: '系统未配置推广位ID(JD_POSITION_ID)' });
      }

      const paramJson = {
        promotionCodeReq: {
          materialId: materialId,
          positionId: positionId,
          subUnionId: String(positionId) // 平台PID
        }
      };

      const jdRes = await callJdApi('jd.union.open.promotion.bysubunionid.get', paramJson, appKey, appSecret);
      console.log('JD API Response:', JSON.stringify(jdRes, null, 2));
      
      // Parse JD API response
      const responseKey = 'jd_union_open_promotion_bysubunionid_get_responce';
      if (!jdRes[responseKey] || !jdRes[responseKey].getResult) {
        console.error('JD API Error (missing key or result):', jdRes);
        // Sometimes the error is at the top level
        if (jdRes.error_response) {
           const errMsg = jdRes.error_response.zh_desc || jdRes.error_response.en_desc;
           if (errMsg.includes('无效签名')) {
             return res.status(500).json({ 
               code: 500, 
               msg: `京东接口报错: 无效签名。请检查：1. AppKey和AppSecret是否正确。2. 确保没有多余空格。当前使用的AppKey: ${appKey.substring(0, 4)}***` 
             });
           }
           return res.status(500).json({ code: 500, msg: `京东接口报错: ${errMsg}` });
        }
        return res.status(500).json({ code: 500, msg: `转链失败，京东接口返回异常: ${JSON.stringify(jdRes)}` });
      }

      const resultStr = jdRes[responseKey].getResult;
      const resultObj = JSON.parse(resultStr);

      if (resultObj.code !== 200) {
        if (resultObj.code === 403 || (resultObj.message && resultObj.message.includes('无访问权限'))) {
          return res.status(500).json({ 
            code: 500, 
            msg: '转链失败：无访问权限。\n\n【原因】：您使用的是“导购媒体”的推广位ID，但您的京东联盟账号尚未开通“社交媒体获取推广链接接口”权限。\n\n【解决方案】：\n请前往京东联盟 -> 我的工具 -> API管理，申请“社交媒体获取推广链接接口”权限。申请通过后即可正常转链。' 
          });
        }
        return res.status(500).json({ code: 500, msg: resultObj.message || '转链失败' });
      }

      clickURL = resultObj.data.shortURL || resultObj.data.clickURL;
    }
    
    let content = clickURL;
    if (type === 'all') {
      if (customText) {
        // Replace the original link in customText with the new clickURL
        // For simplicity, we just append it if we can't find a link to replace, or replace all http links
        content = customText.replace(/https?:\/\/[^\s]+/g, clickURL);
        if (content === customText) {
          content = `${customText}\n抢购链接：${clickURL}`;
        }
      } else if (product && product.promotion_copy) {
        content = `${product.promotion_copy}\n抢购链接：${clickURL}`;
      } else {
        content = `【京东】超级好物推荐\n券后价：${product ? product.price : '9.9'}元\n抢购链接：${clickURL}`;
      }
    }
    
    res.json({
      code: 200,
      msg: 'Success',
      data: {
        url: clickURL,
        content
      }
    });
  } catch (error) {
    console.error('Convert Error:', error);
    res.status(500).json({ code: 500, msg: '转链服务异常' });
  }
});

export default router;
