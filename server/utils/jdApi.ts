import crypto from 'crypto';

export async function callJdApi(method: string, paramJson: any, appKey: string, appSecret: string) {
  // Get Beijing Time (UTC+8)
  const now = new Date();
  // now.getTime() is already UTC milliseconds since epoch
  const beijingTime = new Date(now.getTime() + (3600000 * 8));
  
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  
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
  let signStr = '';
  for (const key of keys) {
    signStr += key + sysParams[key];
  }
  
  // 3. 首尾加 appSecret
  signStr = appSecret + signStr + appSecret;
  
  // 4. MD5 加密转大写
  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  
  sysParams.sign = sign;

  const queryParams = new URLSearchParams(sysParams);
  const url = `https://api.jd.com/routerjson?${queryParams.toString()}`;

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
