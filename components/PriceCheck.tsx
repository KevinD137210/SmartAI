import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, Tag, Sparkles, Globe, ChevronDown } from 'lucide-react';
import { checkMarketPrice } from '../services/geminiService';
import { PriceCheckResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const PriceCheck: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  
  // Default to Taiwan if app is in Chinese, else US
  const [targetLocale, setTargetLocale] = useState(language === 'zh-TW' ? 'zh-TW' : 'en-US');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    const data = await checkMarketPrice(query, targetLocale);
    setResult(data);
    setLoading(false);
  };

  const LOCALE_OPTIONS = [
      { code: 'zh-TW', label: 'Taiwan (TWD)', flag: '🇹🇼' },
      { code: 'en-US', label: 'Global (USD)', flag: '🇺🇸' },
      { code: 'ja-JP', label: 'Japan (JPY)', flag: '🇯🇵' },
      { code: 'ko-KR', label: 'Korea (KRW)', flag: '🇰🇷' },
      { code: 'zh-CN', label: 'China (CNY)', flag: '🇨🇳' },
      { code: 'en-EU', label: 'Europe (EUR)', flag: '🇪🇺' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-10">
      {/* Header removed, using global header */}
      
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10 border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto mt-6">
        <form onSubmit={handleSearch} className="flex items-center relative gap-2">
          <div className="absolute left-5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Search size={22} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('price.placeholder')}
            className="flex-1 pl-14 pr-4 py-4 bg-transparent outline-none text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 min-w-0"
            disabled={loading}
          />
          
          {/* Country Selector */}
          <div className="relative shrink-0 hidden sm:block">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Globe size={18} />
              </div>
              <select
                  value={targetLocale}
                  onChange={(e) => setTargetLocale(e.target.value)}
                  className="appearance-none pl-10 pr-8 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  disabled={loading}
              >
                  {LOCALE_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>
                          {opt.label}
                      </option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={14} />
              </div>
          </div>

          {/* Mobile Country Selector (Icon only if needed, but here we use a compact list or standard select) */}
          <div className="sm:hidden">
               <select
                  value={targetLocale}
                  onChange={(e) => setTargetLocale(e.target.value)}
                  className="appearance-none p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xl outline-none"
                  disabled={loading}
              >
                  {LOCALE_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>
                          {opt.flag}
                      </option>
                  ))}
              </select>
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
          >
            {loading ? (
                <Loader2 className="animate-spin" size={20} /> 
            ) : (
                <span className="whitespace-nowrap">{t('price.button')}</span>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Tag size={200} />
            </div>
            
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={16} />
                </span>
                {t('price.result')}
                </h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full">
                    {LOCALE_OPTIONS.find(l => l.code === targetLocale)?.label}
                </span>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                {t('price.sources')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-all group"
                  >
                    <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <ExternalLink size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {source.title}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 font-mono">
                        {source.uri}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};