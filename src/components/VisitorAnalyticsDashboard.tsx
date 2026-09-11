import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  Eye, 
  MessageSquare, 
  PhoneCall, 
  Sparkles, 
  TrendingUp, 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  RotateCcw, 
  FileSpreadsheet, 
  Printer, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ArrowUpRight,
  ShieldCheck,
  Package,
  Layers,
  FileText,
  DollarSign,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  MousePointerClick,
  Radio,
  RefreshCw,
  Percent,
  ShoppingBag,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  loadAnalyticsData, 
  resetAnalytics, 
  AnalyticsData,
  PageViewEvent,
  ProductViewEvent,
  CategoryClickEvent,
  ActionEvent,
  fetchLiveAnalyticsDashboard,
  LiveDashboardData,
  LiveSalesAnalytics
} from '../utils/analyticsStorage';
import { Product, ProductCategory } from '../types';

interface VisitorAnalyticsDashboardProps {
  products: Product[];
  categories: ProductCategory[];
}

export const VisitorAnalyticsDashboard: React.FC<VisitorAnalyticsDashboardProps> = ({
  products,
  categories
}) => {
  const [localData, setLocalData] = useState<AnalyticsData>(() => loadAnalyticsData());
  const [liveData, setLiveData] = useState<LiveDashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'clickstream' | 'traffic'>('overview');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('30days');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');

  // Fetch live dashboard metrics from backend
  const refreshDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const live = await fetchLiveAnalyticsDashboard();
      if (live && live.success) {
        setLiveData(live);
        setLastSyncTime(new Date());
      }
      setLocalData(loadAnalyticsData());
    } catch (err) {
      console.warn('[Analytics Dashboard] Refresh note:', err);
    } finally {
      if (!isSilent) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial load & periodic background polling
  useEffect(() => {
    refreshDashboard(true);

    const pollInterval = setInterval(() => {
      refreshDashboard(true);
    }, 7000);

    return () => clearInterval(pollInterval);
  }, [refreshDashboard]);

  // Connect to SSE real-time stream for instant order and visitor event notifications
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/admin/orders/stream');

      es.onopen = () => {
        setSseConnected(true);
      };

      es.onerror = () => {
        setSseConnected(false);
      };

      const handleLiveEvent = () => {
        refreshDashboard(true);
      };

      es.addEventListener('analytics_event', handleLiveEvent);
      es.addEventListener('analytics_ping', handleLiveEvent);
      es.addEventListener('analytics_reset', handleLiveEvent);
      es.addEventListener('new_order', handleLiveEvent);
      es.addEventListener('order_status_updated', handleLiveEvent);
      es.addEventListener('order_deleted', handleLiveEvent);
    } catch (err) {
      console.warn('[SSE Analytics Connect] Note:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [refreshDashboard]);

  // Date Filtering helper
  function filterByDate<T extends { timestamp: string }>(events: T[] | undefined): T[] {
    const safeEvents = Array.isArray(events) ? events : [];
    const now = new Date();
    const cutoff = new Date();

    if (dateRange === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (dateRange === '7days') {
      cutoff.setDate(now.getDate() - 7);
    } else if (dateRange === '30days') {
      cutoff.setDate(now.getDate() - 30);
    } else if (dateRange === '90days') {
      cutoff.setDate(now.getDate() - 90);
    } else {
      return safeEvents;
    }

    return safeEvents.filter(e => e && e.timestamp && new Date(e.timestamp) >= cutoff);
  }

  // Combined Metrics (Live Server + Local Fallback)
  const filteredPageViews = useMemo(() => filterByDate<PageViewEvent>(localData?.pageViews), [localData, dateRange]);
  const filteredProductViews = useMemo(() => {
    return filterByDate<ProductViewEvent>(localData?.productViews).filter((pv) => {
      if (selectedProductFilter !== 'all' && pv.productId !== selectedProductFilter) return false;
      return true;
    });
  }, [localData, dateRange, selectedProductFilter]);
  const filteredCategoryClicks = useMemo(() => {
    return filterByDate<CategoryClickEvent>(localData?.categoryClicks).filter((cc) => {
      if (selectedCategoryFilter !== 'all' && cc.categoryId !== selectedCategoryFilter) return false;
      return true;
    });
  }, [localData, dateRange, selectedCategoryFilter]);
  const filteredActions = useMemo(() => filterByDate<ActionEvent>(localData?.actions), [localData, dateRange]);

  // Key Numerical Aggregations
  const liveVisitorsCount = liveData?.liveVisitors ?? 0;
  const totalVisitorsCount = Math.max(liveData?.totalVisitors || 0, filteredPageViews.length);
  const totalPageViewsCount = Math.max(liveData?.totalPageViews || 0, localData?.pageViews?.length || 0);
  const totalWebsiteClicksCount = liveData?.totalWebsiteClicks || 0;
  const totalProductClicksCount = liveData?.totalProductClicks || 0;

  // Actions count
  const whatsappClicks = Math.max(liveData?.actions?.whatsapp || 0, filteredActions.filter(a => a.type === 'whatsapp').length);
  const callClicks = Math.max(liveData?.actions?.call || 0, filteredActions.filter(a => a.type === 'call').length);
  const quoteRequests = Math.max(liveData?.actions?.quote || 0, filteredActions.filter(a => a.type === 'quote').length);
  const totalProductViews = Math.max(totalProductClicksCount, filteredProductViews.length);

  // Clickstream CTR
  const clickThroughRate = totalWebsiteClicksCount > 0 
    ? Math.round((totalProductClicksCount / totalWebsiteClicksCount) * 100) 
    : 0;

  // Device Counts
  const deviceCounts = useMemo(() => {
    const fromServer = liveData?.deviceCounts;
    if (fromServer && Object.keys(fromServer).length > 0) return fromServer;
    return filteredPageViews.reduce((acc, pv) => {
      if (pv && pv.device) acc[pv.device] = (acc[pv.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [liveData, filteredPageViews]);

  // Traffic Sources
  const sourceCounts = useMemo(() => {
    const fromServer = liveData?.sourceCounts;
    if (fromServer && Object.keys(fromServer).length > 0) return fromServer;
    return filteredPageViews.reduce((acc, pv) => {
      if (pv && pv.source) acc[pv.source] = (acc[pv.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [liveData, filteredPageViews]);

  // Top Products
  const sortedTopProducts = useMemo(() => {
    if (liveData?.topProducts && liveData.topProducts.length > 0) {
      return liveData.topProducts.map(p => ({
        name: p.name,
        views: p.views || 0,
        clicks: p.clicks || 0,
        total: (p.views || 0) + (p.clicks || 0)
      }));
    }
    const counts = filteredProductViews.reduce((acc, pv) => {
      if (pv && pv.productName) acc[pv.productName] = (acc[pv.productName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, views]) => ({ name, views, clicks: 0, total: views }));
  }, [liveData, filteredProductViews]);

  // Top Categories
  const sortedTopCategories = useMemo(() => {
    if (liveData?.topCategories && liveData.topCategories.length > 0) {
      return liveData.topCategories.map(c => ({ name: c.name, count: c.count }));
    }
    const counts = filteredCategoryClicks.reduce((acc, cc) => {
      if (cc && cc.categoryName) acc[cc.categoryName] = (acc[cc.categoryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [liveData, filteredCategoryClicks]);

  // Top Search Keywords
  const sortedKeywords = useMemo(() => {
    if (liveData?.topSearches && liveData.topSearches.length > 0) {
      return liveData.topSearches.map(s => ({ query: s.query, count: s.count }));
    }
    const queries = filteredActions.filter(a => a.type === 'search' && a.label).map(a => a.label!);
    const counts = queries.reduce((acc, q) => {
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));
  }, [liveData, filteredActions]);

  // 14-Day Traffic Trend
  const dailyTrend = useMemo(() => {
    if (liveData?.dailyTrend && liveData.dailyTrend.length > 0) {
      return liveData.dailyTrend.map(d => ({
        label: d.label,
        dateStr: d.dateStr,
        views: d.views || 0,
        actions: (d as any).visitors || 0
      }));
    }
    const days: { label: string; dateStr: string; views: number; actions: number }[] = [];
    const now = new Date();
    const pageViewsList = Array.isArray(localData?.pageViews) ? localData.pageViews : [];
    const actionsList = Array.isArray(localData?.actions) ? localData.actions : [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayViews = pageViewsList.filter(pv => pv && pv.timestamp && pv.timestamp.startsWith(dateStr)).length;
      const dayActions = actionsList.filter(a => a && a.timestamp && a.timestamp.startsWith(dateStr)).length;

      days.push({ label: dayLabel, dateStr, views: dayViews, actions: dayActions });
    }
    return days;
  }, [liveData, localData]);

  const maxTrendViews = useMemo(() => Math.max(...dailyTrend.map(d => d.views), 10), [dailyTrend]);

  // Sales & Financial Analytics
  const sales: LiveSalesAnalytics = useMemo(() => {
    if (liveData?.sales) return liveData.sales;
    return {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      grossRevenue: 0,
      netRevenue: 0,
      pendingRevenue: 0,
      averageOrderValue: 0,
      codBreakdown: { count: 0, revenue: 0, percentage: 0, revenuePercentage: 0 },
      onlineBreakdown: { count: 0, revenue: 0, percentage: 0, revenuePercentage: 0 },
      statusBreakdown: {
        completed: { count: 0, percentage: 0 },
        pending: { count: 0, percentage: 0 },
        cancelled: { count: 0, percentage: 0 },
        returned: { count: 0, percentage: 0 }
      },
      detailedStatuses: {},
      recentOrders: []
    };
  }, [liveData]);

  // Handlers
  const handleResetAnalytics = async () => {
    if (window.confirm('Are you sure you want to reset visitor analytics logs? This will refresh metrics to baseline while keeping all customer order records secure.')) {
      setIsRefreshing(true);
      await resetAnalytics();
      await refreshDashboard();
      setIsRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    let csv = "Timestamp,Device,Browser,Traffic Source,Path\n";
    filteredPageViews.forEach(pv => {
      csv += `"${pv.timestamp}","${pv.device}","${pv.browser}","${pv.source}","${pv.path}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZST_Visitor_Analytics_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:p-0">
      
      {/* REAL-TIME TRAFFIC ENGINE HERO RIBBON */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Live Traffic Engine
              </span>
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>{liveVisitorsCount} Live {liveVisitorsCount === 1 ? 'Visitor' : 'Visitors'} Active Now</span>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 text-[11px] font-mono">
                {sseConnected ? (
                  <span className="text-emerald-400 font-medium">● Real-time Stream Connected</span>
                ) : (
                  <span className="text-amber-400 font-medium">● Auto-sync Active (Polling)</span>
                )}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-blue-400" />
              <span>Real-Time Admin Analytics & Sales Engine</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl">
              Live showroom visitor tracking, product clickstream behavior, customer search queries, and instant sales financial breakdown.
            </p>
          </div>

          {/* Action Buttons & Manual Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => refreshDashboard(false)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              title="Manually synchronize live metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleResetAnalytics}
              className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
              title="Reset metrics to initial baseline"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Real-time Sub-bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-4">
            <span>Last Sync: <strong className="text-slate-200">{lastSyncTime.toLocaleTimeString()}</strong></span>
            <span>•</span>
            <span>Clickstream Engine: <strong className="text-emerald-400">Active</strong></span>
            <span>•</span>
            <span>Order Database: <strong className="text-blue-400">Synchronized</strong></span>
          </div>
          <div className="text-slate-400">
            ZST Enterprise Real-time v2.4
          </div>
        </div>
      </div>

      {/* NAVIGATION PILL TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overall Overview', icon: BarChart3 },
          { id: 'sales', label: 'Sales & Financials', icon: DollarSign, badge: sales.totalOrders > 0 ? `${sales.totalOrders} Orders` : undefined },
          { id: 'clickstream', label: 'Clickstream & Products', icon: MousePointerClick },
          { id: 'traffic', label: 'Traffic & Demographics', icon: Globe }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 text-emerald-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FILTER & TIMEFRAME BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Timeframe:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: '90days', label: '90 Days' },
            { id: 'all', label: 'All Time' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateRange === r.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 max-w-[180px] truncate"
            >
              <option value="all">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DEDICATED SALES & ORDER FINANCIAL ANALYTICS MODULE                      */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'sales') && (
        <div className="space-y-6 pt-2">
          
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Financial Intelligence
                </span>
                <span className="text-xs text-slate-400 font-mono">Live Database Aggregation</span>
              </div>
              <h3 className="text-xl font-bold text-white font-serif mt-1 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Sales & Order Financial Analytics</span>
              </h3>
            </div>
            <div className="text-xs text-slate-400">
              Total Order Volume: <strong className="text-white font-mono">{sales.totalOrders}</strong> recorded transactions
            </div>
          </div>

          {/* Top 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Revenue */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Sales Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                PKR {sales.grossRevenue.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Net Settled: <strong className="text-slate-200 font-mono">PKR {sales.netRevenue.toLocaleString()}</strong></span>
                <span>AOV: <strong className="text-blue-300 font-mono">PKR {sales.averageOrderValue.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <div className="p-2 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {sales.totalOrders}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Completed: <strong className="text-emerald-400 font-mono">{sales.completedOrders}</strong></span>
                <span>Pending: <strong className="text-amber-400 font-mono">{sales.pendingOrders}</strong></span>
              </div>
            </div>

            {/* Completed / Delivered Orders */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Delivered & Confirmed</span>
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {sales.completedOrders}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Success Rate: <strong className="text-emerald-300 font-mono">{sales.statusBreakdown.completed.percentage}%</strong></span>
                <span>PKR {sales.netRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Pending In-Progress Orders */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Processing</span>
                <div className="p-2 rounded-xl bg-amber-950 border border-amber-500/30 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                {sales.pendingOrders}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Pending Volume: <strong className="text-amber-300 font-mono">{sales.statusBreakdown.pending.percentage}%</strong></span>
                <span>PKR {sales.pendingRevenue.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* TWO COLUMN SUB-PANEL: PAYMENT GATEWAYS & ORDER LIFECYCLE BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Payment Gateway Breakdown (COD vs Online Payment) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-serif">Payment Gateway Breakdown</h4>
                    <p className="text-xs text-slate-400">Cash on Delivery (COD) vs Online Gateway Revenue</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {sales.totalOrders} Orders Total
                </span>
              </div>

              {/* Comparative Visual Split Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Cash on Delivery ({sales.codBreakdown.percentage}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-300">
                    Online Payment ({sales.onlineBreakdown.percentage}%)
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  </span>
                </div>
                
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full transition-all duration-500" 
                    style={{ width: `${Math.max(sales.codBreakdown.percentage, sales.totalOrders === 0 ? 50 : 2)}%` }} 
                    title={`COD: ${sales.codBreakdown.count} orders`}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-r-full transition-all duration-500" 
                    style={{ width: `${Math.max(sales.onlineBreakdown.percentage, sales.totalOrders === 0 ? 50 : 2)}%` }} 
                    title={`Online: ${sales.onlineBreakdown.count} orders`}
                  />
                </div>
              </div>

              {/* Gateway Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* COD Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      Cash on Delivery
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                      {sales.codBreakdown.percentage}% of Orders
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-white font-mono">
                      PKR {sales.codBreakdown.revenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {sales.codBreakdown.count} {sales.codBreakdown.count === 1 ? 'order' : 'orders'} placed via COD
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
                    <span>Revenue Share:</span>
                    <span className="text-amber-400 font-mono font-bold">{sales.codBreakdown.revenuePercentage}%</span>
                  </div>
                </div>

                {/* Online Payment Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-sky-400" />
                      Online Payment
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-mono text-[10px] font-bold">
                      {sales.onlineBreakdown.percentage}% of Orders
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-white font-mono">
                      PKR {sales.onlineBreakdown.revenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {sales.onlineBreakdown.count} {sales.onlineBreakdown.count === 1 ? 'order' : 'orders'} (Bank / JazzCash)
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
                    <span>Revenue Share:</span>
                    <span className="text-sky-400 font-mono font-bold">{sales.onlineBreakdown.revenuePercentage}%</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Order Lifecycle Status Tracking (4 Primary Stages) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-serif">Order Lifecycle Stages</h4>
                    <p className="text-xs text-slate-400">Fulfillment progress & status distribution</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  4 Stages
                </span>
              </div>

              {/* 4 Status Cards Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* 1. Successful */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Successful
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {sales.statusBreakdown.completed.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {sales.completedOrders}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Delivered / Verified
                  </p>
                </div>

                {/* 2. Pending */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {sales.statusBreakdown.pending.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {sales.pendingOrders}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    In-transit / Verification
                  </p>
                </div>

                {/* 3. Cancelled */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelled
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      {sales.statusBreakdown.cancelled.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {sales.cancelledOrders}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Rejected / Void
                  </p>
                </div>

                {/* 4. Returned */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-orange-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Returned
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-300">
                      {sales.statusBreakdown.returned.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {sales.returnedOrders}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Refund / Exchange
                  </p>
                </div>

              </div>

              {/* Detailed Raw Database Status Pills */}
              {sales.detailedStatuses && Object.keys(sales.detailedStatuses).length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Database Status Tags:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sales.detailedStatuses).map(([statusName, count]) => (
                      <span 
                        key={statusName}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono flex items-center gap-1.5"
                      >
                        <span>{statusName}:</span>
                        <strong className="text-blue-400">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Recent Orders Mini Table Stream */}
          {sales.recentOrders && sales.recentOrders.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Recent Customer Orders</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Live Order Stream</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                      <th className="pb-2.5">Order ID</th>
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Payment Method</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {sales.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-blue-300">{ord.orderNumber}</td>
                        <td className="py-2.5 text-slate-200 font-sans">{ord.customerName}</td>
                        <td className="py-2.5 text-slate-400">{ord.paymentMethod}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ['delivered', 'completed', 'confirmed', 'verified'].some(s => ord.status.toLowerCase().includes(s))
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : ['cancel', 'reject'].some(s => ord.status.toLowerCase().includes(s))
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">
                          PKR {ord.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERALL TRAFFIC & CLICKSTREAM METRIC CARDS                              */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'clickstream' || activeTab === 'traffic') && (
        <div className="space-y-6">
          
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-cyan-400" />
              <span>Visitor Traffic & Clickstream Activity</span>
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Live clickstream logs, card-level interactions, and customer search trends.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Total Visitors */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Unique Visitors</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-serif">
                {(totalVisitorsCount || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Pageviews: <strong className="text-blue-300 font-mono">{totalPageViewsCount}</strong></span>
                <span>•</span>
                <span>Active: <strong className="text-emerald-400 font-mono">{liveVisitorsCount} live</strong></span>
              </div>
            </div>

            {/* Click Analytics: Total Clicks vs Product Clicks */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Product Card Clicks</span>
                <MousePointerClick className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-cyan-400 font-serif">
                {(totalProductClicksCount || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <span>Total Clicks: <strong className="text-white font-mono">{totalWebsiteClicksCount}</strong></span>
                <span>•</span>
                <span>CTR: <strong className="text-cyan-300 font-mono">{clickThroughRate}%</strong></span>
              </div>
            </div>

            {/* WhatsApp Leads */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Clicks</span>
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-serif">
                {(whatsappClicks || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                Direct wholesale buyer conversations
              </p>
            </div>

            {/* Direct Calls & Quotes */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Phone & Quotes</span>
                <PhoneCall className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-300 font-serif">
                {callClicks + quoteRequests}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Calls: <strong className="text-white font-mono">{callClicks}</strong></span>
                <span>•</span>
                <span>AI Quotes: <strong className="text-sky-300 font-mono">{quoteRequests}</strong></span>
              </div>
            </div>

          </div>

          {/* GRAPH SECTION: VISITOR & ACTION TREND (14 DAYS) */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Visitor Traffic & Click Trend (Last 14 Days)</span>
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Daily website pageviews vs customer lead action conversions.
                </p>
              </div>
            </div>

            {/* Custom SVG Line & Area Chart */}
            <div className="h-56 w-full pt-4 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 45, 90, 135].map((y, idx) => (
                  <line key={idx} x1="0" y1={y} x2="700" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                ))}

                {/* Area Path */}
                <path
                  d={dailyTrend.reduce((acc, point, index) => {
                    const x = (index / (dailyTrend.length - 1)) * 700;
                    const y = 160 - (point.views / maxTrendViews) * 140;
                    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '') + ` L 700 160 L 0 160 Z`}
                  fill="url(#trendGradient)"
                />

                {/* Line Path */}
                <path
                  d={dailyTrend.reduce((acc, point, index) => {
                    const x = (index / (dailyTrend.length - 1)) * 700;
                    const y = 160 - (point.views / maxTrendViews) * 140;
                    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="3"
                />

                {/* Data Dots */}
                {dailyTrend.map((point, index) => {
                  const x = (index / (dailyTrend.length - 1)) * 700;
                  const y = 160 - (point.views / maxTrendViews) * 140;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="5" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="2" />
                      <title>{`${point.label}: ${point.views} views, ${point.actions} leads`}</title>
                    </g>
                  );
                })}
              </svg>

              {/* Date Labels below graph */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                {dailyTrend.map((d, i) => (
                  <span key={i} className={i % 2 === 0 ? 'block' : 'hidden sm:block'}>
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID: MOST VIEWED/CLICKED PRODUCTS & POPULAR CATEGORIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Hardware Items Table */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Top Performing Products (Views & Clicks)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Ranked</span>
              </div>

              <div className="space-y-3.5">
                {sortedTopProducts.length > 0 ? (
                  sortedTopProducts.map((item, idx) => {
                    const maxVal = sortedTopProducts[0].total || 1;
                    const pct = Math.round((item.total / maxVal) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                            {idx + 1}. {item.name}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-blue-300 font-bold">{item.views} views</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-cyan-400 font-bold">{item.clicks} clicks</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">No product view logs recorded yet.</p>
                )}
              </div>
            </div>

            {/* Most Clicked Categories */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Most Popular Product Categories</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Ranked</span>
              </div>

              <div className="space-y-3.5">
                {sortedTopCategories.length > 0 ? (
                  sortedTopCategories.map((cat, idx) => {
                    const maxVal = sortedTopCategories[0].count || 1;
                    const pct = Math.round((cat.count / maxVal) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate max-w-[260px]">
                            {idx + 1}. {cat.name}
                          </span>
                          <span className="text-cyan-300 font-mono font-bold">{cat.count} clicks</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">No category click logs recorded yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* THREE COLUMN GRID: SEARCH KEYWORDS, DEVICE BREAKDOWN, TRAFFIC SOURCES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Top Searched Products / Keywords */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Top Searched Products/Keywords</span>
              </h3>

              <div className="space-y-2 pt-2">
                {sortedKeywords.length > 0 ? (
                  sortedKeywords.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-slate-200 font-medium truncate max-w-[150px]">"{kw.query}"</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[10px]">
                        {kw.count} searches
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">No search queries captured yet.</p>
                )}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Device Breakdown</span>
              </h3>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Mobile', icon: Smartphone, color: 'text-emerald-400 bg-emerald-950 border-emerald-500/30' },
                  { label: 'Desktop', icon: Monitor, color: 'text-blue-400 bg-blue-950 border-blue-500/30' },
                  { label: 'Tablet', icon: Tablet, color: 'text-indigo-400 bg-indigo-950 border-indigo-500/30' }
                ].map(dev => {
                  const count = deviceCounts[dev.label] || 0;
                  const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || totalVisitorsCount || 1;
                  const pct = Math.round((count / total) * 100);
                  const IconComp = dev.icon;

                  return (
                    <div key={dev.label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${dev.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">{dev.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white block">{pct}%</span>
                        <span className="text-[10px] text-slate-400 font-mono">{count} visits</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Traffic Sources</span>
              </h3>

              <div className="space-y-2.5 pt-2">
                {Object.entries(sourceCounts).map(([src, count]) => {
                  const total = Object.values(sourceCounts).reduce((a, b) => a + b, 0) || totalVisitorsCount || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={src} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate">{src}</span>
                        <span className="font-mono text-sky-300 font-semibold">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Real-time Activity Ticker */}
          {liveData?.recentEvents && liveData.recentEvents.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Latest Visitor Activity:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[11px]">
                {liveData.recentEvents.slice(0, 3).map((ev) => (
                  <span key={ev.id} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <strong className="text-blue-400 uppercase text-[10px]">{ev.type}</strong>: {ev.label} ({new Date(ev.timestamp).toLocaleTimeString()})
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
