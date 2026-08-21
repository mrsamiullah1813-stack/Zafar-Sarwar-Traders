import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  MessageSquare, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Key, 
  Database, 
  Layers, 
  Package, 
  ShoppingBag, 
  Award, 
  ShieldCheck,
  Palette,
  HelpCircle,
  BookOpen,
  Edit2,
  Check,
  Send,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Lightbulb,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { AiAssistantConfig, AiCustomKnowledge } from '../types';
import { 
  saveAiAssistantConfigToSupabase, 
  upsertAiKnowledgeInSupabase, 
  deleteAiKnowledgeFromSupabase,
  fetchAiKnowledgeFromSupabase,
  isSupabaseConfigured 
} from '../services/supabaseService';

interface AdminAiAssistantManagerProps {
  config: AiAssistantConfig;
  onSaveConfig: (updatedConfig: AiAssistantConfig) => void;
}

export const AdminAiAssistantManager: React.FC<AdminAiAssistantManagerProps> = ({
  config,
  onSaveConfig
}) => {
  const [formState, setFormState] = useState<AiAssistantConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'knowledge' | 'settings' | 'playground'>('knowledge');
  const [newQuestion, setNewQuestion] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search & Filter for Custom Knowledge
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Custom Knowledge Form State (Add / Edit)
  const [showAddCk, setShowAddCk] = useState(false);
  const [editingCkId, setEditingCkId] = useState<string | null>(null);
  const [ckTitle, setCkTitle] = useState('');
  const [ckCategory, setCkCategory] = useState<AiCustomKnowledge['category']>('general');
  const [ckQuestion, setCkQuestion] = useState('');
  const [ckAnswer, setCkAnswer] = useState('');

  // AI Test Simulator State
  const [testPrompt, setTestPrompt] = useState('Do you deliver to Lahore and what is the delivery fee?');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleEnable = () => {
    setFormState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleToggleDataSource = (key: keyof AiAssistantConfig['dataSources']) => {
    setFormState(prev => ({
      ...prev,
      dataSources: {
        ...prev.dataSources,
        [key]: !prev.dataSources[key]
      }
    }));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setFormState(prev => ({
      ...prev,
      suggestedQuestions: [...prev.suggestedQuestions, newQuestion.trim()]
    }));
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    setFormState(prev => ({
      ...prev,
      suggestedQuestions: prev.suggestedQuestions.filter((_, i) => i !== index)
    }));
  };

  // Custom Knowledge Handlers (Add / Edit / Save)
  const handleOpenAdd = () => {
    setEditingCkId(null);
    setCkTitle('');
    setCkCategory('general');
    setCkQuestion('');
    setCkAnswer('');
    setShowAddCk(true);
  };

  const handleOpenEdit = (item: AiCustomKnowledge) => {
    setEditingCkId(item.id);
    setCkTitle(item.title);
    setCkCategory(item.category);
    setCkQuestion(item.questionOrTopic);
    setCkAnswer(item.answerOrContent);
    setShowAddCk(true);
  };

  const handleSaveCustomKnowledge = async () => {
    if (!ckTitle.trim() || !ckAnswer.trim()) {
      alert('Please provide both the Knowledge Title and the Answer/Policy content.');
      return;
    }

    if (editingCkId) {
      // Update existing item
      const updatedItem: AiCustomKnowledge = {
        id: editingCkId,
        title: ckTitle.trim(),
        category: ckCategory,
        questionOrTopic: ckQuestion.trim() || ckTitle.trim(),
        answerOrContent: ckAnswer.trim(),
        isEnabled: true,
        displayOrder: formState.customKnowledge?.find(k => k.id === editingCkId)?.displayOrder || 1
      };

      const updatedList = (formState.customKnowledge || []).map(k => k.id === editingCkId ? updatedItem : k);
      const newConfig = { ...formState, customKnowledge: updatedList };
      setFormState(newConfig);
      onSaveConfig(newConfig);

      // Save directly to Supabase
      await upsertAiKnowledgeInSupabase(updatedItem);
      showToast('Knowledge entry updated and saved to Supabase!');
    } else {
      // Add new item
      const newItem: AiCustomKnowledge = {
        id: `ck-${Date.now()}`,
        title: ckTitle.trim(),
        category: ckCategory,
        questionOrTopic: ckQuestion.trim() || ckTitle.trim(),
        answerOrContent: ckAnswer.trim(),
        isEnabled: true,
        displayOrder: (formState.customKnowledge || []).length + 1
      };

      const updatedList = [...(formState.customKnowledge || []), newItem];
      const newConfig = { ...formState, customKnowledge: updatedList };
      setFormState(newConfig);
      onSaveConfig(newConfig);

      // Save directly to Supabase
      await upsertAiKnowledgeInSupabase(newItem);
      showToast('New Custom AI Knowledge entry created and saved to Supabase!');
    }

    setCkTitle('');
    setCkQuestion('');
    setCkAnswer('');
    setEditingCkId(null);
    setShowAddCk(false);
  };

  const handleToggleCkEnabled = async (id: string) => {
    const target = formState.customKnowledge?.find(item => item.id === id);
    if (!target) return;

    const newEnabled = !target.isEnabled;
    const updatedList = (formState.customKnowledge || []).map(item => 
      item.id === id ? { ...item, isEnabled: newEnabled } : item
    );
    const newConfig = { ...formState, customKnowledge: updatedList };
    setFormState(newConfig);
    onSaveConfig(newConfig);

    // Sync to Supabase
    await upsertAiKnowledgeInSupabase({ ...target, isEnabled: newEnabled });
    showToast(`Knowledge entry "${target.title}" is now ${newEnabled ? 'Active' : 'Disabled'}.`);
  };

  const handleDeleteCkItem = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this AI knowledge entry?')) return;

    const updatedList = (formState.customKnowledge || []).filter(item => item.id !== id);
    const newConfig = { ...formState, customKnowledge: updatedList };
    setFormState(newConfig);
    onSaveConfig(newConfig);

    // Delete in Supabase
    await deleteAiKnowledgeFromSupabase(id);
    showToast('Knowledge entry deleted from Supabase.');
  };

  const handleAddTemplate = async (template: { title: string; category: AiCustomKnowledge['category']; question: string; answer: string }) => {
    const newItem: AiCustomKnowledge = {
      id: `ck-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: template.title,
      category: template.category,
      questionOrTopic: template.question,
      answerOrContent: template.answer,
      isEnabled: true,
      displayOrder: (formState.customKnowledge || []).length + 1
    };

    const updatedList = [...(formState.customKnowledge || []), newItem];
    const newConfig = { ...formState, customKnowledge: updatedList };
    setFormState(newConfig);
    onSaveConfig(newConfig);

    await upsertAiKnowledgeInSupabase(newItem);
    showToast(`Added template rule: "${template.title}"`);
  };

  const handleSyncWithSupabase = async () => {
    setIsSyncing(true);
    try {
      const dbKnowledge = await fetchAiKnowledgeFromSupabase();
      if (dbKnowledge && dbKnowledge.length > 0) {
        const updatedConfig = { ...formState, customKnowledge: dbKnowledge };
        setFormState(updatedConfig);
        onSaveConfig(updatedConfig);
        showToast(`Successfully refreshed ${dbKnowledge.length} knowledge entries from Supabase!`);
      } else {
        // Save current to Supabase
        await saveAiAssistantConfigToSupabase(formState);
        showToast('Pushed current AI assistant configuration to Supabase successfully!');
      }
    } catch (err: any) {
      showToast('Error syncing with Supabase: ' + (err?.message || String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      onSaveConfig(formState);
      await saveAiAssistantConfigToSupabase(formState);
      showToast('AI Sales & Website Assistant Settings successfully saved and synced to Supabase!');
    } catch (err: any) {
      showToast('Saved locally. Supabase note: ' + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  // Run Test in Simulator
  const handleRunSimulator = async () => {
    if (!testPrompt.trim()) return;
    setIsTesting(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testPrompt,
          history: [],
          storeContext: {
            aiAssistantConfig: formState
          }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setTestResponse(json.data);
      } else {
        setTestResponse({ reply: json.error || 'Failed to get response from server.' });
      }
    } catch (err: any) {
      setTestResponse({ reply: 'Request failed: ' + (err?.message || String(err)) });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered Knowledge Entries
  const filteredKnowledge = (formState.customKnowledge || []).filter(item => {
    const matchesCat = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.questionOrTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answerOrContent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/30 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-400 shrink-0">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white font-serif">
                AI Sales & Website Assistant
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                formState.isEnabled 
                  ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950 border-rose-500/40 text-rose-300'
              }`}>
                {formState.isEnabled ? 'AI Active' : 'AI Disabled'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 border border-blue-500/40 text-cyan-300 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Supabase Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light mt-1 max-w-xl">
              Manage custom knowledge rules, store policies, warranty guidelines, and test live AI grounded responses. All knowledge is permanently saved to Supabase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleSyncWithSupabase}
            disabled={isSyncing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Force refresh knowledge from Supabase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleEnable}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              formState.isEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {formState.isEnabled ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            <span>{formState.isEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'knowledge'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Custom Knowledge Base ({formState.customKnowledge?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'playground'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Live AI Testing Playground</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Identity & Data Sources</span>
        </button>
      </div>

      {/* TAB 1: CUSTOM KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          
          {/* Header & Quick Action */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Custom Knowledge Entries & Store Policies</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Entries are stored in Supabase table <code className="text-purple-300 bg-slate-950 px-1 py-0.5 rounded font-mono">ai_knowledge</code> and injected into every customer inquiry.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Knowledge Entry</span>
              </button>
            </div>

            {/* QUICK PRESET TEMPLATES */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>One-Click Knowledge Templates:</span>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddTemplate({
                    title: 'Showroom Hours & Friday Prayer Timing',
                    category: 'general',
                    question: 'What are showroom timings and prayer breaks?',
                    answer: 'Zafar Sarwar Traders showroom is open Monday through Saturday from 9:00 AM to 9:00 PM. We take a break on Fridays from 1:00 PM to 2:30 PM for Juma Prayer. Showroom is closed on Sundays.'
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>Showroom & Friday Timings</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTemplate({
                    title: '10 to 25 Year Brass Cartridge Warranty',
                    category: 'warranty',
                    question: 'Are faucets and showers covered by official brand warranty?',
                    answer: 'Yes! Every sanitaryware and faucet fixture from Sonex, Faisal, Master, Hansgrohe, and Grohe includes official manufacturer warranty cards ranging from 10 to 25 years covering brass casting and ceramic cartridge leaks.'
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>10-25 Year Brand Warranty</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTemplate({
                    title: 'Free Shipping on Orders Over PKR 50,000',
                    category: 'shipping',
                    question: 'Do you offer free delivery for bulk or high value orders?',
                    answer: 'Yes! We provide Free Express Doorstep Delivery across Pakistan on all sanitaryware, faucets, and bathroom fitting orders valued over PKR 50,000.'
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>Free Delivery &gt; 50k</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTemplate({
                    title: 'Plumber & Installation Technician Support',
                    category: 'policy',
                    question: 'Can you recommend certified plumbers or fitters for installation?',
                    answer: 'We provide phone numbers of certified master plumbers for Lahore, Faisalabad, and Chiniot regions upon request on WhatsApp (+92 310 8002863). Fitting charges are settled directly with the plumbing professional.'
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>Plumber Recommendation</span>
                </button>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search knowledge by keyword, topic, or policy..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'policy', 'warranty', 'shipping', 'faq', 'general'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all whitespace-nowrap ${
                      selectedCategoryFilter === cat
                        ? 'bg-purple-950 border border-purple-400 text-purple-200'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ADD / EDIT FORM MODAL / DRAWER */}
            {showAddCk && (
              <div className="p-5 rounded-xl bg-slate-950 border border-purple-500/40 space-y-4 animate-fadeIn shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold text-purple-300 font-mono uppercase flex items-center gap-2">
                    {editingCkId ? <Edit2 className="w-4 h-4 text-purple-400" /> : <Plus className="w-4 h-4 text-purple-400" />}
                    <span>{editingCkId ? 'Edit Custom Knowledge Entry' : 'Create New Custom Knowledge Entry'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddCk(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Knowledge Title</label>
                    <input
                      type="text"
                      value={ckTitle}
                      onChange={(e) => setCkTitle(e.target.value)}
                      placeholder="e.g. 100% Genuine Sonex / Grohe Warranty Policy"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Category</label>
                    <select
                      value={ckCategory}
                      onChange={(e) => setCkCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="policy">Store Policy</option>
                      <option value="warranty">Warranty & Guarantee</option>
                      <option value="shipping">Shipping & Delivery</option>
                      <option value="faq">FAQ</option>
                      <option value="general">General Knowledge</option>
                      <option value="custom">Custom Notes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer Question / Match Keywords</label>
                  <input
                    type="text"
                    value={ckQuestion}
                    onChange={(e) => setCkQuestion(e.target.value)}
                    placeholder="e.g. Do all faucets come with warranty certificates and cartridge guarantees?"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">AI Grounding Answer / Store Policy Details</label>
                  <textarea
                    rows={4}
                    value={ckAnswer}
                    onChange={(e) => setCkAnswer(e.target.value)}
                    placeholder="e.g. Every product sold by Zafar Sarwar Traders is 100% genuine with official manufacturer warranty stamps. In case of any ceramic disc leakage within 10 years, replacement cartridges are provided free of cost..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCk(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomKnowledge}
                    className="px-5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingCkId ? 'Update & Save to Supabase' : 'Save to Supabase'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* KNOWLEDGE LIST */}
            <div className="space-y-3 pt-2">
              {filteredKnowledge.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No custom knowledge entries matched your search.</p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="text-xs text-purple-400 hover:underline font-bold"
                  >
                    Create a new entry now
                  </button>
                </div>
              ) : (
                filteredKnowledge.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isEnabled
                        ? 'bg-slate-950 border-slate-800 hover:border-purple-500/50'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-white font-serif">
                            {item.title}
                          </h4>
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full ${
                            item.isEnabled ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-900'
                          }`}>
                            {item.isEnabled ? 'Live Active' : 'Disabled'}
                          </span>
                        </div>

                        <p className="text-[11px] text-cyan-300 font-mono font-medium">
                          Q: "{item.questionOrTopic}"
                        </p>

                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          {item.answerOrContent}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-950/50 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCkEnabled(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isEnabled ? 'text-emerald-400 hover:bg-emerald-950' : 'text-slate-500 hover:bg-slate-800'
                          }`}
                          title={item.isEnabled ? "Disable Entry" : "Enable Entry"}
                        >
                          {item.isEnabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCkItem(item.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TESTING PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Live AI Assistant Grounding Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Test how the AI assistant answers customer inquiries using live database products, shipping rates, and custom knowledge base rules.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Ask anything in English, Urdu, or Roman Urdu (e.g. 'Show me black shower sets under 30000', 'Do you deliver to Lahore?', 'Sonex faucet warranty kya hai?')..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleRunSimulator(); }}
              />
              <button
                type="button"
                onClick={handleRunSimulator}
                disabled={isTesting}
                className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 transition-all shrink-0"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isTesting ? 'Generating...' : 'Send Test'}</span>
              </button>
            </div>

            {/* Quick Test Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Quick Tests:</span>
              {[
                'Do you deliver to Lahore?',
                'Show me faucets under 10000',
                'What is warranty on Sonex fixtures?',
                'Black shower sets dikhao',
                'Kitna cement lagega 10 marla mein?'
              ].map((query, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setTestPrompt(query); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>

          {/* RESPONSE VIEWER */}
          {testResponse && (
            <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  <span>AI Response Output</span>
                </span>
                {testResponse.suggestedSmartTool && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
                    Smart Tool: {testResponse.suggestedSmartTool}
                  </span>
                )}
              </div>

              {/* Natural Language Reply */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {testResponse.reply}
              </div>

              {/* Recommended Product Cards Preview */}
              {Array.isArray(testResponse.recommendedProducts) && testResponse.recommendedProducts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Grounding Products Attached ({testResponse.recommendedProducts.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {testResponse.recommendedProducts.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <img 
                          src={p.image || '/placeholder.jpg'} 
                          alt={p.name} 
                          className="w-12 h-12 object-cover rounded-md bg-slate-950 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-cyan-400 font-mono">{p.price}</p>
                          {p.brand && <p className="text-[9px] text-slate-400 uppercase">{p.brand}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Info Card Preview */}
              {testResponse.deliveryInfoCard && (
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">City Delivery: {testResponse.deliveryInfoCard.cityName}</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">{testResponse.deliveryInfoCard.estimatedDays} • Fee: PKR {testResponse.deliveryInfoCard.deliveryFee}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono">Verified</span>
                </div>
              )}

              {/* Suggested Quick Replies */}
              {Array.isArray(testResponse.suggestedReplies) && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-mono text-slate-500">Chips:</span>
                  {testResponse.suggestedReplies.map((r: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IDENTITY & DATA SOURCES */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
          
          {/* GENERAL & WELCOME MESSAGE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>General Identity & Welcome Greeting</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Assistant Display Name
                </label>
                <input
                  type="text"
                  value={formState.aiName}
                  onChange={(e) => setFormState({ ...formState, aiName: e.target.value })}
                  placeholder="e.g. Zafar AI Shopping Assistant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Gemini AI Model
                </label>
                <select
                  value={formState.selectedModel}
                  onChange={(e) => setFormState({ ...formState, selectedModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest &amp; Accurate)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deepest Reasoning &amp; Complex Math)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Welcome Message Greeting
              </label>
              <textarea
                rows={5}
                value={formState.welcomeMessage}
                onChange={(e) => setFormState({ ...formState, welcomeMessage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* DATA SOURCES TOGGLES */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Live Database Context Sources</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'products' as const, label: 'Products & Inventory', icon: Package, color: 'text-blue-400' },
                { key: 'categories' as const, label: 'Product Categories', icon: Layers, color: 'text-cyan-400' },
                { key: 'brands' as const, label: 'Authorized Brands', icon: Award, color: 'text-amber-400' },
                { key: 'deliveryInfo' as const, label: 'City Delivery Rates', icon: ShieldCheck, color: 'text-emerald-400' },
                { key: 'customKnowledge' as const, label: 'Custom Knowledge', icon: BookOpen, color: 'text-purple-400' },
                { key: 'companyInfo' as const, label: 'Store Contact & Info', icon: ShieldCheck, color: 'text-rose-400' }
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleDataSource(key)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    formState.dataSources[key]
                      ? 'bg-blue-950/60 border-blue-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span>{label}</span>
                  </div>
                  {formState.dataSources[key] ? <ToggleRight className="w-5 h-5 text-blue-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* SUGGESTED QUESTIONS CHIPS */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Suggested Quick Questions Chips</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Do you have matte black accessories?"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-2">
              {formState.suggestedQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200">
                  <span className="font-medium">"{q}"</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xl shadow-blue-950 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save AI Assistant Settings to Supabase'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
