import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState({
    today_clicks: 0,
    today_orders: 0,
    today_commission: 0,
    month_commission: 0,
  });

  useEffect(() => {
    // In a real app, fetch from API
    // For demo, we use mock data
    setStats({
      today_clicks: 128,
      today_orders: 12,
      today_commission: 156.5,
      month_commission: 3450.2,
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">效果统计</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日点击</p>
            <p className="text-2xl font-bold text-gray-800">{stats.today_clicks}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日订单</p>
            <p className="text-2xl font-bold text-gray-800">{stats.today_orders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日预估佣金</p>
            <p className="text-2xl font-bold text-gray-800">¥{stats.today_commission.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">本月预估佣金</p>
            <p className="text-2xl font-bold text-gray-800">¥{stats.month_commission.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">近期订单</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">订单号</th>
                <th className="p-4 font-medium">商品名称</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">下单时间</th>
                <th className="p-4 font-medium">预估佣金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  暂无订单数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
