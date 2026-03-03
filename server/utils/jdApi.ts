import crypto from 'crypto';

export async function callJdApi(method: string, paramJson: any, appKey: string, appSecret: string) {
  // Get Beijing Time (UTC+8)
  const now = new Date();
  
  // Convert to UTC+8
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingTime = new Date(utc + (3600000 * 8));
  
  // Format: yyyy-MM-dd HH:mm:ss
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getDate()).padStart(2, '0');
  const hours = String(beijingTime.getHours()).padStart(2, '0');
  const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
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

  // 4. 组装 URL (京东推荐将系统参数放在 URL 上，业务参数放在 body 中，或者全部放在 URL 上)
  // URLSearchParams 会把空格编码成 +，这可能导致京东解析时间戳时出错，所以我们手动编码
  const queryParams = Object.keys(sysParams)
    .map(key => `${key}=${encodeURIComponent(sysParams[key])}`)
    .join('&');
  
  const url = `https://router.jd.com/api?${queryParams}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('JD API Error:', error);
    throw error;
  }
}
