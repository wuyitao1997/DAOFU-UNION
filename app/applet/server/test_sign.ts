import crypto from 'crypto';

const appKey = 'test_app_key';
const appSecret = 'test_app_secret';
const method = 'test.method';
const timestamp = '2026-03-03 12:00:00';
const paramJson = { test: 123 };

const sysParams: Record<string, string> = {
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

console.log('Keys:', keys);
console.log('SignStr:', signStr);
console.log('Sign:', crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase());
