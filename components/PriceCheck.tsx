import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, Tag, Sparkles } from 'lucide-react';
import { checkMarketPrice } from '../services/geminiService';
import { PriceCheckResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const PriceCheck: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceCheckResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    const data = await checkMarketPrice(query, language);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-10">
      {/* Header removed, using global header */}
      
      <div className="bg-white dark:bg-slate-900 p-3 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10 border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto mt-6">
        <form onSubmit={handleSearch} className="flex items-center relative">
          <div className="absolute left-5 text-slate-400 dark:text-slate-500">
            <Search size={22} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('price.placeholder')}
            className="flex-1 pl-14 pr-4 py-4 bg-transparent outline-none text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={20} /> 
                    <span className="hidden sm:inline">{t('price.analyzing')}</span>
                </>
            ) : t('price.button')}
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
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={16} />
              </span>
              {t('price.result')}
            </h3>
            
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