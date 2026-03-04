import crypto from 'crypto';

async function callJdApi(method: string, paramJson: any, appKey: string, appSecret: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const dateMap: any = {};
  parts.forEach(p => { dateMap[p.type] = p.value; });
  const timestamp = `${dateMap.year}-${dateMap.month}-${dateMap.day} ${dateMap.hour}:${dateMap.minute}:${dateMap.second}`;
  
  const sysParams: any = {
    app_key: appKey,
    method,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    '360buy_param_json': JSON.stringify(paramJson)
  };

  const keys = Object.keys(sysParams).sort();
  let signStr = appSecret;
  for (const key of keys) {
    signStr += key + sysParams[key];
  }
  signStr += appSecret;
  
  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  sysParams.sign = sign;

  const bodyStr = Object.keys(sysParams)
    .map(key => `${key}=${encodeURIComponent(sysParams[key])}`)
    .join('&');
  
  const url = `https://api.jd.com/routerjson`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    body: bodyStr
  });
  return await response.json();
}

const appKey = '3063ae2137fc178f64a10677c71f8db2';
const appSecret = 'e340bb01536c428a970d596b3a0b65bd';

async function test() {
  console.log('Testing bysubunionid.get with pid...');
  const res1 = await callJdApi('jd.union.open.promotion.bysubunionid.get', {
    promotionCodeReq: {
      materialId: 'https://item.jd.com/100012043978.html',
      pid: '2033480192_4103390764_3103768449'
    }
  }, appKey, appSecret);
  console.log('bysubunionid.get:', JSON.stringify(res1));

  console.log('Testing common.get with siteId and positionId...');
  const res3 = await callJdApi('jd.union.open.promotion.common.get', {
    promotionCodeReq: {
      materialId: 'https://item.jd.com/100012043978.html',
      siteId: 4103390764,
      positionId: 3103768449
    }
  }, appKey, appSecret);
  console.log('common.get with siteId and positionId:', JSON.stringify(res3));
}

test();
