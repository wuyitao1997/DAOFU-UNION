import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function Settlements() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const query = new URLSearchParams({ page: page.toString(), size: '20' });
      const res = await fetch(`/api/admin/settlements?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setSettlements(data.data.list);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">结算管理</h2>
        <div className="flex space-x-3">
          <button 
            onClick={fetchSettlements}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="搜索用户ID..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="flex space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">结算单号</th>
                <th className="p-4 font-medium">用户ID</th>
                <th className="p-4 font-medium">结算金额</th>
                <th className="p-4 font-medium">服务费</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">申请时间</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    暂无结算数据
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">{settlement.id}</td>
                    <td className="p-4 text-sm text-gray-600">{settlement.user_id}</td>
                    <td className="p-4 text-sm font-medium text-orange-600">¥{settlement.amount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-gray-500">¥{settlement.service_fee.toFixed(2)}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        settlement.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        settlement.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {settlement.status === 'completed' ? '已完成' : settlement.status === 'pending' ? '待处理' : '已拒绝'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(settlement.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sm text-right space-x-3">
                      {settlement.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-800 font-medium" title="通过">
                            <CheckCircle size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-800 font-medium" title="拒绝">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
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
