import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PieChart, ShoppingBag, Menu, X, Sun, Moon, Monitor, Settings as SettingsIcon, Home, Users, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Bookkeeping } from './components/Bookkeeping';
import { Invoices } from './components/Invoices';
import { PriceCheck } from './components/PriceCheck';
import { Settings } from './components/Settings';
import { Clients } from './components/Clients';
import { Calendar } from './components/Calendar';
import { Projects } from './components/Projects';
import { Transaction, Invoice, InvoiceStatus, Client, CalendarEvent, Project } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Logo } from './components/Logo';

const NavigationLink = ({ to, icon: Icon, label, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
        isActive 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-medium tracking-wide">{label}</span>
    </Link>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
      <button 
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-600 shadow-sm text-amber-500' : 'text-slate-400'}`}
      >
        <Sun size={18} />
      </button>
      <button 
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-500' : 'text-slate-400'}`}
      >
        <Monitor size={18} />
      </button>
      <button 
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-400' : 'text-slate-400'}`}
      >
        <Moon size={18} />
      </button>
    </div>
  );
};

// Helper to get page info based on current path
const getPageInfo = (pathname: string, t: (key: string) => string) => {
    const headers: Record<string, {title: string, subtitle: string}> = {
      '/': { title: t('nav.dashboard'), subtitle: t('dash.subtitle') },
      '/bookkeeping': { title: t('book.title'), subtitle: t('book.subtitle') },
      '/invoices': { title: t('inv.title'), subtitle: t('inv.subtitle') },
      '/projects': { title: t('proj.title'), subtitle: t('proj.subtitle') },
      '/price-check': { title: t('price.title'), subtitle: t('price.subtitle') },
      '/settings': { title: t('set.title'), subtitle: t('set.subtitle') },
      '/clients': { title: t('client.title'), subtitle: t('client.subtitle') },
      '/calendar': { title: t('cal.title'), subtitle: t('cal.subtitle') },
    };
    return headers[pathname];
};

const PageHeader: React.FC<{title?: string, subtitle?: string}> = ({ title, subtitle }) => {
    if (!title) return null;
  
    return (
      <header className="hidden md:block sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 md:px-8 py-6 mb-6 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
         <div className="flex flex-col animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-orbitron">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>
         </div>
      </header>
    );
};

const MainLayout: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const pageInfo = getPageInfo(location.pathname, t);
  
  // State Persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  // Notification Permission
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Check Reminders Interval
  useEffect(() => {
    const checkReminders = () => {
        const now = new Date();
        const updatedEvents = events.map(event => {
            if (event.reminderMinutes !== undefined && !event.notified && event.date && event.time) {
                const eventTime = new Date(`${event.date}T${event.time}`);
                // Use a proper calculation for reminder time
                const reminderTime = new Date(eventTime.getTime() - event.reminderMinutes * 60000);
                
                // Calculate difference: positive if now is PAST reminderTime
                const timeDiff = now.getTime() - reminderTime.getTime();
                
                // Logic: 
                // 1. timeDiff >= 0: It is time or past time for the reminder.
                // 2. timeDiff < 30 * 60 * 1000: We are within a 30-minute window of the reminder time.
                //    This handles cases where the app was inactive or backgrounded and the precise minute was missed.
                //    It also prevents alerting for very old events (e.g. from yesterday) when opening the app.
                if (timeDiff >= 0 && timeDiff < 30 * 60 * 1000) { 
                    if (Notification.permission === 'granted') {
                         new Notification(event.title, {
                            body: event.description || `Event starting at ${event.time}`,
                            icon: '/favicon.ico',
                            requireInteraction: true // Keep notification until user interacts
                         });
                    }
                    return { ...event, notified: true };
                }
            }
            return event;
        });

        // Only update state if changes occurred to prevent infinite loop
        if (JSON.stringify(updatedEvents) !== JSON.stringify(events)) {
            setEvents(updatedEvents);
        }
    };

    // Check more frequently (10s) to be closer to "on time", but logic robust enough for throttle
    const interval = setInterval(checkReminders, 10000); 
    return () => clearInterval(interval);
  }, [events]);

  // Handlers
  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  const saveInvoice = (inv: Invoice) => {
    setInvoices(prev => {
      const exists = prev.find(i => i.id === inv.id);
      if (exists) return prev.map(i => i.id === inv.id ? inv : i);
      return [...prev, inv];
    });
  };
  const deleteInvoice = (id: string) => setInvoices(prev => prev.filter(i => i.id !== id));
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const addClient = (client: Client) => setClients(prev => [...prev, client]);
  const updateClient = (client: Client) => setClients(prev => prev.map(c => c.id === client.id ? client : c));
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  const archiveClient = (id: string) => setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'ARCHIVED' } : c));
  const restoreClient = (id: string) => setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'ACTIVE' } : c));


  const addProject = (project: Project) => setProjects(prev => [...prev, project]);
  const updateProject = (project: Project) => setProjects(prev => prev.map(p => p.id === project.id ? project : p));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  const addEvent = (event: CalendarEvent) => setEvents(prev => [...prev, event]);
  const updateEvent = (event: CalendarEvent) => setEvents(prev => prev.map(e => e.id === event.id ? event : e));
  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
        {/* Sidebar Navigation (Desktop) - Floating Island Style */}
        <aside className="hidden md:flex flex-col w-72 p-6">
            <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl shadow-indigo-500/5">
                {/* Redesigned Sidebar Header: Vertical Layout */}
                <div className="flex flex-col items-center gap-5 px-6 py-10 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="w-20 h-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/20 ring-1 ring-slate-100 dark:ring-slate-700">
                        <Logo className="w-full h-full" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold font-orbitron bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-wider">
                            SmartQxAI
                        </h1>
                        <div className="flex items-center justify-center gap-2 mt-2 opacity-60">
                            <span className="h-[1px] w-3 bg-slate-400 dark:bg-slate-500"></span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.3em] uppercase">AI Suite</p>
                            <span className="h-[1px] w-3 bg-slate-400 dark:bg-slate-500"></span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-3 mt-6 overflow-y-auto no-scrollbar">
                    <NavigationLink to="/" icon={LayoutDashboard} label={t('nav.dashboard')} />
                    <NavigationLink to="/bookkeeping" icon={PieChart} label={t('nav.bookkeeping')} />
                    <NavigationLink to="/clients" icon={Users} label={t('nav.clients')} />
                    <NavigationLink to="/projects" icon={Briefcase} label={t('nav.projects')} />
                    <NavigationLink to="/invoices" icon={FileText} label={t('nav.invoices')} />
                    <NavigationLink to="/calendar" icon={CalendarIcon} label={t('nav.calendar')} />
                    <NavigationLink to="/price-check" icon={ShoppingBag} label={t('nav.priceCheck')} />
                    <NavigationLink to="/settings" icon={SettingsIcon} label={t('nav.settings')} />
                </nav>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
                    <ThemeToggle />
                    <p className="text-xs text-slate-400 text-center">{t('nav.footer')}</p>
                </div>
            </div>
        </aside>

        {/* Mobile Header & Menu Overlay */}
        <div className="md:hidden fixed inset-0 z-40 pointer-events-none">
            {/* Header Bar */}
            <div className="pointer-events-auto absolute top-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors duration-300 relative">
                 <div className="flex items-center gap-4 overflow-hidden z-10">
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="block font-bold text-lg font-orbitron bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-wide leading-none truncate">
                            {pageInfo?.title || 'SmartQxAI'}
                        </span>
                    </div>
                </div>
                
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                     <span className="font-bold text-2xl font-orbitron text-slate-700 dark:text-slate-200 tracking-wider">
                        SmartQ x AI
                    </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 z-10">
                    <Link to="/" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <Home size={24} />
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isMobileMenuOpen && (
                <div className="pointer-events-auto absolute top-20 inset-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-50 p-6 animate-fadeIn">
                    <div className="flex justify-center mb-8">
                        <ThemeToggle />
                    </div>
                    <nav className="space-y-4">
                         <NavigationLink to="/" icon={LayoutDashboard} label={t('nav.dashboard')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/bookkeeping" icon={PieChart} label={t('nav.bookkeeping')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/clients" icon={Users} label={t('nav.clients')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/projects" icon={Briefcase} label={t('nav.projects')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/invoices" icon={FileText} label={t('nav.invoices')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/calendar" icon={CalendarIcon} label={t('nav.calendar')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/price-check" icon={ShoppingBag} label={t('nav.priceCheck')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <NavigationLink to="/settings" icon={SettingsIcon} label={t('nav.settings')} onClick={() => setIsMobileMenuOpen(false)}/>
                    </nav>
                </div>
            )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto w-full pt-20 md:pt-0 relative">
            <div className="md:h-full overflow-auto rounded-3xl no-scrollbar">
                {/* Global Page Header - Hidden on Mobile, Visible on Desktop */}
                <PageHeader title={pageInfo?.title} subtitle={pageInfo?.subtitle} />
                
                <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
                    <Routes>
                        <Route path="/" element={<Dashboard transactions={transactions} invoices={invoices} />} />
                        <Route path="/bookkeeping" element={
                            <Bookkeeping 
                                transactions={transactions} 
                                onAddTransaction={addTransaction} 
                                onDeleteTransaction={deleteTransaction} 
                            />
                        } />
                        <Route path="/invoices" element={
                            <Invoices 
                                invoices={invoices} 
                                clients={clients}
                                projects={projects}
                                onSaveInvoice={saveInvoice} 
                                onDeleteInvoice={deleteInvoice} 
                                onUpdateStatus={updateInvoiceStatus}
                                onArchiveClient={archiveClient}
                                onUpdateProject={updateProject}
                            />
                        } />
                        <Route path="/clients" element={
                            <Clients 
                                clients={clients} 
                                projects={projects}
                                onAdd={addClient} 
                                onUpdate={updateClient} 
                                onDelete={deleteClient} 
                                onArchive={archiveClient}
                                onRestore={restoreClient}
                                onAddProject={addProject}
                            />
                        } />
                        <Route path="/projects" element={
                            <Projects 
                                projects={projects}
                                clients={clients}
                                invoices={invoices}
                                onAdd={addProject}
                                onUpdate={updateProject}
                                onDelete={deleteProject}
                            />
                        } />
                        <Route path="/calendar" element={
                            <Calendar 
                                events={events}
                                onAddEvent={addEvent}
                                onUpdateEvent={updateEvent}
                                onDeleteEvent={deleteEvent}
                            />
                        } />
                        <Route path="/price-check" element={<PriceCheck />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </div>
        </main>
    </div>
  );
};

export default () => (
    <ThemeProvider>
        <SettingsProvider>
            <LanguageProvider>
                <HashRouter>
                    <MainLayout />
                </HashRouter>
            </LanguageProvider>
        </SettingsProvider>
    </ThemeProvider>
);