import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState({
    today_clicks: 0,
    today_orders: 0,
    today_commission: 0,
    month_commission: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/user/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/user/orders?page=1&size=10', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();

        if (statsData.code === 200) {
          setStats(statsData.data);
        }
        if (ordersData.code === 200) {
          setOrders(ordersData.data.list);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return <span className="text-blue-500">已付款</span>;
      case 'completed': return <span className="text-green-500">已完成</span>;
      case 'refunded': return <span className="text-red-500">已退款</span>;
      case 'invalid': return <span className="text-gray-500">无效</span>;
      default: return <span className="text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">效果统计</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日点击</p>
            <p className="text-2xl font-bold text-gray-800">{stats.today_clicks}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日订单</p>
            <p className="text-2xl font-bold text-gray-800">{stats.today_orders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日预估佣金</p>
            <p className="text-2xl font-bold text-gray-800">¥{stats.today_commission.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">本月预估佣金</p>
            <p className="text-2xl font-bold text-gray-800">¥{stats.month_commission.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">近期订单</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">订单号</th>
                <th className="p-4 font-medium">商品名称</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">下单时间</th>
                <th className="p-4 font-medium">预估佣金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-800">{order.order_id}</td>
                    <td className="p-4 text-sm text-gray-800 max-w-xs truncate" title={order.product_name}>
                      {order.product_name}
                    </td>
                    <td className="p-4 text-sm">{getStatusText(order.status)}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.order_time).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-orange-600">
                      ¥{order.estimated_service_fee.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
