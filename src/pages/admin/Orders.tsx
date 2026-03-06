import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const query = new URLSearchParams({ page: page.toString(), size: '20' });
      const res = await fetch(`/api/admin/orders?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setOrders(data.data.list);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const syncOrders = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/orders/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        alert(data.msg);
        fetchOrders();
      } else {
        alert(data.msg || '同步失败');
      }
    } catch (error) {
      console.error('Failed to sync orders:', error);
      alert('同步失败，请重试');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
        <div className="flex space-x-3">
          <button 
            onClick={syncOrders}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1677ff] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? '同步中...' : '同步最新订单'}</span>
          </button>
          <button 
            onClick={fetchOrders}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            <span>导出订单</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="搜索订单号..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">订单号</th>
                <th className="p-4 font-medium">商品名称</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">下单时间</th>
                <th className="p-4 font-medium">预估佣金</th>
                <th className="p-4 font-medium">实际佣金</th>
                <th className="p-4 font-medium">预估服务费</th>
                <th className="p-4 font-medium">实际服务费</th>
                <th className="p-4 font-medium">退货数量</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">{order.order_id}</td>
                    <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]" title={order.product_name}>{order.product_name}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'refunded' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'completed' ? '已完成' : order.status === 'paid' ? '已付款' : order.status === 'refunded' ? '已退款' : '已失效'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(order.order_time).toLocaleString()}</td>
                    <td className="p-4 text-sm font-medium text-orange-600">¥{order.estimated_commission?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm font-medium text-orange-600">¥{order.actual_commission?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm font-medium text-blue-600">¥{order.estimated_service_fee?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm font-medium text-blue-600">¥{order.actual_service_fee?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm text-gray-500">{order.return_quantity || 0}</td>
                    <td className="p-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">详情</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          <div>共 {total} 条记录</div>
          <div className="flex space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              上一页
            </button>
            <button 
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
