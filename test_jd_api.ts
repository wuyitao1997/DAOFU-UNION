import { callJdApi } from './server/test_jd_api.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const appKey = process.env.JD_APP_KEY;
  const appSecret = process.env.JD_APP_SECRET;
  const skuId = '10025686782162';

  console.log('Testing with appKey:', appKey);

  console.log('Testing jd.union.open.goods.promotiongoodsinfo.query with skuIds string...');
  const res1 = await callJdApi('jd.union.open.goods.promotiongoodsinfo.query', {
    skuIds: skuId
  }, appKey, appSecret);
  console.log(JSON.stringify(res1, null, 2));
}

test();
