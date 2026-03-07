import { useState } from 'react';

export default function AdminOrderSync() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    if (!startTime || !endTime) {
      alert('请选择开始时间和结束时间');
      return;
    }

    if (!confirm('确定要同步订单数据吗？')) return;

    setSyncing(true);
    setResult(null);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/jd-orders/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime,
          endTime,
          pageNo: 1,
          pageSize: 500
        })
      });

      const data = await res.json();

      if (data.code === 200) {
        setResult(data.data);
        alert(`同步成功！共同步 ${data.data.syncCount} 条订单`);
      } else {
        alert('同步失败：' + data.msg);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert('同步失败：' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">订单同步</h1>
        <p className="text-gray-600">从京东联盟同步订单数据</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {syncing ? '同步中...' : '开始同步'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">同步结果</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>同步订单数：{result.syncCount}</li>
              <li>当前页码：{result.pageNo}</li>
              <li>是否还有更多：{result.hasMore ? '是' : '否'}</li>
            </ul>
            {result.hasMore && (
              <p className="mt-2 text-sm text-orange-600">
                ⚠️ 还有更多数据，请继续同步下一页
              </p>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <h3 className="font-medium mb-2">使用说明：</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>选择要同步的时间范围（建议不超过3个月）</li>
            <li>每次最多同步500条订单</li>
            <li>如果有更多数据，需要多次同步</li>
            <li>订单数据会自动关联到用户的RID</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
