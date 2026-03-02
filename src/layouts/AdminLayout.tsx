import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, LayoutDashboard, LogOut, Activity, FileText, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200 && (data.data.role === 'admin' || data.data.role === 'super_admin')) {
          setAdmin(data.data);
        } else {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: '数据概览' },
    { path: '/admin/users', icon: Users, label: '用户管理' },
    { path: '/admin/products', icon: ShoppingBag, label: '商品管理' },
    { path: '/admin/activities', icon: Activity, label: '活动管理' },
    { path: '/admin/orders', icon: FileText, label: '订单管理' },
    { path: '/admin/settlements', icon: DollarSign, label: '结算管理' },
  ];

  if (!admin) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#f4f5f7]">
      {/* Sidebar */}
      <div className="w-64 bg-[#001529] text-white flex flex-col">
        <div className="p-6 flex items-center justify-center border-b border-gray-800">
          <h1 className="text-xl font-bold">岛浮跑单联盟后台</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#1677ff] text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
              {admin.nickname} ({admin.role === 'super_admin' ? '超级管理员' : '普通管理员'})
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
          <Outlet context={{ admin }} />
        </main>
      </div>
    </div>
  );
}
