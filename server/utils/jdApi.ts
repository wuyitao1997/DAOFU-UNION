import crypto from 'crypto';
import axios from 'axios';

const APP_KEY = '3063ae2137fc178f64a10677c71f8db2';
const SECRET_KEY = 'e340bb01536c428a970d596b3a0b65bd';
const API_URL = 'https://router.jd.com/api';

export function generateSign(method: string, timestamp: string, paramJson: string) {
  const params: Record<string, string> = {
    app_key: APP_KEY,
    format: 'json',
    method,
    param_json: paramJson,
    sign_method: 'md5',
    timestamp,
    v: '1.0',
  };

  const sortedKeys = Object.keys(params).sort();
  let str = SECRET_KEY;
  for (const key of sortedKeys) {
    str += key + params[key];
  }
  str += SECRET_KEY;

  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

export async function callJdApi(method: string, paramJson: any) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const paramJsonStr = JSON.stringify(paramJson);
  const sign = generateSign(method, timestamp, paramJsonStr);

  const params = {
    app_key: APP_KEY,
    format: 'json',
    method,
    param_json: paramJsonStr,
    sign_method: 'md5',
    timestamp,
    v: '1.0',
    sign,
  };

  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('JD API Error:', error);
    throw error;
  }
}
