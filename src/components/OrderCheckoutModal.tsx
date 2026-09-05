import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShoppingBag, CheckCircle2, Truck, ShieldCheck, Phone, MapPin, 
  User, FileText, Send, Building2, Info, Compass, Mail, CreditCard, 
  Upload, Check, Copy, ArrowRight, ArrowLeft, Eye, ExternalLink, 
  AlertCircle, RefreshCw, Smartphone, QrCode, DollarSign, Wallet,
  BookOpen, ChevronDown, ChevronUp, Sparkles, HelpCircle
} from 'lucide-react';
import { 
  CartItem, BusinessConfig, CheckoutSettings, CustomerOrder, OrderItem, 
  DeliverySettings, AppliedCouponState, PaymentMethodConfig, OrderStatus, PaymentStatus,
  HowToOrderConfig
} from '../types';
import { loadDeliverySettings, generateNextOrderId, loadPaymentMethods, loadHowToOrderConfig, openWhatsAppLink } from '../utils/storage';
import { getOrGenerateCustomerId } from '../utils/customerStorage';
import { getProductPricingDetails, getVariantPricingDetails, getActiveProductPrice } from '../utils/pricingUtils';
import { fetchPaymentMethodsFromSupabase, uploadMediaToSupabase, fetchHowToOrderConfigFromSupabase } from '../services/supabaseService';
import { CouponPromoBox } from './CouponPromoBox';

type CheckoutStep = 'cart' | 'customer' | 'address' | 'payment_method' | 'payment_instructions' | 'payment_proof' | 'confirmation';

interface OrderCheckoutModalProps {
  isOpen: boolean;
  cartItems: CartItem[];
  directItem?: CartItem | null;
  config: BusinessConfig;
  checkoutSettings: CheckoutSettings;
  onClose: () => void;
  onOrderPlaced: (order: CustomerOrder) => Promise<{ success: boolean; error?: string } | any> | any;
}

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({
  isOpen,
  cartItems,
  directItem,
  config,
  checkoutSettings,
  onClose,
  onOrderPlaced,
}) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());

  // Listen to delivery settings updates
  useEffect(() => {
    if (!isOpen) return;
    setDeliverySettings(loadDeliverySettings());
    const handleDeliveryUpdated = () => {
      setDeliverySettings(loadDeliverySettings());
    };
    window.addEventListener('zst_delivery_settings_updated', handleDeliveryUpdated);
    return () => window.removeEventListener('zst_delivery_settings_updated', handleDeliveryUpdated);
  }, [isOpen]);

  const activeCities = deliverySettings.cities.filter(c => c.isEnabled);

  const customCityOptionValue = 'CUSTOM_CITY_OPTION';
  const customCityLabelText = deliverySettings.customCityLabel || '➕ Custom City / Address';

  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Delivery Address State
  const [selectedCityId, setSelectedCityId] = useState<string>(
    activeCities[0]?.cityName || 'Lahore'
  );
  const [customCityName, setCustomCityName] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('cod');
  const [selectedAdvanceTransferMethodId, setSelectedAdvanceTransferMethodId] = useState<string>('');
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Payment Proof State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [proofUploadedUrl, setProofUploadedUrl] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [zoomQrCode, setZoomQrCode] = useState(false);

  // Order & Submission State
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);

  // "How to Order" Step-by-Step Guide State
  const [howToOrderConfig, setHowToOrderConfig] = useState<HowToOrderConfig>(() => loadHowToOrderConfig());
  const [isHowToOrderOpen, setIsHowToOrderOpen] = useState(false);

  // Sync "How to Order" config from local storage, Supabase, and real-time event
  useEffect(() => {
    if (!isOpen) return;
    const local = loadHowToOrderConfig();
    setHowToOrderConfig(local);

    fetchHowToOrderConfigFromSupabase().then(remote => {
      if (remote) setHowToOrderConfig(remote);
    }).catch(err => {
      console.warn('Could not fetch how-to-order guide from Supabase:', err);
    });

    const handleGuideUpdate = () => {
      setHowToOrderConfig(loadHowToOrderConfig());
    };
    window.addEventListener('zst_how_to_order_updated', handleGuideUpdate);
    return () => window.removeEventListener('zst_how_to_order_updated', handleGuideUpdate);
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset steps and form when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('cart');
      setPlacedOrder(null);
      setErrors({});
    }
  }, [isOpen]);

  // Load configured payment methods instantly from local storage, then sync with Supabase in background
  useEffect(() => {
    let isMounted = true;
    const fetchMethods = async () => {
      setIsLoadingPaymentMethods(true);
      // 1. Instant load from local storage
      const localMethods = loadPaymentMethods().filter(m => m.isEnabled);
      if (isMounted && localMethods.length > 0) {
        setPaymentMethods(localMethods);
        if (!selectedPaymentMethodId || !localMethods.find(m => m.id === selectedPaymentMethodId)) {
          setSelectedPaymentMethodId(localMethods[0].id);
        }
      }

      // 2. Background sync from Supabase
      try {
        const methods = await fetchPaymentMethodsFromSupabase();
        if (isMounted && methods && Array.isArray(methods)) {
          const enabled = methods.filter(m => m.isEnabled);
          if (enabled.length > 0) {
            setPaymentMethods(enabled);
            if (!selectedPaymentMethodId || !enabled.find(m => m.id === selectedPaymentMethodId)) {
              setSelectedPaymentMethodId(enabled[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetch payment methods background notice:', err);
      } finally {
        if (isMounted) setIsLoadingPaymentMethods(false);
      }
    };

    const handleMethodsUpdated = (e: any) => {
      const updated = e.detail || loadPaymentMethods();
      if (Array.isArray(updated)) {
        const enabled = updated.filter((m: PaymentMethodConfig) => m.isEnabled);
        setPaymentMethods(enabled);
      }
    };

    if (isOpen) {
      fetchMethods();
      window.addEventListener('zst_payment_methods_updated', handleMethodsUpdated);
    }
    return () => {
      isMounted = false;
      window.removeEventListener('zst_payment_methods_updated', handleMethodsUpdated);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const items = directItem ? [directItem] : (Array.isArray(cartItems) ? cartItems : []);

  const isCustomCitySelected = selectedCityId === customCityOptionValue || selectedCityId === 'Other';

  // Find city info if predefined
  const matchedCity = activeCities.find(
    c => c.cityName.toLowerCase() === selectedCityId.toLowerCase() || c.id === selectedCityId
  );

  const finalCityName = isCustomCitySelected 
    ? (customCityName.trim() || 'Custom Location')
    : (matchedCity ? matchedCity.cityName : selectedCityId);

  const getItemPricing = (item: CartItem) => {
    if (!item?.product) return { effectivePriceNumeric: 0, isSaleActive: false, discountPercentage: 0, regularPriceNumeric: 0, effectivePriceString: 'Price on Request', formattedSalePrice: '', formattedRegularPrice: '', variantSku: undefined };
    const p = item.product;
    const pricing = getActiveProductPrice(p, item.selectedVariant || item.selectedVariantId);
    const variants = p.variantsList || p.variantsConfig?.variants || [];
    const matched = variants.find(v => v.name === item.selectedVariant || v.id === item.selectedVariantId || v.id === item.selectedVariant);
    return { ...pricing, variantSku: matched?.sku || p.sku };
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (!item?.product) return acc;
      const pricing = getItemPricing(item);
      return acc + pricing.effectivePriceNumeric * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const couponDiscountAmount = appliedCoupon 
    ? Math.round((subtotal * appliedCoupon.discountPercentage) / 100) 
    : 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscountAmount);
  const effectiveSubtotal = appliedCoupon ? discountedSubtotal : subtotal;

  const isFreeDelivery = checkoutSettings.freeDeliveryThreshold 
    ? effectiveSubtotal >= checkoutSettings.freeDeliveryThreshold 
    : false;

  const cityDeliveryFee = isCustomCitySelected 
    ? (checkoutSettings.deliveryFee || 250)
    : (matchedCity ? matchedCity.deliveryFee : (checkoutSettings.deliveryFee || 250));

  const deliveryCharges = effectiveSubtotal > 0 ? (isFreeDelivery ? 0 : cityDeliveryFee) : 0;
  
  const taxAmount = checkoutSettings.enableTaxes && checkoutSettings.taxRatePercent > 0
    ? Math.round((effectiveSubtotal * checkoutSettings.taxRatePercent) / 100)
    : 0;

  const grandTotal = effectiveSubtotal + deliveryCharges + taxAmount;

  const fallbackPaymentMethod: PaymentMethodConfig = {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    isEnabled: true,
    instructions: 'Pay in cash upon doorstep delivery.'
  };

  const activePaymentMethod: PaymentMethodConfig = paymentMethods.find(m => m.id === selectedPaymentMethodId) || paymentMethods[0] || fallbackPaymentMethod;

  const isCashOnDelivery = activePaymentMethod.type === 'cod' || activePaymentMethod.id === 'cod';
  const isCodAdvanceRequired = isCashOnDelivery && Boolean(checkoutSettings.codAdvanceRequired || activePaymentMethod.codAdvanceRequired);
  const codAdvancePercentage = activePaymentMethod.codAdvancePercentage || checkoutSettings.codAdvancePercentage || 30;
  const codAdvanceAmountRequired = isCodAdvanceRequired 
    ? Math.max(checkoutSettings.codAdvanceMinAmount || 0, Math.round((grandTotal * codAdvancePercentage) / 100)) 
    : 0;
  const codRemainingAmount = isCodAdvanceRequired 
    ? Math.max(0, grandTotal - codAdvanceAmountRequired) 
    : (isCashOnDelivery ? grandTotal : 0);
  const requiresPaymentProof = !isCashOnDelivery || isCodAdvanceRequired;

  const onlinePaymentMethods = paymentMethods.filter(m => m.type !== 'cod' && m.isEnabled);
  const activeAdvanceTransferMethod = onlinePaymentMethods.find(m => m.id === selectedAdvanceTransferMethodId) || onlinePaymentMethods[0];

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // File selection for proof
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be under 10MB.');
        return;
      }
      setProofFile(file);
      setUploadError('');
      const preview = URL.createObjectURL(file);
      setProofPreviewUrl(preview);
    }
  };

  // Upload proof image
  const handleUploadProof = async (): Promise<string | null> => {
    if (!proofFile && proofUploadedUrl) return proofUploadedUrl;
    if (!proofFile) return null;

    setIsUploadingProof(true);
    setUploadProgress(25);
    setUploadError('');

    try {
      // Direct upload proxy or fallback
      const uploadResult = await uploadMediaToSupabase(proofFile, 'payment-proofs');
      setUploadProgress(100);
      if (uploadResult?.url) {
        let fullUrl = uploadResult.url;
        if (fullUrl.startsWith('/')) {
          fullUrl = `${window.location.origin}${fullUrl}`;
        }
        setProofUploadedUrl(fullUrl);
        setIsUploadingProof(false);
        return fullUrl;
      }

      // Fallback: Read as data URL if remote upload fails
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(proofFile);
      });

      setProofUploadedUrl(dataUrl);
      setIsUploadingProof(false);
      return dataUrl;
    } catch (err: any) {
      console.error('Failed to upload proof image:', err);
      // Still allow local dataUrl
      if (proofPreviewUrl) {
        setProofUploadedUrl(proofPreviewUrl);
        setIsUploadingProof(false);
        return proofPreviewUrl;
      }
      setUploadError('Failed to upload payment receipt. Please retry or submit order and send proof via WhatsApp.');
      setIsUploadingProof(false);
      return null;
    }
  };

  // Validation functions per step
  const validateCustomerStep = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Please enter your full name';
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'Please enter phone number';
    } else if (phoneNumber.trim().replace(/[^0-9]/g, '').length < 10) {
      errs.phoneNumber = 'Please enter a valid 11-digit mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAddressStep = () => {
    const errs: Record<string, string> = {};
    if (isCustomCitySelected && !customCityName.trim()) {
      errs.customCityName = 'Please enter your city or area';
    }
    if (!areaLocality.trim()) {
      errs.areaLocality = 'Please enter your area or locality (e.g. DHA Phase 6, Model Town)';
    }
    if (!deliveryAddress.trim()) {
      errs.deliveryAddress = 'Please enter complete delivery address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePaymentProofStep = () => {
    if (isCashOnDelivery && !isCodAdvanceRequired) return true;
    const errs: Record<string, string> = {};
    if (!proofFile && !proofUploadedUrl && !transactionReference.trim()) {
      errs.paymentProof = isCodAdvanceRequired 
        ? 'Please upload an advance payment screenshot or enter your Transaction ID/Ref #' 
        : 'Please upload a payment screenshot or enter your Transaction ID/Ref #';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Order Placement
  const handleFinalizeOrder = async () => {
    setIsSubmitting(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.submit;
      return copy;
    });

    let finalProofUrl = proofUploadedUrl;

    if (requiresPaymentProof && proofFile && !finalProofUrl) {
      finalProofUrl = await handleUploadProof() || '';
    }

    const orderId = generateNextOrderId();

    const orderItems: OrderItem[] = items.map(item => {
      const p = item.product;
      const pricing = getItemPricing(item);
      const numericPrice = pricing.effectivePriceNumeric;
      let unitPriceText = pricing.effectivePriceString;
      if (pricing.isSaleActive && pricing.discountPercentage > 0) {
        unitPriceText = `${pricing.formattedSalePrice} (Sale ${pricing.discountPercentage}% OFF)`;
      }
      return {
        productId: p.id,
        productName: p.name,
        brand: p.brand || p.category,
        image: p.images?.[0] || p.image,
        sku: pricing.variantSku || p.sku,
        unitPrice: unitPriceText,
        numericPrice: numericPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedQuality: item.selectedQuality,
        selectedVariant: item.selectedVariant,
        selectedVariantId: item.selectedVariantId,
        selectedVariantName: item.selectedVariantName,
        selectedOptionName: item.selectedOptionName,
        selectedVariantSku: item.selectedVariantSku,
        selectedShade: item.selectedShade,
        selectedShadeId: item.selectedShadeId,
        selectedShadeCode: item.selectedShadeCode,
        selectedShadeColor: item.selectedShadeColor,
        selectedShadeImage: item.selectedShadeImage,
        selectedShadePriceAdjustment: item.selectedShadePriceAdjustment,
        lineTotal: numericPrice * item.quantity,
      };
    });

    const custId = getOrGenerateCustomerId();
    const cleanOrderId = orderId.replace('#', '');

    let paymentStatus: PaymentStatus = 'Payment Proof Submitted';
    let orderStatus: OrderStatus = 'Payment Verification Pending';

    if (isCashOnDelivery) {
      if (isCodAdvanceRequired) {
        paymentStatus = 'Advance Payment Under Review';
        orderStatus = 'Advance Payment Under Review';
      } else {
        paymentStatus = 'Cash on Delivery';
        orderStatus = 'Order Received';
      }
    } else {
      paymentStatus = 'Payment Proof Submitted';
      orderStatus = 'Payment Verification Pending';
    }

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber: `ZFT-${cleanOrderId}`,
      customerId: custId,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: customerEmail.trim() || undefined,
      city: finalCityName,
      areaLocality: areaLocality.trim(),
      deliveryAddress: deliveryAddress.trim(),
      postalCode: postalCode.trim() || undefined,
      landmark: landmark.trim() || undefined,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
      items: orderItems,
      subtotal,
      appliedCouponCode: appliedCoupon?.code,
      couponDiscountPercentage: appliedCoupon?.discountPercentage,
      couponDiscountAmount: couponDiscountAmount,
      deliveryCharges,
      taxAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
      status: orderStatus,
      paymentStatus: paymentStatus,
      paymentMethodId: activePaymentMethod.id,
      paymentMethodName: isCodAdvanceRequired 
        ? `Cash on Delivery (${codAdvancePercentage}% Advance via ${activeAdvanceTransferMethod?.name || 'Online Transfer'})` 
        : activePaymentMethod.name,
      paymentProofUrl: finalProofUrl || undefined,
      transactionReference: transactionReference.trim() || undefined,
      paymentNotes: paymentNotes.trim() || undefined,
      paymentProofUploadedAt: requiresPaymentProof ? new Date().toISOString() : undefined,
      isAdvancePayment: isCodAdvanceRequired,
      advancePercentage: isCodAdvanceRequired ? codAdvancePercentage : undefined,
      advanceAmountRequired: isCodAdvanceRequired ? codAdvanceAmountRequired : undefined,
      advancePaidAmount: isCodAdvanceRequired ? codAdvanceAmountRequired : undefined,
      remainingCodAmount: isCodAdvanceRequired ? codRemainingAmount : (isCashOnDelivery ? grandTotal : 0),
      estimatedDeliveryDays: matchedCity ? matchedCity.estimatedDays : '2-4 Business Days',
      estimatedDeliveryDate: matchedCity ? matchedCity.estimatedDays : '2-4 Business Days',
      estimatedDeliveryTime: '10:00 AM – 6:00 PM',
    };

    // 1. Save order locally and in Supabase first
    try {
      const res = await onOrderPlaced(newOrder);
      if (res && res.success === false) {
        setErrors(prev => ({
          ...prev,
          submit: res.error || 'The system could not save your order in the database. Please try again or contact us via WhatsApp.'
        }));
        setIsSubmitting(false);
        return;
      }
    } catch (orderSaveErr: any) {
      console.warn('Order save warning:', orderSaveErr);
      setErrors(prev => ({
        ...prev,
        submit: orderSaveErr?.message || 'A network error occurred while submitting your order. Please try again.'
      }));
      setIsSubmitting(false);
      return;
    }

    // 2. Dispatch real WhatsApp Business notification via secure server backend
    try {
      fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      }).then(res => res.json()).then(data => {
        if (data?.success) {
          console.log('[WhatsApp Notification] Server dispatched order notification:', data);
        }
      }).catch(err => {
        console.warn('[WhatsApp Notification Dispatch Exception]:', err);
      });
    } catch (waErr) {
      console.warn('[WhatsApp Notification Exception]:', waErr);
    }

    setPlacedOrder(newOrder);
    setIsSubmitting(false);
    setCurrentStep('confirmation');
  };

  // WhatsApp Order Confirmation Messenger
  const handleSendWhatsAppOrder = (orderToUse?: CustomerOrder) => {
    const order = orderToUse || placedOrder;
    if (!order) return;

    // 1. Product Information Section
    const productInfoSections: string[] = [];
    order.items.forEach((item, index) => {
      const variantName = (item.selectedVariant || item.selectedVariantName || item.selectedSize || '').trim();
      const hasVariant = Boolean(variantName && variantName.length > 0);
      
      const lines: string[] = [];
      if (order.items.length > 1) {
        lines.push(`${index + 1}. Product Name: ${item.productName}`);
      } else {
        lines.push(`- Product Name: ${item.productName}`);
      }

      if (item.brand && item.brand.trim()) {
        lines.push(`- Brand: ${item.brand.trim()}`);
      }
      if (item.category && item.category.trim()) {
        lines.push(`- Category: ${item.category.trim()}`);
      }
      if (hasVariant) {
        lines.push(`- Size / Variant: ${variantName}`);
      }
      if (item.selectedShade) {
        lines.push(`- Color / Finish: ${item.selectedShade}${item.selectedShadeCode ? ` (Code: ${item.selectedShadeCode})` : ''}`);
      } else if (item.selectedColor) {
        lines.push(`- Color / Finish: ${item.selectedColor}`);
      }
      if (item.selectedQuality) {
        lines.push(`- Material: ${item.selectedQuality}`);
      } else if (item.material && item.material.trim()) {
        lines.push(`- Material: ${item.material.trim()}`);
      }

      productInfoSections.push(lines.join('\n'));
    });

    // 2. Pricing Breakdown Table
    const tableRows = [
      '| Item Name | Size / Variant | Qty | Unit Price | Total Price |'
    ];

    order.items.forEach(item => {
      const variantOrSize = (item.selectedVariant || item.selectedVariantName || item.selectedSize || 'Standard').trim();
      const lineTotalFormatted = item.lineTotal > 0 ? `Rs. ${item.lineTotal.toLocaleString('en-PK')}` : item.unitPrice;
      tableRows.push(`| ${item.productName} | ${variantOrSize} | ${item.quantity} | ${item.unitPrice} | ${lineTotalFormatted} |`);
    });

    if (order.appliedCouponCode) {
      tableRows.push(`\n- Original Subtotal: Rs. ${order.subtotal.toLocaleString('en-PK')}`);
      tableRows.push(`- Applied Coupon: ${order.appliedCouponCode} (${order.couponDiscountPercentage}% OFF)`);
      tableRows.push(`- Coupon Discount: -Rs. ${(order.couponDiscountAmount || 0).toLocaleString('en-PK')}`);
    }

    const pricingBreakdownTable = tableRows.join('\n');

    // 3. Delivery Details Section
    const deliveryLines: string[] = [];
    deliveryLines.push(`- Customer Name: ${order.customerName}`);
    deliveryLines.push(`- Contact Phone: ${order.phoneNumber}`);
    deliveryLines.push(`- Delivery City: ${order.city}`);
    deliveryLines.push(`- Delivery Address: ${order.deliveryAddress}${order.areaLocality ? `, ${order.areaLocality}` : ''}${order.landmark ? ` (Near: ${order.landmark})` : ''}`);
    
    let deliveryFeeText = 'FREE Delivery';
    if (order.deliveryCharges > 0) {
      deliveryFeeText = `Rs. ${order.deliveryCharges.toLocaleString('en-PK')}`;
    }
    deliveryLines.push(`- Delivery Charges: ${deliveryFeeText}`);

    // 4. Payment Details Section
    const paymentLines: string[] = [];
    paymentLines.push(`- Selected Method: ${order.paymentMethodName || 'Cash on Delivery'}`);
    paymentLines.push(`- Payment Status: ${order.paymentStatus || 'Pending'}`);
    if (order.transactionReference) {
      paymentLines.push(`- Transaction Reference / ID: ${order.transactionReference}`);
    }
    
    // Always include exact payment proof receipt URL (Supabase or server storage)
    const rawProof = order.paymentProofUrl || proofUploadedUrl;
    if (rawProof) {
      const formattedProofUrl = rawProof.startsWith('/') 
        ? `${window.location.origin}${rawProof}` 
        : rawProof;
      paymentLines.push(`- Payment Proof Receipt (Supabase / Media URL):\n${formattedProofUrl}`);
    }

    if (order.paymentNotes) {
      paymentLines.push(`- Payment Notes: ${order.paymentNotes}`);
    }

    // 5. Grand Total
    const grandTotalText = `Rs. ${order.grandTotal.toLocaleString('en-PK')}`;

    // Construct Full Message adhering strictly to requested order format
    const messageParts: string[] = [
      `Hello, Assalam-o-Alaikum ${config.name || 'Zafar Sarwar Traders'},\nI have placed an order #${order.orderNumber}:`,
      `**Product Information**\n${productInfoSections.join('\n\n')}`,
      `**Pricing Breakdown**\n\n${pricingBreakdownTable}`,
      `**Delivery Details**\n${deliveryLines.join('\n')}`,
      `**Payment Information**\n${paymentLines.join('\n')}`,
      `**Grand Total**\n${grandTotalText}`
    ];

    if (order.deliveryInstructions) {
      messageParts.push(`**Delivery Instructions**\n${order.deliveryInstructions}`);
    }
    if (order.notes) {
      messageParts.push(`**Customer Notes**\n${order.notes}`);
    }

    const msg = messageParts.join('\n\n');

    // Target WhatsApp: Specific payment method override or store whatsapp
    const targetWhatsapp = activePaymentMethod.whatsappNumber || 
      checkoutSettings.whatsappNumberOverride || 
      deliverySettings.whatsappSupportNumber || 
      config.whatsapp || 
      config.phone || 
      '923006603063';
    
    const cleanNum = targetWhatsapp.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
    openWhatsAppLink(waUrl);
  };

  // Steps Configuration for Stepper Header
  const stepsList: { id: CheckoutStep; label: string; number: number }[] = [
    { id: 'cart', label: 'Cart', number: 1 },
    { id: 'customer', label: 'Customer', number: 2 },
    { id: 'address', label: 'Delivery', number: 3 },
    { id: 'payment_method', label: 'Payment', number: 4 },
    { id: 'payment_instructions', label: 'Instructions', number: 5 },
    { id: 'payment_proof', label: isCodAdvanceRequired ? 'Advance Proof' : (isCashOnDelivery ? 'Confirm' : 'Payment Proof'), number: 6 },
    { id: 'confirmation', label: 'Done', number: 7 }
  ];

  const currentStepIndex = stepsList.findIndex(s => s.id === currentStep);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[94vh]">
        
        {/* Header with Title & Stepper */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-900/40">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                  {currentStep === 'cart' && 'Review Your Shopping Cart'}
                  {currentStep === 'customer' && 'Customer Contact Details'}
                  {currentStep === 'address' && 'Delivery Address & Shipping'}
                  {currentStep === 'payment_method' && 'Choose Payment Method'}
                  {currentStep === 'payment_instructions' && (isCodAdvanceRequired ? 'COD Advance Payment Instructions' : 'Payment Instructions & Account Details')}
                  {currentStep === 'payment_proof' && (isCodAdvanceRequired ? 'Upload Advance Payment Proof' : (isCashOnDelivery ? 'Order Final Review' : 'Upload Payment Proof Receipt'))}
                  {currentStep === 'confirmation' && 'Order Received Successfully!'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  {currentStep === 'confirmation'
                    ? 'Your order has been recorded in our system'
                    : 'Step ' + (currentStepIndex + 1) + ' of ' + stepsList.length + ' • Professional Fast Checkout'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Navigation Progress Indicator */}
          {currentStep !== 'confirmation' && (
            <div className="pt-2 border-t border-slate-800/80">
              {/* Desktop Stepper */}
              <div className="hidden sm:flex items-center justify-between">
                {stepsList.slice(0, 6).map((step, idx) => {
                  const isPassed = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                          isPassed 
                            ? 'bg-emerald-500 text-white' 
                            : isCurrent 
                              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]' 
                              : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${
                          isCurrent ? 'text-white font-bold' : isPassed ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < 5 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                          currentStepIndex > idx ? 'bg-emerald-500/80' : 'bg-slate-800'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile Stepper Bar */}
              <div className="sm:hidden flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>Step {currentStepIndex + 1} of 6: <strong className="text-white">{stepsList[currentStepIndex]?.label}</strong></span>
                  <span className="text-slate-400 font-mono">{Math.round(((currentStepIndex + 1) / 6) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / 6) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ============================================================ */}
          {/* STEP 1: CART REVIEW */}
          {/* ============================================================ */}
          {currentStep === 'cart' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>Items in Your Order ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">Quality Guaranteed</span>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const p = item.product;
                    const pricing = getItemPricing(item);
                    const lineTot = pricing.effectivePriceNumeric * item.quantity;

                    return (
                      <div key={idx} className="pt-2.5 first:pt-0 flex items-center gap-3">
                        <img
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <h5 className="font-bold text-slate-900 truncate leading-snug">{p.name}</h5>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {p.brand && `${p.brand} • `}Qty: {item.quantity}
                            {item.selectedVariant && ` • ${p.optionName || 'Option'}: ${item.selectedVariant}`}
                            {item.selectedShade && ` • Shade: ${item.selectedShade}`}
                            {item.selectedColor && !item.selectedShade && ` • ${item.selectedColor}`}
                            {item.selectedSize && !item.selectedVariant && ` • ${item.selectedSize}`}
                          </p>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            Unit: <span className="font-medium text-slate-900">{pricing.effectivePriceString}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs shrink-0 font-bold text-slate-900 font-mono">
                          {lineTot > 0 ? `PKR ${lineTot.toLocaleString('en-PK')}` : pricing.effectivePriceString}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Box */}
                <div className="pt-2">
                  <CouponPromoBox
                    subtotalNumeric={subtotal}
                    appliedCoupon={appliedCoupon ? {
                      ...appliedCoupon,
                      originalTotal: subtotal,
                      discountAmount: couponDiscountAmount,
                      finalTotal: discountedSubtotal
                    } : null}
                    onApplyCoupon={setAppliedCoupon}
                    onRemoveCoupon={() => setAppliedCoupon(null)}
                  />
                </div>
              </div>

              {/* Order Calculation Sidebar */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">
                    Pricing Summary
                  </h4>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {subtotal > 0 ? `PKR ${subtotal.toLocaleString('en-PK')}` : 'Price on Request'}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-emerald-600 font-medium">
                        <span>Coupon Discount ({appliedCoupon.code}):</span>
                        <span className="font-bold font-mono">-PKR {couponDiscountAmount.toLocaleString('en-PK')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Delivery Fee:</span>
                      </span>
                      <span className="font-bold font-mono">
                        {isFreeDelivery ? (
                          <span className="text-emerald-600 font-bold uppercase text-[11px]">FREE Delivery</span>
                        ) : (
                          `PKR ${deliveryCharges.toLocaleString('en-PK')}`
                        )}
                      </span>
                    </div>

                    {taxAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Taxes ({checkoutSettings.taxRatePercent}%):</span>
                        <span className="font-bold font-mono">PKR {taxAmount.toLocaleString('en-PK')}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-emerald-600 font-mono text-base">
                        {grandTotal > 0 ? `PKR ${grandTotal.toLocaleString('en-PK')}` : 'Price on Request'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Free replacements for transit damage. Real human support via WhatsApp.</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('customer')}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 cursor-pointer"
                  >
                    <span>Proceed to Customer Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: CUSTOMER DETAILS */}
          {/* ============================================================ */}
          {currentStep === 'customer' && (
            <div className="max-w-xl mx-auto space-y-5 animate-fadeIn">
              <div className="text-center pb-2">
                <h4 className="font-serif font-bold text-slate-900 text-base">Enter Your Contact Information</h4>
                <p className="text-xs text-slate-500 mt-0.5">We will send your order confirmation and tracking details to this mobile number</p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Ali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 transition-all outline-none ${
                        errors.customerName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.customerName && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.customerName}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. 0300 1234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 transition-all outline-none ${
                        errors.phoneNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.phoneNumber && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.phoneNumber}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Format: 03XX XXXXXXX (active WhatsApp preferred)</p>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 transition-all outline-none focus:border-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateCustomerStep()) {
                      setCurrentStep('address');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Delivery Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: DELIVERY ADDRESS */}
          {/* ============================================================ */}
          {currentStep === 'address' && (
            <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className="text-center pb-1">
                <h4 className="font-serif font-bold text-slate-900 text-base">Delivery Location & Shipping Details</h4>
                <p className="text-xs text-slate-500 mt-0.5">Please provide an accurate doorstep delivery address</p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                {/* City Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Select Delivery City *</span>
                    {matchedCity && !isCustomCitySelected && (
                      <span className="text-[11px] text-emerald-600 font-bold">
                        ⚡ {matchedCity.estimatedDays}
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      {activeCities.map((c) => (
                        <option key={c.id} value={c.cityName}>
                          📍 {c.cityName} ({c.estimatedDays} • {c.deliveryFee === 0 ? 'FREE' : `PKR ${c.deliveryFee}`})
                        </option>
                      ))}
                      {deliverySettings.enableCustomCity !== false && (
                        <option value={customCityOptionValue}>
                          {customCityLabelText}
                        </option>
                      )}
                    </select>
                    <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Custom City Manual Input Field */}
                {isCustomCitySelected && (
                  <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Custom City / Area *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your city or area (e.g. Kasur, Swat, Daska, Rahim Yar Khan)"
                      value={customCityName}
                      onChange={(e) => setCustomCityName(e.target.value)}
                      className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border bg-white text-slate-900 outline-none ${
                        errors.customCityName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-amber-300 focus:border-amber-600'
                      }`}
                    />
                    {errors.customCityName && <p className="text-[11px] text-rose-600 font-semibold">{errors.customCityName}</p>}
                    <p className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team on WhatsApp.'}</span>
                    </p>
                  </div>
                )}

                {/* Area / Locality */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. DHA Phase 6, Sector F-7, Gulberg III, Model Town"
                      value={areaLocality}
                      onChange={(e) => setAreaLocality(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 transition-all outline-none ${
                        errors.areaLocality ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.areaLocality && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.areaLocality}</p>}
                </div>

                {/* Complete Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address *</label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      placeholder="House/Plot #, Street Number, Block/Sector, Building/Apartment Name"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border bg-white text-slate-900 transition-all outline-none resize-none ${
                        errors.deliveryAddress ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                  {errors.deliveryAddress && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.deliveryAddress}</p>}
                </div>

                {/* Landmark & Instructions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nearest Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Near ABC Mosque / Park"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Call before arrival"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('customer')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateAddressStep()) {
                      setCurrentStep('payment_method');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Payment Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PAYMENT METHOD SELECTION */}
          {/* ============================================================ */}
          {currentStep === 'payment_method' && (
            <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className="text-center pb-1">
                <h4 className="font-serif font-bold text-slate-900 text-base">Select Your Preferred Payment Method</h4>
                <p className="text-xs text-slate-500 mt-0.5">Choose how you would like to complete payment for your order</p>
              </div>

              {isLoadingPaymentMethods ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500">Loading available payment options...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Cash on Delivery Available</h5>
                  <p className="text-xs text-slate-600">Standard Cash on Delivery will be applied to your order.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethodId === method.id;
                    const isCod = method.type === 'cod' || method.id === 'cod';
                    const methodRequiresAdvance = isCod && Boolean(checkoutSettings.codAdvanceRequired || method.codAdvanceRequired);
                    const methodAdvancePct = method.codAdvancePercentage || checkoutSettings.codAdvancePercentage || 30;
                    const methodAdvanceAmt = methodRequiresAdvance 
                      ? Math.max(checkoutSettings.codAdvanceMinAmount || 0, Math.round((grandTotal * methodAdvancePct) / 100)) 
                      : 0;
                    const methodRemainingAmt = methodRequiresAdvance 
                      ? Math.max(0, grandTotal - methodAdvanceAmt) 
                      : grandTotal;

                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPaymentMethodId(method.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-sm shadow-blue-500/15 ring-1 ring-blue-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isCod 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : method.type === 'easypaisa'
                              ? 'bg-green-100 text-green-700'
                              : method.type === 'jazzcash'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isCod ? (
                            <Truck className="w-5 h-5" />
                          ) : method.type === 'easypaisa' || method.type === 'jazzcash' ? (
                            <Smartphone className="w-5 h-5" />
                          ) : method.type === 'bank_transfer' ? (
                            <Building2 className="w-5 h-5" />
                          ) : (
                            <CreditCard className="w-5 h-5" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{method.name}</h5>
                            {isCod && !methodRequiresAdvance && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                100% Pay at Doorstep
                              </span>
                            )}
                            {isCod && methodRequiresAdvance && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                🛡️ {methodAdvancePct}% Advance Required
                              </span>
                            )}
                            {method.qrCodeUrl && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5">
                                <QrCode className="w-2.5 h-2.5" /> QR Available
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {isCod
                              ? methodRequiresAdvance
                                ? `Pay PKR ${methodAdvanceAmt.toLocaleString('en-PK')} (${methodAdvancePct}%) advance online, remaining PKR ${methodRemainingAmt.toLocaleString('en-PK')} on delivery.`
                                : 'Pay 100% cash upon doorstep delivery.'
                              : method.bankName 
                                ? `${method.bankName} • ${method.accountTitle || 'Direct Transfer'}`
                                : method.accountTitle 
                                  ? `Account: ${method.accountTitle}` 
                                  : 'Transfer to company account and submit proof'}
                          </p>
                        </div>

                        {/* Price Preview */}
                        <div className="text-right text-xs font-bold text-slate-900 font-mono shrink-0">
                          {isCod && methodRequiresAdvance ? (
                            <div>
                              <span className="text-[10px] text-amber-700 block font-sans">Advance</span>
                              <span>PKR {methodAdvanceAmt.toLocaleString('en-PK')}</span>
                            </div>
                          ) : (
                            <span>PKR {grandTotal.toLocaleString('en-PK')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('address')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_instructions')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>View Instructions & Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: PAYMENT INSTRUCTIONS & ACCOUNT DETAILS */}
          {/* ============================================================ */}
          {currentStep === 'payment_instructions' && (
            <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className="text-center pb-1">
                <h4 className="font-serif font-bold text-slate-900 text-base">
                  {isCodAdvanceRequired 
                    ? 'COD Advance Deposit Instructions' 
                    : `Payment Details for ${activePaymentMethod.name}`}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isCodAdvanceRequired 
                    ? 'Transfer the advance amount to confirm your Cash on Delivery booking' 
                    : 'Please review the payment details below to complete your transfer'}
                </p>
              </div>

              {isCashOnDelivery && isCodAdvanceRequired ? (
                /* Cash on Delivery with Advance Protection */
                <div className="space-y-4">
                  {/* Advance Required Highlight Card */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                          🛡️
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-800 font-bold tracking-wider uppercase">Order Confirmation Policy</span>
                          <h5 className="text-sm font-bold text-slate-900">Cash on Delivery with Advance Deposit</h5>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Required Advance:</span>
                        <span className="text-sm font-bold text-amber-700 font-mono">
                          PKR {codAdvanceAmountRequired.toLocaleString('en-PK')} ({codAdvancePercentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">Total Order Value</span>
                        <span className="font-bold text-slate-900 font-mono">PKR {grandTotal.toLocaleString('en-PK')}</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">Remaining on Delivery</span>
                        <span className="font-bold text-emerald-700 font-mono">PKR {codRemainingAmount.toLocaleString('en-PK')}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      {checkoutSettings.codAdvanceInstructions || 
                        `To confirm your Cash on Delivery order, a ${codAdvancePercentage}% advance deposit (PKR ${codAdvanceAmountRequired.toLocaleString('en-PK')}) is required. The remaining PKR ${codRemainingAmount.toLocaleString('en-PK')} will be collected in cash upon doorstep delivery.`}
                    </p>
                  </div>

                  {/* Select Account to Transfer Advance */}
                  {onlinePaymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Choose Receiving Account to Transfer Advance (PKR {codAdvanceAmountRequired.toLocaleString('en-PK')}):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {onlinePaymentMethods.map((m) => {
                          const isAccSelected = (activeAdvanceTransferMethod?.id || onlinePaymentMethods[0]?.id) === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedAdvanceTransferMethodId(m.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                isAccSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold block truncate">{m.name}</span>
                              <span className={`text-[10px] truncate block ${isAccSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                {m.bankName || m.type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Account Details for Advance */}
                  {activeAdvanceTransferMethod && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">Transfer Advance Here</span>
                          <h5 className="text-sm font-bold text-white">{activeAdvanceTransferMethod.name}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">Advance Amount:</span>
                          <p className="text-sm font-bold text-amber-400 font-mono">PKR {codAdvanceAmountRequired.toLocaleString('en-PK')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {activeAdvanceTransferMethod.accountTitle && (
                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Account Title</span>
                              <span className="font-bold text-white text-xs">{activeAdvanceTransferMethod.accountTitle}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeAdvanceTransferMethod.accountTitle || '', 'Account Title')}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 transition-colors"
                              title="Copy Account Title"
                            >
                              {copiedField === 'Account Title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {activeAdvanceTransferMethod.accountNumber && (
                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Account / Mobile Number</span>
                              <span className="font-bold text-cyan-300 font-mono text-xs">{activeAdvanceTransferMethod.accountNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeAdvanceTransferMethod.accountNumber || '', 'Account Number')}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 transition-colors"
                              title="Copy Account Number"
                            >
                              {copiedField === 'Account Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {activeAdvanceTransferMethod.bankName && (
                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block">Bank / Institution</span>
                            <span className="font-bold text-white text-xs">{activeAdvanceTransferMethod.bankName}</span>
                          </div>
                        )}

                        {activeAdvanceTransferMethod.iban && (
                          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-slate-400 block">IBAN Number</span>
                              <span className="font-mono text-[11px] text-white truncate block">{activeAdvanceTransferMethod.iban}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeAdvanceTransferMethod.iban || '', 'IBAN')}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 shrink-0 transition-colors"
                              title="Copy IBAN"
                            >
                              {copiedField === 'IBAN' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {activeAdvanceTransferMethod.qrCodeUrl && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={activeAdvanceTransferMethod.qrCodeUrl}
                              alt="Payment QR"
                              className="w-12 h-12 rounded-lg bg-white p-1 object-contain border border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setZoomQrCode(true)}
                            />
                            <div>
                              <span className="text-xs font-bold text-white block">Scan & Pay via Mobile App</span>
                              <span className="text-[10px] text-slate-400">Click QR to enlarge & scan</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setZoomQrCode(true)}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Enlarge QR
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Copy Notification */}
                  {copiedField && (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800 animate-fadeIn">
                      ✓ Copied {copiedField} to clipboard!
                    </div>
                  )}
                </div>
              ) : isCashOnDelivery && !isCodAdvanceRequired ? (
                /* Standard 100% Cash on Delivery Notice */
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">No Advance Payment Required</h5>
                    <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
                      Your order will be processed and dispatched for delivery. You can pay the total amount of <strong>PKR {grandTotal.toLocaleString('en-PK')}</strong> in cash to the delivery courier.
                    </p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs text-slate-700 flex items-center justify-between font-mono">
                    <span>Total Due on Delivery:</span>
                    <span className="font-bold text-emerald-700 text-sm">PKR {grandTotal.toLocaleString('en-PK')}</span>
                  </div>
                </div>
              ) : (
                /* Online / Bank Transfer Details */
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">Official Payment Account</span>
                        <h5 className="text-sm font-bold text-white">{activePaymentMethod.name}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">Total Payable:</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono">PKR {grandTotal.toLocaleString('en-PK')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Account Title */}
                      {activePaymentMethod.accountTitle && (
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Account Title</span>
                            <span className="font-bold text-white text-xs">{activePaymentMethod.accountTitle}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activePaymentMethod.accountTitle || '', 'Account Title')}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 transition-colors"
                            title="Copy Account Title"
                          >
                            {copiedField === 'Account Title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {/* Account Number */}
                      {activePaymentMethod.accountNumber && (
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Account Number</span>
                            <span className="font-bold text-cyan-300 font-mono text-xs">{activePaymentMethod.accountNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activePaymentMethod.accountNumber || '', 'Account Number')}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 transition-colors"
                            title="Copy Account Number"
                          >
                            {copiedField === 'Account Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {/* Bank Name */}
                      {activePaymentMethod.bankName && (
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block">Bank / Institution</span>
                          <span className="font-bold text-white text-xs">{activePaymentMethod.bankName}</span>
                        </div>
                      )}

                      {/* IBAN */}
                      {activePaymentMethod.iban && (
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="text-[10px] text-slate-400 block">IBAN Number</span>
                            <span className="font-mono text-[11px] text-white truncate block">{activePaymentMethod.iban}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activePaymentMethod.iban || '', 'IBAN')}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 shrink-0 transition-colors"
                            title="Copy IBAN"
                          >
                            {copiedField === 'IBAN' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* QR Code Section */}
                    {activePaymentMethod.qrCodeUrl && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={activePaymentMethod.qrCodeUrl}
                            alt="Payment QR"
                            className="w-12 h-12 rounded-lg bg-white p-1 object-contain border border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setZoomQrCode(true)}
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Scan & Pay via Mobile App</span>
                            <span className="text-[10px] text-slate-400">Click QR to enlarge & scan</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setZoomQrCode(true)}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Enlarge QR
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Instructions Note */}
                  {activePaymentMethod.instructions && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>Payment Instructions:</span>
                      </div>
                      <p className="text-blue-800 text-[11px] leading-relaxed whitespace-pre-line pl-5">
                        {activePaymentMethod.instructions}
                      </p>
                    </div>
                  )}

                  {/* Quick Copy Notification */}
                  {copiedField && (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800 animate-fadeIn">
                      ✓ Copied {copiedField} to clipboard!
                    </div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_method')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Choose Another Method</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_proof')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>
                    {isCashOnDelivery && !isCodAdvanceRequired 
                      ? 'Review & Place Order' 
                      : (isCodAdvanceRequired ? 'Upload Advance Proof' : 'Proceed to Payment Proof')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: PAYMENT PROOF UPLOAD / ORDER REVIEW */}
          {/* ============================================================ */}
          {currentStep === 'payment_proof' && (
            <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
              <div className="text-center pb-1">
                <h4 className="font-serif font-bold text-slate-900 text-base">
                  {isCodAdvanceRequired
                    ? 'Upload Advance Payment Screenshot'
                    : isCashOnDelivery
                      ? 'Review & Confirm Your Order'
                      : 'Submit Payment Proof Receipt'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isCodAdvanceRequired
                    ? `Upload the PKR ${codAdvanceAmountRequired.toLocaleString('en-PK')} advance payment screenshot to confirm booking`
                    : isCashOnDelivery 
                      ? 'Verify your delivery details before final confirmation'
                      : 'Upload your transaction screenshot or enter the transaction reference ID'}
                </p>
              </div>

              {isCashOnDelivery && !isCodAdvanceRequired ? (
                /* Standard Cash on Delivery Summary Review (No Advance) */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900">Payment Option:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Cash on Delivery (100% at Doorstep)</span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <p><strong>Customer:</strong> {customerName} ({phoneNumber})</p>
                    <p><strong>Destination:</strong> {finalCityName}</p>
                    <p><strong>Address:</strong> {deliveryAddress}, {areaLocality}</p>
                    <p><strong>Items:</strong> {items.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>Total Amount Due on Delivery:</span>
                    <span className="font-mono text-emerald-600 text-base">PKR {grandTotal.toLocaleString('en-PK')}</span>
                  </div>
                </div>
              ) : (
                /* Payment Proof Upload (for Advance or 100% Online Payment) */
                <div className="space-y-4">
                  {/* Summary Card for Advance or Full Amount */}
                  {isCodAdvanceRequired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-bold pb-2 border-b border-amber-200">
                        <span>Advance Payment Required:</span>
                        <span className="text-amber-700 font-mono text-sm">PKR {codAdvanceAmountRequired.toLocaleString('en-PK')} ({codAdvancePercentage}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Remaining Balance Due upon Delivery:</span>
                        <span className="font-bold font-mono text-emerald-700">PKR {codRemainingAmount.toLocaleString('en-PK')}</span>
                      </div>
                    </div>
                  )}

                  {/* File Upload Drop Zone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      {isCodAdvanceRequired 
                        ? `Advance Payment Receipt Screenshot (PKR ${codAdvanceAmountRequired.toLocaleString('en-PK')}) *`
                        : 'Payment Screenshot / Receipt Image *'}
                    </label>

                    {proofPreviewUrl ? (
                      /* Preview Box with remove */
                      <div className="relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 flex items-center gap-4">
                        <img
                          src={proofPreviewUrl}
                          alt="Payment Receipt Preview"
                          className="w-20 h-20 rounded-xl object-cover border border-slate-300 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {proofFile?.name || 'Payment Receipt Screenshot'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {proofFile ? `${(proofFile.size / 1024).toFixed(1)} KB` : 'Ready to submit'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Receipt Attached
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProofFile(null);
                            setProofPreviewUrl('');
                            setProofUploadedUrl('');
                          }}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove Screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Drag and drop / Click to browse */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            setProofFile(file);
                            setProofPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50/40 hover:border-blue-400 ${
                          errors.paymentProof ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-slate-50/60'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">
                          Click to upload or drag & drop payment screenshot
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PNG, JPG, JPEG or WEBP (Max 10MB)
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}

                    {errors.paymentProof && (
                      <p className="text-[11px] text-rose-500 font-semibold">{errors.paymentProof}</p>
                    )}
                  </div>

                  {/* Transaction ID / Reference Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transaction ID / Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TID-9823412 or TRX-48291"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Found in your bank app confirmation SMS or receipt</p>
                  </div>

                  {/* Payment Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Notes / Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via mobile banking app, sender name..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Security & Verification Notice</span>
                    </p>
                    <p>
                      {isCodAdvanceRequired
                        ? 'We will verify your advance payment and confirm your order shortly. We will update you on your provided WhatsApp number.'
                        : 'Your payment receipt will be verified by our team. We will confirm your order and keep you updated via WhatsApp.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Submission error feedback */}
              {errors.submit && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] font-semibold text-center mt-3 animate-fadeIn flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_instructions')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || isUploadingProof}
                  onClick={() => {
                    if (validatePaymentProofStep()) {
                      handleFinalizeOrder();
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting || isUploadingProof ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {isCodAdvanceRequired 
                          ? 'Submit Advance Proof & Confirm Booking' 
                          : isCashOnDelivery 
                            ? 'Place Cash on Delivery Order' 
                            : 'Submit & Place Order'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 7: ORDER CONFIRMATION & SUCCESS SCREEN */}
          {/* ============================================================ */}
          {currentStep === 'confirmation' && placedOrder && (
            <div className="max-w-xl mx-auto text-center space-y-4 py-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  {placedOrder.isAdvancePayment
                    ? 'Advance Payment Proof Submitted!'
                    : placedOrder.paymentStatus === 'Cash on Delivery'
                      ? 'Order Placed Successfully!'
                      : 'Payment Proof Submitted & Order Recorded!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Thank you, <strong>{placedOrder.customerName}</strong>. Your order has been registered in our system.
                </p>
              </div>

              {/* Order Verification Notice Box */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 text-left space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Order Confirmation & Verification:</span>
                </div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  We will verify your payment and confirm your order shortly. We will update you on your provided WhatsApp number (<strong>{placedOrder.phoneNumber}</strong>) or contact you if needed.
                </p>
              </div>

              {/* Order Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Order Number</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">#{placedOrder.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Payment Status</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      placedOrder.paymentStatus === 'Payment Verified' || placedOrder.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : placedOrder.paymentStatus === 'Advance Payment Under Review' || placedOrder.paymentStatus === 'Payment Proof Submitted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {placedOrder.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Method</span>
                    <span className="font-bold text-slate-900">{placedOrder.paymentMethodName || 'Cash on Delivery'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Delivery City</span>
                    <span className="font-bold text-slate-900">{placedOrder.city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimated Arrival</span>
                    <span className="font-bold text-emerald-600">{placedOrder.estimatedDeliveryDays || '2-4 Days'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Grand Total</span>
                    <span className="font-bold text-slate-900 font-mono">PKR {placedOrder.grandTotal.toLocaleString('en-PK')}</span>
                  </div>
                </div>

                {placedOrder.isAdvancePayment && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 bg-amber-50/50 p-2 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Advance Paid (Under Review)</span>
                      <span className="font-bold font-mono text-amber-700">PKR {placedOrder.advancePaidAmount?.toLocaleString('en-PK')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Remaining on Delivery</span>
                      <span className="font-bold font-mono text-emerald-700">PKR {placedOrder.remainingCodAmount?.toLocaleString('en-PK')}</span>
                    </div>
                  </div>
                )}

                {placedOrder.transactionReference && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="text-[10px] text-slate-400 block">Transaction Reference ID</span>
                    <span className="font-mono font-bold text-slate-900">{placedOrder.transactionReference}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Open WhatsApp & Close */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppOrder(placedOrder)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order & Tracking via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* HOW TO ORDER STEP-BY-STEP GUIDE (DYNAMIC ADMIN CONFIGURABLE) */}
          {/* ============================================================ */}
          {howToOrderConfig.isEnabled !== false && (
            <div className="mt-8 pt-5 border-t border-slate-200">
              {/* Expand/Collapse Toggle Button */}
              <button
                type="button"
                onClick={() => setIsHowToOrderOpen(!isHowToOrderOpen)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-900 transition-all flex items-center justify-between shadow-2xs group cursor-pointer"
                aria-expanded={isHowToOrderOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 block">
                      {howToOrderConfig.buttonLabel || 'Learn how to order (Step-by-step guide)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Need help placing your order? Click to see instructions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-blue-600 hidden sm:inline">
                    {isHowToOrderOpen ? 'Hide Guide' : 'View Steps'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white/90 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                    {isHowToOrderOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Expandable Step-by-Step Instructions */}
              {isHowToOrderOpen && (
                <div className="mt-3.5 p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn shadow-inner">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>{howToOrderConfig.title || 'How to Order from Zafar Sarwar Traders'}</span>
                      </h4>
                      {howToOrderConfig.subtitle && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {howToOrderConfig.subtitle}
                        </p>
                      )}
                    </div>
                    {howToOrderConfig.supportWhatsapp && (
                      <a
                        href={`https://wa.me/${howToOrderConfig.supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello ZST, I need assistance placing an order.')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Order via WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {howToOrderConfig.steps.map((step) => (
                      <div
                        key={step.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 shadow-sm">
                            {step.stepNumber}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {step.title}
                          </h5>
                        </div>

                        <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                          {step.description}
                        </p>

                        {step.tip && (
                          <div className="ml-8 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-start gap-1.5">
                            <span className="shrink-0">💡</span>
                            <span>{step.tip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Assurance Note */}
                  {howToOrderConfig.customNote && (
                    <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{howToOrderConfig.customNote}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsHowToOrderOpen(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline decoration-slate-300 hover:decoration-slate-600 cursor-pointer"
                    >
                      Close instructions
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Full-Screen Zoom QR Modal */}
      {zoomQrCode && activePaymentMethod.qrCodeUrl && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setZoomQrCode(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomQrCode(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-slate-900 text-base">{activePaymentMethod.name} QR Code</h4>
            <p className="text-xs text-slate-500">Scan this QR code using your banking or wallet app to pay</p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src={activePaymentMethod.qrCodeUrl}
                alt="Enlarged Payment QR"
                className="w-64 h-64 object-contain mx-auto"
              />
            </div>

            <div className="text-xs font-mono font-bold text-slate-800">
              Total: PKR {grandTotal.toLocaleString('en-PK')}
            </div>

            <button
              onClick={() => setZoomQrCode(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Close QR Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
