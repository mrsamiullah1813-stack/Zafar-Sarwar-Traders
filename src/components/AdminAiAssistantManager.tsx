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
  Check
} from 'lucide-react';
import { AiAssistantConfig, AiCustomKnowledge } from '../types';

interface AdminAiAssistantManagerProps {
  config: AiAssistantConfig;
  onSaveConfig: (updatedConfig: AiAssistantConfig) => void;
}

export const AdminAiAssistantManager: React.FC<AdminAiAssistantManagerProps> = ({
  config,
  onSaveConfig
}) => {
  const [formState, setFormState] = useState<AiAssistantConfig>({ ...config });
  const [newQuestion, setNewQuestion] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Knowledge Form State
  const [showAddCk, setShowAddCk] = useState(false);
  const [ckTitle, setCkTitle] = useState('');
  const [ckCategory, setCkCategory] = useState<AiCustomKnowledge['category']>('general');
  const [ckQuestion, setCkQuestion] = useState('');
  const [ckAnswer, setCkAnswer] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Custom Knowledge Handlers
  const handleAddCustomKnowledge = () => {
    if (!ckTitle.trim() || !ckAnswer.trim()) {
      alert('Please fill in both the Knowledge Title and Content/Answer.');
      return;
    }

    const newItem: AiCustomKnowledge = {
      id: `ck-${Date.now()}`,
      title: ckTitle.trim(),
      category: ckCategory,
      questionOrTopic: ckQuestion.trim() || ckTitle.trim(),
      answerOrContent: ckAnswer.trim(),
      isEnabled: true,
      displayOrder: (formState.customKnowledge || []).length + 1
    };

    setFormState(prev => ({
      ...prev,
      customKnowledge: [...(prev.customKnowledge || []), newItem]
    }));

    setCkTitle('');
    setCkQuestion('');
    setCkAnswer('');
    setShowAddCk(false);
    showToast('New Custom AI Knowledge entry added!');
  };

  const handleToggleCkEnabled = (id: string) => {
    setFormState(prev => ({
      ...prev,
      customKnowledge: (prev.customKnowledge || []).map(item => 
        item.id === id ? { ...item, isEnabled: !item.isEnabled } : item
      )
    }));
  };

  const handleDeleteCkItem = (id: string) => {
    setFormState(prev => ({
      ...prev,
      customKnowledge: (prev.customKnowledge || []).filter(item => item.id !== id)
    }));
    showToast('Knowledge item removed.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formState);
    showToast('AI Sales & Website Assistant Settings successfully saved!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/30 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-400 shrink-0">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              <span>AI Sales & Website Assistant Settings</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                formState.isEnabled 
                  ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950 border-rose-500/40 text-rose-300'
              }`}>
                {formState.isEnabled ? 'AI Active' : 'AI Disabled'}
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-light mt-1 max-w-xl">
              Configure your floating AI showroom consultant. Customize AI name, welcome message, Gemini model, live database sources, and interactive quick questions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
            <span>{formState.isEnabled ? 'AI Enabled' : 'AI Disabled'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: GENERAL & WELCOME MESSAGE */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>General Identity & Welcome Greeting</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                AI Assistant Name
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
              <label className="block text-xs font-bold text-slate-300 mb-1">
                AI Model Selection
              </label>
              <select
                value={formState.selectedModel}
                onChange={(e) => setFormState({ ...formState, selectedModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended - Fastest & High Accuracy)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex Reasoning)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Welcome Message (Shown when user opens floating AI chat)
            </label>
            <textarea
              rows={8}
              value={formState.welcomeMessage}
              onChange={(e) => setFormState({ ...formState, welcomeMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Chat Styling Theme</span>
              </label>
              <select
                value={formState.theme}
                onChange={(e) => setFormState({ ...formState, theme: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="dark-cyan">Dark Luxury Cyan (Glow Ring & Glassmorphism)</option>
                <option value="emerald-gold">Emerald & Gold Showroom Edition</option>
                <option value="midnight-sapphire">Midnight Sapphire Blue</option>
                <option value="slate-glass">Slate Minimalist Glass</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
              <Key className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-[11px] text-slate-400">
                <span className="font-bold text-white block">API Credentials</span>
                {formState.apiKeyNotice || "GEMINI_API_KEY environment secret is attached server-side automatically."}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE DATA SOURCES & RAG REAL-TIME SYNC */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Real-Time Database Knowledge Sources (RAG)</span>
          </h3>

          <p className="text-xs text-slate-400">
            Select which live data modules the AI Assistant reads in real-time. Whenever Admin updates product prices, descriptions, images, or business info, the AI immediately uses the latest information with zero delay!
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleToggleDataSource('products')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.products
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Package className="w-4 h-4 text-blue-400" />
                <span>Live Products ({formState.dataSources.products ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.products ? <ToggleRight className="w-5 h-5 text-blue-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDataSource('categories')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.categories
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Categories ({formState.dataSources.categories ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.categories ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDataSource('brands')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.brands
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Brands ({formState.dataSources.brands ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.brands ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDataSource('faqs')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.faqs
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>FAQs ({formState.dataSources.faqs ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.faqs ? <ToggleRight className="w-5 h-5 text-cyan-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDataSource('reviews')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.reviews
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Reviews ({formState.dataSources.reviews ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.reviews ? <ToggleRight className="w-5 h-5 text-sky-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDataSource('companyInfo')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                formState.dataSources.companyInfo
                  ? 'bg-blue-950/60 border-blue-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Store Contact & Info ({formState.dataSources.companyInfo ? 'ON' : 'OFF'})</span>
              </div>
              {formState.dataSources.companyInfo ? <ToggleRight className="w-5 h-5 text-purple-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* SECTION 3: ASSISTANT FEATURES & INTERACTIVE MODULES */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Interactive Features & Recommendation Modules</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Product Recommendations</span>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, enableProductRecommendations: !formState.enableProductRecommendations })}
                >
                  {formState.enableProductRecommendations ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Display rich product cards with image, price, specs & direct WhatsApp ordering button in chat.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Quote & WhatsApp Assistance</span>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, enableQuoteAssistance: !formState.enableQuoteAssistance })}
                >
                  {formState.enableQuoteAssistance ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Provide instant price quotes, wholesale estimates, and pre-formatted WhatsApp chat links.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Bathroom Planner Launch</span>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, enableBathroomPlanner: !formState.enableBathroomPlanner })}
                >
                  {formState.enableBathroomPlanner ? <ToggleRight className="w-6 h-6 text-purple-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Allow AI assistant to launch complete bathroom package recommendations and open the site's planner.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: CUSTOM AI KNOWLEDGE BASE & STORE POLICIES */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Custom AI Knowledge Base, Policies & FAQs</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCk(!showAddCk)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddCk ? 'Cancel' : 'Add Custom Knowledge'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Train the AI Assistant on custom showroom policies, warranty details, installation guidance, return policies, or business FAQs. The AI will cite these custom rules in customer conversations.
          </p>

          {/* ADD CUSTOM KNOWLEDGE FORM */}
          {showAddCk && (
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-purple-300 font-mono uppercase">
                ➕ New Custom Knowledge Entry
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Knowledge Title</label>
                  <input
                    type="text"
                    value={ckTitle}
                    onChange={(e) => setCkTitle(e.target.value)}
                    placeholder="e.g. Installation & Fitting Services Policy"
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
                    <option value="faq">FAQ</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="warranty">Warranty & Quality</option>
                    <option value="general">General Knowledge</option>
                    <option value="custom">Custom Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer Question / Topic Keywords</label>
                <input
                  type="text"
                  value={ckQuestion}
                  onChange={(e) => setCkQuestion(e.target.value)}
                  placeholder="e.g. Do you provide installation or plumber contacts in Lahore?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">AI Answer / Detailed Policy Content</label>
                <textarea
                  rows={3}
                  value={ckAnswer}
                  onChange={(e) => setCkAnswer(e.target.value)}
                  placeholder="e.g. We provide recommended certified plumber contacts for Lahore and Chiniot regions. Fitting charges are settled directly with the plumbing technician..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCk(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomKnowledge}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Add Entry
                </button>
              </div>
            </div>
          )}

          {/* CUSTOM KNOWLEDGE ITEMS LIST */}
          <div className="space-y-3">
            {(formState.customKnowledge || []).map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isEnabled
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-white font-serif truncate">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-cyan-300 font-mono font-medium">
                      Q: "{item.questionOrTopic}"
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                      {item.answerOrContent}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
            ))}
          </div>
        </div>

        {/* SECTION 5: SUGGESTED QUESTIONS CHIPS */}
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

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xl shadow-blue-950 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save AI Assistant Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
};
