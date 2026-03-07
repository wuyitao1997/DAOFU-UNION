import cron from 'node-cron';
import db from './db.js';
import { callJdApi } from './utils/jdApi.js';

// 同步团长活动列表
async function syncActivities() {
  try {
    console.log('[Cron] 开始同步团长活动列表...');
    
    // 获取 access_token
    const auth = db.prepare('SELECT access_token, expires_at FROM jd_auth ORDER BY id DESC LIMIT 1').get();
    
    if (!auth) {
      console.log('[Cron] 未授权京东联盟账号，跳过同步');
      return;
    }

    const expiresAt = new Date(auth.expires_at);
    if (expiresAt < new Date()) {
      console.log('[Cron] 授权已过期，跳过同步');
      return;
    }

    const appKey = process.env.JD_APP_KEY;
    const appSecret = process.env.JD_APP_SECRET;

    if (!appKey || !appSecret) {
      console.log('[Cron] 未配置京东联盟API密钥，跳过同步');
      return;
    }

    // 调用京东联盟API获取团长活动列表
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
      auth.access_token
    );

    const responseKey = 'jd_union_open_cp_activity_query_responce';
    if (!jdRes[responseKey] || !jdRes[responseKey].queryResult) {
      console.error('[Cron] 获取活动列表失败:', jdRes);
      return;
    }

    const resultStr = jdRes[responseKey].queryResult;
    const resultObj = JSON.parse(resultStr);

    if (resultObj.code !== 200 || !resultObj.data) {
      console.error('[Cron] 获取活动列表失败:', resultObj.message);
      return;
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

    console.log(`[Cron] 同步完成，共同步 ${syncCount} 个活动`);
  } catch (err) {
    console.error('[Cron] 同步活动失败:', err);
  }
}

// 启动定时任务
export function startCronJobs() {
  // 每天凌晨0点执行
  cron.schedule('0 0 * * *', syncActivities, {
    timezone: 'Asia/Shanghai'
  });

  console.log('[Cron] 定时任务已启动：每天 0:00 同步团长活动列表');
}
