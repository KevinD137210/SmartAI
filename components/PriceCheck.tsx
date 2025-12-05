import React, { useState, useRef } from 'react';
import { Search, Loader2, ExternalLink, Tag, Sparkles, Globe, ChevronDown, Camera, ShoppingBag, ArrowRight } from 'lucide-react';
import { checkMarketPrice, identifyProductFromImage } from '../services/geminiService';
import { PriceCheckResult, PriceItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const PriceCheck: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default to US unless language is strictly TW
  const [targetLocale, setTargetLocale] = useState(language === 'zh-TW' ? 'zh-TW' : 'en-US');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    const data = await checkMarketPrice(query, targetLocale);
    setResult(data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdentifying(true);
    setResult(null);
    setQuery(''); 

    try {
        const productName = await identifyProductFromImage(file, targetLocale);
        if (productName) {
            setQuery(productName);
            setIdentifying(false);
            setLoading(true);
            const data = await checkMarketPrice(productName, targetLocale);
            setResult(data);
            setLoading(false);
        } else {
            setIdentifying(false);
            alert("Could not identify the item. Please try again or type manually.");
        }
    } catch (error) {
        console.error("Image identification failed", error);
        setIdentifying(false);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFallbackSearchUrl = (item: PriceItem) => {
      const searchQuery = encodeURIComponent(`${item.merchant} ${item.title}`);
      return `https://www.google.com/search?q=${searchQuery}`;
  };

  const LOCALE_OPTIONS = [
      { code: 'en-US', label: 'USA', flag: '🇺🇸' },
      { code: 'zh-TW', label: 'Taiwan', flag: '🇹🇼' },
      { code: 'ja-JP', label: 'Japan', flag: '🇯🇵' },
      { code: 'ko-KR', label: 'Korea', flag: '🇰🇷' },
      { code: 'en-EU', label: 'Europe', flag: '🇪🇺' },
      { code: 'zh-HK', label: 'Hong Kong', flag: '🇭🇰' },
      { code: 'en-SG', label: 'Singapore', flag: '🇸🇬' },
      { code: 'zh-CN', label: 'China', flag: '🇨🇳' },
      { code: 'ru-RU', label: 'Russia', flag: '🇷🇺' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-10">
      
      <div className="max-w-3xl mx-auto mt-6">
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-3 font-medium animate-fadeIn">
            {t('price.helper')}
        </p>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-3">
            
            <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                <div className="pl-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Search size={22} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={identifying ? t('price.identify') : t('price.placeholder')}
                    className="w-full pl-3 pr-2 py-4 bg-transparent outline-none text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 min-w-0"
                    disabled={loading || identifying}
                />
                
                <div className="pr-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || identifying}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-xl"
                        title={t('price.photoSearch')}
                    >
                        {identifying ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20} />}
                    </button>
                </div>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
            />
            
            <div className="flex gap-3 h-full">
                {/* Country Selector */}
                <div className="relative shrink-0 w-full sm:w-[160px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10">
                        <Globe size={18} />
                    </div>
                    <select
                        value={targetLocale}
                        onChange={(e) => setTargetLocale(e.target.value)}
                        className="appearance-none w-full h-full pl-10 pr-10 py-4 bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-base font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        disabled={loading || identifying}
                    >
                        {LOCALE_OPTIONS.map(opt => (
                            <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-900">
                                {opt.flag} {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={16} />
                    </div>
                </div>

                <button
                type="submit"
                disabled={loading || identifying || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
                >
                {loading || identifying ? (
                    <Loader2 className="animate-spin" size={22} /> 
                ) : (
                    <span className="whitespace-nowrap text-lg">{t('price.button')}</span>
                )}
                </button>
            </div>
          </form>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="text-indigo-500" size={22} />
                {t('price.result')}
             </h3>
             <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {result.items ? `${result.items.length} ${t('price.optionsFound')}` : t('price.checking')}
             </span>
          </div>

          {/* Primary Results: Structured Items */}
          {result.items && result.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
                      >
                         <div className="mb-4">
                             <div className="flex justify-between items-start gap-4 mb-2">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-2 leading-tight">
                                    {item.title}
                                </h4>
                                <a 
                                    href={getFallbackSearchUrl(item)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-300 dark:text-slate-600 shrink-0 hover:text-indigo-500 transition-colors p-1"
                                    title="Search on Google if link is broken"
                                >
                                    <Search size={18} />
                                </a>
                             </div>
                             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <ShoppingBag size={12} className="text-indigo-500" /> {item.merchant}
                             </div>
                         </div>
                         <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                             <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                 {item.price}
                             </div>
                             <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                             >
                                 {t('price.buyNow')} <ArrowRight size={14} />
                             </a>
                         </div>
                      </div>
                  ))}
              </div>
          ) : (
             // Fallback to text if structured parsing failed
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-800">
                <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                    {result.text}
                </div>
             </div>
          )}

          {/* Secondary Sources (Grounding) */}
          {result.sources.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
                {t('price.sources')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all truncate max-w-[240px]"
                  >
                    <Globe size={12} />
                    <span className="truncate">{source.title}</span>
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