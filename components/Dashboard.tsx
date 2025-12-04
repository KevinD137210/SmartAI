import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Transaction, TransactionType, Invoice, InvoiceStatus, DocumentType } from '../types';
import { 
  Sparkles, Cloud, Bell, ArrowUpRight, CheckCircle, XCircle, FileText, 
  Users, Plus, Wallet, Calendar, FileBarChart, Clock, Briefcase, ChevronRight, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, invoices }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showInvalid, setShowInvalid] = useState(false);

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const now = new Date();
    const VALIDITY_DAYS = 15;

    // Filter Active Quotes: Type is Quote, Status is not Paid, and either not sent or sent within 15 days
    const activeQuotes = invoices.filter(i => {
        if (i.type !== DocumentType.QUOTATION || i.status === InvoiceStatus.PAID) return false;
        
        if (i.emailSentAt) {
            const sentDate = new Date(i.emailSentAt);
            const diffTime = Math.abs(now.getTime() - sentDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= VALIDITY_DAYS;
        }
        return true; // Drafts or not emailed yet are considered active
    }).length;

    // Filter Invalid/Expired Quotes: Type is Quote, not Paid, and Sent > 15 days ago
    const invalidCases = invoices.filter(i => {
        if (i.type !== DocumentType.QUOTATION || i.status === InvoiceStatus.PAID) return false;
        
        if (i.emailSentAt) {
            const sentDate = new Date(i.emailSentAt);
            const diffTime = Math.abs(now.getTime() - sentDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > VALIDITY_DAYS;
        }
        return false;
    }).length;

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

  // Get displayed quotes based on filter state
  const displayedQuotes = useMemo(() => {
      const allQuotes = invoices
        .filter(i => i.type === DocumentType.QUOTATION)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (showInvalid) {
          // Show only expired quotes
          return allQuotes.filter(quote => {
              const daysRemaining = getDaysRemaining(quote.emailSentAt);
              // Must be sent, not paid, and expired
              return quote.status !== InvoiceStatus.PAID && daysRemaining !== null && daysRemaining < 0;
          });
      } else {
          // Default view: Show top 5 recent (active logic usually, but here just raw recent for 'Recent Quotes' unless we specifically want to filter out expired)
          // To keep 'Recent Quotes' meaning broad, we show all, but visually distinguish them. 
          // OR, we can just show Active ones. Let's show Active + Drafts by default to contrast with Invalid.
          return allQuotes.filter(quote => {
               const daysRemaining = getDaysRemaining(quote.emailSentAt);
               // Show if not expired (null means draft/unsent, >=0 means valid) or if Paid
               return quote.status === InvoiceStatus.PAID || daysRemaining === null || daysRemaining >= 0;
          }).slice(0, 5);
      }
  }, [invoices, showInvalid]);

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

             {/* Invalid/Missed (Clickable Toggle) */}
             <div 
                onClick={() => setShowInvalid(!showInvalid)}
                className={`col-span-1 border rounded-2xl p-4 flex flex-col justify-between relative group transition-all h-24 cursor-pointer select-none ${showInvalid ? 'bg-[#3a1515] border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-900/40' : 'bg-[#2b0f0f] border-[#451a1a] hover:bg-[#2b0f0f]/80'}`}
             >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${showInvalid ? 'text-white' : 'text-rose-400'}`}>
                        {showInvalid ? t('dash.invalidQuote') : t('dash.invalid')}
                    </span>
                    <XCircle size={14} className={`${showInvalid ? 'text-white' : 'text-rose-500 opacity-70'} group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className={`text-3xl font-bold ${showInvalid ? 'text-white' : 'text-rose-100'}`}>{stats.invalidCases}</div>
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
      <div className={`bg-[#111827] rounded-[2.5rem] p-8 border transition-colors ${showInvalid ? 'border-rose-900/50' : 'border-slate-800/50'}`}>
         <div className="flex items-center gap-2 mb-6">
             {showInvalid ? <AlertCircle size={18} className="text-rose-500" /> : <Clock size={18} className="text-slate-400" />}
             <h3 className={`font-bold transition-colors ${showInvalid ? 'text-rose-100' : 'text-slate-200'}`}>
                 {showInvalid ? t('dash.viewInvalid') : t('dash.recentQuotes')}
             </h3>
         </div>
         
         {displayedQuotes.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                 <div className="p-4 bg-slate-800 rounded-full mb-4">
                     <FileText size={32} className="text-slate-600" />
                 </div>
                 <p className="text-slate-500 font-medium">
                     {showInvalid ? 'No invalid/expired quotes found.' : t('dash.createFirst')}
                 </p>
             </div>
         ) : (
             <div className="space-y-3">
                {displayedQuotes.map(quote => {
                    const daysRemaining = getDaysRemaining(quote.emailSentAt);
                    const isExpired = daysRemaining !== null && daysRemaining < 0;
                    
                    return (
                    <div 
                        key={quote.id} 
                        onClick={() => navigate('/invoices', { state: { openInvoiceId: quote.id } })}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                                isExpired ? 'bg-rose-900/20 text-rose-500' :
                                quote.status === InvoiceStatus.SENT ? 'bg-blue-900/20 text-blue-500' : 
                                'bg-slate-800 text-slate-500'
                            }`}>
                                {quote.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{quote.clientName}</h4>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span className="font-mono">{quote.number}</span>
                                    <span>•</span>
                                    <span>${quote.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {quote.emailSentAt ? (
                                isExpired ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-900/30 rounded-lg text-rose-400 text-xs font-bold border border-rose-900/50">
                                        <AlertCircle size={12} />
                                        <span>Expired</span>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <div className="text-xs text-emerald-400 font-bold">{daysRemaining} days left</div>
                                        <div className="text-[10px] text-slate-500">Validity</div>
                                    </div>
                                )
                            ) : (
                                <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 text-xs font-bold">
                                    Draft
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