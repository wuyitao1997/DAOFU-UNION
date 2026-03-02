import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, BarChart2, Link as LinkIcon, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          if (data.data.status === 'blacklisted') {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          setUser(data.data);
          if ((data.data.status === 'pending' || data.data.status === 'rejected') && location.pathname !== '/profile') {
            navigate('/profile');
          }
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { path: '/profile', icon: User, label: '个人信息' },
    { path: '/products', icon: ShoppingBag, label: '我要推广' },
    { path: '/dashboard', icon: User, label: '个人中心' },
    { path: '/stats', icon: BarChart2, label: '效果统计' },
    { path: '/tools', icon: LinkIcon, label: '转链工具' },
  ];

  if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#f4f5f7]">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-[#1677ff]">岛浮跑单联盟</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isDisabled = (user.status === 'pending' || user.status === 'rejected') && item.path !== '/profile';
            
            if (isDisabled) {
              return (
                <div
                  key={item.path}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed"
                  title="请先完成个人信息维护并等待审核"
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#1677ff] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
          <div className="text-gray-600 font-medium">
            {menuItems.find(m => location.pathname.startsWith(m.path))?.label || ''}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.nickname || '未设置昵称'} <br/>
              <span className="text-xs text-gray-400">{user.phone}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
              <span>退出</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
