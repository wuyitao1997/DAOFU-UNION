import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Activity, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          setStats(data.data);
        }
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  if (!stats) return <div>Loading...</div>;

  const cards = [
    { title: '总用户数', value: stats.totalUsers, sub: `待审核: ${stats.pendingUsers}`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: '总商品数', value: stats.totalProducts, sub: `已上架: ${stats.activeProducts}`, icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50' },
    { title: '总活动数', value: stats.totalActivities, sub: `进行中: ${stats.activeActivities}`, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: '全平台有效订单', value: stats.totalOrders, sub: `预估收入: ¥${stats.totalRevenue}`, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon size={28} />
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">{card.title}</div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-4 gap-4">
          {['用户审核', '商品提报', '活动添加', '结算审核'].map((action, i) => (
            <button key={i} className="py-4 border rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#1677ff] hover:border-[#1677ff] transition-colors font-medium">
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
