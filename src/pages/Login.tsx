import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.code === 200) {
        localStorage.setItem('token', data.data.token);
        navigate('/dashboard');
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1677ff]">岛浮跑单联盟</h1>
          <p className="text-gray-500 mt-2">欢迎回来，请登录您的账号</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] focus:border-transparent outline-none transition-all"
              placeholder="请输入11位手机号"
              required
              pattern="^1[3-9]\d{9}$"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] focus:border-transparent outline-none transition-all"
                placeholder="请输入验证码"
                required
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                获取验证码
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          
          <div className="mt-4 text-center">
            <Link to="/admin/login" className="text-sm text-gray-400 hover:text-[#1677ff] transition-colors">
              管理员入口
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
