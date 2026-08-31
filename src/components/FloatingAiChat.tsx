import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Bot, 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Send, 
  MessageSquare, 
  ShoppingBag, 
  Compass, 
  TrendingUp, 
  Award, 
  PhoneCall, 
  MapPin, 
  Tag, 
  ExternalLink, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw,
  Sliders,
  ShieldCheck,
  Check,
  ChevronRight
} from 'lucide-react';
import { Product, ProductCategory, BusinessConfig, ProductBrand, AiAssistantConfig, ChatMessage, ChatMessageProduct, ComparisonData } from '../types';

interface FloatingAiChatProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  config: BusinessConfig;
  aiAssistantConfig: AiAssistantConfig;
  onViewProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onSelectCategory?: (categoryId: string) => void;
  onOpenPlanner?: () => void;
}

export const FloatingAiChat: React.FC<FloatingAiChatProps> = ({
  products,
  categories,
  brands,
  config,
  aiAssistantConfig,
  onViewProduct,
  onAddToCart,
  onSelectCategory,
  onOpenPlanner
}) => {
  if (!aiAssistantConfig.isEnabled) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: aiAssistantConfig.welcomeMessage || `Welcome to Zafar Sarwar Traders!\nI'm your AI Shopping Assistant. How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: [
          'Browse Products',
          'Bathroom Planner',
          'I need a luxury faucet',
          'Show me black showers',
          'Order on WhatsApp'
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  // Helper to match product objects from live state
  const findProductByNameOrId = (identifier: string): Product | undefined => {
    if (!identifier) return undefined;
    const lower = identifier.toLowerCase();
    return (products || []).find(p => p && (p.id === identifier || (p.name || '').toLowerCase().includes(lower) || lower.includes((p.name || '').toLowerCase())));
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsTyping(true);

    // Check for quick client-side trigger actions
    const lowerText = textToSend.toLowerCase();

    // Match Business Leadership Queries (Owner, Founder, CEO, Combined Leadership)
    const matchLeadership = (raw: string): 'owner' | 'ceo' | 'combined' | null => {
      const q = raw.toLowerCase().replace(/['"’`]/g, '').replace(/[?.,!/\\-_:;]/g, ' ').trim();
      const normalized = ` ${q.replace(/\s+/g, ' ')} `;
      const mentionsOwner = /\b(owner|founder|proprietor|started the business|established the business|founded the business|owns the shop|owns this|owns zafar|zafar sarwar|malik)\b/i.test(normalized);
      const mentionsCeo = /\b(ceo|chief executive|operations manager|day to day manager|manages the business|manages the shop|manages this business|management head|head of management|abubakar zafar|abubakar)\b/i.test(normalized);
      if (mentionsOwner && mentionsCeo) return 'combined';
      const isCombinedOrGeneral = 
        normalized.includes(' owner and ceo ') ||
        normalized.includes(' owner & ceo ') ||
        normalized.includes(' founder and ceo ') ||
        normalized.includes(' founder & ceo ') ||
        normalized.includes(' who runs zafar sarwar traders ') ||
        normalized.includes(' who runs zafar ') ||
        normalized.includes(' who is behind zafar sarwar traders ') ||
        normalized.includes(' who is behind zafar ') ||
        normalized.includes(' who is behind the shop ') ||
        normalized.includes(' who is behind this ') ||
        normalized.includes(' who is the main person in the business ') ||
        normalized.includes(' who is the main person ') ||
        normalized.includes(' who manages zafar sarwar traders ') ||
        normalized.includes(' who manages zafar ') ||
        normalized.includes(' who is in charge of the shop ') ||
        normalized.includes(' who is in charge of this ') ||
        normalized.includes(' who is in charge ') ||
        normalized.includes(' who leads the business ') ||
        normalized.includes(' business leadership ') ||
        normalized.includes(' company leadership ') ||
        normalized.includes(' management team ') ||
        normalized.includes(' business management ') ||
        normalized.includes(' shop management ') ||
        normalized.includes(' who runs the company ') ||
        normalized.includes(' who runs this store ') ||
        normalized.includes(' who runs this shop ') ||
        normalized.includes(' who runs the shop ') ||
        normalized.includes(' who is the seller ') ||
        normalized.includes(' who is behind the shop ') ||
        normalized.includes(' dukan kon chalata hai ') ||
        normalized.includes(' incharge kon hai ');
      if (isCombinedOrGeneral) return 'combined';
      const isOwner = 
        normalized.includes(' owner ') ||
        normalized.includes(' owner name ') ||
        normalized.includes(' who is the owner ') ||
        normalized.includes(' whos the owner ') ||
        normalized.includes(' who is owner ') ||
        normalized.includes(' owner of zafar sarwar traders ') ||
        normalized.includes(' owner of zafar ') ||
        normalized.includes(' founder ') ||
        normalized.includes(' founder name ') ||
        normalized.includes(' who is the founder ') ||
        normalized.includes(' who is founder ') ||
        normalized.includes(' founder of zafar sarwar traders ') ||
        normalized.includes(' founder of zafar ') ||
        normalized.includes(' business owner ') ||
        normalized.includes(' shop owner ') ||
        normalized.includes(' main owner ') ||
        normalized.includes(' proprietor ') ||
        normalized.includes(' who owns the shop ') ||
        normalized.includes(' who owns zafar sarwar traders ') ||
        normalized.includes(' who owns zafar ') ||
        normalized.includes(' who owns this ') ||
        normalized.includes(' who started the business ') ||
        normalized.includes(' who established the business ') ||
        normalized.includes(' who founded the business ') ||
        normalized.includes(' who started zafar sarwar traders ') ||
        normalized.includes(' who started zafar ') ||
        normalized.includes(' head of the business ') ||
        normalized.includes(' person behind the business ') ||
        normalized.includes(' owner details ') ||
        normalized.includes(' owner information ') ||
        normalized.includes(' owner of this store ') ||
        normalized.includes(' owner of this shop ') ||
        normalized.includes(' about the owner ') ||
        normalized.includes(' tell me about the owner ') ||
        normalized.includes(' about the founder ') ||
        normalized.includes(' tell me about the founder ') ||
        normalized.includes(' zafar sarwar ') ||
        normalized.includes(' dukan ka malik ') ||
        normalized.includes(' malik kaun hai ') ||
        normalized.includes(' owner kon hai ');
      if (isOwner && !mentionsCeo) return 'owner';
      const isCeo = 
        normalized.includes(' ceo ') ||
        normalized.includes(' ceo name ') ||
        normalized.includes(' who is the ceo ') ||
        normalized.includes(' whos the ceo ') ||
        normalized.includes(' who is ceo ') ||
        normalized.includes(' ceo of zafar sarwar traders ') ||
        normalized.includes(' ceo of zafar ') ||
        normalized.includes(' chief executive officer ') ||
        normalized.includes(' chief executive ') ||
        normalized.includes(' business ceo ') ||
        normalized.includes(' shop ceo ') ||
        normalized.includes(' company ceo ') ||
        normalized.includes(' management head ') ||
        normalized.includes(' head of management ') ||
        normalized.includes(' who manages the business ') ||
        normalized.includes(' who manages this business ') ||
        normalized.includes(' who runs the business ') ||
        normalized.includes(' who manages the shop ') ||
        normalized.includes(' main manager ') ||
        normalized.includes(' business manager ') ||
        normalized.includes(' day to day manager ') ||
        normalized.includes(' operations manager ') ||
        normalized.includes(' ceo details ') ||
        normalized.includes(' ceo information ') ||
        normalized.includes(' about the ceo ') ||
        normalized.includes(' tell me about the ceo ') ||
        normalized.includes(' abubakar zafar ') ||
        normalized.includes(' ceo kon hai ') ||
        normalized.includes(' manager kon hai ');
      if (isCeo && !mentionsOwner) return 'ceo';
      const trimmed = q.trim();
      if (trimmed === 'owner' || trimmed === 'owner name' || trimmed === 'founder' || trimmed === 'founder name' || trimmed === 'proprietor' || trimmed === 'business owner' || trimmed === 'shop owner') return 'owner';
      if (trimmed === 'ceo' || trimmed === 'ceo name' || trimmed === 'chief executive' || trimmed === 'chief executive officer' || trimmed === 'operations manager') return 'ceo';
      if (trimmed === 'seller' || trimmed === 'main person' || trimmed === 'in charge' || trimmed === 'management' || trimmed === 'management team' || trimmed === 'leadership') return 'combined';
      return null;
    };

    const leadershipType = matchLeadership(textToSend);
    if (leadershipType) {
      let replyText = '';
      if (leadershipType === 'owner') {
        replyText = 'Zafar Sarwar is the Founder and Owner of Zafar Sarwar Traders. He established and owns the business and provides the overall vision and leadership behind the shop. The business operates under his ownership with a focus on quality products, customer satisfaction, and long-term growth.';
      } else if (leadershipType === 'ceo') {
        replyText = 'Abubakar Zafar, the son of Zafar Sarwar, serves as the CEO of Zafar Sarwar Traders. He is responsible for managing the shop\'s day-to-day operations, business activities, administration, and overall management, working to maintain the quality and growth of the business.';
      } else {
        replyText = 'Zafar Sarwar is the Founder and Owner of Zafar Sarwar Traders, while his son, Abubakar Zafar, serves as the CEO and oversees the day-to-day management and operations of the business.';
      }

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: ['Browse Products', 'Bathroom Planner', 'Order on WhatsApp']
          }
        ]);
      }, 400);
      return;
    }

    // Trigger: Bathroom Planner request
    if (lowerText.includes('bathroom planner') || lowerText.includes('planner') || lowerText.includes('design my bathroom')) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: `I've opened our **AI Bathroom Planner**! You can select your bathroom dimensions, aesthetic style (Modern Minimalist, Gold Luxury, Italian Matte Black), and budget scale to generate an instant package.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            launchPlanner: true,
            suggestedReplies: ['Browse Products', 'Order on WhatsApp', 'Contact Showroom']
          }
        ]);
      }, 600);
      return;
    }

    // Trigger: Contact info
    if (lowerText === 'contact us' || lowerText === 'shop location' || lowerText.includes('where is your shop') || lowerText.includes('address')) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: `**ZAFAR SARWAR TRADERS SHOWROOM**\n📍 **Address**: ${config.address}\n📞 **Phone / WhatsApp**: ${config.phone}\n✉️ **Email**: ${config.email}\n⏰ **Business Hours**: ${config.hoursWeekday} | ${config.hoursSunday}\n\nOur showroom features live water test benches for rain showers and faucets, custom paint color mixing, and bulk CPVC/UPVC pipe yards.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: ['Order on WhatsApp', 'Browse Products', 'Bathroom Planner']
          }
        ]);
      }, 500);
      return;
    }

    // Trigger: WhatsApp ordering
    if (lowerText === 'order on whatsapp' || lowerText.includes('whatsapp order')) {
      const waUrl = `https://wa.me/${(config.phone || '923108002863').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Zafar Sarwar Traders, I am inquiring from your website AI Assistant regarding product availability and prices.')}`;
      window.open(waUrl, '_blank');
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `Opening WhatsApp chat with our official sales team (+92 310 8002863). You can send us your architectural floor plan or product list for instant itemized quotations!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedReplies: ['Browse Products', 'Bathroom Planner', 'Contact Us']
        }
      ]);
      return;
    }

    // Call live RAG backend `/api/ai-chat`
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          storeContext: {
            config,
            products: products.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              brand: p.brand,
              features: p.features,
              specs: p.specs,
              stockStatus: p.stockStatus || 'In Stock',
              image: p.image
            })),
            categories: categories.map(c => ({ id: c.id, name: c.name })),
            brands: brands.map(b => ({ id: b.id, name: b.name })),
            aiAssistantConfig
          }
        })
      });

      const json = await response.json();
      setIsTyping(false);

      if (json.success && json.data) {
        const { reply, recommendedProducts, recommendedCategory, deliveryInfoCard, comparisonTable, launchPlanner, needsWhatsAppEscalation, suggestedReplies } = json.data;

        // Map recommended products from live products list
        const enrichedProducts: ChatMessageProduct[] = (recommendedProducts || []).map((p: any) => {
          const liveMatch = findProductByNameOrId(p.id || p.name);
          return {
            id: liveMatch ? liveMatch.id : (p.id || `rec-${Date.now()}`),
            name: liveMatch ? liveMatch.name : p.name,
            price: liveMatch ? liveMatch.price : (p.price || 'Price on Request'),
            image: liveMatch ? liveMatch.image : (p.image || 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80'),
            brand: liveMatch ? liveMatch.brand : (p.brand || 'Zafar Sarwar Traders'),
            category: liveMatch ? liveMatch.category : p.category,
            features: liveMatch ? liveMatch.features : p.features,
            stockStatus: liveMatch ? (liveMatch.stockStatus || 'In Stock') : 'In Stock'
          };
        });

        const asstMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendedProducts: enrichedProducts.length > 0 ? enrichedProducts : undefined,
          recommendedCategory: recommendedCategory || undefined,
          deliveryInfoCard: deliveryInfoCard || undefined,
          comparisonTable: comparisonTable || undefined,
          launchPlanner: !!launchPlanner || json.data.suggestedSmartTool === 'bathroom_planner',
          suggestedSmartTool: json.data.suggestedSmartTool || undefined,
          needsWhatsAppEscalation: !!needsWhatsAppEscalation,
          suggestedReplies: suggestedReplies || ['Order on WhatsApp', 'Browse Products', 'Bathroom Planner']
        };

        setMessages(prev => [...prev, asstMsg]);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      console.error('Chat AI Error:', err);
      setIsTyping(false);
      
      // Client-Side Smart Fallback RAG Search
      let fallbackText = `Here are matching items from our live Zafar Sarwar Traders catalog:`;
      const searchTerms = lowerText.split(' ').filter(w => w.length > 2);
      const safeProductsList = Array.isArray(products) ? products : [];
      const matchedProds = safeProductsList.filter(p => {
        if (!p) return false;
        const nameLower = (p.name || '').toLowerCase();
        const catLower = (p.category || '').toLowerCase();
        const brandLower = (p.brand || '').toLowerCase();
        return searchTerms.some(term => nameLower.includes(term) || catLower.includes(term) || brandLower.includes(term));
      }).slice(0, 3);

      const fallbackProducts: ChatMessageProduct[] = (matchedProds.length > 0 ? matchedProds : safeProductsList.slice(0, 3)).map(p => ({
        id: p.id,
        name: p.name || 'Product',
        price: p.price || 'Call for Price',
        image: p.image || '',
        brand: p.brand || 'Zafar Sarwar Traders',
        category: p.category || 'General',
        features: p.features || [],
        stockStatus: p.stockStatus || 'In Stock'
      }));

      setMessages(prev => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `Thank you for inquiring! ${fallbackText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendedProducts: fallbackProducts,
          suggestedReplies: ['Order on WhatsApp', 'Browse Products', 'Bathroom Planner']
        }
      ]);
    }
  };

  const handleQuickActionClick = (actionName: string) => {
    if (actionName === 'Browse Products') {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      handleSendMessage('Show me featured products and categories');
    } else if (actionName === 'Bathroom Planner') {
      if (onOpenPlanner) onOpenPlanner();
      const el = document.getElementById('bathroom-planner');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      handleSendMessage('I want to plan my bathroom');
    } else if (actionName === 'Trending Products' || actionName === 'Best Sellers') {
      handleSendMessage('Show me your best sellers and luxury trending products');
    } else if (actionName === 'Offers') {
      handleSendMessage('Do you have any current packages, wholesale rates, or special offers?');
    } else {
      handleSendMessage(actionName);
    }
  };

  const handleProductWhatsAppOrder = (prodName: string, prodPrice?: string) => {
    const text = `Hello Zafar Sarwar Traders, I would like to order/inquire about: ${prodName} (${prodPrice || 'Price on Request'}). Please share stock & delivery details.`;
    const waUrl = `https://wa.me/${(config.phone || '923108002863').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <>
      {/* FLOATING AI CHAT BUTTON (Bottom-Right Corner) */}
      {!isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 flex items-center gap-3 animate-bounce-subtle safe-area-bottom">
          {/* Unread Message Tooltip Preview */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 text-xs text-white shadow-2xl shadow-cyan-950/80 animate-fadeIn">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-medium">Need help? Ask AI Assistant</span>
          </div>

          <button
            onClick={handleOpenChat}
            className="group relative p-4 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 backdrop-blur-xl border border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Open AI Shopping Assistant"
          >
            {/* Pulsing Glowing Outer Ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-40 blur group-hover:opacity-80 transition duration-500 animate-pulse" />

            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-cyan-300 group-hover:rotate-12 transition-transform duration-300" />
              
              {/* Online Indicator Green Dot */}
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
              </span>

              {/* Unread Badge Count */}
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold border border-white shadow-lg">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* FLOATING CHAT WINDOW */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col transition-all duration-300 ${
            isFullscreen
              ? 'inset-2 sm:inset-6 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden'
              : isMinimized
              ? 'bottom-4 sm:bottom-6 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-80 max-w-xs bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden safe-area-bottom'
              : 'bottom-2 sm:bottom-6 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-[440px] h-[86vh] sm:h-[640px] max-h-[90vh] bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden safe-area-bottom'
          }`}
        >
          {/* HEADER BAR */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Bot className="w-5 h-5 text-cyan-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white font-serif tracking-wide flex items-center gap-1.5">
                  <span>{aiAssistantConfig.aiName || "Zafar AI Shopping Assistant"}</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-light flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Live Showroom Sales Consultant</span>
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleMinimize}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isFullscreen ? "Restore" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCloseChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/80 transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MINIMIZED STATE CONTENT */}
          {isMinimized ? (
            <div
              onClick={handleToggleMinimize}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
            >
              <span className="text-xs font-bold text-cyan-300">AI Assistant Minimized</span>
              <span className="text-[10px] text-slate-400">Click to resume</span>
            </div>
          ) : (
            <>
              {/* MESSAGES SCROLL AREA */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 animate-fadeIn`}
                    >
                      <div className="flex items-end gap-2 max-w-[90%]">
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mb-1">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none shadow-lg shadow-blue-950/50'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
                          }`}
                        >
                          {/* Message Text */}
                          <div className="whitespace-pre-wrap font-sans font-normal">
                            {msg.text}
                          </div>

                          {/* RECOMMENDED PRODUCTS CARDS */}
                          {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                            <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-800">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block font-mono">
                                💎 Recommended Showroom Products
                              </span>

                              <div className="grid grid-cols-1 gap-2.5">
                                {msg.recommendedProducts.map((prod) => {
                                  const fullProduct = findProductByNameOrId(prod.id || prod.name);

                                  return (
                                    <div
                                      key={prod.id}
                                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex items-start gap-3"
                                    >
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[10px] text-cyan-400 font-mono font-bold truncate">
                                            {prod.brand || 'Zafar Sarwar Traders'}
                                          </span>
                                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-mono">
                                            {prod.stockStatus || 'In Stock'}
                                          </span>
                                        </div>

                                        <h4 className="text-xs font-bold text-white font-serif truncate leading-tight mt-0.5">
                                          {prod.name}
                                        </h4>

                                        <span className="text-xs font-bold text-emerald-400 font-mono block mt-1">
                                          {prod.price || 'Call for Price'}
                                        </span>

                                        {prod.features && prod.features.length > 0 && (
                                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                            • {prod.features[0]}
                                          </p>
                                        )}

                                        {/* Action Buttons for Recommended Product */}
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                          {fullProduct && onViewProduct && (
                                            <button
                                              onClick={() => onViewProduct(fullProduct)}
                                              className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>View</span>
                                            </button>
                                          )}

                                          {fullProduct && onAddToCart && (
                                            <button
                                              onClick={() => onAddToCart(fullProduct)}
                                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                                            >
                                              <ShoppingBag className="w-3 h-3" />
                                              <span>Add Cart</span>
                                            </button>
                                          )}

                                          <button
                                            onClick={() => handleProductWhatsAppOrder(prod.name, prod.price)}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                            <span>WhatsApp</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* PRODUCT COMPARISON TABLE */}
                          {msg.comparisonTable && msg.comparisonTable.products && (
                            <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">
                                ⚖️ Product Comparison Matrix
                              </span>

                              <div className="overflow-x-auto rounded-xl border border-slate-800">
                                <table className="w-full text-left text-[10px] text-slate-300">
                                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[9px]">
                                    <tr>
                                      <th className="p-2 border-b border-slate-800">Product</th>
                                      <th className="p-2 border-b border-slate-800">Brand</th>
                                      <th className="p-2 border-b border-slate-800">Price</th>
                                      <th className="p-2 border-b border-slate-800">Warranty</th>
                                      <th className="p-2 border-b border-slate-800">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                                    {msg.comparisonTable.products.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/60">
                                        <td className="p-2 font-bold text-white">{item.name}</td>
                                        <td className="p-2 text-cyan-400 font-mono">{item.brand || 'ZST'}</td>
                                        <td className="p-2 text-emerald-400 font-mono font-bold">{item.price}</td>
                                        <td className="p-2 text-slate-300">{item.warranty || 'Original'}</td>
                                        <td className="p-2 text-slate-300">{item.availability || 'In Stock'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* RECOMMENDED CATEGORY CARD */}
                          {msg.recommendedCategory && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase block">
                                  📁 Featured Store Category
                                </span>
                                <h4 className="text-xs font-bold text-white font-serif mt-0.5">
                                  {msg.recommendedCategory.name}
                                </h4>
                                {msg.recommendedCategory.description && (
                                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                                    {msg.recommendedCategory.description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  if (onSelectCategory && msg.recommendedCategory?.id) {
                                    onSelectCategory(msg.recommendedCategory.id);
                                    const el = document.getElementById('products');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all shadow-md"
                              >
                                <span>View Category</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* DELIVERY INFORMATION CARD */}
                          {msg.deliveryInfoCard && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>City Delivery Details: {msg.deliveryInfoCard.cityName}</span>
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold">
                                  PKR {msg.deliveryInfoCard.deliveryFee}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-200 font-medium">
                                Estimated Delivery Time: <span className="text-emerald-300 font-mono font-bold">{msg.deliveryInfoCard.estimatedDays}</span>
                              </div>

                              {msg.deliveryInfoCard.notes && (
                                <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                                  • {msg.deliveryInfoCard.notes}
                                </p>
                              )}

                              <button
                                onClick={() => {
                                  const text = `Hello Zafar Sarwar Traders, I am inquiring regarding delivery details to ${msg.deliveryInfoCard?.cityName}.`;
                                  const waUrl = `https://wa.me/${(config.phone || '923108002863').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                                  window.open(waUrl, '_blank');
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Confirm Delivery on WhatsApp</span>
                              </button>
                            </div>
                          )}

                          {/* WHATSAPP ESCALATION BUTTON */}
                          {msg.needsWhatsAppEscalation && (
                            <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                              <p className="text-[10px] text-slate-200">
                                Need custom quotations, exact architectural sizing, or immediate team assistance?
                              </p>
                              <button
                                onClick={() => {
                                  const text = `Hello Zafar Sarwar Traders, I would like to consult with your showroom team directly regarding my requirements.`;
                                  const waUrl = `https://wa.me/${(config.phone || '923108002863').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                                  window.open(waUrl, '_blank');
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat Directly on WhatsApp (+92 310 8002863)</span>
                              </button>
                            </div>
                          )}

                          {/* LAUNCH PLANNER CARD */}
                          {msg.launchPlanner && (
                            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/80 to-blue-950/80 border border-purple-500/40 space-y-2">
                              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>AI Bathroom Planner Tool Available</span>
                              </span>
                              <p className="text-[10px] text-slate-300">
                                Want to customize your room dimensions and budget scale live? Launch the full designer below!
                              </p>
                              <button
                                onClick={() => {
                                  if (onOpenPlanner) onOpenPlanner();
                                  const el = document.getElementById('bathroom-planner');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                <span>Launch AI Bathroom Planner</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* SMART TOOLS CARDS */}
                          {msg.suggestedSmartTool && msg.suggestedSmartTool !== 'bathroom_planner' && (
                            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 space-y-2">
                              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                                <span>
                                  {msg.suggestedSmartTool === 'cement_estimator' && 'Material & Cement Estimator'}
                                  {msg.suggestedSmartTool === 'tank_calculator' && 'Water Tank & Pump Calculator'}
                                  {msg.suggestedSmartTool === 'tile_calculator' && 'Tile Box & Area Estimator'}
                                </span>
                              </span>
                              <p className="text-[10px] text-slate-300">
                                Launch our official engineering calculators to calculate exact quantities and estimates:
                              </p>
                              <button
                                onClick={() => {
                                  const el = document.getElementById('smart-tools') || document.getElementById('products');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                <span>Open Interactive Calculator</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <span className="text-[9px] text-slate-400/80 block text-right mt-1 font-mono">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* SUGGESTED REPLIES CHIPS FOR THIS MESSAGE */}
                      {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-9 mt-1">
                          {msg.suggestedReplies.map((reply, rIdx) => (
                            <button
                              key={rIdx}
                              onClick={() => handleQuickActionClick(reply)}
                              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-[10px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>{reply}</span>
                              <ChevronRight className="w-3 h-3 text-cyan-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* TYPING ANIMATION INDICATOR */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-100" />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-200" />
                      <span className="text-[10px] text-slate-400 font-mono ml-1">Searching live catalog...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK ACTION BUTTONS BAR */}
              <div className="p-2 bg-slate-950 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => handleQuickActionClick('Browse Products')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <ShoppingBag className="w-3 h-3 text-blue-400" />
                    <span>Browse Products</span>
                  </button>

                  <button
                    onClick={() => handleQuickActionClick('Bathroom Planner')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Bathroom Planner</span>
                  </button>

                  <button
                    onClick={() => handleQuickActionClick('Trending Products')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>Trending Products</span>
                  </button>

                  <button
                    onClick={() => handleQuickActionClick('Contact Us')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>Shop Location</span>
                  </button>

                  <button
                    onClick={() => handleQuickActionClick('Order on WhatsApp')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {/* INPUT BAR */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 mt-1.5"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about faucets, showers, prices, specs..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-cyan-950 transition-all shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

        </div>
      )}
    </>
  );
};
