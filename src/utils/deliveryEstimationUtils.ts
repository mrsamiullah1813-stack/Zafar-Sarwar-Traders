/**
 * Zafar Sarwar Traders — City-Based Dynamic Delivery Estimation Service
 * 
 * Origin: Chiniot, Punjab, Pakistan
 * Timezone: Asia/Karachi (UTC+5)
 * 
 * Delivery Tiers:
 * - Tier 1: Chiniot and nearby areas -> 1–2 days
 * - Tier 2: Nearby cities -> 2–3 days
 * - Tier 3: Medium-distance cities -> 3–4 days
 * - Tier 4: Farther cities across Pakistan -> 3–5 days
 * - Unmapped / Custom cities -> 3–5 days (provisional — courier confirmation dependent)
 * 
 * Dates are dynamically calculated using Asia/Karachi time with Day/Month precision (no hours).
 */

import { CityDeliveryInfo, DeliverySettings } from '../types';

export interface DeliveryEstimateResult {
  cityName: string;
  minDays: number;
  maxDays: number;
  rangeDaysLabel: string; // e.g. "1–2 days" or "1–2 Working Days"
  startDateText: string; // e.g. "30 Oct"
  endDateText: string; // e.g. "31 Oct"
  dateRangeText: string; // e.g. "30 Oct – 31 Oct"
  formattedDateRange: string; // e.g. "Fri, 30 Oct – Sat, 31 Oct"
  tierName: string;
  originText: string; // "Chiniot Showroom"
  isProvisional: boolean;
  provisionalNote?: string;
  badgeColor: 'emerald' | 'amber' | 'blue' | 'indigo' | 'slate';
}

// Tier 1: Chiniot & Immediate Vicinity (1–2 days)
export const TIER_1_CHINIOT_AREAS = [
  'chiniot',
  'chenab nagar',
  'rabwah',
  'bhowana',
  'lalian',
  'pindi bhattian',
  'sukheke',
  'sukheke mandi',
  'chak jhumra',
  'sangla hill',
  'shahkot'
];

// Tier 2: Nearby Cities & Neighboring Districts (2–3 days)
export const TIER_2_NEARBY_CITIES = [
  'faisalabad',
  'khurrianwala',
  'sargodha',
  'silanwali',
  'jhang',
  'hafizabad',
  'jaranwala',
  'gojra',
  'samundri',
  'tandlianwala',
  'toba tek singh',
  'kamalia',
  'pir mahal',
  'shorkot',
  'athara hazari',
  'kot momin',
  'bhalwal',
  'shahpur',
  'sahiwal (sargodha)',
  'safdarabad',
  'farooqabad',
  'nankana sahib',
  'warburton',
  'ali pur chatha',
  'wazirabad',
  'phalia',
  'malakwal',
  'mandi bahauddin',
  'khushab',
  'joharabad'
];

// Tier 3: Medium-Distance Cities (3–4 days)
export const TIER_3_MEDIUM_DISTANCE_CITIES = [
  'lahore',
  'sheikhupura',
  'sharaqpur',
  'sharaqpur sharif',
  'muridke',
  'ferozewala',
  'gujranwala',
  'kamoke',
  'nowshera virkan',
  'daska',
  'sialkot',
  'sambrial',
  'pasrur',
  'gujrat',
  'jalalpur jattan',
  'kunjah',
  'dinga',
  'kharian',
  'sarai alamgir',
  'raiwind',
  'kasur',
  'chunian',
  'pattoki',
  'kot radha kishan',
  'kanganpur',
  'okara',
  'renala khurd',
  'depalpur',
  'haveli lakha',
  'sahiwal',
  'chichawatni',
  'harappa',
  'pakpattan',
  'arifwala',
  'ahmadpur sial',
  'quaidabad',
  'noorpur thal',
  'naushera',
  'naushera (soon valley)',
  'abdul hakim',
  'kabirwala',
  'khanewal',
  'mian channu',
  'jahanian',
  'pind dadan khan',
  'kallar kahar',
  'choa saidan shah',
  'chakwal',
  'talagang',
  'lawa',
  'jhelum',
  'dina',
  'sohawa',
  'gujar khan',
  'rawalpindi',
  'islamabad',
  'taxila',
  'wah cantt',
  'kahuta',
  'kallar syedan',
  'murree',
  'kotli sattian',
  'attock',
  'hassan abdal',
  'fateh jang',
  'hazro',
  'pindi gheb',
  'jand',
  'narowal',
  'shakargarh',
  'zafarwal',
  'bhakkar',
  'darya khan',
  'kallurkot',
  'mankera',
  'mianwali',
  'isa khel',
  'piplan',
  'kundian',
  'kalabagh',
  'multan',
  'shujabad',
  'jalalpur pirwala',
  'lodhran',
  'dunyapur',
  'kahror pacca',
  'vehari',
  'burewala',
  'mailsi',
  'peshawar',
  'mardan',
  'abbottabad'
];

// Tier 4: Farther Cities Across Pakistan (3–5 days)
export const TIER_4_FARTHER_CITIES = [
  'bahawalpur',
  'ahmadpur east',
  'hasilpur',
  'khairpur tamewali',
  'yazman',
  'bahawalnagar',
  'chishtian',
  'haroonabad',
  'minchinabad',
  'fort abbas',
  'rahim yar khan',
  'sadiqabad',
  'khanpur',
  'liaquatpur',
  'chowk sarwar shaheed',
  'fatehpur',
  'chaubara',
  'chowk azam',
  'layyah',
  'karor lal esan',
  'kot addu',
  'muzaffargarh',
  'alipur',
  'jatoi',
  'dera ghazi khan',
  'dg khan',
  'taunsa',
  'kot chutta',
  'jampur',
  'rajanpur',
  'fazilpur',
  'rojhan',
  'sukkur',
  'rohri',
  'hyderabad',
  'karachi',
  'quetta',
  'gwadar',
  'gilgit',
  'skardu',
  'mirpur',
  'muzaffarabad',
  'larkana',
  'nawabshah',
  'turbat',
  'khuzdar'
];

/**
 * Get current date & time in Asia/Karachi (Pakistan Time UTC+5)
 */
export function getPakistanNow(): Date {
  const now = new Date();
  // Format to Asia/Karachi string and parse back
  try {
    const karachiStr = now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
    return new Date(karachiStr);
  } catch {
    // UTC + 5 hours fallback
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcTime + 5 * 3600000);
  }
}

/**
 * Add business days (skipping Sundays as dispatch hub holiday)
 */
export function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < daysToAdd) {
    result.setDate(result.getDate() + 1);
    // Sunday is day 0
    if (result.getDay() !== 0) {
      added++;
    }
  }
  return result;
}

/**
 * Format a Date to Day & Month only (NO hours):
 * e.g., "30 Oct" or with weekday "Fri, 30 Oct"
 */
export function formatDayMonth(date: Date, includeWeekday: boolean = false): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const d = date.getDate();
  const m = months[date.getMonth()];
  const w = weekdays[date.getDay()];

  if (includeWeekday) {
    return `${w}, ${d} ${m}`;
  }
  return `${d} ${m}`;
}

/**
 * Parses an explicit estimatedDays string like "1–2 Days", "2-3 Working Days", "3–4 days"
 */
function parseEstimatedDaysRange(str?: string): { min: number; max: number } | null {
  if (!str) return null;
  const match = str.match(/(\d+)\s*(?:–|-|to)\s*(\d+)/i);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    if (!isNaN(min) && !isNaN(max) && min > 0) {
      return { min, max: Math.max(min, max) };
    }
  }
  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return { min: val, max: val };
    }
  }
  return null;
}

/**
 * Calculates dynamic city delivery estimate based on city name, matched city record, or settings
 */
export function calculateDeliveryEstimate(
  cityInput?: string | CityDeliveryInfo | null,
  customSettings?: DeliverySettings
): DeliveryEstimateResult {
  const pktNow = getPakistanNow();
  
  // Cutoff time: 5:00 PM (17:00). If order is placed after 5:00 PM or on Sunday,
  // fulfillment dispatch starts the next business day.
  const isPastCutoff = pktNow.getHours() >= 17;
  const isSunday = pktNow.getDay() === 0;

  const dispatchStartDate = new Date(pktNow);
  if (isSunday) {
    // Move to Monday
    dispatchStartDate.setDate(dispatchStartDate.getDate() + 1);
  } else if (isPastCutoff) {
    // Next day (or Monday if Saturday evening)
    dispatchStartDate.setDate(dispatchStartDate.getDate() + 1);
    if (dispatchStartDate.getDay() === 0) {
      dispatchStartDate.setDate(dispatchStartDate.getDate() + 1);
    }
  }

  // Determine city name and object
  let cityName = 'Chiniot';
  let matchedCity: CityDeliveryInfo | undefined;

  if (typeof cityInput === 'string' && cityInput.trim()) {
    cityName = cityInput.trim();
  } else if (cityInput && typeof cityInput === 'object') {
    cityName = cityInput.cityName || 'Chiniot';
    matchedCity = cityInput;
  }

  const normCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Check if city has an admin-customized explicit estimatedDays
  const explicitParsed = matchedCity?.estimatedDays ? parseEstimatedDaysRange(matchedCity.estimatedDays) : null;

  let minDays = 1;
  let maxDays = 2;
  let tierName = 'Chiniot & Local Vicinity';
  let isProvisional = false;
  let provisionalNote: string | undefined;
  let badgeColor: 'emerald' | 'amber' | 'blue' | 'indigo' | 'slate' = 'emerald';

  if (explicitParsed && (matchedCity?.useCustomRules || matchedCity?.estimatedDays)) {
    minDays = explicitParsed.min;
    maxDays = explicitParsed.max;
    if (minDays <= 2 && maxDays <= 2) {
      tierName = 'Chiniot & Local Area';
      badgeColor = 'emerald';
    } else if (maxDays <= 3) {
      tierName = 'Nearby City';
      badgeColor = 'amber';
    } else if (maxDays <= 4) {
      tierName = 'Medium-Distance City';
      badgeColor = 'blue';
    } else {
      tierName = 'Nationwide Courier';
      badgeColor = 'indigo';
    }
  } else if (TIER_1_CHINIOT_AREAS.some(c => normCity === c || normCity.includes(c) || c.includes(normCity))) {
    // Tier 1: Chiniot and nearby areas: 1–2 days
    minDays = 1;
    maxDays = 2;
    tierName = 'Chiniot & Local Vicinity (Direct Fleet)';
    badgeColor = 'emerald';
  } else if (TIER_2_NEARBY_CITIES.some(c => normCity === c || normCity.includes(c) || c.includes(normCity))) {
    // Tier 2: Nearby cities: 2–3 days
    minDays = 2;
    maxDays = 3;
    tierName = 'Nearby City Express Route';
    badgeColor = 'amber';
  } else if (TIER_3_MEDIUM_DISTANCE_CITIES.some(c => normCity === c || normCity.includes(c) || c.includes(normCity))) {
    // Tier 3: Medium-distance cities: 3–4 days
    minDays = 3;
    maxDays = 4;
    tierName = 'Medium-Distance Express Transit';
    badgeColor = 'blue';
  } else if (TIER_4_FARTHER_CITIES.some(c => normCity === c || normCity.includes(c) || c.includes(normCity))) {
    // Tier 4: Farther cities across Pakistan: 3–5 days
    minDays = 3;
    maxDays = 5;
    tierName = 'Nationwide Courier & Cargo';
    badgeColor = 'indigo';
  } else {
    // Unmapped / Custom cities: 3–5 days provisional estimate
    minDays = 3;
    maxDays = 5;
    tierName = 'All Pakistan (Courier Route)';
    isProvisional = true;
    provisionalNote = 'Provisional estimate — courier confirmation dependent';
    badgeColor = 'slate';
  }

  // Calculate dynamic start and end dates
  const deliveryStartDate = addBusinessDays(dispatchStartDate, minDays);
  const deliveryEndDate = addBusinessDays(dispatchStartDate, maxDays);

  const startDayMonth = formatDayMonth(deliveryStartDate, false);
  const endDayMonth = formatDayMonth(deliveryEndDate, false);

  const startFormatted = formatDayMonth(deliveryStartDate, true);
  const endFormatted = formatDayMonth(deliveryEndDate, true);

  const rangeDaysLabel = minDays === maxDays ? `${minDays} Day` : `${minDays}–${maxDays} Days`;
  const dateRangeText = minDays === maxDays ? startDayMonth : `${startDayMonth} – ${endDayMonth}`;
  const formattedDateRange = minDays === maxDays ? startFormatted : `${startFormatted} – ${endFormatted}`;

  return {
    cityName,
    minDays,
    maxDays,
    rangeDaysLabel,
    startDateText: startDayMonth,
    endDateText: endDayMonth,
    dateRangeText,
    formattedDateRange,
    tierName,
    originText: 'Chiniot Showroom',
    isProvisional,
    provisionalNote,
    badgeColor
  };
}
