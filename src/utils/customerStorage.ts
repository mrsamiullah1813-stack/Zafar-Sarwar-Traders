import { CustomerProfile, CustomerOrder } from '../types';

const CUSTOMER_PROFILE_KEY = 'zft_current_customer_profile';
const CUSTOMER_COUNTER_KEY = 'zft_customer_counter';

// Keep an in-memory store in case localStorage is blocked/unavailable in some browser/iframe environments
const inMemoryStore: Record<string, string> = {};

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return inMemoryStore[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      inMemoryStore[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete inMemoryStore[key];
    }
  }
};

export const getOrGenerateCustomerId = (): string => {
  const existing = safeLocalStorage.getItem('zft_customer_id');
  if (existing) return existing;

  const countStr = safeLocalStorage.getItem(CUSTOMER_COUNTER_KEY);
  let count = countStr ? parseInt(countStr, 10) : 1000;
  count += 1;

  const newId = `ZFT-CUST-${count}`;
  safeLocalStorage.setItem(CUSTOMER_COUNTER_KEY, count.toString());
  safeLocalStorage.setItem('zft_customer_id', newId);
  return newId;
};

export const loadCustomerProfile = (): CustomerProfile => {
  const stored = safeLocalStorage.getItem(CUSTOMER_PROFILE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse customer profile', e);
    }
  }

  const customerId = getOrGenerateCustomerId();
  const defaultProfile: CustomerProfile = {
    customerId,
    fullName: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    city: 'Lahore',
    areaLocality: '',
    completeAddress: '',
    createdAt: new Date().toISOString(),
    savedAddresses: []
  };

  saveCustomerProfile(defaultProfile);
  return defaultProfile;
};

export const saveCustomerProfile = (profile: CustomerProfile): void => {
  safeLocalStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  if (profile.customerId) {
    safeLocalStorage.setItem('zft_customer_id', profile.customerId);
  }
};

export const filterOrdersForCustomer = (orders: CustomerOrder[], profile: CustomerProfile): CustomerOrder[] => {
  if (!profile) return [];
  return orders.filter(order => {
    // Check by Customer ID match first
    if (order.customerId && profile.customerId && order.customerId === profile.customerId) {
      return true;
    }
    // Fallback: Check by Phone Number match if Customer ID not attached
    if (profile.phoneNumber && order.phoneNumber) {
      const cleanProfilePhone = profile.phoneNumber.replace(/\D/g, '');
      const cleanOrderPhone = order.phoneNumber.replace(/\D/g, '');
      if (cleanProfilePhone && cleanOrderPhone && cleanProfilePhone === cleanOrderPhone) {
        return true;
      }
    }
    return false;
  });
};
