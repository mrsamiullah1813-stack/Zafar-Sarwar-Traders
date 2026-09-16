import { CityDeliveryInfo } from '../types';
import { generateCityTiersForBaseFee, generateHeavyCityTiersForBaseFee } from '../utils/deliveryFeeCalculator';

export const createDefaultCityInfo = (
  id: string,
  cityName: string,
  province: string,
  areaTown: string,
  baseFee: number,
  displayOrder: number,
  options?: Partial<CityDeliveryInfo>
): CityDeliveryInfo => {
  const citySlug = id.replace('city-', '');
  return {
    id,
    cityName,
    province,
    areaTown,
    status: 'available',
    estimatedDays: baseFee <= 200 ? '1 Working Day' : (baseFee <= 300 ? '1–2 Working Days' : '2–3 Working Days'),
    deliveryFee: baseFee,
    baseFee: baseFee,
    lightWeightFee: baseFee,
    heavyWeightFee: baseFee + (baseFee <= 250 ? 100 : (baseFee <= 350 ? 130 : 150)),
    deliveryFeeType: 'tiered',
    useCustomRules: true,
    isEnabled: true,
    displayOrder,
    deliveryTiers: generateCityTiersForBaseFee(baseFee, citySlug),
    heavyDeliveryTiers: generateHeavyCityTiersForBaseFee(baseFee, citySlug),
    ...options
  };
};

export const defaultDeliveryCities: CityDeliveryInfo[] = [
  // 1. Chiniot & Core Local (Rs. 200)
  createDefaultCityInfo('city-chiniot', 'Chiniot', 'Punjab', 'Chiniot City & Tehsil', 200, 1, {
    estimatedDays: 'Same Day / 1 Day',
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    deliveryFeeCustomText: 'Standard Delivery (Rs. 200)',
    notes: 'Express direct delivery from our Chiniot showroom.',
    coverageAreas: ['Chiniot City', 'Katchery Road', 'Jhang Road', 'Faisalabad Road', 'Chenab Nagar / Rabwah', 'Bhowana', 'Lalian']
  }),
  createDefaultCityInfo('city-rabwah', 'Chenab Nagar (Rabwah)', 'Punjab', 'Chenab Nagar & Surrounding Towns', 200, 2, {
    estimatedDays: 'Same Day / 1 Day',
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Showroom vehicle direct route (~10 km from Chiniot).'
  }),
  createDefaultCityInfo('city-bhowana', 'Bhowana', 'Punjab', 'Bhowana Tehsil & Surrounding Area', 200, 3, {
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Direct showroom vehicle route.'
  }),
  createDefaultCityInfo('city-lalian', 'Lalian', 'Punjab', 'Lalian Tehsil & Surrounding Area', 200, 4, {
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Direct showroom vehicle route.'
  }),
  createDefaultCityInfo('city-pindi-bhattian', 'Pindi Bhattian', 'Punjab', 'Pindi Bhattian Motorway Interchange', 200, 5, {
    isSameDayAvailable: true,
    isNextDayAvailable: true
  }),
  createDefaultCityInfo('city-sukheke', 'Sukheke Mandi', 'Punjab', 'Sukheke Mandi', 200, 6),
  createDefaultCityInfo('city-chak-jhumra', 'Chak Jhumra', 'Punjab', 'Chak Jhumra City & Tehsil', 200, 7, { isSameDayAvailable: true }),
  createDefaultCityInfo('city-sangla-hill', 'Sangla Hill', 'Punjab', 'Sangla Hill City & Tehsil', 200, 8),
  createDefaultCityInfo('city-shahkot', 'Shahkot', 'Punjab', 'Shahkot City & Tehsil', 200, 9),

  // 2. Faisalabad, Sargodha, Jhang & Close Neighboring Districts (Rs. 200 - 250)
  createDefaultCityInfo('city-faisalabad', 'Faisalabad', 'Punjab', 'All Towns & Industrial Zones', 200, 10, {
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Daily delivery shuttle available.'
  }),
  createDefaultCityInfo('city-khurrianwala', 'Khurrianwala', 'Punjab', 'Khurrianwala Industrial Zone', 200, 11, { isSameDayAvailable: true }),
  createDefaultCityInfo('city-sargodha', 'Sargodha', 'Punjab', 'Sargodha City, Cantt & Satellite Town', 200, 12, {
    isSameDayAvailable: false,
    isNextDayAvailable: true,
    notes: 'Direct truck delivery route.'
  }),
  createDefaultCityInfo('city-silanwali', 'Silanwali', 'Punjab', 'Silanwali City & Handicrafts Hub', 200, 13),
  createDefaultCityInfo('city-jhang', 'Jhang', 'Punjab', 'Jhang City, Saddar & Shorkot', 200, 14, {
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Showroom delivery route.'
  }),
  createDefaultCityInfo('city-hafizabad', 'Hafizabad', 'Punjab', 'Hafizabad City & Grain Market', 250, 15),
  createDefaultCityInfo('city-jaranwala', 'Jaranwala', 'Punjab', 'Jaranwala City & Tehsil', 250, 16),
  createDefaultCityInfo('city-gojra', 'Gojra', 'Punjab', 'Gojra City & Tehsil', 250, 17),
  createDefaultCityInfo('city-samundri', 'Samundri', 'Punjab', 'Samundri City & Tehsil', 250, 18),
  createDefaultCityInfo('city-tandlianwala', 'Tandlianwala', 'Punjab', 'Tandlianwala City & Tehsil', 250, 19),
  createDefaultCityInfo('city-toba-tek-singh', 'Toba Tek Singh', 'Punjab', 'Toba Tek Singh City & Saddar', 250, 20),
  createDefaultCityInfo('city-kamalia', 'Kamalia', 'Punjab', 'Kamalia City & Khaddar Market', 250, 21),
  createDefaultCityInfo('city-pir-mahal', 'Pir Mahal', 'Punjab', 'Pir Mahal City & Tehsil', 250, 22),
  createDefaultCityInfo('city-shorkot', 'Shorkot', 'Punjab', 'Shorkot City & Cantt', 250, 23),
  createDefaultCityInfo('city-athara-hazari', 'Athara Hazari', 'Punjab', 'Athara Hazari City & Tehsil', 250, 24),
  createDefaultCityInfo('city-kot-momin', 'Kot Momin', 'Punjab', 'Kot Momin Motorway Hub', 250, 25),
  createDefaultCityInfo('city-bhalwal', 'Bhalwal', 'Punjab', 'Bhalwal City & Citrus Market', 250, 26),
  createDefaultCityInfo('city-shahpur', 'Shahpur', 'Punjab', 'Shahpur Saddar & Tehsil', 250, 27),
  createDefaultCityInfo('city-sahiwal-sargodha', 'Sahiwal (Sargodha)', 'Punjab', 'Sahiwal Tehsil (District Sargodha)', 250, 28),
  createDefaultCityInfo('city-safdarabad', 'Safdarabad', 'Punjab', 'Safdarabad City & Tehsil', 250, 29),
  createDefaultCityInfo('city-farooqabad', 'Farooqabad', 'Punjab', 'Farooqabad City (Choohar Kana)', 250, 30),
  createDefaultCityInfo('city-nankana-sahib', 'Nankana Sahib', 'Punjab', 'Nankana Sahib City & Gurdwara Area', 250, 31),
  createDefaultCityInfo('city-warburton', 'Warburton', 'Punjab', 'Warburton City', 250, 32),
  createDefaultCityInfo('city-ali-pur-chatha', 'Ali Pur Chatha', 'Punjab', 'Ali Pur Chatha City & Tehsil', 250, 33),
  createDefaultCityInfo('city-wazirabad', 'Wazirabad', 'Punjab', 'Wazirabad City & Cutlery Zone', 250, 34),
  createDefaultCityInfo('city-phalia', 'Phalia', 'Punjab', 'Phalia City & Tehsil', 250, 35),
  createDefaultCityInfo('city-malakwal', 'Malakwal', 'Punjab', 'Malakwal City & Tehsil', 250, 36),
  createDefaultCityInfo('city-mandi-bahauddin', 'Mandi Bahauddin', 'Punjab', 'Mandi Bahauddin City & District', 250, 37),
  createDefaultCityInfo('city-khushab', 'Khushab', 'Punjab', 'Khushab City & District', 250, 38),
  createDefaultCityInfo('city-joharabad', 'Joharabad', 'Punjab', 'Joharabad City (Administrative HQ)', 250, 39),

  // 3. Lahore, Gujranwala, Sialkot & Central-Eastern Punjab (Rs. 250 - 300)
  createDefaultCityInfo('city-lahore', 'Lahore', 'Punjab', 'All Zones (DHA, Gulberg, Bahria, Johar Town, etc.)', 250, 40, {
    isSameDayAvailable: true,
    isNextDayAvailable: true,
    notes: 'Daily direct courier & cargo service.'
  }),
  createDefaultCityInfo('city-sheikhupura', 'Sheikhupura', 'Punjab', 'Sheikhupura City, Housing Societies & Cantt', 250, 41),
  createDefaultCityInfo('city-sharaqpur', 'Sharaqpur Sharif', 'Punjab', 'Sharaqpur Sharif City & Tehsil', 250, 42),
  createDefaultCityInfo('city-muridke', 'Muridke', 'Punjab', 'Muridke City & GT Road', 250, 43),
  createDefaultCityInfo('city-ferozewala', 'Ferozewala', 'Punjab', 'Ferozewala Tehsil', 250, 44),
  createDefaultCityInfo('city-gujranwala', 'Gujranwala', 'Punjab', 'Gujranwala City & Cantt', 250, 45, {
    isSameDayAvailable: true,
    isNextDayAvailable: true
  }),
  createDefaultCityInfo('city-kamoke', 'Kamoke', 'Punjab', 'Kamoke City & GT Road', 250, 46),
  createDefaultCityInfo('city-nowshera-virkan', 'Nowshera Virkan', 'Punjab', 'Nowshera Virkan Tehsil', 250, 47),
  createDefaultCityInfo('city-daska', 'Daska', 'Punjab', 'Daska City & Industrial Zone', 280, 48),
  createDefaultCityInfo('city-sialkot', 'Sialkot', 'Punjab', 'Sialkot City & Cantt', 280, 49, { isNextDayAvailable: true }),
  createDefaultCityInfo('city-sambrial', 'Sambrial', 'Punjab', 'Sambrial City & Airport Area', 280, 50),
  createDefaultCityInfo('city-pasrur', 'Pasrur', 'Punjab', 'Pasrur City & Tehsil', 280, 51),
  createDefaultCityInfo('city-gujrat', 'Gujrat', 'Punjab', 'Gujrat City, Cantt & Fan Industrial Zone', 280, 52),
  createDefaultCityInfo('city-jalalpur-jattan', 'Jalalpur Jattan', 'Punjab', 'Jalalpur Jattan City & Tehsil', 280, 53),
  createDefaultCityInfo('city-kunjah', 'Kunjah', 'Punjab', 'Kunjah Town', 280, 54),
  createDefaultCityInfo('city-dinga', 'Dinga', 'Punjab', 'Dinga City & Surrounding Area', 280, 55),
  createDefaultCityInfo('city-kharian', 'Kharian', 'Punjab', 'Kharian City & Cantt', 280, 56),
  createDefaultCityInfo('city-sarai-alamgir', 'Sarai Alamgir', 'Punjab', 'Sarai Alamgir City & Tehsil', 280, 57),
  createDefaultCityInfo('city-raiwind', 'Raiwind', 'Punjab', 'Raiwind City & Industrial Area', 280, 58),
  createDefaultCityInfo('city-kasur', 'Kasur', 'Punjab', 'Kasur City & Cantt', 280, 59),
  createDefaultCityInfo('city-chunian', 'Chunian', 'Punjab', 'Chunian City & Tehsil', 280, 60),
  createDefaultCityInfo('city-pattoki', 'Pattoki', 'Punjab', 'Pattoki City & Floral Market', 280, 61),
  createDefaultCityInfo('city-kot-radha-kishan', 'Kot Radha Kishan', 'Punjab', 'Kot Radha Kishan Tehsil', 280, 62),
  createDefaultCityInfo('city-kanganpur', 'Kanganpur', 'Punjab', 'Kanganpur & Mustafabad', 300, 63),
  createDefaultCityInfo('city-okara', 'Okara', 'Punjab', 'Okara City, Cantt & Military Farms', 280, 64),
  createDefaultCityInfo('city-renala-khurd', 'Renala Khurd', 'Punjab', 'Renala Khurd City & Tehsil', 280, 65),
  createDefaultCityInfo('city-depalpur', 'Depalpur', 'Punjab', 'Depalpur City & Tehsil', 300, 66),
  createDefaultCityInfo('city-haveli-lakha', 'Haveli Lakha', 'Punjab', 'Haveli Lakha Town', 300, 67),
  createDefaultCityInfo('city-sahiwal', 'Sahiwal', 'Punjab', 'Sahiwal City, Cantt & District', 280, 68),
  createDefaultCityInfo('city-chichawatni', 'Chichawatni', 'Punjab', 'Chichawatni City & Tehsil', 280, 69),
  createDefaultCityInfo('city-harappa', 'Harappa', 'Punjab', 'Harappa City & Historic Zone', 280, 70),
  createDefaultCityInfo('city-pakpattan', 'Pakpattan', 'Punjab', 'Pakpattan City & Baba Farid Area', 300, 71),
  createDefaultCityInfo('city-arifwala', 'Arifwala', 'Punjab', 'Arifwala City & Grain Market', 320, 72),
  createDefaultCityInfo('city-ahmadpur-sial', 'Ahmadpur Sial', 'Punjab', 'Ahmadpur Sial Tehsil', 280, 73),
  createDefaultCityInfo('city-quaidabad', 'Quaidabad', 'Punjab', 'Quaidabad Tehsil', 280, 74),
  createDefaultCityInfo('city-noorpur-thal', 'Noorpur Thal', 'Punjab', 'Noorpur Thal Tehsil', 280, 75),
  createDefaultCityInfo('city-naushera-soon-valley', 'Naushera (Soon Valley)', 'Punjab', 'Naushera Tehsil & Soon Valley', 300, 76),
  createDefaultCityInfo('city-abdul-hakim', 'Abdul Hakim', 'Punjab', 'Abdul Hakim Motorway Interchange Hub', 280, 77),
  createDefaultCityInfo('city-kabirwala', 'Kabirwala', 'Punjab', 'Kabirwala City & Tehsil', 280, 78),
  createDefaultCityInfo('city-khanewal', 'Khanewal', 'Punjab', 'Khanewal City, Railway Junction & Cantt', 280, 79),
  createDefaultCityInfo('city-mian-channu', 'Mian Channu', 'Punjab', 'Mian Channu City & Industrial Area', 280, 80),
  createDefaultCityInfo('city-jahanian', 'Jahanian', 'Punjab', 'Jahanian City & Tehsil', 300, 81),

  // 4. Northern Punjab, Potohar & Rawalpindi / Islamabad (Rs. 280 - 380)
  createDefaultCityInfo('city-pind-dadan-khan', 'Pind Dadan Khan', 'Punjab', 'Pind Dadan Khan & Khewra', 280, 82),
  createDefaultCityInfo('city-kallar-kahar', 'Kallar Kahar', 'Punjab', 'Kallar Kahar Motorway Interchange', 280, 83),
  createDefaultCityInfo('city-choa-saidan-shah', 'Choa Saidan Shah', 'Punjab', 'Choa Saidan Shah Tehsil', 300, 84),
  createDefaultCityInfo('city-chakwal', 'Chakwal', 'Punjab', 'Chakwal City & Cantt', 300, 85),
  createDefaultCityInfo('city-talagang', 'Talagang', 'Punjab', 'Talagang City & Tehsil', 300, 86),
  createDefaultCityInfo('city-lawa', 'Lawa', 'Punjab', 'Lawa City & Tehsil', 320, 87),
  createDefaultCityInfo('city-jhelum', 'Jhelum', 'Punjab', 'Jhelum City, Cantt & Saddar', 300, 88),
  createDefaultCityInfo('city-dina', 'Dina', 'Punjab', 'Dina City & Mangla Road', 300, 89),
  createDefaultCityInfo('city-sohawa', 'Sohawa', 'Punjab', 'Sohawa City & Tehsil', 320, 90),
  createDefaultCityInfo('city-gujar-khan', 'Gujar Khan', 'Punjab', 'Gujar Khan City & Tehsil', 320, 91),
  createDefaultCityInfo('city-rawalpindi', 'Rawalpindi', 'Punjab', 'Rawalpindi City & Cantt', 350, 92),
  createDefaultCityInfo('city-islamabad', 'Islamabad', 'Federal Capital', 'Federal Capital (All Sectors & DHA/Bahria)', 350, 93),
  createDefaultCityInfo('city-taxila', 'Taxila', 'Punjab', 'Taxila City, Cantt & Heavy Mechanical Area', 350, 94),
  createDefaultCityInfo('city-wah-cantt', 'Wah Cantt', 'Punjab', 'Wah Cantt & Industrial Town', 350, 95),
  createDefaultCityInfo('city-kahuta', 'Kahuta', 'Punjab', 'Kahuta City & Tehsil', 350, 96),
  createDefaultCityInfo('city-kallar-syedan', 'Kallar Syedan', 'Punjab', 'Kallar Syedan City & Tehsil', 350, 97),
  createDefaultCityInfo('city-murree', 'Murree', 'Punjab', 'Murree District, Mall Road & Hill Station', 380, 98),
  createDefaultCityInfo('city-kotli-sattian', 'Kotli Sattian', 'Punjab', 'Kotli Sattian Tehsil', 380, 99),
  createDefaultCityInfo('city-attock', 'Attock', 'Punjab', 'Attock City & Cantt', 350, 100),
  createDefaultCityInfo('city-hassan-abdal', 'Hassan Abdal', 'Punjab', 'Hassan Abdal City & GT Road', 350, 101),
  createDefaultCityInfo('city-fateh-jang', 'Fateh Jang', 'Punjab', 'Fateh Jang City & Tehsil', 350, 102),
  createDefaultCityInfo('city-hazro', 'Hazro', 'Punjab', 'Hazro City & Chhachh Area', 350, 103),
  createDefaultCityInfo('city-pindi-gheb', 'Pindi Gheb', 'Punjab', 'Pindi Gheb City & Tehsil', 350, 104),
  createDefaultCityInfo('city-jand', 'Jand', 'Punjab', 'Jand City & Tehsil', 350, 105),
  createDefaultCityInfo('city-narowal', 'Narowal', 'Punjab', 'Narowal City & Cantt', 320, 106),
  createDefaultCityInfo('city-shakargarh', 'Shakargarh', 'Punjab', 'Shakargarh City & Tehsil', 350, 107),
  createDefaultCityInfo('city-zafarwal', 'Zafarwal', 'Punjab', 'Zafarwal City & Tehsil', 320, 108),

  // 5. Western & Thal Punjab (Rs. 320 - 350)
  createDefaultCityInfo('city-bhakkar', 'Bhakkar', 'Punjab', 'Bhakkar City & District', 320, 109),
  createDefaultCityInfo('city-darya-khan', 'Darya Khan', 'Punjab', 'Darya Khan Tehsil', 320, 110),
  createDefaultCityInfo('city-kallurkot', 'Kallurkot', 'Punjab', 'Kallurkot Tehsil', 320, 111),
  createDefaultCityInfo('city-mankera', 'Mankera', 'Punjab', 'Mankera Tehsil & Thal Area', 320, 112),
  createDefaultCityInfo('city-mianwali', 'Mianwali', 'Punjab', 'Mianwali City, Cantt & PAF Base', 320, 113),
  createDefaultCityInfo('city-isa-khel', 'Isa Khel', 'Punjab', 'Isa Khel Tehsil', 350, 114),
  createDefaultCityInfo('city-piplan', 'Piplan', 'Punjab', 'Piplan City & Liaquatabad', 320, 115),
  createDefaultCityInfo('city-kundian', 'Kundian', 'Punjab', 'Kundian Railway Junction', 320, 116),
  createDefaultCityInfo('city-kalabagh', 'Kalabagh', 'Punjab', 'Kalabagh City & River Hub', 350, 117),

  // 6. Multan, Vehari & Southern Punjab (Rs. 300 - 350)
  createDefaultCityInfo('city-multan', 'Multan', 'Punjab', 'Multan Cantt, Bosan Road & City', 300, 118),
  createDefaultCityInfo('city-shujabad', 'Shujabad', 'Punjab', 'Shujabad City & Mango Belt', 350, 119),
  createDefaultCityInfo('city-jalalpur-pirwala', 'Jalalpur Pirwala', 'Punjab', 'Jalalpur Pirwala Tehsil', 350, 120),
  createDefaultCityInfo('city-lodhran', 'Lodhran', 'Punjab', 'Lodhran City & Railway Junction', 350, 121),
  createDefaultCityInfo('city-dunyapur', 'Dunyapur', 'Punjab', 'Dunyapur City & Tehsil', 350, 122),
  createDefaultCityInfo('city-kahror-pacca', 'Kahror Pacca', 'Punjab', 'Kahror Pacca Tehsil', 350, 123),
  createDefaultCityInfo('city-vehari', 'Vehari', 'Punjab', 'Vehari City & District HQ', 320, 124),
  createDefaultCityInfo('city-burewala', 'Burewala', 'Punjab', 'Burewala City & Textile/Commercial Hub', 300, 125),
  createDefaultCityInfo('city-mailsi', 'Mailsi', 'Punjab', 'Mailsi City & Tehsil', 320, 126),

  // 7. Bahawalpur, Bahawalnagar & Lower Southern Punjab (Rs. 350 - 420)
  createDefaultCityInfo('city-bahawalpur', 'Bahawalpur', 'Punjab', 'Bahawalpur City & Cantt', 350, 127),
  createDefaultCityInfo('city-ahmadpur-east', 'Ahmadpur East', 'Punjab', 'Ahmadpur East City & Tehsil', 380, 128),
  createDefaultCityInfo('city-hasilpur', 'Hasilpur', 'Punjab', 'Hasilpur City & Cotton Hub', 350, 129),
  createDefaultCityInfo('city-khairpur-tamewali', 'Khairpur Tamewali', 'Punjab', 'Khairpur Tamewali Tehsil', 350, 130),
  createDefaultCityInfo('city-yazman', 'Yazman', 'Punjab', 'Yazman City & Cholistan Gate', 380, 131),
  createDefaultCityInfo('city-bahawalnagar', 'Bahawalnagar', 'Punjab', 'Bahawalnagar City & Grain Market', 350, 132),
  createDefaultCityInfo('city-chishtian', 'Chishtian', 'Punjab', 'Chishtian City & Tehsil', 350, 133),
  createDefaultCityInfo('city-haroonabad', 'Haroonabad', 'Punjab', 'Haroonabad City & Tehsil', 350, 134),
  createDefaultCityInfo('city-minchinabad', 'Minchinabad', 'Punjab', 'Minchinabad City & Tehsil', 350, 135),
  createDefaultCityInfo('city-fort-abbas', 'Fort Abbas', 'Punjab', 'Fort Abbas City & Border Tehsil', 400, 136),
  createDefaultCityInfo('city-rahim-yar-khan', 'Rahim Yar Khan', 'Punjab', 'Rahim Yar Khan City, Airport & Cantt', 400, 137),
  createDefaultCityInfo('city-sadiqabad', 'Sadiqabad', 'Punjab', 'Sadiqabad City & Fertilizer/Industrial Hub', 420, 138),
  createDefaultCityInfo('city-khanpur', 'Khanpur', 'Punjab', 'Khanpur City & Sugar Belt', 400, 139),
  createDefaultCityInfo('city-liaquatpur', 'Liaquatpur', 'Punjab', 'Liaquatpur City & Tehsil', 400, 140),

  // 8. Dera Ghazi Khan, Layyah & Muzaffargarh Divisions (Rs. 300 - 450)
  createDefaultCityInfo('city-chowk-sarwar-shaheed', 'Chowk Sarwar Shaheed', 'Punjab', 'Chowk Sarwar Shaheed Tehsil', 300, 141),
  createDefaultCityInfo('city-fatehpur', 'Fatehpur', 'Punjab', 'Fatehpur City', 300, 142),
  createDefaultCityInfo('city-chaubara', 'Chaubara', 'Punjab', 'Chaubara Tehsil', 320, 143),
  createDefaultCityInfo('city-chowk-azam', 'Chowk Azam', 'Punjab', 'Chowk Azam Commercial Junction', 320, 144),
  createDefaultCityInfo('city-layyah', 'Layyah', 'Punjab', 'Layyah City & College Road', 350, 145),
  createDefaultCityInfo('city-karor-lal-esan', 'Karor Lal Esan', 'Punjab', 'Karor Lal Esan Tehsil', 350, 146),
  createDefaultCityInfo('city-kot-addu', 'Kot Addu', 'Punjab', 'Kot Addu City & Power Complex', 350, 147),
  createDefaultCityInfo('city-muzaffargarh', 'Muzaffargarh', 'Punjab', 'Muzaffargarh City & Thermal Power Area', 350, 148),
  createDefaultCityInfo('city-alipur', 'Alipur', 'Punjab', 'Alipur City & Tehsil', 400, 149),
  createDefaultCityInfo('city-jatoi', 'Jatoi', 'Punjab', 'Jatoi City & Tehsil', 380, 150),
  createDefaultCityInfo('city-dera-ghazi-khan', 'Dera Ghazi Khan', 'Punjab', 'DG Khan City, Cantt & Tribal Area', 380, 151),
  createDefaultCityInfo('city-taunsa', 'Taunsa', 'Punjab', 'Taunsa Sharif City & Tehsil', 380, 152),
  createDefaultCityInfo('city-kot-chutta', 'Kot Chutta', 'Punjab', 'Kot Chutta Tehsil', 400, 153),
  createDefaultCityInfo('city-jampur', 'Jampur', 'Punjab', 'Jampur City & Tehsil', 400, 154),
  createDefaultCityInfo('city-rajanpur', 'Rajanpur', 'Punjab', 'Rajanpur City & District', 420, 155),
  createDefaultCityInfo('city-fazilpur', 'Fazilpur', 'Punjab', 'Fazilpur City', 450, 156),
  createDefaultCityInfo('city-rojhan', 'Rojhan', 'Punjab', 'Rojhan Tehsil', 450, 157),

  // 9. Major Inter-Provincial Hubs (Outside Punjab)
  createDefaultCityInfo('city-peshawar', 'Peshawar', 'KPK', 'Peshawar City, Hayatabad & Cantt', 400, 158, { estimatedDays: '3–4 Working Days' }),
  createDefaultCityInfo('city-sukkur', 'Sukkur', 'Sindh', 'Sukkur City & Rohri', 400, 159, { estimatedDays: '3–4 Working Days' }),
  createDefaultCityInfo('city-hyderabad', 'Hyderabad', 'Sindh', 'Hyderabad City, Latifabad & Qasimabad', 450, 160, { estimatedDays: '3–5 Working Days' }),
  createDefaultCityInfo('city-karachi', 'Karachi', 'Sindh', 'All Districts & Port Area', 450, 161, { estimatedDays: '3–5 Working Days', notes: 'Express air & overland cargo.' }),
  createDefaultCityInfo('city-quetta', 'Quetta', 'Balochistan', 'Quetta City & Cantt', 500, 162, {
    status: 'contact_to_confirm',
    deliveryFeeType: 'contact',
    estimatedDays: '4–6 Working Days',
    notes: 'Please contact WhatsApp to confirm cargo schedule.'
  })
];
