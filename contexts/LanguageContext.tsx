import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh-TW';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  'en': {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.bookkeeping': 'Bookkeeping',
    'nav.invoices': 'Invoices & Quotes',
    'nav.projects': 'Projects',
    'nav.priceCheck': 'Price Check AI',
    'nav.settings': 'Settings',
    'nav.clients': 'Client List',
    'nav.calendar': 'Calendar',
    'nav.footer': '© 2025 SmartQxAI',

    // Dashboard
    'dash.welcome': 'Good Evening,',
    'dash.user': 'User',
    'dash.quote': 'Your time is limited, don\'t waste it.',
    'dash.weather': 'Local Weather',
    'dash.weather.desc': 'Cloudy',
    'dash.event': 'Christmas',
    'dash.days': 'Days',
    'dash.netAsset': 'Net Assets',
    'dash.activeQuotes': 'Active Quotes',
    'dash.invalid': 'Invalid/Missed',
    'dash.closedCases': 'Closed Cases',
    'dash.totalInvoices': 'Invoices',
    'dash.quickActions': 'Quick Actions',
    'dash.recentQuotes': 'Recent Quotes',
    'dash.clients': 'Clients',
    'dash.newQuote': 'New Quote',
    'dash.projectStatus': 'Project Status',
    'dash.ledger': 'Ledger',
    'dash.calendar': 'Calendar',
    'dash.reports': 'Reports',
    'dash.createFirst': 'No quotes yet. Create your first one!',
    'dash.compare': 'vs Last Month',
    'dash.netBalance': 'Net Balance',
    'dash.totalIncome': 'Total Income',
    'dash.totalExpense': 'Total Expenses',
    'dash.pendingInvoices': 'Pending Invoices',
    'dash.unpaidAmount': 'Unpaid amount',
    'dash.cashFlow': 'Cash Flow Overview',
    'dash.noData': 'No transaction data available yet.',
    'dash.chart.income': 'Income',
    'dash.chart.expense': 'Expense',
    'dash.subtitle': 'Welcome back to your financial command center.',

    // Bookkeeping
    'book.title': 'Transactions',
    'book.subtitle': 'Track your daily income and expenses.',
    'book.addNew': 'Add New',
    'book.all': 'All',
    'book.income': 'Income',
    'book.expense': 'Expense',
    'book.date': 'Date',
    'book.type': 'Type',
    'book.desc': 'Description',
    'book.category': 'Category',
    'book.amount': 'Amount',
    'book.noTrans': 'No transactions found. Add one to get started.',
    'book.modal.title': 'Add Transaction',
    'book.placeholder.desc': 'e.g. Monthly Rent',
    'book.cancel': 'Cancel',
    'book.save': 'Save',
    
    // Categories
    'cat.Salary': 'Salary',
    'cat.Freelance': 'Freelance',
    'cat.Investment': 'Investment',
    'cat.Sales': 'Sales',
    'cat.Other': 'Other',
    'cat.Food': 'Food',
    'cat.Transport': 'Transport',
    'cat.Rent': 'Rent',
    'cat.Utilities': 'Utilities',
    'cat.Entertainment': 'Entertainment',
    'cat.Shopping': 'Shopping',
    'cat.Health': 'Health',

    // Invoices
    'inv.title': 'Invoices & Quotes',
    'inv.subtitle': 'Manage and track your professional documents.',
    'inv.createNew': 'Create New',
    'inv.noDocs': 'No documents found. Create your first invoice or quotation.',
    'inv.draft': 'Draft',
    'inv.sent': 'Sent',
    'inv.paid': 'Paid',
    'inv.back': 'Back to List',
    'inv.newDoc': 'New Document',
    'inv.editDoc': 'Edit Document',
    'inv.type': 'Document Type',
    'inv.quotation': 'Quotation',
    'inv.invoice': 'Invoice',
    'inv.clientName': 'Client Name',
    'inv.clientPlace': 'Client Company or Name',
    'inv.number': 'Number',
    'inv.date': 'Date',
    'inv.dueDate': 'Due Date',
    'inv.items': 'Items',
    'inv.addItem': 'Add Item',
    'inv.desc': 'Description',
    'inv.qty': 'Qty',
    'inv.price': 'Price',
    'inv.totalAmount': 'Total Amount',
    'inv.print': 'Print / PDF',
    'inv.billTo': 'Bill To',
    'inv.subtotal': 'Subtotal',
    'inv.total': 'Total',
    'inv.notes': 'Notes',
    'inv.paymentTerms': 'Payment Terms',
    'inv.deposit': 'Deposit',
    'inv.balance': 'Balance Due',
    'inv.selectClient': 'Select Client',
    'inv.selectClientTitle': 'Select Client',
    'inv.noClientsAlert': 'No clients found. Please add a client first in the Client Management section.',
    'inv.searchClient': 'Search clients...',
    'inv.close': 'Close',
    'inv.project': 'Project',
    'inv.selectProject': 'Select Project (Optional)',
    'inv.convertToInvoice': 'Convert to Invoice',
    'inv.archiveClient': 'Complete & Archive Client',
    'inv.workflow': 'Workflow',

    // Projects
    'proj.title': 'Projects',
    'proj.subtitle': 'Manage projects and link them to clients.',
    'proj.addNew': 'New Project',
    'proj.name': 'Project Name',
    'proj.status': 'Status',
    'proj.active': 'Active',
    'proj.completed': 'Completed',
    'proj.noData': 'No projects found. Start a new project to track work.',
    'proj.selectClient': 'Select Client',
    
    // Project Statuses
    'proj.st.NOT_SET': 'Not Set',
    'proj.st.QUOTE_SENT': 'Quote Sent',
    'proj.st.DEPOSIT_RECEIVED': 'Deposit Received',
    'proj.st.PROGRESS_PAYMENT': 'Progress Payment Received',
    'proj.st.COMPLETED': 'Completed & Settled',
    'proj.st.ARCHIVED': 'Project Archived',

    // Price Check
    'price.title': 'Market Price Checker',
    'price.subtitle': 'Instant price intelligence powered by AI & Google Search.',
    'price.placeholder': 'E.g., iPhone 15 Pro 256GB, Graphics Card RTX 4070...',
    'price.button': 'Check Price',
    'price.analyzing': 'Analyzing...',
    'price.result': 'Analysis Result',
    'price.sources': 'Sources & References',

    // Clients
    'client.title': 'Client Management',
    'client.subtitle': 'Manage your customer database.',
    'client.addNew': 'Add Client',
    'client.name': 'Client Name',
    'client.edit': 'Edit Client',
    'client.email': 'Email',
    'client.phone': 'Phone',
    'client.address': 'Address',
    'client.taxId': 'Tax ID',
    'client.notes': 'Notes',
    'client.noData': 'No clients found. Add your first client.',
    'client.search': 'Search clients...',
    'client.active': 'Active',
    'client.archived': 'Archived',
    'client.archive': 'Archive',
    'client.restore': 'Restore',
    'client.status': 'Status',
    'client.projects': 'Projects',
    'client.manageProjects': 'Manage Projects',
    'client.createQuote': 'Create Quote',

    // Calendar
    'cal.title': 'Calendar',
    'cal.subtitle': 'Schedule events and set reminders.',
    'cal.addEvent': 'Add Event',
    'cal.editEvent': 'Edit Event',
    'cal.eventTitle': 'Event Title',
    'cal.time': 'Time',
    'cal.description': 'Description',
    'cal.reminder': 'Reminder',
    'cal.none': 'None',
    'cal.atTime': 'At time of event',
    'cal.5min': '5 minutes before',
    'cal.15min': '15 minutes before',
    'cal.30min': '30 minutes before',
    'cal.1hour': '1 hour before',
    'cal.1day': '1 day before',
    'cal.today': 'Today',
    'cal.mon': 'Mon',
    'cal.tue': 'Tue',
    'cal.wed': 'Wed',
    'cal.thu': 'Thu',
    'cal.fri': 'Fri',
    'cal.sat': 'Sat',
    'cal.sun': 'Sun',
    'cal.noEvents': 'No events',

    // Settings
    'set.title': '用戶設定',
    'set.subtitle': 'Manage your profile and invoice defaults.',
    'set.basicInfo': 'Basic Information',
    'set.financial': 'Financial Settings',
    'set.companyName': 'Company / Personal Name',
    'set.contactName': 'Contact Person',
    'set.address': 'Address',
    'set.email': 'Email',
    'set.phone': 'Phone',
    'set.taxId': 'Tax ID / VAT',
    'set.deposit': 'Deposit Percentage (%)',
    'set.secondPayment': 'Second Payment Percentage (%)',
    'set.saveSuccess': 'Settings saved successfully!',
  },
  'zh-TW': {
    // Navigation
    'nav.dashboard': '儀表板',
    'nav.bookkeeping': '記帳',
    'nav.invoices': '報價與發票',
    'nav.projects': '專案管理',
    'nav.priceCheck': 'AI 智能查價',
    'nav.settings': '設定',
    'nav.clients': '客戶列表',
    'nav.calendar': '行事曆',
    'nav.footer': '© 2025 SmartQxAI',

    // Dashboard
    'dash.welcome': '晚安，',
    'dash.user': '使用者',
    'dash.quote': '你的時間有限，不要浪費。',
    'dash.weather': '當地天氣',
    'dash.weather.desc': '多雲',
    'dash.event': '聖誕節',
    'dash.days': '天',
    'dash.netAsset': '淨資產',
    'dash.activeQuotes': '活躍報價',
    'dash.invalid': '無效/未命中',
    'dash.closedCases': '已結案件',
    'dash.totalInvoices': '發票',
    'dash.quickActions': '快速操作',
    'dash.recentQuotes': '近期報價',
    'dash.clients': '客戶管理',
    'dash.newQuote': '新報價',
    'dash.projectStatus': '專案狀態',
    'dash.ledger': '帳簿',
    'dash.calendar': '日曆',
    'dash.reports': '報告',
    'dash.createFirst': '暫無報價。創建你的第一個報價吧！',
    'dash.compare': '與上個月相比',
    'dash.netBalance': '淨資產',
    'dash.totalIncome': '總收入',
    'dash.totalExpense': '總支出',
    'dash.pendingInvoices': '待收款項',
    'dash.unpaidAmount': '未付金額',
    'dash.cashFlow': '現金流總覽',
    'dash.noData': '目前尚無交易資料',
    'dash.chart.income': '收入',
    'dash.chart.expense': '支出',
    'dash.subtitle': '歡迎回到您的財務指揮中心。',

    // Bookkeeping
    'book.title': '交易紀錄',
    'book.subtitle': '追蹤您的日常收入與支出。',
    'book.addNew': '新增交易',
    'book.all': '全部',
    'book.income': '收入',
    'book.expense': '支出',
    'book.date': '日期',
    'book.type': '類型',
    'book.desc': '描述',
    'book.category': '類別',
    'book.amount': '金額',
    'book.noTrans': '找不到交易紀錄。請新增一筆資料。',
    'book.modal.title': '新增交易',
    'book.placeholder.desc': '例如：每月房租',
    'book.cancel': '取消',
    'book.save': '儲存',

    // Categories
    'cat.Salary': '薪資',
    'cat.Freelance': '接案/副業',
    'cat.Investment': '投資',
    'cat.Sales': '銷售',
    'cat.Other': '其他',
    'cat.Food': '飲食',
    'cat.Transport': '交通',
    'cat.Rent': '房租',
    'cat.Utilities': '水電費',
    'cat.Entertainment': '娛樂',
    'cat.Shopping': '購物',
    'cat.Health': '醫療健康',

    // Invoices
    'inv.title': '報價單與發票',
    'inv.subtitle': '管理與追蹤您的專業文件。',
    'inv.createNew': '建立新文件',
    'inv.noDocs': '找不到文件。請建立第一張發票或報價單。',
    'inv.draft': '草稿',
    'inv.sent': '已發送',
    'inv.paid': '已付款',
    'inv.back': '返回列表',
    'inv.newDoc': '新文件',
    'inv.editDoc': '編輯文件',
    'inv.type': '文件類型',
    'inv.quotation': '報價單',
    'inv.invoice': '發票',
    'inv.clientName': '客戶名稱',
    'inv.clientPlace': '客戶公司或姓名',
    'inv.number': '編號',
    'inv.date': '日期',
    'inv.dueDate': '到期日',
    'inv.items': '項目',
    'inv.addItem': '新增項目',
    'inv.desc': '項目描述',
    'inv.qty': '數量',
    'inv.price': '單價',
    'inv.totalAmount': '總金額',
    'inv.print': '列印 / PDF',
    'inv.billTo': '受款人',
    'inv.subtotal': '小計',
    'inv.total': '總計',
    'inv.notes': '備註',
    'inv.paymentTerms': '付款條件',
    'inv.deposit': '訂金',
    'inv.balance': '尾款',
    'inv.selectClient': '選擇客戶',
    'inv.selectClientTitle': '選擇客戶',
    'inv.noClientsAlert': '找不到客戶資料。請先至客戶管理新增客戶。',
    'inv.searchClient': '搜尋客戶...',
    'inv.close': '關閉',
    'inv.project': '專案',
    'inv.selectProject': '選擇專案 (選填)',
    'inv.convertToInvoice': '轉為發票',
    'inv.archiveClient': '完成並歸檔客戶',
    'inv.workflow': '工作流程',

    // Projects
    'proj.title': '專案管理',
    'proj.subtitle': '管理專案並連結客戶與文件。',
    'proj.addNew': '新增專案',
    'proj.name': '專案名稱',
    'proj.status': '狀態',
    'proj.active': '進行中',
    'proj.completed': '已完成',
    'proj.noData': '找不到專案。開始一個新專案以追蹤進度。',
    'proj.selectClient': '選擇客戶',
    
    // Project Statuses
    'proj.st.NOT_SET': '未設定',
    'proj.st.QUOTE_SENT': '報價已發送',
    'proj.st.DEPOSIT_RECEIVED': '訂金已收',
    'proj.st.PROGRESS_PAYMENT': '收到進度款',
    'proj.st.COMPLETED': '完工結案',
    'proj.st.ARCHIVED': '已歸檔',

    // Price Check
    'price.title': '市場價格查詢',
    'price.subtitle': '結合 AI 與 Google 搜尋的即時價格分析。',
    'price.placeholder': '例如：iPhone 15 Pro 256GB, RTX 4070 顯卡...',
    'price.button': '查詢價格',
    'price.analyzing': '分析中...',
    'price.result': '分析結果',
    'price.sources': '資料來源與參考',

    // Clients
    'client.title': '客戶管理',
    'client.subtitle': '管理您的客戶資料庫。',
    'client.addNew': '新增客戶',
    'client.name': '客戶名稱',
    'client.edit': '編輯客戶',
    'client.email': '電子郵件',
    'client.phone': '電話',
    'client.address': '地址',
    'client.taxId': '統一編號',
    'client.notes': '備註',
    'client.noData': '找不到客戶資料。請新增您的第一位客戶。',
    'client.search': '搜尋客戶...',
    'client.active': '進行中',
    'client.archived': '已歸檔',
    'client.archive': '歸檔',
    'client.restore': '還原',
    'client.status': '狀態',
    'client.projects': '專案列表',
    'client.manageProjects': '管理專案',
    'client.createQuote': '建立報價單',

    // Calendar
    'cal.title': '行事曆',
    'cal.subtitle': '安排行程並設定提醒。',
    'cal.addEvent': '新增事件',
    'cal.editEvent': '編輯事件',
    'cal.eventTitle': '事件標題',
    'cal.time': '時間',
    'cal.description': '描述',
    'cal.reminder': '提醒',
    'cal.none': '無',
    'cal.atTime': '事件發生時',
    'cal.5min': '5 分鐘前',
    'cal.15min': '15 分鐘前',
    'cal.30min': '30 分鐘前',
    'cal.1hour': '1 小時前',
    'cal.1day': '1 天前',
    'cal.today': '今天',
    'cal.mon': '一',
    'cal.tue': '二',
    'cal.wed': '三',
    'cal.thu': '四',
    'cal.fri': '五',
    'cal.sat': '六',
    'cal.sun': '日',
    'cal.noEvents': '本月無事件',

    // Settings
    'set.title': '用戶設定',
    'set.subtitle': '管理您的基本資料與發票預設值。',
    'set.basicInfo': '基本資料',
    'set.financial': '財務設定',
    'set.companyName': '公司 / 個人名稱',
    'set.contactName': '聯絡人',
    'set.address': '地址',
    'set.email': '電子郵件',
    'set.phone': '電話',
    'set.taxId': '統一編號 / 稅籍編號',
    'set.deposit': '訂金百分比 (%)',
    'set.secondPayment': '二次付款(尾款)百分比 (%)',
    'set.saveSuccess': '設定已成功儲存！',
  }
};

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const browserLang = navigator.language;
    // Detect if language starts with zh (zh-TW, zh-HK, zh-CN -> map to zh-TW for this app)
    if (browserLang.toLowerCase().startsWith('zh')) {
      setLanguage('zh-TW');
    } else {
      setLanguage('en');
    }
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};