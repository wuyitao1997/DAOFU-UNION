import { useOutletContext } from 'react-router-dom';
import { User, Settings, Shield, RefreshCw, Link as LinkIcon } from 'lucide-react';

export default function Dashboard() {
  const { user } = useOutletContext<any>();

  const maskString = (str: string, start: number, end: number) => {
    if (!str) return '';
    if (str.length <= start + end) return str;
    return str.substring(0, start) + '****' + str.substring(str.length - end);
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
            <span className="font-medium text-gray-800">{maskString(user.phone, 3, 4)}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">京东联盟ID</span>
            <span className="font-medium text-gray-800">{maskString(user.jd_union_id, 2, 2)}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">RID</span>
            <span className="font-medium text-gray-800">{user.rid ? maskString(user.rid, 2, 2) : '未分配'}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Acctoken</span>
            <span className="font-medium text-gray-800">********</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: RefreshCw, label: '更新联盟授权', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: LinkIcon, label: '同步推广位', color: 'text-green-500', bg: 'bg-green-50' },
          { icon: Settings, label: '账号信息编辑', color: 'text-purple-500', bg: 'bg-purple-50' },
          { icon: Shield, label: '安全设置', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((action, i) => (
          <button key={i} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center space-y-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} ${action.color}`}>
              <action.icon size={24} />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
