import React, { useState } from 'react';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';

export default function Tools() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError('');
    setOutputText('');
    
    try {
      // Extract the first URL from the input text
      const urlMatch = inputText.match(/https?:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : inputText;

      const token = localStorage.getItem('token');
      const res = await fetch('/api/products/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          url: url, 
          type: 'all',
          customText: inputText
        })
      });
      
      const data = await res.json();
      if (data.code === 200) {
        setOutputText(data.data.content);
      } else {
        setError(data.msg || '转链失败');
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
      setError('转链服务异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    alert('复制成功！');
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800">万能转链工具</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              万能转链推广链接：
            </label>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入包含京东商品链接的文案，例如：&#10;京东的商品详情页、频道页、活动页、店铺页&#10;支持“自定义文案+链接”" 
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1677ff] focus:border-[#1677ff] outline-none resize-none text-sm"
            />
            <div className="flex space-x-3">
              <button 
                onClick={handleGenerate}
                disabled={!inputText.trim() || loading}
                className="flex-1 py-2.5 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <span>获取推广链接</span>}
              </button>
              <button 
                onClick={handleClear}
                className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors flex justify-center items-center space-x-2"
              >
                <Trash2 size={18} />
                <span>一键清空</span>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Output Area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              转链结果：
            </label>
            <textarea 
              readOnly
              value={outputText}
              placeholder="转链成功后返回的结果，您可以根据需要修改文案。&#10;PS. 1、点击<获取推广链接>会覆盖上一次的转链结果哦~"
              className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none resize-none text-sm"
            />
            <button 
              onClick={handleCopy}
              disabled={!outputText}
              className="w-full py-2.5 bg-[#e4393c] text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
            >
              <Copy size={18} />
              <span>复 制</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
