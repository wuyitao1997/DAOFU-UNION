import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Users() {
  const { admin } = useOutletContext<any>();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ridInput, setRidInput] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const query = new URLSearchParams({ page: page.toString(), size: '20', status });
      const res = await fetch(`/api/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setUsers(data.data.list);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, status]);

  const handleApprove = async () => {
    if (admin.role !== 'super_admin' && admin.role !== 'admin') return alert('无权限');
    if (!ridInput) return alert('请输入RID');

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rid: ridInput })
      });
      const data = await res.json();
      if (data.code === 200) {
        alert('审核通过');
        setShowApproveModal(false);
        fetchUsers();
      } else {
        alert(data.msg || '操作失败');
      }
    } catch (err) {
      console.error(err);
      alert('操作失败');
    }
  };

  const handleReject = async () => {
    if (admin.role !== 'super_admin') return alert('无权限');
    if (!rejectReason) return alert('请输入驳回原因');

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (data.code === 200) {
        alert('已驳回');
        setShowRejectModal(false);
        fetchUsers();
      } else {
        alert(data.msg || '操作失败');
      }
    } catch (err) {
      console.error(err);
      alert('操作失败');
    }
  };

  const openApproveModal = (user: any) => {
    setSelectedUser(user);
    setRidInput('');
    setShowApproveModal(true);
  };

  const openRejectModal = (user: any) => {
    setSelectedUser(user);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openDetailsModal = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">用户管理</h2>
        <div className="flex items-center space-x-4">
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border rounded-lg outline-none">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="normal">正常</option>
            <option value="rejected">已驳回</option>
            <option value="blacklisted">黑名单</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">昵称</th>
                <th className="p-4 font-medium">手机号</th>
                <th className="p-4 font-medium">京东联盟ID</th>
                <th className="p-4 font-medium">RID</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">注册时间</th>
                <th className="p-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">加载中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">暂无数据</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-800">{user.id}</td>
                    <td className="p-4 text-sm text-gray-800">{user.nickname}</td>
                    <td className="p-4 text-sm text-gray-800">{user.phone}</td>
                    <td className="p-4 text-sm text-gray-800">{user.jd_union_id || '-'}</td>
                    <td className="p-4 text-sm text-gray-800">{user.rid || '-'}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'normal' ? 'bg-green-100 text-green-600' :
                        user.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {user.status === 'normal' ? '正常' : user.status === 'pending' ? '待审核' : user.status === 'rejected' ? '已驳回' : '黑名单'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sm space-x-2">
                      {user.status === 'pending' && (admin.role === 'super_admin' || admin.role === 'admin') && (
                        <>
                          <button onClick={() => openApproveModal(user)} className="text-blue-500 hover:text-blue-700">通过</button>
                          <button onClick={() => openRejectModal(user)} className="text-red-500 hover:text-red-700">驳回</button>
                        </>
                      )}
                      <button onClick={() => openDetailsModal(user)} className="text-gray-500 hover:text-gray-700">详情</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>共 {total} 条数据，当前第 {page} 页</span>
            <div className="flex space-x-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">审核通过</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">正在为用户 <strong>{selectedUser.nickname}</strong> ({selectedUser.phone}) 办理通过手续。</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分配 RID</label>
                <input
                  type="text"
                  value={ridInput}
                  onChange={(e) => setRidInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] focus:border-transparent outline-none"
                  placeholder="请输入分配给该用户的RID"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100">取消</button>
              <button onClick={handleApprove} className="px-4 py-2 bg-[#1677ff] text-white rounded-lg hover:bg-blue-600">确定通过</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">驳回申请</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">正在驳回用户 <strong>{selectedUser.nickname}</strong> ({selectedUser.phone}) 的申请。</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="请输入驳回原因"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100">取消</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">确定驳回</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">用户详情</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">用户ID</p>
                <p className="font-medium text-gray-800">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">手机号</p>
                <p className="font-medium text-gray-800">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">昵称</p>
                <p className="font-medium text-gray-800">{selectedUser.nickname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">微信号</p>
                <p className="font-medium text-gray-800">{selectedUser.wechat || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">京东联盟ID</p>
                <p className="font-medium text-gray-800">{selectedUser.jd_union_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">京东联盟Key</p>
                <p className="font-medium text-gray-800 break-all">{selectedUser.jd_union_key || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">分配RID</p>
                <p className="font-medium text-gray-800">{selectedUser.rid || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">状态</p>
                <p className="font-medium text-gray-800">
                  {selectedUser.status === 'normal' ? '正常' : selectedUser.status === 'pending' ? '待审核' : selectedUser.status === 'rejected' ? '已驳回' : '黑名单'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">注册时间</p>
                <p className="font-medium text-gray-800">{new Date(selectedUser.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
