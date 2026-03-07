import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function Stats() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [productStats, setProductStats] = useState<any[]>([]);
  const [shopStats, setShopStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'products') {
      loadProductStats();
    } else if (activeTab === 'shops') {
      loadShopStats();
    }
  }, [activeTab, page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/user-stats/orders?page=${page}&size=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setOrders(data.data.list);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user-stats/product-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setProductStats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadShopStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user-stats/shop-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setShopStats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getStatusText = (status: string) => {
    const statusMap: any = {
      'paid': '已付款',
      'completed': '已完成',
      'refunded': '已退款',
      'invalid': '无效'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">数据看板</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="orders">订单明细</TabsTrigger>
            <TabsTrigger value="products">商品看板</TabsTrigger>
            <TabsTrigger value="shops">店铺看板</TabsTrigger>
          </TabsList>

          {/* 订单明细 */}
          <TabsContent value="orders">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-medium">订单号</th>
                    <th className="p-4 font-medium">子订单号</th>
                    <th className="p-4 font-medium">商品名称</th>
                    <th className="p-4 font-medium">店铺名称</th>
                    <th className="p-4 font-medium">数量</th>
                    <th className="p-4 font-medium">预估佣金</th>
                    <th className="p-4 font-medium">实际佣金</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium">下单时间</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="p-8 text-center text-gray-500">加载中...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-gray-500">暂无数据</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.orderId} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{order.orderId}</td>
                        <td className="p-4 text-sm">{order.parentId || '-'}</td>
                        <td className="p-4 text-sm max-w-xs truncate">{order.skuName}</td>
                        <td className="p-4 text-sm">{order.shopName}</td>
                        <td className="p-4 text-sm">{order.skuNum}</td>
                        <td className="p-4 text-sm text-green-600">¥{order.estimateCosPrice}</td>
                        <td className="p-4 text-sm text-green-600">¥{order.actualCosPrice}</td>
                        <td className="p-4 text-sm">{getStatusText(order.validCode)}</td>
                        <td className="p-4 text-sm">{formatDate(order.orderTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {total > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>共 {total} 条数据，当前第 {page} 页</span>
                <div className="flex space-x-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
                  <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 商品看板 */}
          <TabsContent value="products">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-medium">商品ID</th>
                    <th className="p-4 font-medium">商品名称</th>
                    <th className="p-4 font-medium">订单数</th>
                    <th className="p-4 font-medium">推广件数</th>
                    <th className="p-4 font-medium">预估佣金</th>
                    <th className="p-4 font-medium">实际佣金</th>
                    <th className="p-4 font-medium">预估服务费</th>
                    <th className="p-4 font-medium">实际服务费</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">加载中...</td></tr>
                  ) : productStats.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">暂无数据</td></tr>
                  ) : (
                    productStats.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{item.productId}</td>
                        <td className="p-4 text-sm max-w-xs truncate">{item.productName}</td>
                        <td className="p-4 text-sm">{item.orderCount}</td>
                        <td className="p-4 text-sm">{item.totalQuantity}</td>
                        <td className="p-4 text-sm text-green-600">¥{item.totalEstimateCommission}</td>
                        <td className="p-4 text-sm text-green-600">¥{item.totalActualCommission}</td>
                        <td className="p-4 text-sm text-blue-600">¥{item.estimateServiceFee}</td>
                        <td className="p-4 text-sm text-blue-600">¥{item.actualServiceFee}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* 店铺看板 */}
          <TabsContent value="shops">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-medium">店铺ID</th>
                    <th className="p-4 font-medium">店铺名称</th>
                    <th className="p-4 font-medium">订单数</th>
                    <th className="p-4 font-medium">推广件数</th>
                    <th className="p-4 font-medium">预估佣金</th>
                    <th className="p-4 font-medium">实际佣金</th>
                    <th className="p-4 font-medium">预估服务费</th>
                    <th className="p-4 font-medium">实际服务费</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">加载中...</td></tr>
                  ) : shopStats.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">暂无数据</td></tr>
                  ) : (
                    shopStats.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{item.shopId}</td>
                        <td className="p-4 text-sm">{item.shopName}</td>
                        <td className="p-4 text-sm">{item.orderCount}</td>
                        <td className="p-4 text-sm">{item.totalQuantity}</td>
                        <td className="p-4 text-sm text-green-600">¥{item.totalEstimateCommission}</td>
                        <td className="p-4 text-sm text-green-600">¥{item.totalActualCommission}</td>
                        <td className="p-4 text-sm text-blue-600">¥{item.estimateServiceFee}</td>
                        <td className="p-4 text-sm text-blue-600">¥{item.actualServiceFee}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
