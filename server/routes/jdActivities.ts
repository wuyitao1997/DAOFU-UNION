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

// 同步团长活动列表
router.post('/sync', async (req, res) => {
  try {
    const accessToken = getAccessToken();
    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      return res.status(500).json({ code: 500, msg: '未配置京东联盟API密钥' });
    }

    // 调用京东联盟API获取团长活动列表
    // 接口：jd.union.open.cp.activity.query
    const paramJson = {
      cpActivityReq: {
        pageIndex: 1,
        pageSize: 50,
        type: 1 // 1:进行中的活动
      }
    };

    const jdRes = await callJdApi(
      'jd.union.open.cp.activity.query',
      paramJson,
      appKey,
      appSecret,
      accessToken
    );

    const responseKey = 'jd_union_open_cp_activity_query_responce';
    if (!jdRes[responseKey] || !jdRes[responseKey].queryResult) {
      console.error('JD API Error:', jdRes);
      return res.status(500).json({ code: 500, msg: '获取活动列表失败', details: jdRes });
    }

    const resultStr = jdRes[responseKey].queryResult;
    const resultObj = JSON.parse(resultStr);

    if (resultObj.code !== 200 || !resultObj.data) {
      return res.status(500).json({ code: 500, msg: resultObj.message || '获取活动列表失败' });
    }

    // 保存到数据库
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO jd_activities 
      (activity_id, activity_name, start_time, end_time, status, goods_count, last_synced_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    let syncCount = 0;
    for (const activity of resultObj.data) {
      insertStmt.run(
        activity.activityId,
        activity.activityName,
        activity.startTime ? new Date(activity.startTime).toISOString() : null,
        activity.endTime ? new Date(activity.endTime).toISOString() : null,
        'active',
        activity.goodsCount || 0
      );
      syncCount++;
    }

    res.json({
      code: 200,
      msg: 'Success',
      data: {
        syncCount,
        activities: resultObj.data
      }
    });
  } catch (err: any) {
    console.error('Sync activities error:', err);
    res.status(500).json({ code: 500, msg: err.message || '同步活动失败' });
  }
});

// 获取活动列表
router.get('/list', (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT * FROM jd_activities 
      WHERE status = 'active'
      ORDER BY last_synced_at DESC
    `).all();

    res.json({
      code: 200,
      msg: 'Success',
      data: activities
    });
  } catch (err: any) {
    console.error('Get activities error:', err);
    res.status(500).json({ code: 500, msg: err.message || '获取活动列表失败' });
  }
});

export default router;
