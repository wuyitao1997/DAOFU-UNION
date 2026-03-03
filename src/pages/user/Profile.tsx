import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function Profile() {
  const { user, setUser } = useOutletContext<any>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    wechat: user?.wechat || '',
    jd_union_id: user?.jd_union_id || '',
    jd_union_key: user?.jd_union_key || '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.code === 200) {
        setSuccessMessage('已提交申请，请等待审核，预计1-2个工作日内完成。');
        setUser({ ...user, ...formData, status: 'pending' });
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error(err);
      alert('提交失败，请重试');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">个人信息维护</h2>
      
      {user?.status === 'pending' && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6 text-sm border border-yellow-200">
          <strong>当前状态：待审核</strong> - 您的账号正在等待管理员审核，审核通过后即可使用系统功能。您仍可以修改以下信息并重新提交。
        </div>
      )}

      {user?.status === 'normal' && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
          <strong>当前状态：已认证</strong> - 您的账号已通过审核。如修改以下信息，账号将重新进入待审核状态。
        </div>
      )}

      {user?.status === 'rejected' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-200">
          <strong>当前状态：已驳回</strong> - 您的账号审核被驳回，请重新修改信息并提交。
          {user?.reject_reason && (
            <div className="mt-2">
              <strong>驳回原因：</strong> {user.reject_reason}
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 text-blue-600 p-4 rounded-lg mb-8 text-sm">
        <strong>核心提示：</strong> RID需联系客服申请，审核通过后才可使用系统功能。
      </div>

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户昵称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={e => setFormData({...formData, nickname: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
            placeholder="团队/个人名称"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            京东联盟ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.jd_union_id}
            onChange={e => setFormData({...formData, jd_union_id: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
            placeholder="请输入京东联盟ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            京东联盟有效key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.jd_union_key}
            onChange={e => setFormData({...formData, jd_union_key: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
            placeholder="请输入京东联盟有效key"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
          <input
            type="text"
            value={formData.wechat}
            onChange={e => setFormData({...formData, wechat: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
            placeholder="选填，默认注册手机号"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          提交审核
        </button>
      </form>
    </div>
  );
}
