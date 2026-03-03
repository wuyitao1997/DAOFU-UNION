import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, Settings, Shield, RefreshCw, CreditCard, Eye, EyeOff, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useOutletContext<any>();
  const navigate = useNavigate();
  
  const [showPhone, setShowPhone] = useState(false);
  const [showJdId, setShowJdId] = useState(false);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [newJdKey, setNewJdKey] = useState('');
  
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementType, setSettlementType] = useState<'public' | 'private'>('public');
  const [settlementForm, setSettlementForm] = useState({
    payeeName: '',
    bankAccount: '',
    bankName: '',
    taxId: ''
  });

  const maskString = (str: string, start: number, end: number) => {
    if (!str) return '';
    if (str.length <= start + end) return str;
    return str.substring(0, start) + '****' + str.substring(str.length - end);
  };

  const handleUpdateAuth = async () => {
    if (!newJdKey) return alert('请输入新的联盟授权KEY');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          nickname: user.nickname,
          wechat: user.wechat,
          jd_union_id: user.jd_union_id,
          jd_union_key: newJdKey 
        }),
      });
      const data = await res.json();
      if (data.code === 200) {
        alert('更新成功');
        setIsAuthModalOpen(false);
        window.location.reload();
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert('更新失败');
    }
  };

  const handleUpdateSettlement = async () => {
    // In a real app, this would save to the backend
    alert('结算信息已保存');
    setIsSettlementModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
            <p className="text-gray-500">
              ID: {user.id} | 状态: {
                user.status === 'normal' ? <span className="text-green-500">正常</span> : 
                user.status === 'pending' ? <span className="text-orange-500">审核中</span> :
                user.status === 'rejected' ? <span className="text-red-500">已驳回</span> :
                <span className="text-gray-500">黑名单</span>
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-gray-500 block mb-1">手机号</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-800">
                {showPhone ? user.phone : maskString(user.phone, 3, 4)}
              </span>
              <button onClick={() => setShowPhone(!showPhone)} className="text-gray-400 hover:text-gray-600">
                {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">京东联盟ID</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-800">
                {showJdId ? user.jd_union_id : maskString(user.jd_union_id, 2, 2)}
              </span>
              <button onClick={() => setShowJdId(!showJdId)} className="text-gray-400 hover:text-gray-600">
                {showJdId ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">RID</span>
            <span className="font-medium text-gray-800">{user.rid || '未分配'}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: RefreshCw, label: '更新联盟授权', color: 'text-blue-500', bg: 'bg-blue-50', onClick: () => setIsAuthModalOpen(true) },
          { icon: CreditCard, label: '结算信息', color: 'text-green-500', bg: 'bg-green-50', onClick: () => setIsSettlementModalOpen(true) },
          { icon: Settings, label: '账号信息编辑', color: 'text-purple-500', bg: 'bg-purple-50', onClick: () => navigate('/user/profile') },
          { icon: Shield, label: '安全设置', color: 'text-orange-500', bg: 'bg-orange-50', onClick: () => alert('功能开发中') },
        ].map((action, i) => (
          <button 
            key={i} 
            onClick={action.onClick}
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} ${action.color}`}>
              <action.icon size={24} />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">更新联盟授权</h3>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新的联盟授权KEY</label>
                <input 
                  type="text" 
                  value={newJdKey}
                  onChange={(e) => setNewJdKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
                  placeholder="请输入新的有效KEY"
                />
              </div>
              <button 
                onClick={handleUpdateAuth}
                className="w-full py-2 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">结算信息</h3>
              <button onClick={() => setIsSettlementModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setSettlementType('public')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${settlementType === 'public' ? 'bg-[#1677ff] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                对公
              </button>
              <button
                onClick={() => setSettlementType('private')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${settlementType === 'private' ? 'bg-[#1677ff] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                对私
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">收款名称</label>
                <input 
                  type="text" 
                  value={settlementForm.payeeName}
                  onChange={(e) => setSettlementForm({...settlementForm, payeeName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
                  placeholder="请输入收款名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
                <input 
                  type="text" 
                  value={settlementForm.bankAccount}
                  onChange={(e) => setSettlementForm({...settlementForm, bankAccount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
                  placeholder="请输入银行账号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开户行信息</label>
                <input 
                  type="text" 
                  value={settlementForm.bankName}
                  onChange={(e) => setSettlementForm({...settlementForm, bankName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
                  placeholder="请输入开户行信息"
                />
              </div>
              
              {settlementType === 'public' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司税号</label>
                  <input 
                    type="text" 
                    value={settlementForm.taxId}
                    onChange={(e) => setSettlementForm({...settlementForm, taxId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] outline-none"
                    placeholder="请输入公司税号"
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <button 
                  onClick={handleUpdateSettlement}
                  className="w-full py-2 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors mb-3"
                >
                  保存结算信息
                </button>
                <p className="text-sm text-red-500 text-center">
                  {settlementType === 'public' ? '提示：需要提供增值税发票。' : '提示：对私转账将收取10%服务费。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
