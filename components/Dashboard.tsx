import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, TransactionType, Invoice, InvoiceStatus, DocumentType } from '../types';
import { 
  Sparkles, Cloud, Bell, ArrowUpRight, CheckCircle, XCircle, FileText, 
  Users, Plus, Wallet, Calendar, FileBarChart, Clock, Briefcase
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, invoices }) => {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const activeQuotes = invoices.filter(i => i.type === DocumentType.QUOTATION).length;
    const totalInvoices = invoices.filter(i => i.type === DocumentType.INVOICE).length;
    const closedCases = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
    // Mocking "invalid/missed" as 0 for now as we don't track it explicitly
    const invalidCases = 0; 

    return { 
        netAsset: totalIncome - totalExpense, 
        activeQuotes,
        totalInvoices,
        closedCases,
        invalidCases
    };
  }, [transactions, invoices]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Status Indicators Grid - Full Width now */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
             {/* Active Quotes */}
             <div className="col-span-1 bg-[#052e16] border border-[#14532d] rounded-2xl p-4 flex flex-col justify-between relative group hover:bg-[#052e16]/80 transition-colors h-24">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t('dash.activeQuotes')}</span>
                    <CheckCircle size={14} className="text-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-emerald-100">{stats.activeQuotes}</div>
             </div>

             {/* Invalid/Missed */}
             <div className="col-span-1 bg-[#2b0f0f] border border-[#451a1a] rounded-2xl p-4 flex flex-col justify-between relative group hover:bg-[#2b0f0f]/80 transition-colors h-24">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{t('dash.invalid')}</span>
                    <XCircle size={14} className="text-rose-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-rose-100">{stats.invalidCases}</div>
             </div>

             {/* Closed Cases */}
             <div className="col-span-1 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between relative group hover:bg-[#0f172a]/80 transition-colors h-24">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('dash.closedCases')}</span>
                    <CheckCircle size={14} className="text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-blue-100">{stats.closedCases}</div>
             </div>

              {/* Invoices */}
             <div className="col-span-1 bg-[#0c2a42] border border-[#164e63] rounded-2xl p-4 flex flex-col justify-between relative group hover:bg-[#0c2a42]/80 transition-colors h-24">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{t('dash.totalInvoices')}</span>
                    <FileText size={14} className="text-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-cyan-100">{stats.totalInvoices}</div>
             </div>
        </div>
      </div>

      {/* Quick Actions - Compact Version */}
      <div>
         <div className="flex items-center gap-2 mb-4">
             <Sparkles size={18} className="text-amber-500" />
             <h3 className="font-bold text-slate-800 dark:text-white">{t('dash.quickActions')}</h3>
         </div>
         <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <Link to="/clients" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Users size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.clients')}</span>
            </Link>

            <Link to="/projects" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                    <Briefcase size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.projectStatus')}</span>
            </Link>

            <Link to="/bookkeeping" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                    <Wallet size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.ledger')}</span>
            </Link>

            <Link to="/invoices" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('inv.invoice')}</span>
            </Link>

            <Link to="/calendar" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.calendar')}</span>
            </Link>

            <div className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group cursor-pointer">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <FileBarChart size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.reports')}</span>
            </div>
         </div>
      </div>

      {/* Recent Quotes List (Bottom Section) */}
      <div className="bg-[#111827] rounded-[2.5rem] p-8 border border-slate-800/50">
         <div className="flex items-center gap-2 mb-6">
             <Clock size={18} className="text-slate-400" />
             <h3 className="font-bold text-slate-200">{t('dash.recentQuotes')}</h3>
         </div>
         
         <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
             <div className="p-4 bg-slate-800 rounded-full mb-4">
                 <FileText size={32} className="text-slate-600" />
             </div>
             <p className="text-slate-500 font-medium">{t('dash.createFirst')}</p>
         </div>
      </div>

    </div>
  );
};