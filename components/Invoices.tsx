import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, DocumentType, InvoiceStatus, Client, Project } from '../types';
import { Plus, Printer, Eye, Trash2, Edit2, ArrowLeft, Download, FileText, Users, Mail, Sparkles, Loader2, ExternalLink, Paperclip, X, Search, AlertCircle, ArrowRightCircle, Briefcase, Archive, Filter, CheckCircle, Globe, CreditCard, Building, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateInvoiceEmail, translateText, generateTermsAndConditions } from '../services/geminiService';
import { useLocation, useNavigate } from 'react-router-dom';

interface InvoicesProps {
  invoices: Invoice[];
  clients?: Client[];
  projects?: Project[];
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onArchiveClient?: (clientId: string) => void;
  onUpdateProject?: (project: Project) => void;
}

const EmptyInvoice: Invoice = {
  id: '',
  number: '',
  type: DocumentType.QUOTATION,
  clientName: '',
  clientEmail: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  items: [],
  status: InvoiceStatus.DRAFT,
  total: 0,
  notes: '',
  quoteMode: 'COMPANY',
  docLanguage: 'zh-TW',
  currency: 'USD',
  taxRate: 0,
  discount: 0,
  depositPercentage: 0,
  progressPaymentPercentage: 0
};

const TRANSLATION_OPTIONS = [
    { code: 'en-US', label: 'USA', flag: '🇺🇸' },
    { code: 'zh-TW', label: 'TWN', flag: '🇹🇼' },
    { code: 'ja-JP', label: 'JPN', flag: '🇯🇵' },
    { code: 'ko-KR', label: 'KOR', flag: '🇰🇷' },
    { code: 'zh-CN', label: 'CHN', flag: '🇨🇳' },
    { code: 'en-EU', label: 'EUR', flag: '🇪🇺' },
];

const CURRENCY_OPTIONS = ['USD', 'TWD', 'JPY', 'KRW', 'CNY', 'EUR', 'HKD', 'SGD'];

export const Invoices: React.FC<InvoicesProps> = ({ invoices, clients = [], projects = [], onSaveInvoice, onDeleteInvoice, onUpdateStatus, onArchiveClient, onUpdateProject }) => {
  const { t, language } = useLanguage(); 
  const { profile, updateProfile } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<'LIST' | 'EDIT' | 'PREVIEW'>('LIST');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(EmptyInvoice);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);
  const [emailTone, setEmailTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Client Selector Modal State
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [showNoClientAlert, setShowNoClientAlert] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Translation & Terms State
  const [translationLang, setTranslationLang] = useState(language === 'zh-TW' ? 'en-US' : 'zh-TW');
  const [translatingState, setTranslatingState] = useState<{itemId: string, field: 'description' | 'notes'} | null>(null);
  const [isTranslatingDoc, setIsTranslatingDoc] = useState(false);
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);

  // Handle incoming navigation state for pre-filling or opening invoice
  useEffect(() => {
    if (location.state) {
        if (location.state.createNew) {
            const { clientId, projectId } = location.state;
            const client = clients.find(c => c.id === clientId);
            
            const newInvoice = {
                ...EmptyInvoice,
                id: crypto.randomUUID(),
                number: `QUO-${Date.now().toString().slice(-6)}`,
                type: DocumentType.QUOTATION, // Default to quote from project workflow
                clientName: client ? client.name : '',
                clientEmail: client ? client.email : '',
                projectId: projectId,
                items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
                // Initialize with profile defaults if available
                depositPercentage: profile.depositPercentage,
                progressPaymentPercentage: 0,
                docLanguage: language === 'zh-TW' ? 'zh-TW' : 'en-US',
                notes: profile.defaultTerms || ''
            };
            
            setCurrentInvoice(newInvoice);
            setView('EDIT');
            setFilterProjectId(null);
            window.history.replaceState({}, '');
        } else if (location.state.openInvoiceId) {
            const target = invoices.find(i => i.id === location.state.openInvoiceId);
            if (target) {
                setCurrentInvoice(target);
                setView('PREVIEW');
                setFilterProjectId(null);
                window.history.replaceState({}, '');
            }
        } else if (location.state.filterProjectId) {
            setFilterProjectId(location.state.filterProjectId);
            setView('LIST');
            window.history.replaceState({}, '');
        }
    }
  }, [location, clients, invoices, profile, language]);

  const handleCreateNew = () => {
    // If filtering by project, pre-fill that project
    const project = filterProjectId ? projects.find(p => p.id === filterProjectId) : undefined;
    const client = project ? clients.find(c => c.id === project.clientId) : undefined;

    setCurrentInvoice({
      ...EmptyInvoice,
      id: crypto.randomUUID(),
      number: `QUO-${Date.now().toString().slice(-6)}`, // Default to QUO for new manual entries
      projectId: filterProjectId || undefined,
      clientName: client ? client.name : '',
      clientEmail: client ? client.email : '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
      depositPercentage: profile.depositPercentage,
      docLanguage: language === 'zh-TW' ? 'zh-TW' : 'en-US',
      notes: profile.defaultTerms || ''
    });
    setView('EDIT');
  };

  const handleEdit = (inv: Invoice) => {
    setCurrentInvoice({
        ...EmptyInvoice, // Ensure new fields are present if editing old record
        ...inv
    });
    setView('EDIT');
  };

  const handlePreview = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setView('PREVIEW');
  };

  // Logic to calculate final totals based on all financials
  const calculateFinancials = () => {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const discountAmount = currentInvoice.discount || 0;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = taxableAmount * ((currentInvoice.taxRate || 0) / 100);
      const total = taxableAmount + taxAmount;
      return { subtotal, total };
  };

  const handleSave = () => {
    const { total } = calculateFinancials();

    // Save terms as default if present
    if (currentInvoice.notes) {
        updateProfile({
            ...profile,
            defaultTerms: currentInvoice.notes
        });
    }

    onSaveInvoice({ ...currentInvoice, total });
    setShowSaveSuccess(true);
    setTimeout(() => {
        setShowSaveSuccess(false);
        setView('LIST');
    }, 1500);
  };

  const addItem = () => {
    setCurrentInvoice({
      ...currentInvoice,
      items: [...currentInvoice.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (itemId: string) => {
    setCurrentInvoice({
      ...currentInvoice,
      items: currentInvoice.items.filter(i => i.id !== itemId)
    });
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    const newItems = currentInvoice.items.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setCurrentInvoice({ ...currentInvoice, items: newItems });
  };

  const handleTranslateItem = async (itemId: string, text: string, field: 'description' | 'notes') => {
      if (!text.trim()) return;
      
      setTranslatingState({ itemId, field });
      try {
          const translatedText = await translateText(text, translationLang);
          updateItem(itemId, field, translatedText);
      } catch (error) {
          console.error('Translation failed', error);
      } finally {
          setTranslatingState(null);
      }
  };

  const handleTranslateNotes = async () => {
      if (!currentInvoice.notes?.trim()) return;
      
      setTranslatingState({ itemId: 'main-notes', field: 'notes' });
      try {
          const translatedText = await translateText(currentInvoice.notes, translationLang);
          setCurrentInvoice(prev => ({ ...prev, notes: translatedText }));
      } catch (error) {
          console.error('Translation failed', error);
      } finally {
          setTranslatingState(null);
      }
  };

  // Translate all items to the Doc Language
  const handleTranslateDocument = async () => {
      if (!currentInvoice.items.length) return;
      
      setIsTranslatingDoc(true);
      try {
          const newItems = await Promise.all(currentInvoice.items.map(async (item) => {
              const newDesc = item.description ? await translateText(item.description, currentInvoice.docLanguage || 'en-US') : item.description;
              const newNotes = item.notes ? await translateText(item.notes, currentInvoice.docLanguage || 'en-US') : item.notes;
              return { ...item, description: newDesc, notes: newNotes };
          }));
          
          setCurrentInvoice(prev => ({ ...prev, items: newItems }));
      } catch (error) {
          console.error("Doc Translation Error", error);
      } finally {
          setIsTranslatingDoc(false);
      }
  };

  const handleGenerateTerms = async () => {
      if (!currentInvoice.docLanguage) return;
      setIsGeneratingTerms(true);
      // Pass user profile address to improve jurisdiction detection
      const terms = await generateTermsAndConditions(currentInvoice.docLanguage, currentInvoice.type, profile.address);
      
      // Append if there are existing notes, otherwise set
      setCurrentInvoice(prev => ({
          ...prev, 
          notes: prev.notes ? `${prev.notes}\n\n${terms}` : terms
      }));
      setIsGeneratingTerms(false);
  };

  const selectClient = (client: Client) => {
      setCurrentInvoice(prev => ({
          ...prev,
          clientName: client.name,
          clientEmail: client.email
      }));
      setIsClientSelectorOpen(false);
  };

  const handleProjectSelect = (projectId: string) => {
      if (!projectId) {
          setCurrentInvoice(prev => ({ ...prev, projectId: undefined }));
          return;
      }
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const client = clients.find(c => c.id === project.clientId);
          setCurrentInvoice(prev => ({
              ...prev,
              projectId: projectId,
              clientName: client ? client.name : prev.clientName,
              clientEmail: client ? client.email : prev.clientEmail
          }));
      }
  };

  const filteredClients = clients.filter(c => 
    c.status !== 'ARCHIVED' && 
    (c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );
  const activeProjects = projects.filter(p => p.status !== 'ARCHIVED');
  const filteredInvoices = invoices.filter(inv => !filterProjectId || inv.projectId === filterProjectId);
  const activeFilterProjectName = filterProjectId ? projects.find(p => p.id === filterProjectId)?.name : null;

  const handleArchiveClient = (inv: Invoice) => {
      const client = clients.find(c => c.email === inv.clientEmail || c.name === inv.clientName);
      if (client && onArchiveClient) {
          if (confirm(`Are you sure you want to archive client "${client.name}" and complete this workflow?`)) {
              onArchiveClient(client.id);
          }
      }
  };
  const handleOpenEmailModal = (inv: Invoice) => {
      setSelectedInvoiceForEmail(inv);
      setIsEmailModalOpen(true);
      setEmailDraft({ subject: '', body: '' });
      setEmailTone('professional');
  };
  const handleGenerateEmail = async () => {
      if (!selectedInvoiceForEmail) return;
      setIsGeneratingEmail(true);
      const result = await generateInvoiceEmail(selectedInvoiceForEmail, emailTone, language);
      setEmailDraft(result);
      setIsGeneratingEmail(false);
  };
  const handleOpenGmail = () => {
      if (!selectedInvoiceForEmail) return;
      const now = new Date().toISOString();
      const updatedInvoice: Invoice = {
          ...selectedInvoiceForEmail,
          status: InvoiceStatus.SENT,
          emailSentAt: now
      };
      onSaveInvoice(updatedInvoice);
      if (selectedInvoiceForEmail.projectId && onUpdateProject) {
          const project = projects.find(p => p.id === selectedInvoiceForEmail.projectId);
          if (project && project.status !== 'COMPLETED' && project.status !== 'ARCHIVED') {
             onUpdateProject({ ...project, status: 'QUOTE_SENT' });
          }
      }
      const { clientEmail } = selectedInvoiceForEmail;
      const { subject, body } = emailDraft;
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url, '_blank');
      setIsEmailModalOpen(false);
  };
  const handlePrint = () => {
    setIsPrinting(true);
    const printContent = document.getElementById('print-area');
    if (!printContent) { setIsPrinting(false); return; }
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${currentInvoice.type} - ${currentInvoice.number}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');body{font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}</style>
            </head>
            <body>${printContent.innerHTML}<script>window.onload=function(){setTimeout(function(){window.print();window.parent.postMessage('printComplete','*');},500);}</script></body>
            </html>
        `);
        doc.close();
        const cleanup = () => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); setIsPrinting(false); window.removeEventListener('message', handleMessage); };
        const handleMessage = (event: MessageEvent) => { if (event.data === 'printComplete') { setTimeout(cleanup, 1000); } };
        window.addEventListener('message', handleMessage); setTimeout(cleanup, 60000); 
    }
  };

  // --- Sub-Component: Invoice Editor ---
  if (view === 'EDIT') {
    const { subtotal, total } = calculateFinancials();

    return (
      <div className="max-w-[1400px] mx-auto space-y-6 animate-fadeIn pb-20">
        <div className="flex items-center justify-between">
            <button onClick={() => setView('LIST')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <ArrowLeft size={20} className="mr-2"/> {t('inv.back')}
            </button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {currentInvoice.id === '' ? t('inv.newDoc') : t('inv.editDoc')}
            </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Main Info & Items */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.type')}</label>
                            <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
                                {currentInvoice.type === DocumentType.INVOICE ? (
                                    <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <FileText size={18} />
                                        {t('inv.invoice')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                        <FileText size={18} />
                                        {t('inv.quotation')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.project')}</label>
                            <select 
                                value={currentInvoice.projectId || ''} 
                                onChange={(e) => handleProjectSelect(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                            >
                                <option value="">{t('inv.selectProject')}</option>
                                {activeProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                     </div>
                     
                     <hr className="border-slate-100 dark:border-slate-800" />

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.clientName')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={currentInvoice.clientName}
                                        onChange={(e) => setCurrentInvoice({...currentInvoice, clientName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        placeholder={t('inv.clientPlace')}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (clients.length === 0) {
                                                setShowNoClientAlert(true);
                                            } else {
                                                setClientSearchTerm('');
                                                setIsClientSelectorOpen(true);
                                            }
                                        }}
                                        className="px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                        <Users size={20} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.number')}</label>
                                <input
                                    type="text"
                                    value={currentInvoice.number}
                                    onChange={(e) => setCurrentInvoice({...currentInvoice, number: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                                />
                            </div>
                         </div>
                         
                         <div className="space-y-4">
                            <div>
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.date')}</label>
                                <input
                                    type="date"
                                    value={currentInvoice.date}
                                    onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                                />
                            </div>
                         </div>
                     </div>
                </div>

                {/* Items Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">{t('inv.items')}</h3>
                        <button onClick={addItem} className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <Plus size={16} /> {t('inv.addItem')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {currentInvoice.items.map((item) => (
                            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex-1 space-y-3 w-full">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={t('inv.desc')}
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            className="w-full pl-4 pr-32 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        />
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                            <select 
                                                value={translationLang}
                                                onChange={(e) => setTranslationLang(e.target.value)}
                                                className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 py-1 w-12 text-center outline-none cursor-pointer appearance-none"
                                            >
                                                {TRANSLATION_OPTIONS.map(opt => (
                                                    <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-800 text-left">
                                                        {opt.label} {opt.flag}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                            <button 
                                                onClick={() => handleTranslateItem(item.id, item.description, 'description')}
                                                disabled={translatingState?.itemId === item.id || !item.description}
                                                className="p-1.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                                            >
                                                {translatingState?.itemId === item.id && translatingState?.field === 'description' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <textarea
                                            placeholder={t('inv.itemNote')}
                                            value={item.notes || ''}
                                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                            className="w-full pl-4 pr-32 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-y min-h-[80px] text-sm"
                                        />
                                        <div className="absolute right-1 top-2 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                            <select 
                                                value={translationLang}
                                                onChange={(e) => setTranslationLang(e.target.value)}
                                                className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 py-1 w-12 text-center outline-none cursor-pointer appearance-none"
                                            >
                                                {TRANSLATION_OPTIONS.map(opt => (
                                                    <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-800 text-left">
                                                        {opt.label} {opt.flag}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                            <button 
                                                onClick={() => handleTranslateItem(item.id, item.notes || '', 'notes')}
                                                disabled={translatingState?.itemId === item.id || !item.notes}
                                                className="p-1.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                                            >
                                                {translatingState?.itemId === item.id && translatingState?.field === 'notes' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            placeholder={t('inv.qty')}
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-right"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            placeholder={t('inv.price')}
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-right"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button onClick={() => removeItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('inv.subtotal')}</span>
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                                {currentInvoice.currency} {subtotal.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    {/* Notes Area */}
                    <div className="pt-4">
                        <div className="flex justify-end items-end mb-2">
                            <button
                                onClick={handleGenerateTerms}
                                disabled={isGeneratingTerms}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                            >
                                {isGeneratingTerms ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {t('inv.generateTerms')}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                rows={3}
                                value={currentInvoice.notes || ''}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, notes: e.target.value})}
                                className="w-full pl-4 pr-32 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                                placeholder={t('inv.notesPlaceholder')}
                            />
                            <div className="absolute right-1 top-2 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <select 
                                    value={translationLang}
                                    onChange={(e) => setTranslationLang(e.target.value)}
                                    className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 py-1 w-12 text-center outline-none cursor-pointer appearance-none"
                                >
                                    {TRANSLATION_OPTIONS.map(opt => (
                                        <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-800 text-left">
                                            {opt.label} {opt.flag}
                                        </option>
                                    ))}
                                </select>
                                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                <button 
                                    onClick={handleTranslateNotes}
                                    disabled={translatingState?.itemId === 'main-notes' || !currentInvoice.notes}
                                    className="p-1.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                                >
                                    {translatingState?.itemId === 'main-notes' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Financials Panel (Sticky) */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                {/* ... existing code ... */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white overflow-hidden relative">
                     <div className="flex items-center gap-2 mb-6">
                         <CreditCard className="text-emerald-400" size={20} />
                         <h3 className="font-bold text-lg tracking-wide">{t('set.financial')}</h3>
                     </div>
                     
                     {/* Quote Mode Toggle */}
                     <div className="mb-6">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('inv.quoteMode')}</label>
                         <div className="flex bg-slate-800 rounded-xl p-1">
                             <button 
                                onClick={() => setCurrentInvoice({...currentInvoice, quoteMode: 'COMPANY'})}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${currentInvoice.quoteMode === 'COMPANY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                             >
                                 <Building size={14} /> {t('inv.modeCompany')}
                             </button>
                             <button 
                                onClick={() => setCurrentInvoice({...currentInvoice, quoteMode: 'INDIVIDUAL'})}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${currentInvoice.quoteMode === 'INDIVIDUAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                             >
                                 <User size={14} /> {t('inv.modeIndividual')}
                             </button>
                         </div>
                     </div>

                     {/* Doc Language & Currency */}
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                 {t('inv.docLanguage')}
                             </label>
                             <div className="flex gap-2">
                                 <select
                                     value={currentInvoice.docLanguage}
                                     onChange={(e) => setCurrentInvoice({...currentInvoice, docLanguage: e.target.value})}
                                     className="w-full bg-slate-800 text-white text-sm font-bold rounded-xl px-3 py-2.5 border border-slate-700 outline-none appearance-none"
                                 >
                                     {TRANSLATION_OPTIONS.map(opt => (
                                         <option key={opt.code} value={opt.code} className="bg-slate-800">{opt.label} {opt.flag}</option>
                                     ))}
                                 </select>
                                 <button 
                                    onClick={handleTranslateDocument}
                                    disabled={isTranslatingDoc}
                                    className="px-3 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 rounded-xl transition-colors border border-indigo-500/30"
                                    title="Translate all items to selected language"
                                 >
                                     {isTranslatingDoc ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                                 </button>
                             </div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('inv.currency')}</label>
                             <select
                                 value={currentInvoice.currency}
                                 onChange={(e) => setCurrentInvoice({...currentInvoice, currency: e.target.value})}
                                 className="w-full bg-slate-800 text-white text-sm font-bold rounded-xl px-3 py-2.5 border border-slate-700 outline-none appearance-none"
                             >
                                 {CURRENCY_OPTIONS.map(c => (
                                     <option key={c} value={c} className="bg-slate-800">{c}</option>
                                 ))}
                             </select>
                        </div>
                     </div>

                     {/* Financial Inputs */}
                     <div className="space-y-4 mb-8">
                         <div className="flex justify-between items-center">
                             <label className="text-sm text-slate-400 font-medium">{t('inv.taxRate')}</label>
                             <input 
                                type="number" 
                                min="0" 
                                value={currentInvoice.taxRate}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, taxRate: Number(e.target.value)})}
                                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:outline-none focus:border-indigo-500"
                             />
                         </div>
                         <div className="flex justify-between items-center">
                             <label className="text-sm text-slate-400 font-medium">{t('inv.discount')}</label>
                             <input 
                                type="number" 
                                min="0" 
                                value={currentInvoice.discount}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, discount: Number(e.target.value)})}
                                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:outline-none focus:border-indigo-500"
                             />
                         </div>
                         <div className="flex justify-between items-center">
                             <label className="text-sm text-slate-400 font-medium">{t('inv.depositPercent')}</label>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-500">%</span>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    max="100"
                                    value={currentInvoice.depositPercentage}
                                    onChange={(e) => setCurrentInvoice({...currentInvoice, depositPercentage: Number(e.target.value)})}
                                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:outline-none focus:border-indigo-500"
                                 />
                             </div>
                         </div>
                         <div className="flex justify-between items-center">
                             <label className="text-sm text-slate-400 font-medium">{t('inv.progressPercent')}</label>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-500">%</span>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    max="100"
                                    value={currentInvoice.progressPaymentPercentage}
                                    onChange={(e) => setCurrentInvoice({...currentInvoice, progressPaymentPercentage: Number(e.target.value)})}
                                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:outline-none focus:border-indigo-500"
                                 />
                             </div>
                         </div>
                     </div>
                     
                     {/* Grand Total */}
                     <div className="pt-6 border-t border-slate-800">
                         <div className="flex justify-between items-end">
                             <span className="text-slate-400 font-bold text-lg">{t('inv.total')}</span>
                             <div className="text-right">
                                 <div className="text-3xl font-bold text-white">{currentInvoice.currency} {total.toLocaleString()}</div>
                                 {currentInvoice.taxRate > 0 && <div className="text-xs text-slate-500 mt-1">{t('inv.includesTax')}</div>}
                             </div>
                         </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="grid grid-cols-2 gap-4 mt-8">
                        <button
                            onClick={() => setView('LIST')}
                            className="px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 font-bold transition-colors"
                        >
                            {t('book.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
                        >
                            {t('book.save')}
                        </button>
                    </div>
                </div>
            </div>

        </div>
        
        {/* Success Modal */}
        {showSaveSuccess && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800 transform scale-105">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('inv.added')}</h3>
                    </div>
                </div>
            </div>
        )}

        {/* Client Selector Modal */}
        {isClientSelectorOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('inv.selectClientTitle')}</h3>
                        <button onClick={() => setIsClientSelectorOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                 <Search size={16} />
                             </div>
                             <input 
                                type="text" 
                                placeholder={t('inv.searchClient')}
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                             />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => selectClient(client)}
                                    className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors group"
                                >
                                    <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {client.name}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {client.email || 'No Email'}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                                {t('client.noData')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {showNoClientAlert && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-scaleIn">
                 <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
                        <AlertCircle size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        {t('inv.selectClientTitle')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {t('inv.noClientsAlert')}
                    </p>
                    <button 
                        onClick={() => setShowNoClientAlert(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {t('inv.close')}
                    </button>
                 </div>
             </div>
        )}

      </div>
    );
  }

  // --- Print Preview Logic ---
  if (view === 'PREVIEW') {
     // Recalculate based on saved invoice (which now includes taxRate etc)
     const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
     const discount = currentInvoice.discount || 0;
     const taxAmount = (subtotal - discount) * ((currentInvoice.taxRate || 0) / 100);
     const total = (subtotal - discount) + taxAmount;
     
     const depositAmount = total * ((currentInvoice.depositPercentage || profile.depositPercentage) / 100);
     const balanceAmount = total - depositAmount;

     // Calculate Validity/Due Date
     const baseDate = currentInvoice.emailSentAt ? new Date(currentInvoice.emailSentAt) : new Date(currentInvoice.date);
     const dueDateObj = new Date(baseDate);
     dueDateObj.setDate(dueDateObj.getDate() + 15);
     const displayDueDate = dueDateObj.toISOString().split('T')[0];

      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
              <div className="flex items-center justify-between no-print">
                <button onClick={() => setView('LIST')} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                    <ArrowLeft size={20} className="mr-2"/> {t('inv.back')}
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint} 
                        disabled={isPrinting}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 shadow-lg disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16}/>}
                        <span>{t('inv.print')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white text-slate-900 shadow-xl rounded-none md:rounded-lg p-12 min-h-[1000px]" id="print-area">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        {/* Logo Logic: Only show if Company Mode AND logo exists */}
                        {currentInvoice.quoteMode === 'COMPANY' && profile.logo && (
                            <img src={profile.logo} alt="Company Logo" className="h-16 mb-4 object-contain" />
                        )}

                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                            {currentInvoice.type === DocumentType.INVOICE ? t('inv.invoice') : t('inv.quotation')}
                        </h1>
                        <p className="text-slate-500 mt-2 font-mono">#{currentInvoice.number}</p>
                    </div>
                    <div className="text-right">
                        {/* Name Logic: Company Name if Company Mode, Contact Name if Individual Mode */}
                        <div className="text-2xl font-bold text-indigo-600">
                            {currentInvoice.quoteMode === 'COMPANY' ? profile.companyName : profile.contactName}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{profile.address}</p>
                        <p className="text-slate-500 text-sm">{profile.email} | {profile.phone}</p>
                        
                        {/* Tax ID only for Company Mode */}
                        {currentInvoice.quoteMode === 'COMPANY' && profile.taxId && (
                            <p className="text-slate-500 text-sm">Tax ID: {profile.taxId}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-between mb-16">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('inv.billTo')}</h3>
                        <div className="text-lg font-medium text-slate-900">{currentInvoice.clientName || 'No Client Name'}</div>
                        <div className="text-slate-500">{currentInvoice.clientEmail}</div>
                    </div>
                    <div className="text-right">
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('inv.date')}</h3>
                            <div className="font-medium text-slate-900">{currentInvoice.date}</div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('inv.dueDate')}</h3>
                            <div className="font-medium text-slate-900">{displayDueDate}</div>
                        </div>
                    </div>
                </div>

                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="text-left py-3 text-sm font-semibold text-slate-600">{t('inv.desc')}</th>
                            <th className="text-right py-3 text-sm font-semibold text-slate-600">{t('inv.qty')}</th>
                            <th className="text-right py-3 text-sm font-semibold text-slate-600">{t('inv.price')}</th>
                            <th className="text-right py-3 text-sm font-semibold text-slate-600">{t('inv.total')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                                <td className="py-4 text-slate-800">
                                    <div className="font-medium">{item.description}</div>
                                    {item.notes && <div className="text-xs text-slate-500 mt-1">{item.notes}</div>}
                                </td>
                                <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                                <td className="py-4 text-right text-slate-600">{currentInvoice.currency} {item.unitPrice.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-slate-800">{currentInvoice.currency} {(item.quantity * item.unitPrice).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end border-t-2 border-slate-100 pt-6">
                    <div className="w-72 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">{t('inv.subtotal')}</span>
                            <span className="font-medium text-slate-900">{currentInvoice.currency} {subtotal.toLocaleString()}</span>
                        </div>
                        
                        {discount > 0 && (
                             <div className="flex justify-between items-center text-sm text-rose-600">
                                <span>{t('inv.discount')}</span>
                                <span>- {currentInvoice.currency} {discount.toLocaleString()}</span>
                            </div>
                        )}
                        
                        {taxAmount > 0 && (
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">{t('inv.tax')} ({currentInvoice.taxRate}%)</span>
                                <span className="font-medium text-slate-900">{currentInvoice.currency} {taxAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xl font-bold text-slate-800 mt-4 pb-4 border-b border-slate-100 border-t pt-4">
                            <span>{t('inv.total')}</span>
                            <span>{currentInvoice.currency} {total.toLocaleString()}</span>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{t('inv.deposit')} ({currentInvoice.depositPercentage || 0}%)</span>
                                <span className="font-medium text-slate-900">{currentInvoice.currency} {depositAmount.toLocaleString()}</span>
                            </div>
                             {/* Show progress payment if set > 0 */}
                             {currentInvoice.progressPaymentPercentage && currentInvoice.progressPaymentPercentage > 0 ? (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Progress Payment ({currentInvoice.progressPaymentPercentage}%)</span>
                                    <span className="font-medium text-slate-900">{currentInvoice.currency} {(total * (currentInvoice.progressPaymentPercentage / 100)).toLocaleString()}</span>
                                </div>
                             ) : null}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{t('inv.balance')}</span>
                                <span className="font-medium text-slate-900">{currentInvoice.currency} {balanceAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-8">
                    {currentInvoice.notes && (
                        <div className="pt-8 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-2">{t('inv.notes')}</h4>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{currentInvoice.notes}</p>
                        </div>
                    )}

                    {/* Signature Section */}
                    {profile.signature && (
                        <div className="flex justify-end pt-8">
                            <div className="text-center">
                                <img src={profile.signature} alt="Signature" className="h-20 object-contain mb-2 mx-auto" />
                                <div className="border-t border-slate-300 w-48"></div>
                                <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-bold">{t('inv.authorizedSignature')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )
  }

  // --- Default: List View ---
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Bar */}
      <div className="flex justify-end items-center mb-2 gap-4">
        {filterProjectId && (
            <div className="flex-1 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl text-indigo-700 dark:text-indigo-300">
                <button 
                    onClick={() => navigate('/projects', { state: { filterProjectId } })} 
                    className="p-1.5 hover:bg-indigo-200/50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors mr-1"
                    title={t('inv.backToProjects')}
                >
                    <ArrowLeft size={18} />
                </button>
                <Filter size={16} />
                <span className="font-bold text-sm">{t('inv.project')}: {activeFilterProjectName}</span>
                <button onClick={() => setFilterProjectId(null)} className="ml-auto p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full"><X size={16}/></button>
            </div>
        )}
        <button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium"
        >
          <Plus size={20} />
          <span>{t('inv.createNew')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
                    <FileText className="text-indigo-300 dark:text-indigo-600" size={48}/>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">
                    {filterProjectId ? t('inv.noDocsProject') : t('inv.noDocs')}
                </p>
                {filterProjectId && (
                    <button onClick={handleCreateNew} className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        {t('inv.createOneNow')}
                    </button>
                )}
            </div>
        ) : (
            filteredInvoices.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all group">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest ${inv.type === DocumentType.INVOICE ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                            {inv.type === DocumentType.INVOICE ? t('inv.invoice') : t('inv.quotation')}
                        </span>
                        <span className="font-mono text-slate-400 dark:text-slate-500 text-xs">#{inv.number}</span>
                        {inv.quoteMode === 'INDIVIDUAL' && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{t('inv.modeIndividual')}</span>}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{inv.clientName || 'Unknown Client'}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span>{inv.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{inv.currency || 'USD'} {inv.total.toLocaleString()}</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end w-full md:w-auto">
                    {/* Status Actions */}
                    <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto justify-end">
                        {inv.type === DocumentType.INVOICE && (
                            <select 
                                value={inv.status}
                                onChange={(e) => onUpdateStatus(inv.id, e.target.value as InvoiceStatus)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none appearance-none cursor-pointer ${
                                    inv.status === InvoiceStatus.PAID ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                                    inv.status === InvoiceStatus.SENT ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' :
                                    'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <option value={InvoiceStatus.DRAFT}>{t('inv.draft')}</option>
                                <option value={InvoiceStatus.SENT}>{t('inv.sent')}</option>
                                <option value={InvoiceStatus.PAID}>{t('inv.paid')}</option>
                            </select>
                        )}
                        
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                            {inv.projectId && (
                                <button 
                                    onClick={() => navigate('/projects', { state: { filterProjectId: inv.projectId } })}
                                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" 
                                    title={t('inv.viewProject')}
                                >
                                    <Briefcase size={18} />
                                </button>
                            )}
                             <button 
                                onClick={() => handleOpenEmailModal(inv)} 
                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" 
                                title="AI Compose Email"
                            >
                                <Mail size={18} />
                            </button>
                            <button onClick={() => handlePreview(inv)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title="Preview">
                                <Eye size={18} />
                            </button>
                            <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Workflow Actions */}
                    <div className="flex gap-2">
                        {inv.status === InvoiceStatus.PAID && (
                             <button 
                                onClick={() => handleArchiveClient(inv)}
                                className="text-[10px] flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold"
                             >
                                 <Archive size={12} /> {t('inv.archiveClient')}
                             </button>
                        )}
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

       {/* Email Modal */}
       {isEmailModalOpen && selectedInvoiceForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
             {/* Email Modal Content */}
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Sparkles size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('inv.emailComposer')}</h3>
                      <p className="text-xs text-slate-500">{t('inv.emailDrafting')} {selectedInvoiceForEmail.type === DocumentType.INVOICE ? t('inv.invoice') : t('inv.quotation')} #{selectedInvoiceForEmail.number}</p>
                   </div>
                </div>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.emailTone')}</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                             {['professional', 'friendly', 'urgent'].map(tone => (
                                 <button
                                    key={tone}
                                    onClick={() => setEmailTone(tone as any)}
                                    className={`flex-1 py-2 text-xs md:text-sm rounded-lg font-bold capitalize transition-all ${emailTone === tone ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                 >
                                    {tone === 'professional' ? t('inv.toneProfessional') : tone === 'friendly' ? t('inv.toneFriendly') : t('inv.toneUrgent')}
                                 </button>
                             ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleGenerateEmail}
                        disabled={isGeneratingEmail}
                        className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGeneratingEmail ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        <span>{t('inv.generateAI')}</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('inv.subject')}</label>
                        <input 
                            type="text" 
                            value={emailDraft.subject}
                            onChange={(e) => setEmailDraft({...emailDraft, subject: e.target.value})}
                            placeholder={t('inv.subjectPlaceholder')}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('inv.body')}</label>
                         <textarea 
                            rows={8}
                            value={emailDraft.body}
                            onChange={(e) => setEmailDraft({...emailDraft, body: e.target.value})}
                            placeholder={t('inv.bodyPlaceholder')}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                         />
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 flex items-start gap-3">
                    <Paperclip className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-bold">{t('inv.attachmentReminder')}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            {t('inv.attachmentDesc')}
                        </p>
                    </div>
                </div>

             </div>

             <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                 <button 
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold transition-colors"
                 >
                    {t('inv.close')}
                 </button>
                 <button 
                    onClick={handleOpenGmail}
                    disabled={!emailDraft.body}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                 >
                    <Mail size={18} />
                    <span>{t('inv.openGmail')}</span>
                    <ExternalLink size={14} className="opacity-70" />
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};