import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { 
  loadAnalyticsData, 
  resetAnalytics, 
  AnalyticsData,
  PageViewEvent,
  ProductViewEvent,
  CategoryClickEvent,
  ActionEvent
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
  const [data, setData] = useState<AnalyticsData>(() => loadAnalyticsData());
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('30days');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');

  // Filter analytics events by date range
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

  const pageViewsList = Array.isArray(data?.pageViews) ? data.pageViews : [];
  const actionsList = Array.isArray(data?.actions) ? data.actions : [];

  const filteredPageViews = filterByDate<PageViewEvent>(data?.pageViews);
  const filteredProductViews = filterByDate<ProductViewEvent>(data?.productViews).filter((pv) => {
    if (selectedProductFilter !== 'all' && pv.productId !== selectedProductFilter) return false;
    return true;
  });
  const filteredCategoryClicks = filterByDate<CategoryClickEvent>(data?.categoryClicks).filter((cc) => {
    if (selectedCategoryFilter !== 'all' && cc.categoryId !== selectedCategoryFilter) return false;
    return true;
  });
  const filteredActions = filterByDate<ActionEvent>(data?.actions);

  // Key Metric Calculations
  const totalVisitors = filteredPageViews.length;
  
  const todayCutoff = new Date();
  todayCutoff.setHours(0, 0, 0, 0);
  const todayVisitors = pageViewsList.filter(pv => pv && pv.timestamp && new Date(pv.timestamp) >= todayCutoff).length;

  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - 7);
  const weeklyVisitors = pageViewsList.filter(pv => pv && pv.timestamp && new Date(pv.timestamp) >= weekCutoff).length;

  const monthCutoff = new Date();
  monthCutoff.setDate(monthCutoff.getDate() - 30);
  const monthlyVisitors = pageViewsList.filter(pv => pv && pv.timestamp && new Date(pv.timestamp) >= monthCutoff).length;

  const totalProductViews = filteredProductViews.length;
  const whatsappClicks = filteredActions.filter(a => a.type === 'whatsapp').length;
  const callClicks = filteredActions.filter(a => a.type === 'call').length;
  const quoteRequests = filteredActions.filter(a => a.type === 'quote').length;
  const downloadCount = filteredActions.filter(a => a.type === 'download').length;

  // Device Breakdown
  const deviceCounts = filteredPageViews.reduce((acc, pv) => {
    if (pv && pv.device) {
      acc[pv.device] = (acc[pv.device] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Browser Breakdown
  const browserCounts = filteredPageViews.reduce((acc, pv) => {
    if (pv && pv.browser) {
      acc[pv.browser] = (acc[pv.browser] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Traffic Source Breakdown
  const sourceCounts = filteredPageViews.reduce((acc, pv) => {
    if (pv && pv.source) {
      acc[pv.source] = (acc[pv.source] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Most Viewed Products Ranking
  const productViewCounts = filteredProductViews.reduce((acc, pv) => {
    if (pv && pv.productName) {
      acc[pv.productName] = (acc[pv.productName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedTopProducts = Object.entries(productViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Most Clicked Categories Ranking
  const categoryClickCounts = filteredCategoryClicks.reduce((acc, cc) => {
    if (cc && cc.categoryName) {
      acc[cc.categoryName] = (acc[cc.categoryName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedTopCategories = Object.entries(categoryClickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Search Keywords
  const searchQueries = filteredActions
    .filter(a => a.type === 'search' && a.label)
    .map(a => a.label!);

  const keywordCounts = searchQueries.reduce((acc, q) => {
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Time Series for Line Graph (Last 14 days)
  const generateDailyTrend = () => {
    const days: { label: string; dateStr: string; views: number; actions: number }[] = [];
    const now = new Date();

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
  };

  const dailyTrend = generateDailyTrend();
  const maxTrendViews = Math.max(...dailyTrend.map(d => d.views), 10);

  // Handlers
  const handleResetAnalytics = () => {
    if (confirm('Are you sure you want to reset all visitor analytics logs? This will re-seed baseline metrics.')) {
      const fresh = resetAnalytics();
      setData(fresh);
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
    a.download = `Visitor_Analytics_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:p-0">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
              Admin Exclusive Portal
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white font-serif mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span>Real-time Visitor Analytics & Insights</span>
          </h2>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Strictly confidential hardware showroom traffic logs, inquiry metrics & visitor behavior.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleResetAnalytics}
            className="px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Logs</span>
          </button>
        </div>
      </div>

      {/* Filter & Range Bar */}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* TOP METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Visitors</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-serif">
            {(totalVisitors || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
            <span>Today: <strong className="text-emerald-400 font-mono">{todayVisitors}</strong></span>
            <span>•</span>
            <span>Month: <strong className="text-blue-300 font-mono">{monthlyVisitors}</strong></span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Product Views</span>
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-serif">
            {(totalProductViews || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Catalog item previews & modal interactions
          </p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Clicks</span>
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-serif">
            {(whatsappClicks || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Direct customer wholesale inquiries
          </p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800/80 space-y-2 relative overflow-hidden">
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
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/80 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Visitor Traffic Trend (Last 14 Days)</span>
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

      {/* TWO COLUMN GRID: TOP PRODUCTS & TOP CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Viewed Products */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Most Viewed Hardware Items</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top 6</span>
          </div>

          <div className="space-y-3">
            {sortedTopProducts.length > 0 ? (
              sortedTopProducts.map(([name, count], idx) => {
                const maxVal = sortedTopProducts[0][1] || 1;
                const pct = Math.round((count / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[260px]">
                        {idx + 1}. {name}
                      </span>
                      <span className="text-blue-300 font-mono font-bold">{count} views</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
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
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Most Popular Categories</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top 5</span>
          </div>

          <div className="space-y-3">
            {sortedTopCategories.length > 0 ? (
              sortedTopCategories.map(([name, count], idx) => {
                const maxVal = sortedTopCategories[0][1] || 1;
                const pct = Math.round((count / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[260px]">
                        {idx + 1}. {name}
                      </span>
                      <span className="text-cyan-300 font-mono font-bold">{count} clicks</span>
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

      {/* THREE COLUMN GRID: DEVICE BREAKDOWN, TRAFFIC SOURCES, SEARCH KEYWORDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Device Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4">
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
              const pct = totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0;
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
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Traffic Sources</span>
          </h3>

          <div className="space-y-2 pt-2">
            {Object.entries(sourceCounts).map(([src, count]) => {
              const pct = totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0;
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

        {/* Popular Search Keywords */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Top Search Keywords</span>
          </h3>

          <div className="space-y-2 pt-2">
            {sortedKeywords.length > 0 ? (
              sortedKeywords.map(([kw, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-200 font-medium truncate max-w-[150px]">"{kw}"</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[10px]">
                    {count} searches
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">No search query logs yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
