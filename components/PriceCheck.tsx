import React, { useState, useRef } from 'react';
import { Search, Loader2, ExternalLink, Tag, Sparkles, Globe, ChevronDown, Camera } from 'lucide-react';
import { checkMarketPrice, identifyProductFromImage } from '../services/geminiService';
import { PriceCheckResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

// Linkify Component to handle markdown style links [Label](URL) and raw URLs
const Linkify: React.FC<{ text: string }> = ({ text }) => {
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  
  // Split by markdown links first
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    // Link
    elements.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
      >
        {match[1]}
      </a>
    );
    lastIndex = markdownLinkRegex.lastIndex;
  }
  // Remaining text
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  // If we processed markdown links, return them.
  // Otherwise, or in addition, we might want to scan for raw URLs in the text chunks.
  // For simplicity, let's process the text parts for raw URLs if they are simple strings.
  
  const processRawUrls = (node: React.ReactNode): React.ReactNode => {
      if (typeof node !== 'string') return node;
      
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const parts = node.split(urlRegex);
      if (parts.length === 1) return node;

      return parts.map((part, i) => 
          urlRegex.test(part) ? (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">{part}</a>
          ) : part
      );
  };

  return <>{elements.map((el, i) => <React.Fragment key={i}>{processRawUrls(el)}</React.Fragment>)}</>;
};

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
    setQuery(''); // Clear previous query

    try {
        const productName = await identifyProductFromImage(file, targetLocale);
        if (productName) {
            setQuery(productName);
            // Automatically trigger search with the identified name
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
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

        <div className="bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10 border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            
            {/* Input Group: Search Icon + Input + Camera Button */}
            <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-transparent focus-within:border-indigo-500/20 focus-within:bg-slate-50 dark:focus-within:bg-slate-950 transition-all">
                <div className="pl-4 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={identifying ? t('price.identify') : t('price.placeholder')}
                    className="w-full pl-3 pr-2 py-3.5 bg-transparent outline-none text-base md:text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 min-w-0"
                    disabled={loading || identifying}
                />
                
                {/* Camera Button attached to input */}
                <div className="pr-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || identifying}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-xl"
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
            
            {/* Country Selector - Desktop */}
            <div className="relative shrink-0 hidden sm:block max-w-[150px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Globe size={16} />
                </div>
                <select
                    value={targetLocale}
                    onChange={(e) => setTargetLocale(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    disabled={loading || identifying}
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

            {/* Country Selector - Mobile (Compact Icon Only) */}
            <div className="sm:hidden relative">
                 <select
                    value={targetLocale}
                    onChange={(e) => setTargetLocale(e.target.value)}
                    className="appearance-none w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl text-xl outline-none border-none text-center cursor-pointer p-0 opacity-0"
                    disabled={loading || identifying}
                >
                    {LOCALE_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.code}>
                            {opt.flag}
                        </option>
                    ))}
                </select>
                {/* Visual Overlay for Mobile Select to show flag centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-100 dark:bg-slate-800 rounded-2xl text-xl">
                    {LOCALE_OPTIONS.find(o => o.code === targetLocale)?.flag}
                </div>
            </div>

            <button
              type="submit"
              disabled={loading || identifying || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 md:px-8 py-3.5 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
            >
              {loading || identifying ? (
                  <Loader2 className="animate-spin" size={20} /> 
              ) : (
                  <span className="whitespace-nowrap">{t('price.button')}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Result Content */}
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
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    {LOCALE_OPTIONS.find(l => l.code === targetLocale)?.flag}
                    {LOCALE_OPTIONS.find(l => l.code === targetLocale)?.label}
                </span>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              <Linkify text={result.text} />
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