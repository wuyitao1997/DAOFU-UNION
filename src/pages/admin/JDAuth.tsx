import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JDAuth() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/jd-oauth/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setAuthStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/jd-oauth/authorize-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.code === 200) {
        // 打开新窗口进行授权
        const authWindow = window.open(data.data.authUrl, '_blank', 'width=800,height=600');
        
        // 监听授权完成
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval);
            // 授权窗口关闭后，重新检查授权状态
            setTimeout(() => {
              checkAuthStatus();
            }, 1000);
          }
        }, 500);
      } else {
        alert('获取授权链接失败：' + data.msg);
      }
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      alert('获取授权链接失败');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">京东联盟授权</h1>
        <p className="text-gray-600">授权后才能使用团长活动商品查询功能</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {authStatus?.authorized ? (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-600 font-medium">已授权</span>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <p>授权有效期至：{new Date(authStatus.expiresAt).toLocaleString('zh-CN')}</p>
            </div>
            <button
              onClick={handleAuthorize}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新授权
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-600 font-medium">
                {authStatus?.isExpired ? '授权已过期' : '未授权'}
              </span>
            </div>
            <div className="mb-6">
              <h3 className="font-medium mb-2">授权步骤：</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>点击下方"立即授权"按钮</li>
                <li>在弹出的窗口中登录京东联盟账号</li>
                <li>同意授权后，窗口会自动关闭</li>
                <li>返回此页面查看授权状态</li>
              </ol>
            </div>
            <button
              onClick={handleAuthorize}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              立即授权
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/admin/jd-activities')}
          className="text-blue-500 hover:text-blue-600"
        >
          → 前往活动管理
        </button>
      </div>
    </div>
  );
}
