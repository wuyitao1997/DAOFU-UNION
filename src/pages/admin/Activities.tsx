import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';

export default function Activities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    avg_commission_rate: '',
    avg_system_service_fee: '',
    custom_service_rate: '',
    start_time: '',
    end_time: '',
    subsidy: '',
    content: '',
    image_url: '',
    memo: ''
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const query = new URLSearchParams({ page: page.toString(), size: '20' });
      const res = await fetch(`/api/admin/activities?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setActivities(data.data.list);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        ...formData,
        avg_commission_rate: formData.avg_commission_rate ? Number(formData.avg_commission_rate) / 100 : null,
        avg_system_service_fee: formData.avg_system_service_fee ? Number(formData.avg_system_service_fee) / 100 : null,
        custom_service_rate: formData.custom_service_rate ? Number(formData.custom_service_rate) / 100 : null,
        subsidy: formData.subsidy ? Number(formData.subsidy) : null,
      };

      const res = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.code === 200) {
        setShowAddModal(false);
        setFormData({
          name: '', url: '', avg_commission_rate: '', avg_system_service_fee: '', custom_service_rate: '',
          start_time: '', end_time: '', subsidy: '', content: '', image_url: '', memo: ''
        });
        fetchActivities();
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error(err);
      alert('添加失败');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">活动管理</h2>
        <div className="flex space-x-3">
          <button 
            onClick={fetchActivities}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1677ff] text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            <span>添加活动</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="搜索活动..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">活动ID</th>
                <th className="p-4 font-medium">活动名称</th>
                <th className="p-4 font-medium">平均佣金率</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">创建时间</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    暂无活动数据
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">{activity.id}</td>
                    <td className="p-4 text-sm text-gray-600">{activity.name}</td>
                    <td className="p-4 text-sm text-gray-600">{(activity.avg_commission_rate * 100).toFixed(2)}%</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status === 'active' ? '进行中' : '已结束'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(activity.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                      <button className="text-red-600 hover:text-red-800 font-medium">删除</button>
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

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">添加活动</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动名称 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动链接 <span className="text-red-500">*</span></label>
                  <input type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平均佣金率(%)</label>
                  <input type="number" step="0.01" value={formData.avg_commission_rate} onChange={e => setFormData({...formData, avg_commission_rate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平均系统服务费(%)</label>
                  <input type="number" step="0.01" value={formData.avg_system_service_fee} onChange={e => setFormData({...formData, avg_system_service_fee: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动内容</label>
                  <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" rows={3} />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-[#1677ff] text-white rounded-lg hover:bg-blue-600">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
