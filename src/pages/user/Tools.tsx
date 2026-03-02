import React, { useState } from 'react';
import { Link as LinkIcon, Copy, CheckCircle } from 'lucide-react';

export default function Tools() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!originalUrl) return;
    
    setLoading(true);
    try {
      // In a real app, call API to generate short link
      // For demo, we just simulate a delay and return a mock link
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShortUrl(`https://daofu.com/t/${Math.random().toString(36).substring(7)}`);
      setCopied(false);
    } catch (error) {
      console.error('Failed to generate link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800">转链工具</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            原始商品链接
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="请输入淘宝/京东/拼多多商品链接..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!originalUrl || loading}
          className="w-full py-3 bg-[#1677ff] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>生成专属推广链接</span>
          )}
        </button>

        {shortUrl && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              您的专属推广链接
            </label>
            <div className="flex items-center space-x-3">
              <input 
                type="text" 
                readOnly
                value={shortUrl}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 outline-none"
              />
              <button 
                onClick={handleCopy}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
