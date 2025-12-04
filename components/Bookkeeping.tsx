import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Filter, Calendar, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BookkeepingProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const CATEGORIES = {
  [TransactionType.INCOME]: ['Salary', 'Freelance', 'Investment', 'Sales', 'Other'],
  [TransactionType.EXPENSE]: ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
};

export const Bookkeeping: React.FC<BookkeepingProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');

  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    description: '',
    amount: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.description) return;

    onAddTransaction({
      id: crypto.randomUUID(),
      date: newTx.date!,
      description: newTx.description!,
      amount: Number(newTx.amount),
      type: newTx.type!,
      category: newTx.category!
    });
    
    setIsModalOpen(false);
    setNewTx(prev => ({ ...prev, description: '', amount: 0 }));
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Actions Bar (Title removed) */}
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
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
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
                    <td className="px-8 py-5 text-sm text-slate-900 dark:text-white font-semibold">{tx.description}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Tag size={14} className="opacity-50"/>
                        {t(`cat.${tx.category}`)}
                    </td>
                    <td className={`px-8 py-5 text-sm font-bold text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                        <button
                        onClick={() => onDeleteTransaction(tx.id)}
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

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleIn border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('book.modal.title')}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.type')}</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5">
                        <button
                            type="button"
                            onClick={() => setNewTx(p => ({...p, type: TransactionType.EXPENSE, category: CATEGORIES[TransactionType.EXPENSE][0]}))}
                            className={`flex-1 py-2 text-sm rounded-lg font-bold transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            {t('book.expense')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewTx(p => ({...p, type: TransactionType.INCOME, category: CATEGORIES[TransactionType.INCOME][0]}))}
                            className={`flex-1 py-2 text-sm rounded-lg font-bold transition-all ${newTx.type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            {t('book.income')}
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.date')}</label>
                    <input
                        type="date"
                        required
                        value={newTx.date}
                        onChange={e => setNewTx({...newTx, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.desc')}</label>
                <input
                  type="text"
                  required
                  value={newTx.description}
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                  placeholder={t('book.placeholder.desc')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.amount')}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                        <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newTx.amount}
                        onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.category')}</label>
                    <select
                        value={newTx.category}
                        onChange={e => setNewTx({...newTx, category: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                    >
                        {CATEGORIES[newTx.type as TransactionType].map(c => (
                            <option key={c} value={c}>{t(`cat.${c}`)}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                >
                  {t('book.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95"
                >
                  {t('book.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};