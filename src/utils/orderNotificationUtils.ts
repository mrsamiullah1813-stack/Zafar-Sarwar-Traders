/**
 * Instant Audio & Cross-Tab Notification Utility for Customer Orders
 */

// Web Audio API Chime for New Order Arrival
export function playNewOrderAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: G#5 (830.61 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.28, now + 0.20);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);

    // Note 3: B5 (987.77 Hz) - triumphant high finish
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(987.77, now + 0.32);
    gain3.gain.setValueAtTime(0, now + 0.32);
    gain3.gain.linearRampToValueAtTime(0.3, now + 0.38);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.32);
    osc3.stop(now + 0.9);
  } catch (err) {
    console.debug('[Audio] Could not play alert sound:', err);
  }
}

// Cross-tab Broadcast Channel for zero-latency sync
let orderBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    orderBroadcastChannel = new BroadcastChannel('zst_orders_realtime_sync');
  }
} catch {}

export function broadcastNewOrderPlaced(order: any) {
  try {
    // 1. Dispatch custom DOM event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zst_order_placed', { detail: order }));
    }

    // 2. Broadcast across tabs via BroadcastChannel
    if (orderBroadcastChannel) {
      orderBroadcastChannel.postMessage({ type: 'NEW_ORDER', order, timestamp: Date.now() });
    }

    // 3. Trigger localStorage storage event by writing timestamp ping
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zst_last_order_ping', JSON.stringify({ id: order?.id, time: Date.now() }));
    }
  } catch (e) {
    console.warn('[Realtime Orders Broadcast] Error broadcasting:', e);
  }
}

export function subscribeToRealtimeOrderEvents(onNewOrder: (order?: any) => void): () => void {
  const handleCustomEvent = (e: any) => {
    if (e?.detail) onNewOrder(e.detail);
    else onNewOrder();
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_ORDER') {
      onNewOrder(event.data.order);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === 'zst_last_order_ping' || event.key === 'zst_orders_v1' || event.key === 'zst_orders') {
      onNewOrder();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('zst_order_placed', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  if (orderBroadcastChannel) {
    orderBroadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('zst_order_placed', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
    if (orderBroadcastChannel) {
      orderBroadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
