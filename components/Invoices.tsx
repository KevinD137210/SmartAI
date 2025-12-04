import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, DocumentType, InvoiceStatus, Client, Project } from '../types';
import { Plus, Printer, Eye, Trash2, Edit2, ArrowLeft, Download, FileText, Users, Mail, Sparkles, Loader2, ExternalLink, Paperclip, X, Search, AlertCircle, ArrowRightCircle, Briefcase, Archive, Filter, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateInvoiceEmail } from '../services/geminiService';
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
  notes: ''
};

export const Invoices: React.FC<InvoicesProps> = ({ invoices, clients = [], projects = [], onSaveInvoice, onDeleteInvoice, onUpdateStatus, onArchiveClient, onUpdateProject }) => {
  const { t, language } = useLanguage(); 
  const { profile } = useSettings();
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
                items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
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
  }, [location, clients, invoices]);

  const handleCreateNew = () => {
    // If filtering by project, pre-fill that project
    const project = filterProjectId ? projects.find(p => p.id === filterProjectId) : undefined;
    const client = project ? clients.find(c => c.id === project.clientId) : undefined;

    setCurrentInvoice({
      ...EmptyInvoice,
      id: crypto.randomUUID(),
      number: `INV-${Date.now().toString().slice(-6)}`,
      projectId: filterProjectId || undefined,
      clientName: client ? client.name : '',
      clientEmail: client ? client.email : '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
    });
    setView('EDIT');
  };

  const handleEdit = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setView('EDIT');
  };

  const handlePreview = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setView('PREVIEW');
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSave = () => {
    const total = calculateTotal(currentInvoice.items);
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

  // --- Workflow Logic ---
  const convertToInvoice = (quote: Invoice) => {
      const newInvoice: Invoice = {
          ...quote,
          id: crypto.randomUUID(),
          number: quote.number.replace('QUO', 'INV').replace('INV', 'INV-NEW'), // simple logic, user can edit
          type: DocumentType.INVOICE,
          status: InvoiceStatus.DRAFT,
          date: new Date().toISOString().split('T')[0]
      };
      setCurrentInvoice(newInvoice);
      setView('EDIT');
  };

  const handleArchiveClient = (inv: Invoice) => {
      const client = clients.find(c => c.email === inv.clientEmail || c.name === inv.clientName);
      if (client && onArchiveClient) {
          if (confirm(`Are you sure you want to archive client "${client.name}" and complete this workflow?`)) {
              onArchiveClient(client.id);
          }
      }
  };


  // --- Email Logic ---
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
      
      // Update Invoice Status and Timestamp
      const now = new Date().toISOString();
      const updatedInvoice: Invoice = {
          ...selectedInvoiceForEmail,
          status: InvoiceStatus.SENT,
          emailSentAt: now
      };
      
      onSaveInvoice(updatedInvoice);
      
      // Update Linked Project Status if applicable
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

  // --- Printing Logic ---
  const handlePrint = () => {
    setIsPrinting(true);
    const printContent = document.getElementById('print-area');
    
    if (!printContent) {
        setIsPrinting(false);
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
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
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    body { 
                        font-family: 'Inter', sans-serif; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.parent.postMessage('printComplete', '*');
                        }, 500); 
                    }
                </script>
            </body>
            </html>
        `);
        doc.close();

        const cleanup = () => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            setIsPrinting(false);
            window.removeEventListener('message', handleMessage);
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'printComplete') {
                setTimeout(cleanup, 1000);
            }
        };
        
        window.addEventListener('message', handleMessage);
        setTimeout(cleanup, 60000); 
    }
  };

  // --- Sub-Component: Invoice Editor ---
  if (view === 'EDIT') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
        <div className="flex items-center justify-between">
            <button onClick={() => setView('LIST')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <ArrowLeft size={20} className="mr-2"/> {t('inv.back')}
            </button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {currentInvoice.id === '' ? t('inv.newDoc') : t('inv.editDoc')}
            </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-8">
            {/* Project & Type Selector */}
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.type')}</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 w-full">
                             <button
                                type="button"
                                onClick={() => setCurrentInvoice({...currentInvoice, type: DocumentType.QUOTATION, number: currentInvoice.number.replace('INV', 'QUO')})}
                                className={`flex-1 py-2 text-sm rounded-lg font-bold transition-all ${currentInvoice.type === DocumentType.QUOTATION ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {t('inv.quotation')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentInvoice({...currentInvoice, type: DocumentType.INVOICE, number: currentInvoice.number.replace('QUO', 'INV')})}
                                className={`flex-1 py-2 text-sm rounded-lg font-bold transition-all ${currentInvoice.type === DocumentType.INVOICE ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                {t('inv.invoice')}
                            </button>
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
            </div>
            
            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
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
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.number')}</label>
                        <input
                            type="text"
                            value={currentInvoice.number}
                            onChange={(e) => setCurrentInvoice({...currentInvoice, number: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.date')}</label>
                            <input
                                type="date"
                                value={currentInvoice.date}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, date: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('inv.dueDate')}</label>
                            <input
                                type="date"
                                value={currentInvoice.dueDate}
                                onChange={(e) => setCurrentInvoice({...currentInvoice, dueDate: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="font-bold text-slate-800 dark:text-white">{t('inv.items')}</h3>
                    <button onClick={addItem} className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        <Plus size={16} /> {t('inv.addItem')}
                    </button>
                </div>
                <div className="space-y-3">
                    {currentInvoice.items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    placeholder={t('inv.desc')}
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder={t('inv.itemNote')}
                                    value={item.notes || ''}
                                    onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                    className="w-full px-4 py-2 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    placeholder={t('inv.qty')}
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-right"
                                />
                            </div>
                            <div className="w-32">
                                <input
                                    type="number"
                                    placeholder={t('inv.price')}
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-right"
                                />
                            </div>
                            <div className="pt-2">
                                <button onClick={() => removeItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('inv.totalAmount')}</span>
                        <div className="text-4xl font-bold text-slate-800 dark:text-white mt-1">
                            ${calculateTotal(currentInvoice.items).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                 <button
                    onClick={() => setView('LIST')}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                >
                    {t('book.cancel')}
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
                >
                    {t('book.save')}
                </button>
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

        {/* Client Selector Modal and Alert Modal - Same as before */}
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
                                No clients found
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

  // --- Print Preview remains similar, no logic change needed there ---
  if (view === 'PREVIEW') {
     const depositAmount = currentInvoice.total * (profile.depositPercentage / 100);
      const balanceAmount = currentInvoice.total - depositAmount;

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
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                            {currentInvoice.type === DocumentType.INVOICE ? t('inv.invoice') : t('inv.quotation')}
                        </h1>
                        <p className="text-slate-500 mt-2 font-mono">#{currentInvoice.number}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{profile.companyName}</div>
                        <p className="text-slate-500 text-sm mt-1">{profile.address}</p>
                        <p className="text-slate-500 text-sm">{profile.email} | {profile.phone}</p>
                        {profile.taxId && <p className="text-slate-500 text-sm">Tax ID: {profile.taxId}</p>}
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
                        {currentInvoice.dueDate && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('inv.dueDate')}</h3>
                                <div className="font-medium text-slate-900">{currentInvoice.dueDate}</div>
                            </div>
                        )}
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
                                <td className="py-4 text-right text-slate-600">${item.unitPrice.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-slate-800">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end border-t-2 border-slate-100 pt-6">
                    <div className="w-72">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-600">{t('inv.subtotal')}</span>
                            <span className="font-medium text-slate-900">${currentInvoice.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold text-slate-800 mt-4 pb-4 border-b border-slate-100">
                            <span>{t('inv.total')}</span>
                            <span>${currentInvoice.total.toLocaleString()}</span>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{t('inv.deposit')} ({profile.depositPercentage}%)</span>
                                <span className="font-medium text-slate-900">${depositAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{t('inv.balance')} ({profile.secondPaymentPercentage}%)</span>
                                <span className="font-medium text-slate-900">${balanceAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {currentInvoice.notes && (
                    <div className="mt-16 pt-8 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 mb-2">{t('inv.notes')}</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">{currentInvoice.notes}</p>
                    </div>
                )}
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
                    {filterProjectId ? 'No invoices or quotes found for this project.' : t('inv.noDocs')}
                </p>
                {filterProjectId && (
                    <button onClick={handleCreateNew} className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Create one now
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
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{inv.clientName || 'Unknown Client'}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span>{inv.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">${inv.total.toLocaleString()}</span>
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
                        {inv.type === DocumentType.QUOTATION && (
                             <button 
                                onClick={() => convertToInvoice(inv)}
                                className="text-[10px] flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-bold"
                             >
                                 <ArrowRightCircle size={12} /> {t('inv.convertToInvoice')}
                             </button>
                        )}
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
             {/* Email Modal Content (Same as before) */}
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Sparkles size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">AI Email Composer</h3>
                      <p className="text-xs text-slate-500">Drafting for {selectedInvoiceForEmail.type === DocumentType.INVOICE ? 'Invoice' : 'Quote'} #{selectedInvoiceForEmail.number}</p>
                   </div>
                </div>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Tone</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                             {['professional', 'friendly', 'urgent'].map(tone => (
                                 <button
                                    key={tone}
                                    onClick={() => setEmailTone(tone as any)}
                                    className={`flex-1 py-2 text-xs md:text-sm rounded-lg font-bold capitalize transition-all ${emailTone === tone ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                 >
                                    {tone}
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
                        <span>Generate with AI</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                        <input 
                            type="text" 
                            value={emailDraft.subject}
                            onChange={(e) => setEmailDraft({...emailDraft, subject: e.target.value})}
                            placeholder="AI will generate subject..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Body</label>
                         <textarea 
                            rows={8}
                            value={emailDraft.body}
                            onChange={(e) => setEmailDraft({...emailDraft, body: e.target.value})}
                            placeholder="Select a tone and click Generate..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                         />
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 flex items-start gap-3">
                    <Paperclip className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-bold">Attachment Reminder</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Use the preview button to download/print the PDF first. Then, in the Gmail window, drag and drop the file to attach it.
                        </p>
                    </div>
                </div>

             </div>

             <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                 <button 
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold transition-colors"
                 >
                    Close
                 </button>
                 <button 
                    onClick={handleOpenGmail}
                    disabled={!emailDraft.body}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                 >
                    <Mail size={18} />
                    <span>Open in Gmail</span>
                    <ExternalLink size={14} className="opacity-70" />
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};