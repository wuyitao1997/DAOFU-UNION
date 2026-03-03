import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalError, setModalError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const query = new URLSearchParams({ page: page.toString(), size: '20' });
      const res = await fetch(`/api/admin/products?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
  }, [page]);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    shop_name: '',
    original_price: '',
    price: '',
    commission_rate: '',
    system_service_fee: '',
    start_time: '',
    end_time: '',
    memo: '',
    promotion_copy: '',
    image_url: ''
  });

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setFormData({ ...formData, id });
    
    if (id && id.length > 5) {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`/api/admin/products/jd-info/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.code === 200 && data.data) {
          setFormData(prev => ({ 
            ...prev, 
            title: data.data.title || prev.title,
            image_url: data.data.image_url || prev.image_url
          }));
        }
      } catch (err) {
        console.error('Failed to fetch JD info:', err);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.code === 200) {
        setShowAddModal(false);
        setEditingProduct(null);
        setFormData({
          id: '', title: '', shop_name: '', original_price: '', price: '', commission_rate: '',
          system_service_fee: '', start_time: '', end_time: '', memo: '', promotion_copy: '', image_url: ''
        });
        fetchProducts();
      } else {
        setModalError(data.msg || (editingProduct ? '更新失败' : '添加失败'));
      }
    } catch (err) {
      console.error(err);
      setModalError(editingProduct ? '更新失败，请重试' : '添加失败，请重试');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setModalError('');
    setFormData({
      id: product.id,
      title: product.title,
      shop_name: product.shop_name || '',
      original_price: product.original_price || '',
      price: product.price,
      commission_rate: product.commission_rate,
      system_service_fee: product.system_service_fee,
      start_time: product.start_time || '',
      end_time: product.end_time || '',
      memo: product.memo || '',
      promotion_copy: product.promotion_copy || '',
      image_url: product.image_url || ''
    });
    setShowAddModal(true);
  };

  const handleToggleStatus = async (product: any) => {
    setSelectedProduct(product);
    setShowStatusModal(true);
    setModalError('');
  };

  const confirmToggleStatus = async () => {
    if (!selectedProduct) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: selectedProduct.status === 'active' ? 'inactive' : 'active' })
      });
      const data = await res.json();
      if (data.code === 200) {
        fetchProducts();
        setShowStatusModal(false);
        setSelectedProduct(null);
      } else {
        setModalError(data.msg);
      }
    } catch (err) {
      console.error(err);
      setModalError('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">商品管理</h2>
        <div className="flex items-center space-x-4">
          <button onClick={() => { setShowAddModal(true); setModalError(''); }} className="px-4 py-2 bg-[#1677ff] text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors">
            <Plus size={18} />
            <span>手动提报商品</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-4 font-medium">商品ID</th>
                <th className="p-4 font-medium">标题</th>
                <th className="p-4 font-medium">推广文案</th>
                <th className="p-4 font-medium">店铺</th>
                <th className="p-4 font-medium">到手价</th>
                <th className="p-4 font-medium">佣金比例</th>
                <th className="p-4 font-medium">系统服务费</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">来源</th>
                <th className="p-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-gray-500">加载中...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-gray-500">暂无数据</td></tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-800">{product.id}</td>
                    <td className="p-4 text-sm text-gray-800 max-w-xs truncate" title={product.title}>{product.title}</td>
                    <td className="p-4 text-sm text-gray-800 max-w-xs truncate" title={product.promotion_copy}>{product.promotion_copy || '-'}</td>
                    <td className="p-4 text-sm text-gray-800">{product.shop_name}</td>
                    <td className="p-4 text-sm text-red-500 font-medium">¥{product.price}</td>
                    <td className="p-4 text-sm text-gray-800">{product.commission_rate}%</td>
                    <td className="p-4 text-sm text-gray-800">{product.system_service_fee}%</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.status === 'active' ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{product.source === 'manual' ? '手动提报' : '自动兜底'}</td>
                    <td className="p-4 text-sm space-x-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700">编辑</button>
                      <button onClick={() => handleToggleStatus(product)} className={`${product.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}>
                        {product.status === 'active' ? '下架' : '上架'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>共 {total} 条数据，当前第 {page} 页</span>
            <div className="flex space-x-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {showStatusModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              确定要{selectedProduct.status === 'active' ? '下架' : '上架'}该商品吗？
            </h3>
            <p className="text-gray-600 mb-6">
              商品ID: {selectedProduct.id} <br/>
              商品标题: {selectedProduct.title}
            </p>
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
                {modalError}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedProduct(null);
                  setModalError('');
                }}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmToggleStatus}
                className={`px-4 py-2 text-white rounded-lg ${selectedProduct.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                确定{selectedProduct.status === 'active' ? '下架' : '上架'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">{editingProduct ? '编辑商品' : '手动提报商品'}</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setEditingProduct(null);
                setFormData({
                  id: '', title: '', shop_name: '', original_price: '', price: '', commission_rate: '',
                  system_service_fee: '', start_time: '', end_time: '', memo: '', promotion_copy: '', image_url: ''
                });
              }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品ID <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.id} onChange={handleIdChange} disabled={!!editingProduct} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff] disabled:bg-gray-100 disabled:text-gray-500" placeholder="输入商品ID自动获取标题" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">店铺名称</label>
                  <input type="text" value={formData.shop_name} onChange={e => setFormData({...formData, shop_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品标题 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">京东原价</label>
                  <input type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">到手价 <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例(%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">系统服务费(%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required value={formData.system_service_fee} onChange={e => setFormData({...formData, system_service_fee: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">推广开始时间</label>
                  <input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">推广结束时间</label>
                  <input type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片链接</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" placeholder="输入商品ID后自动获取，或手动输入" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">推广文案</label>
                  <textarea value={formData.promotion_copy} onChange={e => setFormData({...formData, promotion_copy: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#1677ff]" rows={3} placeholder="请输入推广文案，前台用户可见" />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-4 border-t">
                {modalError && (
                  <div className="flex-1 text-sm text-red-500 bg-red-50 p-2 rounded-lg flex items-center">
                    {modalError}
                  </div>
                )}
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  setModalError('');
                  setFormData({
                    id: '', title: '', shop_name: '', original_price: '', price: '', commission_rate: '',
                    system_service_fee: '', start_time: '', end_time: '', memo: '', promotion_copy: '', image_url: ''
                  });
                }} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-[#1677ff] text-white rounded-lg hover:bg-blue-600">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
