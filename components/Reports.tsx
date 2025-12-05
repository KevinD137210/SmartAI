import React, { useState, useMemo } from 'react';
import { Transaction, Invoice, Project, Client, TransactionType, DocumentType, InvoiceStatus } from '../types';
import { FileSpreadsheet, Download, Filter, Calendar as CalendarIcon, PieChart, TrendingUp, TrendingDown, DollarSign, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface ReportsProps {
  transactions: Transaction[];
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
}

export const Reports: React.FC<ReportsProps> = ({ transactions, invoices, projects, clients }) => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Helper to filter by date
  const isWithinPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const yearMatch = date.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 'all' || (date.getMonth() + 1) === selectedMonth;
    return yearMatch && monthMatch;
  };

  const reportData = useMemo(() => {
    // 1. Process Projects
    const projectStats = projects.map(project => {
        const client = clients.find(c => c.id === project.clientId);
        
        // Income from Paid Invoices linked to this project
        const projectIncome = invoices
            .filter(inv => 
                inv.projectId === project.id && 
                inv.status === InvoiceStatus.PAID &&
                inv.type === DocumentType.INVOICE &&
                isWithinPeriod(inv.date)
            )
            .reduce((sum, inv) => sum + inv.total, 0);

        // Expenses linked to this project
        const projectExpenses = transactions
            .filter(tx => 
                tx.projectId === project.id && 
                tx.type === TransactionType.EXPENSE &&
                isWithinPeriod(tx.date)
            )
            .reduce((sum, tx) => sum + tx.amount, 0);

        return {
            id: project.id,
            projectName: project.name,
            clientName: client ? client.name : 'Unknown Client',
            status: project.status,
            income: projectIncome,
            expenses: projectExpenses,
            netIncome: projectIncome - projectExpenses
        };
    }).filter(p => p.income > 0 || p.expenses > 0); // Only show active projects in financial period

    const totalIncome = projectStats.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projectStats.reduce((sum, p) => sum + p.expenses, 0);

    return { projectStats, totalIncome, totalExpenses };
  }, [projects, clients, invoices, transactions, selectedYear, selectedMonth]);

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();

    // --- Sheet 1: Project Summary (P&L) ---
    const summaryData = reportData.projectStats.map(p => ({
        "Client": p.clientName,
        "Project Name": p.projectName,
        "Status": p.status,
        "Gross Revenue": p.income,
        "Project Expenses": p.expenses,
        "Net Income": p.netIncome
    }));

    // Add totals row
    summaryData.push({
        "Client": "TOTAL",
        "Project Name": "",
        "Status": "",
        "Gross Revenue": reportData.totalIncome,
        "Project Expenses": reportData.totalExpenses,
        "Net Income": reportData.totalIncome - reportData.totalExpenses
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Formatting widths
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Project Summary");

    // --- Sheet 2: Detailed General Ledger (For Tax Audit) ---
    // Combine Invoices (Income) and Transactions (Expenses) linked to projects
    const ledgerData: any[] = [];

    // Add Income
    invoices.forEach(inv => {
        if (inv.projectId && inv.status === InvoiceStatus.PAID && inv.type === DocumentType.INVOICE && isWithinPeriod(inv.date)) {
            const project = projects.find(p => p.id === inv.projectId);
            ledgerData.push({
                "Date": inv.date,
                "Type": "INCOME",
                "Project": project ? project.name : "Unknown Project",
                "Client/Payee": inv.clientName,
                "Category": "Sales",
                "Description": `Invoice #${inv.number}`,
                "Amount": inv.total
            });
        }
    });

    // Add Expenses
    transactions.forEach(tx => {
        if (tx.projectId && tx.type === TransactionType.EXPENSE && isWithinPeriod(tx.date)) {
            const project = projects.find(p => p.id === tx.projectId);
            ledgerData.push({
                "Date": tx.date,
                "Type": "EXPENSE",
                "Project": project ? project.name : "Unknown Project",
                "Client/Payee": tx.merchant || "N/A",
                "Category": tx.category,
                "Description": tx.description,
                "Amount": -tx.amount // Negative for expense in ledger
            });
        }
    });

    // Sort by Date
    ledgerData.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const ledgerSheet = XLSX.utils.json_to_sheet(ledgerData);
    ledgerSheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, ledgerSheet, "General Ledger");

    // Download
    const fileName = `Financial_Report_${selectedYear}_${selectedMonth === 'all' ? 'Annual' : selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-orbitron flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-500" />
                  {t('rep.title')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('rep.subtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <CalendarIcon size={16} />
                  </div>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold pl-10 pr-8 py-3 rounded-xl outline-none cursor-pointer border border-transparent focus:border-indigo-500 transition-all"
                  >
                      {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>)}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={14} />
                  </div>
              </div>

              <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Filter size={16} />
                  </div>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold pl-10 pr-8 py-3 rounded-xl outline-none cursor-pointer border border-transparent focus:border-indigo-500 transition-all"
                  >
                      <option value="all" className="bg-white dark:bg-slate-900">{t('rep.allMonths')}</option>
                      {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-900">{m}</option>)}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={14} />
                  </div>
              </div>

              <button 
                onClick={generateExcel}
                disabled={reportData.projectStats.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Download size={20} />
                  {t('rep.download')}
              </button>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs">
                  <TrendingUp size={16} />
                  {t('rep.revenue')}
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                  ${reportData.totalIncome.toLocaleString()}
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-bl-[4rem] group-hover:bg-rose-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-2 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-xs">
                  <TrendingDown size={16} />
                  {t('rep.expenses')}
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                  ${reportData.totalExpenses.toLocaleString()}
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[4rem] group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                  <DollarSign size={16} />
                  {t('rep.net')}
              </div>
              <div className={`text-3xl font-bold ${reportData.totalIncome - reportData.totalExpenses >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                  ${(reportData.totalIncome - reportData.totalExpenses).toLocaleString()}
              </div>
          </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PieChart size={20} className="text-indigo-500"/>
                  {t('rep.preview')}
              </h3>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                          <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('rep.project')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('rep.client')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('rep.revenue')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('rep.expenses')}</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('rep.net')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.projectStats.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                                  {t('rep.noData')}
                              </td>
                          </tr>
                      ) : (
                          <>
                            {reportData.projectStats.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{p.projectName}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.clientName}</td>
                                    <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                        ${p.income.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400">
                                        ${p.expenses.toLocaleString()}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${p.netIncome >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                                        ${p.netIncome.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-100 dark:border-slate-700">
                                <td colSpan={2} className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right">{t('rep.total')}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-right">${reportData.totalIncome.toLocaleString()}</td>
                                <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400 text-right">${reportData.totalExpenses.toLocaleString()}</td>
                                <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 text-right">${(reportData.totalIncome - reportData.totalExpenses).toLocaleString()}</td>
                            </tr>
                          </>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};