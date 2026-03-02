import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, RefreshCw, Copy, Link as LinkIcon } from 'lucide-react';

export default function Products() {
  const { user } = useOutletContext<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [category, setCategory] = useState('');
  const [minCommission, setMinCommission] = useState('');
  const [maxCommission, setMaxCommission] = useState('');
  const [sort, setSort] = useState('created_desc');

  const categories = ['全部', 'T恤', '个人护理', '休闲食品', '家用电器', '手机通讯', '电脑办公', '美妆护肤'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        size: '12',
        category,
        minCommission,
        maxCommission,
        sort
      });
      const res = await fetch(`/api/products?${query}`);
      const data = await res.json();
      if (data.code === 200) {
        setProducts(data.data.list);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, sort]);

  const handleConvert = async (product: any, type: 'all' | 'link') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/products/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: product.id, type })
      });
      const data = await res.json();
      if (data.code === 200) {
        navigator.clipboard.writeText(data.data.content);
        alert('复制成功！');
      }
    } catch (err) {
      alert('转链失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        {/* Categories */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === '全部' ? '' : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                (category === cat || (cat === '全部' && !category))
                  ? 'bg-[#1677ff] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">佣金比例</span>
              <input type="number" value={minCommission} onChange={e => setMinCommission(e.target.value)} className="w-16 px-2 py-1 border rounded text-sm" placeholder="%" />
              <span className="text-gray-400">-</span>
              <input type="number" value={maxCommission} onChange={e => setMaxCommission(e.target.value)} className="w-16 px-2 py-1 border rounded text-sm" placeholder="%" />
            </div>
            
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-white outline-none">
              <option value="created_desc">综合排序</option>
              <option value="commission_desc">佣金比例降序</option>
              <option value="service_desc">服务费比例降序</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => fetchProducts()} className="px-4 py-1.5 bg-[#1677ff] text-white rounded-lg text-sm font-medium flex items-center space-x-1 hover:bg-blue-600">
              <Search size={16} />
              <span>查询</span>
            </button>
            <button onClick={() => { setMinCommission(''); setMaxCommission(''); setSort('created_desc'); }} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center space-x-1 hover:bg-gray-200">
              <RefreshCw size={16} />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">暂无商品数据</div>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-square bg-gray-100 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                )}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  佣金 {product.commission_rate}%
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-800 line-clamp-2 mb-2" title={product.title}>{product.title}</h3>
                <div className="text-xs text-gray-500 mb-3">{product.shop_name || '京东自营'}</div>
                
                <div className="mt-auto">
                  {product.promotion_copy && (
                    <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded line-clamp-2" title={product.promotion_copy}>
                      {product.promotion_copy}
                    </div>
                  )}
                  <div className="flex items-end space-x-2 mb-4">
                    <span className="text-sm text-gray-500">到手价</span>
                    <span className="text-xl font-bold text-red-500">¥{product.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                    <div>
                      <span className="block mb-1">服务费比例</span>
                      <span className="font-medium text-gray-800">{product.system_service_fee}%</span>
                    </div>
                    <div className="text-right">
                      <span className="block mb-1">推广时间</span>
                      <span className="font-medium text-gray-800">{new Date(product.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleConvert(product, 'all')}
                    className="w-full py-2 bg-[#1677ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <LinkIcon size={16} />
                    <span>一键转链</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
          <span className="text-sm text-gray-500">
            共 {total} 条商品，当前第 {page} 页
          </span>
          <div className="flex space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button 
              disabled={page * 12 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
