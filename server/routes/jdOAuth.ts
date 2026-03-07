import express from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { callJdApi } from '../utils/jdApi.js';

const router = express.Router();

// OAuth 配置
const JD_APP_KEY = process.env.JD_APP_KEY;
const JD_APP_SECRET = process.env.JD_APP_SECRET;
const REDIRECT_URI = process.env.APP_URL || 'http://localhost:3000';

// 步骤1：生成授权URL
router.get('/authorize-url', (req, res) => {
  if (!JD_APP_KEY) {
    return res.status(500).json({ code: 500, msg: '未配置京东联盟AppKey' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = `https://oauth.jd.com/oauth/authorize?response_type=code&client_id=${JD_APP_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI + '/api/jd-oauth/callback')}&state=${state}`;
  
  res.json({
    code: 200,
    msg: 'Success',
    data: { authUrl, state }
  });
});

// 步骤2：OAuth 回调
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('授权失败：缺少授权码');
  }

  try {
    // 用 code 换取 access_token
    const tokenUrl = 'https://oauth.jd.com/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: JD_APP_KEY!,
      client_secret: JD_APP_SECRET!,
      code: code as string,
      redirect_uri: REDIRECT_URI + '/api/jd-oauth/callback'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (data.access_token) {
      // 保存到数据库
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      
      db.prepare('DELETE FROM jd_auth').run(); // 清除旧的
      db.prepare(`
        INSERT INTO jd_auth (access_token, refresh_token, expires_at)
        VALUES (?, ?, ?)
      `).run(data.access_token, data.refresh_token || null, expiresAt.toISOString());

      res.send(`
        <html>
          <body>
            <h2>授权成功！</h2>
            <p>您可以关闭此页面，返回管理后台。</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(500).send('授权失败：' + JSON.stringify(data));
    }
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.status(500).send('授权失败：' + err.message);
  }
});

// 获取当前授权状态
router.get('/status', (req, res) => {
  const auth = db.prepare('SELECT * FROM jd_auth ORDER BY id DESC LIMIT 1').get();
  
  if (!auth) {
    return res.json({
      code: 200,
      msg: 'Success',
      data: { authorized: false }
    });
  }

  const expiresAt = new Date(auth.expires_at);
  const isExpired = expiresAt < new Date();

  res.json({
    code: 200,
    msg: 'Success',
    data: {
      authorized: !isExpired,
      expiresAt: auth.expires_at,
      isExpired
    }
  });
});

export default router;
