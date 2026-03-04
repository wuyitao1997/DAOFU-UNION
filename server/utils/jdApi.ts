import crypto from 'crypto';

export async function callJdApi(method: string, paramJson: any, appKey: string, appSecret: string) {
  // 去除可能存在的首尾空格
  appKey = appKey.trim();
  appSecret = appSecret.trim();

  // 获取北京时间 (UTC+8)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dateMap: Record<string, string> = {};
  parts.forEach(p => { dateMap[p.type] = p.value; });
  
  const timestamp = `${dateMap.year}-${dateMap.month}-${dateMap.day} ${dateMap.hour}:${dateMap.minute}:${dateMap.second}`;
  
  const sysParams: Record<string, string> = {
    app_key: appKey,
    method,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    '360buy_param_json': JSON.stringify(paramJson)
  };

  // 1. 参数按字母升序排列
  const keys = Object.keys(sysParams).sort();
  
  // 2. 拼接参数名 + 值
  let signStr = appSecret; // 京东签名要求：首尾加 appSecret，这里是头部
  for (const key of keys) {
    signStr += key + sysParams[key];
  }
  signStr += appSecret; // 尾部加 appSecret
  
  // 3. MD5 加密转大写
  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  
  sysParams.sign = sign;

  // 4. 组装请求体 (使用 application/x-www-form-urlencoded)
  // 手动拼接并使用 encodeURIComponent，确保空格被编码为 %20 而不是 +
  const bodyStr = Object.keys(sysParams)
    .map(key => `${key}=${encodeURIComponent(sysParams[key])}`)
    .join('&');
  
  const url = `https://api.jd.com/routerjson`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: bodyStr
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('JD API Error:', error);
    throw error;
  }
}
