import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Transaction, TransactionType, Invoice, InvoiceStatus, DocumentType, Project } from '../types';
import { 
  Sparkles, Cloud, Bell, ArrowUpRight, CheckCircle, XCircle, FileText, 
  Users, Plus, Wallet, Calendar, FileBarChart, Clock, Briefcase, ChevronRight, AlertCircle, ShoppingBag
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  invoices: Invoice[];
  projects?: Project[];
}

type ListMode = 'QUOTES' | 'INVALID' | 'INVOICES';

export const Dashboard: React.FC<DashboardProps> = ({ transactions, invoices, projects = [] }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [listMode, setListMode] = useState<ListMode>('QUOTES');

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const now = Date.now(); // Use timestamp (milliseconds) for efficient date comparisons
    const VALIDITY_MS = 15 * 24 * 60 * 60 * 1000; // Pre-calculate validity in milliseconds

    let activeQuotes = 0;
    let invalidCases = 0;

    // Single pass through invoices for quote calculations
    for (const invoice of invoices) {
      if (invoice.type === DocumentType.QUOTATION && invoice.status !== InvoiceStatus.PAID) {
        if (invoice.emailSentAt) {
          const sentTime = new Date(invoice.emailSentAt).getTime();
          const age = now - sentTime;
          
          if (age <= VALIDITY_MS) {
            activeQuotes++;
          } else {
            invalidCases++;
          }
        } else {
          // Drafts or not emailed yet are considered active
          activeQuotes++;
        }
      }
    }

    const totalInvoices = invoices.filter(i => i.type === DocumentType.INVOICE).length;
    const closedCases = invoices.filter(i => i.status === InvoiceStatus.PAID).length;

    return { 
        netAsset: totalIncome - totalExpense, 
        activeQuotes,
        totalInvoices,
        closedCases,
        invalidCases
    };
  }, [transactions, invoices]);

  // Helper to determine validity days
  const getDaysRemaining = (emailSentAt?: string) => {
      if (!emailSentAt) return null;
      const sent = new Date(emailSentAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - sent.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remaining = 15 - diffDays;
      return remaining;
  };

  const getProjectName = (id?: string) => {
      if (!id) return null;
      return projects.find(p => p.id === id)?.name;
  };

  // Get displayed list based on filter state - Optimized
  const displayedList = useMemo(() => {
      const now = Date.now();
      const VALIDITY_MS = 15 * 24 * 60 * 60 * 1000;

      if (listMode === 'INVOICES') {
          return invoices
            .filter(i => i.type === DocumentType.INVOICE)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
      }

      // Pre-sort quotes once
      const allQuotes = invoices
        .filter(i => i.type === DocumentType.QUOTATION)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (listMode === 'INVALID') {
          // Show only expired quotes
          return allQuotes.filter(quote => {
              if (quote.status === InvoiceStatus.PAID || !quote.emailSentAt) return false;
              const age = now - new Date(quote.emailSentAt).getTime();
              return age > VALIDITY_MS;
          });
      } else {
          // QUOTES mode: Show active/draft quotes
          return allQuotes.filter(quote => {
               if (quote.status === InvoiceStatus.PAID) return true;
               if (!quote.emailSentAt) return true; // Drafts
               const age = now - new Date(quote.emailSentAt).getTime();
               return age <= VALIDITY_MS;
          }).slice(0, 5);
      }
  }, [invoices, listMode]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Status Indicators Grid - Full Width now */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
             {/* Active Quotes */}
             <div 
                onClick={() => setListMode('QUOTES')}
                className={`col-span-1 border rounded-2xl p-4 flex flex-col justify-between relative group transition-all h-24 cursor-pointer select-none ${listMode === 'QUOTES' ? 'bg-[#052e16] border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/40' : 'bg-[#052e16] border-[#14532d] hover:bg-[#052e16]/80'}`}
             >
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t('dash.activeQuotes')}</span>
                    <CheckCircle size={14} className="text-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-emerald-100">{stats.activeQuotes}</div>
             </div>

             {/* Invalid/Missed (Clickable Toggle) */}
             <div 
                onClick={() => setListMode(listMode === 'INVALID' ? 'QUOTES' : 'INVALID')}
                className={`col-span-1 border rounded-2xl p-4 flex flex-col justify-between relative group transition-all h-24 cursor-pointer select-none ${listMode === 'INVALID' ? 'bg-[#3a1515] border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-900/40' : 'bg-[#2b0f0f] border-[#451a1a] hover:bg-[#2b0f0f]/80'}`}
             >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${listMode === 'INVALID' ? 'text-white' : 'text-rose-400'}`}>
                        {listMode === 'INVALID' ? t('dash.invalidQuote') : t('dash.invalid')}
                    </span>
                    <XCircle size={14} className={`${listMode === 'INVALID' ? 'text-white' : 'text-rose-500 opacity-70'} group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className={`text-3xl font-bold ${listMode === 'INVALID' ? 'text-white' : 'text-rose-100'}`}>{stats.invalidCases}</div>
             </div>

             {/* Closed Cases */}
             <div className="col-span-1 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between relative group hover:bg-[#0f172a]/80 transition-colors h-24">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('dash.closedCases')}</span>
                    <CheckCircle size={14} className="text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-blue-100">{stats.closedCases}</div>
             </div>

              {/* Invoices (Clickable Toggle) */}
             <div 
                onClick={() => setListMode(listMode === 'INVOICES' ? 'QUOTES' : 'INVOICES')}
                className={`col-span-1 border rounded-2xl p-4 flex flex-col justify-between relative group transition-all h-24 cursor-pointer select-none ${listMode === 'INVOICES' ? 'bg-[#0c3b5e] border-cyan-500 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-900/40' : 'bg-[#0c2a42] border-[#164e63] hover:bg-[#0c2a42]/80'}`}
             >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${listMode === 'INVOICES' ? 'text-white' : 'text-cyan-400'}`}>
                        {listMode === 'INVOICES' ? t('dash.invoicesIssued') : t('dash.totalInvoices')}
                    </span>
                    <FileText size={14} className={`${listMode === 'INVOICES' ? 'text-white' : 'text-cyan-500 opacity-70'} group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className={`text-3xl font-bold ${listMode === 'INVOICES' ? 'text-white' : 'text-cyan-100'}`}>{stats.totalInvoices}</div>
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

            <Link to="/price-check" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
                    <ShoppingBag size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400 text-center leading-tight">{t('dash.itemPriceLookup')}</span>
            </Link>

            <Link to="/calendar" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.calendar')}</span>
            </Link>

            <Link to="/reports" className="flex flex-col items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] border border-slate-800 rounded-2xl py-4 transition-all group cursor-pointer">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <FileBarChart size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{t('dash.reports')}</span>
            </Link>
         </div>
      </div>

      {/* Dynamic List (Bottom Section) */}
      <div className={`bg-[#111827] rounded-[2.5rem] p-8 border transition-colors ${
          listMode === 'INVALID' ? 'border-rose-900/50' : 
          listMode === 'INVOICES' ? 'border-cyan-900/50' :
          'border-slate-800/50'
      }`}>
         <div className="flex items-center gap-2 mb-6">
             {listMode === 'INVALID' ? <AlertCircle size={18} className="text-rose-500" /> : 
              listMode === 'INVOICES' ? <FileText size={18} className="text-cyan-500" /> :
              <Clock size={18} className="text-slate-400" />}
             <h3 className={`font-bold transition-colors ${
                 listMode === 'INVALID' ? 'text-rose-100' :
                 listMode === 'INVOICES' ? 'text-cyan-100' :
                 'text-slate-200'
             }`}>
                 {listMode === 'INVALID' ? t('dash.viewInvalid') : 
                  listMode === 'INVOICES' ? t('dash.viewInvoices') :
                  t('dash.recentQuotes')}
             </h3>
         </div>
         
         {displayedList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                 <div className="p-4 bg-slate-800 rounded-full mb-4">
                     <FileText size={32} className="text-slate-600" />
                 </div>
                 <p className="text-slate-500 font-medium">
                     {listMode === 'INVALID' ? t('dash.noInvalid') : 
                      listMode === 'INVOICES' ? t('dash.noInvoices') :
                      t('dash.createFirst')}
                 </p>
             </div>
         ) : (
             <div className="space-y-3">
                {displayedList.map(item => {
                    const daysRemaining = item.type === DocumentType.QUOTATION ? getDaysRemaining(item.emailSentAt) : null;
                    const isExpired = daysRemaining !== null && daysRemaining < 0;
                    const projectName = getProjectName(item.projectId);
                    
                    return (
                    <div 
                        key={item.id} 
                        onClick={() => navigate('/invoices', { state: { openInvoiceId: item.id } })}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                                isExpired ? 'bg-rose-900/20 text-rose-500' :
                                item.type === DocumentType.INVOICE ? 'bg-cyan-900/20 text-cyan-400' :
                                item.status === InvoiceStatus.SENT ? 'bg-blue-900/20 text-blue-500' : 
                                'bg-slate-800 text-slate-500'
                            }`}>
                                {item.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.clientName}</h4>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span className="font-mono">{item.number}</span>
                                    <span>•</span>
                                    <span>${item.total.toLocaleString()}</span>
                                    {projectName && (
                                        <>
                                            <span className="mx-1 text-slate-600">|</span>
                                            <span className="text-indigo-400 flex items-center gap-1">
                                                <Briefcase size={10} /> {projectName}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {item.type === DocumentType.QUOTATION ? (
                                item.emailSentAt ? (
                                    isExpired ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-900/30 rounded-lg text-rose-400 text-xs font-bold border border-rose-900/50">
                                            <AlertCircle size={12} />
                                            <span>{t('dash.expired')}</span>
                                        </div>
                                    ) : (
                                        <div className="text-right">
                                            <div className="text-xs text-emerald-400 font-bold">{daysRemaining} {t('dash.daysLeft')}</div>
                                            <div className="text-[10px] text-slate-500">{t('dash.validity')}</div>
                                        </div>
                                    )
                                ) : (
                                    <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 text-xs font-bold">
                                        {t('inv.draft')}
                                    </div>
                                )
                            ) : (
                                <div className="px-3 py-1 bg-cyan-900/20 text-cyan-400 rounded-lg text-xs font-bold border border-cyan-900/30">
                                    {item.status}
                                </div>
                            )}
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
                        </div>
                    </div>
                )})}
             </div>
         )}
      </div>

    </div>
  );
};