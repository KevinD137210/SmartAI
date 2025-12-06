import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PieChart, ShoppingBag, Menu, X, Sun, Moon, Monitor, Settings as SettingsIcon, Home, Users, Calendar as CalendarIcon, Briefcase, FileSpreadsheet, LogIn } from 'lucide-react';
import { Transaction, Invoice, InvoiceStatus, Client, CalendarEvent, Project } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Logo } from './components/Logo';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Bookkeeping = lazy(() => import('./components/Bookkeeping').then(m => ({ default: m.Bookkeeping })));
const Invoices = lazy(() => import('./components/Invoices').then(m => ({ default: m.Invoices })));
const PriceCheck = lazy(() => import('./components/PriceCheck').then(m => ({ default: m.PriceCheck })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const Clients = lazy(() => import('./components/Clients').then(m => ({ default: m.Clients })));
const Calendar = lazy(() => import('./components/Calendar').then(m => ({ default: m.Calendar })));
const Projects = lazy(() => import('./components/Projects').then(m => ({ default: m.Projects })));
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));

// Firebase & DB Service Imports
import { auth, onAuthStateChanged, signInAnonymously, User } from './services/firebase'; 
import { subscribeToCollection, saveData, deleteData } from './services/dbService';

const NavigationLink = React.memo(({ to, icon: Icon, label, onClick }: any) => {
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
});

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
      '/reports': { title: t('rep.title'), subtitle: t('rep.subtitle') },
    };
    return headers[pathname];
};

const PageHeader = React.memo<{title?: string, subtitle?: string}>(({ title, subtitle }) => {
    if (!title) return null;
  
    return (
      <header className="hidden lg:block sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 md:px-8 py-6 mb-6 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
         <div className="flex flex-col animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-orbitron">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>
         </div>
      </header>
    );
});

const MainLayout: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const pageInfo = getPageInfo(location.pathname, t);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Data State (Managed by Firestore/Offline Service)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // 1. Handle Authentication
  useEffect(() => {
    // If no Firebase config is present, auth will likely fail or hang.
    // We add a timeout fallback to ensure offline mode activates if Firebase is unresponsive.
    const offlineFallbackTimer = setTimeout(() => {
        if (!user) {
            console.log("Firebase Auth timeout - enabling offline mode");
            setUser({ uid: 'offline', isAnonymous: true } as any);
        }
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(offlineFallbackTimer);
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Auto sign-in anonymously for immediate usage
        signInAnonymously(auth).catch((error) => {
          console.warn("Anonymous auth failed, failing back to offline mode", error);
          // Fallback: Create a fake "offline" user to allow the app to function locally
          setUser({ uid: 'offline', isAnonymous: true } as any);
        });
      }
    }, (error) => {
        clearTimeout(offlineFallbackTimer);
        console.warn("Auth state change error", error);
        setUser({ uid: 'offline', isAnonymous: true } as any);
    });

    return () => {
        clearTimeout(offlineFallbackTimer);
        unsubscribe();
    };
  }, []);

  // 2. Handle Data Subscriptions (Real-time Sync)
  useEffect(() => {
    if (!user) return; // Wait for auth

    const unsubTx = subscribeToCollection<Transaction>(user.uid, 'transactions', setTransactions);
    const unsubInv = subscribeToCollection<Invoice>(user.uid, 'invoices', setInvoices);
    const unsubClients = subscribeToCollection<Client>(user.uid, 'clients', setClients);
    const unsubProjects = subscribeToCollection<Project>(user.uid, 'projects', setProjects);
    const unsubEvents = subscribeToCollection<CalendarEvent>(user.uid, 'events', setEvents);

    return () => {
      if (typeof unsubTx === 'function') unsubTx();
      if (typeof unsubInv === 'function') unsubInv();
      if (typeof unsubClients === 'function') unsubClients();
      if (typeof unsubProjects === 'function') unsubProjects();
      if (typeof unsubEvents === 'function') unsubEvents();
    };
  }, [user]);

  // Notification Permission
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Check Reminders Interval - Optimized
  useEffect(() => {
    // Early return if no events with reminders
    const eventsWithReminders = events.filter(e => 
      e.reminderMinutes !== undefined && !e.notified && e.date && e.time
    );
    
    if (eventsWithReminders.length === 0) return;

    const checkReminders = () => {
        const now = new Date();
        const nowTime = now.getTime();
        const changedEvents: CalendarEvent[] = [];
        
        // Only process events with pending reminders
        for (const event of eventsWithReminders) {
            const eventTime = new Date(`${event.date}T${event.time}`);
            const reminderTime = eventTime.getTime() - (event.reminderMinutes! * 60000);
            const timeDiff = nowTime - reminderTime;
            
            // Check if reminder should fire (within 30-minute window)
            if (timeDiff >= 0 && timeDiff < 1800000) { // 30 * 60 * 1000
                if (Notification.permission === 'granted') {
                     new Notification(event.title, {
                        body: event.description || `Event starting at ${event.time}`,
                        icon: '/favicon.ico',
                        requireInteraction: true 
                     });
                }
                changedEvents.push({ ...event, notified: true });
            }
        }

        // Batch update only changed events
        if (changedEvents.length > 0 && user) {
            changedEvents.forEach(ev => saveData(user.uid, 'events', ev.id, ev));
        }
    };

    const interval = setInterval(checkReminders, 60000); // Check every 60s (30-min window ensures no missed reminders)
    checkReminders(); // Run immediately on mount
    return () => clearInterval(interval);
  }, [events, user]);

  // Handlers - Now writing to Firestore/LocalStorage via dbService
  const addTransaction = (t: Transaction) => {
    if (user) saveData(user.uid, 'transactions', t.id, t);
  };
  const deleteTransaction = (id: string) => {
    if (user) deleteData(user.uid, 'transactions', id);
  };
  
  const saveInvoice = (inv: Invoice) => {
    if (user) saveData(user.uid, 'invoices', inv.id, inv);
  };
  const deleteInvoice = (id: string) => {
    if (user) deleteData(user.uid, 'invoices', id);
  };
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    if (user) {
        const inv = invoices.find(i => i.id === id);
        if (inv) saveData(user.uid, 'invoices', id, { ...inv, status });
    }
  };

  const addClient = (client: Client) => {
    if (user) saveData(user.uid, 'clients', client.id, client);
  };
  const updateClient = (client: Client) => {
    if (user) saveData(user.uid, 'clients', client.id, client);
  };
  const deleteClient = (id: string) => {
    if (user) deleteData(user.uid, 'clients', id);
  };
  const archiveClient = (id: string) => {
    if (user) {
        const c = clients.find(c => c.id === id);
        if (c) saveData(user.uid, 'clients', id, { ...c, status: 'ARCHIVED' });
    }
  };
  const restoreClient = (id: string) => {
    if (user) {
        const c = clients.find(c => c.id === id);
        if (c) saveData(user.uid, 'clients', id, { ...c, status: 'ACTIVE' });
    }
  };

  const addProject = (project: Project) => {
    if (user) saveData(user.uid, 'projects', project.id, project);
  };
  const updateProject = (project: Project) => {
    if (user) saveData(user.uid, 'projects', project.id, project);
  };
  const deleteProject = (id: string) => {
    if (user) deleteData(user.uid, 'projects', id);
  };

  const addEvent = (event: CalendarEvent) => {
    if (user) saveData(user.uid, 'events', event.id, event);
  };
  const updateEvent = (event: CalendarEvent) => {
    if (user) saveData(user.uid, 'events', event.id, event);
  };
  const deleteEvent = (id: string) => {
    if (user) deleteData(user.uid, 'events', id);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
        {/* Sidebar Navigation (Desktop) */}
        <aside className="hidden lg:flex flex-col w-72 p-6">
            <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl shadow-indigo-500/5">
                <Link to="/" className="flex flex-col items-center gap-5 px-6 py-10 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="w-20 h-20 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/20 ring-1 ring-slate-100 dark:ring-slate-700 group-hover:scale-105 transition-transform">
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
                </Link>

                <nav className="flex-1 px-4 space-y-3 mt-6 overflow-y-auto no-scrollbar">
                    <NavigationLink to="/settings" icon={SettingsIcon} label={t('nav.settings')} />
                </nav>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
                    <ThemeToggle />
                    {user?.uid === 'offline' && (
                        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-800">
                            OFFLINE MODE
                        </div>
                    )}
                    <p className="text-xs text-slate-400 text-center">{t('nav.footer')}</p>
                </div>
            </div>
        </aside>

        {/* Mobile Header & Menu Overlay */}
        <div className="lg:hidden fixed inset-0 z-40 pointer-events-none">
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

            {isMobileMenuOpen && (
                <div className="pointer-events-auto absolute top-20 inset-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-50 p-6 animate-fadeIn">
                    <div className="flex justify-center mb-8">
                        <ThemeToggle />
                    </div>
                    <nav className="space-y-4">
                        <NavigationLink to="/settings" icon={SettingsIcon} label={t('nav.settings')} onClick={() => setIsMobileMenuOpen(false)}/>
                    </nav>
                </div>
            )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full pt-20 lg:pt-0 relative">
            <div className="min-h-full rounded-3xl">
                <PageHeader title={pageInfo?.title} subtitle={pageInfo?.subtitle} />
                
                <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
                    {user ? (
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-pulse">
                                    <LayoutDashboard size={40} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Loading...</h2>
                                <p className="text-slate-500 dark:text-slate-400">Please wait a moment.</p>
                            </div>
                        }>
                            <Routes>
                                <Route path="/" element={<Dashboard transactions={transactions} invoices={invoices} projects={projects} />} />
                                <Route path="/bookkeeping" element={
                                    <Bookkeeping 
                                        transactions={transactions} 
                                        projects={projects}
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
                                        onSaveInvoice={saveInvoice}
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
                                <Route path="/reports" element={
                                    <Reports 
                                        transactions={transactions}
                                        invoices={invoices}
                                        projects={projects}
                                        clients={clients}
                                    />
                                } />
                                <Route path="/price-check" element={<PriceCheck />} />
                                <Route path="/settings" element={<Settings />} />
                            </Routes>
                        </Suspense>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-pulse">
                                <LogIn size={40} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Connecting to Database...</h2>
                            <p className="text-slate-500 dark:text-slate-400">Synchronizing your financial data securely.</p>
                        </div>
                    )}
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