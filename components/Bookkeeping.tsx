import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, Project } from '../types';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, Tag, Loader2, MapPin, ShoppingBag, Store, X, ScanLine, Camera, Image as ImageIcon, Briefcase, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeReceipt } from '../services/geminiService';

interface BookkeepingProps {
  transactions: Transaction[];
  projects?: Project[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const CATEGORIES = {
  [TransactionType.INCOME]: ['Salary', 'Freelance', 'Investment', 'Sales', 'Other'],
  [TransactionType.EXPENSE]: ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
};

export const Bookkeeping: React.FC<BookkeepingProps> = ({ transactions, projects = [], onAddTransaction, onDeleteTransaction }) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  
  // Separate refs for Camera and File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    description: '',
    amount: 0,
    merchant: '',
    items: '',
    location: '',
    projectId: ''
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTx.amount || !newTx.description) return;

    onAddTransaction({
      id: crypto.randomUUID(),
      date: newTx.date!,
      description: newTx.description!,
      amount: Number(newTx.amount),
      type: newTx.type!,
      category: newTx.category!,
      merchant: newTx.merchant,
      items: newTx.items,
      location: newTx.location,
      projectId: newTx.projectId
    });
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTx({
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
      category: 'Food',
      description: '',
      amount: 0,
      merchant: '',
      items: '',
      location: '',
      projectId: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      try {
          const result = await analyzeReceipt(file);
          
          // Data Sanitization
          const parsedAmount = typeof result.amount === 'number' ? result.amount : parseFloat(result.amount as unknown as string) || 0;
          const parsedDate = result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date) ? result.date : new Date().toISOString().split('T')[0];

          setNewTx(prev => ({
              ...prev,
              amount: parsedAmount,
              date: parsedDate,
              description: result.items || result.merchant || prev.description, // Prioritize summarized items for main description
              merchant: result.merchant || '',
              items: result.items || '',
              location: result.location || '',
              category: result.category || prev.category,
              type: (result.type as TransactionType) || prev.type
          }));
      } catch (error) {
          console.error("Analysis failed", error);
          alert("Could not analyze receipt. Please try again.");
      } finally {
          setIsAnalyzing(false);
          // Reset inputs
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter Active Projects for selection
  const activeProjects = projects.filter(p => p.status !== 'ARCHIVED');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-3">
            <div className="flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 text-sm rounded-xl transition-all ${filterType === 'ALL' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {t('book.all')}
                </button>
                <button 
                    onClick={() => setFilterType(TransactionType.INCOME)}
                    className={`px-4 py-2 text-sm rounded-xl transition-all ${filterType === TransactionType.INCOME ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {t('book.income')}
                </button>
                <button 
                    onClick={() => setFilterType(TransactionType.EXPENSE)}
                    className={`px-4 py-2 text-sm rounded-xl transition-all ${filterType === TransactionType.EXPENSE ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {t('book.expense')}
                </button>
            </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{t('book.addNew')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('book.date')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('book.type')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('book.desc')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('book.category')}</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('book.amount')}</th>
                <th className="px-8 py-5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                                <Calendar className="text-slate-300 dark:text-slate-600" size={40} />
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 font-medium">{t('book.noTrans')}</p>
                        </div>
                    </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                    <tr 
                        key={tx.id} 
                        onClick={() => setViewTx(tx)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                    <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">{tx.date}</td>
                    <td className="px-8 py-5">
                        {tx.type === TransactionType.INCOME ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                            <ArrowUpCircle size={14} /> {t('book.income')}
                        </span>
                        ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                            <ArrowDownCircle size={14} /> {t('book.expense')}
                        </span>
                        )}
                    </td>
                    <td className="px-8 py-5">
                        <div className="text-sm text-slate-900 dark:text-white font-semibold">{tx.description}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-1">
                            {(tx.merchant || tx.location) && (
                                <div className="flex items-center gap-3">
                                    {tx.merchant && <span className="flex items-center gap-1"><Store size={10} /> {tx.merchant}</span>}
                                    {tx.location && <span className="flex items-center gap-1"><MapPin size={10} /> {tx.location}</span>}
                                </div>
                            )}
                            {tx.items && (
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                    <ShoppingBag size={10} className="shrink-0" /> 
                                    <span className="truncate max-w-[200px]">{tx.items}</span>
                                </div>
                            )}
                            {tx.projectId && (
                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <Briefcase size={10} className="shrink-0" />
                                    <span>{projects.find(p => p.id === tx.projectId)?.name}</span>
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Tag size={14} className="opacity-50"/>
                        {t(`cat.${tx.category}`)}
                    </td>
                    <td className={`px-8 py-5 text-sm font-bold text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTransaction(tx.id);
                        }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                        <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Transaction Details Modal */}
      {viewTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('book.details')}</h3>
                    <button onClick={() => setViewTx(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Amount & Date */}
                    <div className="text-center">
                        <div className={`text-4xl font-bold mb-2 ${viewTx.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {viewTx.type === TransactionType.INCOME ? '+' : ''}${viewTx.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium flex justify-center gap-2">
                            <span>{viewTx.date}</span>
                            <span>•</span>
                            <span>{t(`cat.${viewTx.category}`)}</span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('book.desc')}</label>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{viewTx.description}</p>
                        </div>
                        
                        {(viewTx.merchant || viewTx.location || viewTx.projectId) && (
                            <div className="grid grid-cols-2 gap-4">
                                {viewTx.merchant && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('book.merchant')}</label>
                                        <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Store size={14} className="text-indigo-500"/> {viewTx.merchant}
                                        </p>
                                    </div>
                                )}
                                {viewTx.location && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('book.location')}</label>
                                        <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <MapPin size={14} className="text-rose-500"/> {viewTx.location}
                                        </p>
                                    </div>
                                )}
                                {viewTx.projectId && (
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('inv.project')}</label>
                                        <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Briefcase size={14} className="text-amber-500"/> {projects.find(p => p.id === viewTx.projectId)?.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {viewTx.items && (
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('book.item')}</label>
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {viewTx.items}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8 flex flex-col max-h-[90vh] animate-scaleIn">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-30">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {t('book.modal.title')}
                </h3>
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Top Section: Dual AI Scanner & Project Selector */}
                <div className="mb-6 space-y-4">
                    {/* Scanner Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Hidden Inputs */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isAnalyzing}
                        />
                        <input 
                            type="file" 
                            ref={cameraInputRef}
                            accept="image/*"
                            capture="environment" // Forces camera on mobile
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isAnalyzing}
                        />

                        {/* Camera Button */}
                        <button 
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isAnalyzing}
                            className="relative group w-full h-28 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center gap-2 animate-pulse">
                                    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('book.analyzing')}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-2.5 bg-indigo-600 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                        <Camera size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">{t('book.cameraScan')}</span>
                                </>
                            )}
                        </button>

                        {/* Upload Button */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzing}
                            className="relative group w-full h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center gap-2 animate-pulse">
                                    <Loader2 className="animate-spin text-slate-500 dark:text-slate-400" size={24} />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('book.analyzing')}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 group-hover:scale-110 transition-transform">
                                        <ImageIcon size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('book.uploadAlbum')}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Project Selector - Always visible now */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex items-center gap-4 transition-all">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                            <Briefcase size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider block mb-1">
                                {t('book.projectExpense')}
                            </label>
                            <div className="relative">
                                <select
                                    value={newTx.projectId || ''}
                                    onChange={e => setNewTx({...newTx, projectId: e.target.value})}
                                    className="w-full bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer truncate pr-6"
                                >
                                    <option value="">{t('book.selectProjectPlaceholder')}</option>
                                    {activeProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600 dark:text-amber-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>
                        {newTx.projectId && (
                            <button 
                                onClick={() => setNewTx({...newTx, projectId: ''})}
                                className="p-1.5 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded-full text-amber-700 dark:text-amber-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <form className="space-y-6">
                    
                    {/* Row 1: Type & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                            <button
                                type="button"
                                onClick={() => setNewTx(p => ({...p, type: TransactionType.EXPENSE, category: CATEGORIES[TransactionType.EXPENSE][0]}))}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${newTx.type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <ArrowDownCircle size={16} />
                                {t('book.personalExpense')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewTx(p => ({...p, type: TransactionType.INCOME, category: CATEGORIES[TransactionType.INCOME][0]}))}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${newTx.type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <ArrowUpCircle size={16} />
                                {t('book.income')}
                            </button>
                        </div>
                        
                        <div className="relative">
                            <input
                                type="date"
                                required
                                value={newTx.date}
                                onChange={e => setNewTx({...newTx, date: e.target.value})}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold dark:scheme-dark"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Calendar size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Amount & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.amount')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={newTx.amount || ''}
                                    onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xl font-bold font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.category')}</label>
                            <div className="relative">
                                <select
                                    value={newTx.category}
                                    onChange={e => setNewTx({...newTx, category: e.target.value})}
                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold appearance-none h-[54px]"
                                >
                                    {CATEGORIES[newTx.type as TransactionType].map(c => (
                                        <option key={c} value={c}>{t(`cat.${c}`)}</option>
                                    ))}
                                </select>
                                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Merchant & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.merchant')}</label>
                            <div className="relative">
                                <Store className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={newTx.merchant}
                                    onChange={e => setNewTx({...newTx, merchant: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-medium"
                                    placeholder={t('book.placeholder.merchant')}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.location')}</label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={newTx.location}
                                    onChange={e => setNewTx({...newTx, location: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-medium"
                                    placeholder={t('book.placeholder.location')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Items */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.item')}</label>
                        <div className="relative">
                            <ShoppingBag className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                            <textarea
                                value={newTx.items}
                                onChange={e => setNewTx({...newTx, items: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-medium resize-none min-h-[80px]"
                                placeholder={t('book.placeholder.item')}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Row 5: Description (Main) */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('book.desc')}</label>
                        <input
                            type="text"
                            required
                            value={newTx.description}
                            onChange={e => setNewTx({...newTx, description: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                            placeholder={t('book.placeholder.desc')}
                        />
                    </div>

                </form>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm flex gap-4">
                <button
                    type="button"
                    onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}
                    className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                    {t('book.cancel')}
                </button>
                <button
                    onClick={() => handleSubmit()}
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-transform active:scale-95"
                >
                    {t('book.save')}
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};