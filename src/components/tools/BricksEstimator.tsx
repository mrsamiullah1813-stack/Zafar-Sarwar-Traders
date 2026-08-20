import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Send, 
  Info, 
  ShieldAlert, 
  Layers, 
  Check, 
  Sliders, 
  HelpCircle, 
  Sparkles, 
  Home, 
  DoorClosed, 
  LayoutGrid, 
  Bed, 
  UtensilsCrossed, 
  Bath, 
  Warehouse, 
  Printer, 
  Share2, 
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { 
  HouseBrickEstimatorInputs, 
  HouseBrickEstimatorResult, 
  HouseStoreyType, 
  HouseRoomItem, 
  RoomCategoryType, 
  BrickDimensions, 
  HouseFloorDetail, 
  BusinessConfig, 
  SmartToolsSettings 
} from '../../types';
import { 
  calculateHouseBrickEstimate, 
  buildHouseBrickEstimateWhatsAppMessage,
  STANDARD_BRICK_LENGTH_INCHES,
  STANDARD_BRICK_WIDTH_INCHES,
  STANDARD_BRICK_HEIGHT_INCHES
} from '../../utils/bricksEstimatorEngine';
import { defaultSmartToolsSettings } from '../../data/defaultSmartToolsConfig';

interface BricksEstimatorProps {
  config: BusinessConfig;
  settings?: SmartToolsSettings;
}

const TOTAL_STEPS = 8;

const STEP_LABELS = [
  'House Type',
  'House Size',
  'Wall Height',
  'Rooms',
  'Kitchens',
  'Washrooms',
  'Wall Details',
  'Doors, Windows & Bricks'
];

export function BricksEstimator({ config, settings }: BricksEstimatorProps) {
  const safeSettings = settings || defaultSmartToolsSettings;
  const brickDefaults = safeSettings.brickSettings || defaultSmartToolsSettings.brickSettings!;

  // Initial State with sensible Pakistani residential defaults
  const [inputs, setInputs] = useState<HouseBrickEstimatorInputs>(() => ({
    houseType: 'single',
    houseLengthFeet: 40,
    houseWidthFeet: 30,
    defaultWallHeightFeet: brickDefaults.defaultWallHeightFeet || 10,
    floors: [
      { storeyId: 'ground', label: 'Ground Floor', lengthFeet: 40, widthFeet: 30, heightFeet: brickDefaults.defaultWallHeightFeet || 10 }
    ],
    rooms: [
      { id: 'r1', category: 'bedroom', name: 'Master Bedroom', lengthFeet: 14, widthFeet: 16, heightFeet: 10, floorId: 'ground' },
      { id: 'r2', category: 'bedroom', name: 'Bedroom 2', lengthFeet: 12, widthFeet: 14, heightFeet: 10, floorId: 'ground' },
      { id: 'r3', category: 'living', name: 'Living / TV Lounge', lengthFeet: 16, widthFeet: 18, heightFeet: 10, floorId: 'ground' },
      { id: 'r4', category: 'drawing', name: 'Drawing Room', lengthFeet: 14, widthFeet: 16, heightFeet: 10, floorId: 'ground' }
    ],
    kitchens: [
      { id: 'k1', category: 'kitchen', name: 'Main Kitchen', lengthFeet: 10, widthFeet: 12, heightFeet: 10, floorId: 'ground' }
    ],
    washrooms: [
      { id: 'w1', category: 'washroom', name: 'Attach Bathroom 1', lengthFeet: 6, widthFeet: 8, heightFeet: 10, floorId: 'ground' },
      { id: 'w2', category: 'washroom', name: 'Attach Bathroom 2', lengthFeet: 6, widthFeet: 8, heightFeet: 10, floorId: 'ground' }
    ],
    otherSpaces: [],
    wallThicknessType: 'dual', // 9" exterior + 4.5" interior partitions (standard Pakistani practice)
    doorsCount: 6,
    doorWidthFeet: brickDefaults.defaultDoorWidthFeet || 3,
    doorHeightFeet: brickDefaults.defaultDoorHeightFeet || 7,
    windowsCount: 5,
    windowWidthFeet: brickDefaults.defaultWindowWidthFeet || 4,
    windowHeightFeet: brickDefaults.defaultWindowHeightFeet || 4,
    brickDimensions: {
      type: 'standard-pakistani',
      lengthInches: brickDefaults.defaultBrickLengthInches || STANDARD_BRICK_LENGTH_INCHES,
      widthInches: brickDefaults.defaultBrickWidthInches || STANDARD_BRICK_WIDTH_INCHES,
      heightInches: brickDefaults.defaultBrickHeightInches || STANDARD_BRICK_HEIGHT_INCHES
    },
    wastagePercent: brickDefaults.defaultWastagePercent || 5
  }));

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculation Result Memoization
  const result: HouseBrickEstimatorResult = useMemo(() => {
    return calculateHouseBrickEstimate(inputs, safeSettings);
  }, [inputs, safeSettings]);

  // Sync floors when houseType changes
  const handleHouseTypeChange = (type: HouseStoreyType) => {
    const storeysCount = type === 'triple' ? 3 : (type === 'double' ? 2 : 1);
    const updatedFloors: HouseFloorDetail[] = [
      { storeyId: 'ground', label: 'Ground Floor', lengthFeet: inputs.houseLengthFeet, widthFeet: inputs.houseWidthFeet, heightFeet: inputs.defaultWallHeightFeet }
    ];
    if (storeysCount >= 2) {
      updatedFloors.push({ storeyId: 'first', label: 'First Floor', lengthFeet: inputs.houseLengthFeet, widthFeet: inputs.houseWidthFeet, heightFeet: inputs.defaultWallHeightFeet });
    }
    if (storeysCount >= 3) {
      updatedFloors.push({ storeyId: 'second', label: 'Second Floor', lengthFeet: inputs.houseLengthFeet, widthFeet: inputs.houseWidthFeet, heightFeet: inputs.defaultWallHeightFeet });
    }

    // Adjust smart defaults for doors and windows based on storey count
    const baseDoors = type === 'single' ? 6 : (type === 'double' ? 11 : 16);
    const baseWindows = type === 'single' ? 5 : (type === 'double' ? 9 : 14);

    setInputs(prev => ({
      ...prev,
      houseType: type,
      floors: updatedFloors,
      doorsCount: prev.doorsCount || baseDoors,
      windowsCount: prev.windowsCount || baseWindows
    }));
  };

  // Preset Pakistani House Size Pickers
  const handleApplyPresetSize = (length: number, width: number, label: string) => {
    setInputs(prev => {
      const updatedFloors = prev.floors.map(f => ({
        ...f,
        lengthFeet: length,
        widthFeet: width
      }));
      return {
        ...prev,
        houseLengthFeet: length,
        houseWidthFeet: width,
        floors: updatedFloors
      };
    });
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setValidationError(null);
    if (currentStep === 2) {
      if (!inputs.houseLengthFeet || inputs.houseLengthFeet < 5) {
        setValidationError('Please enter a valid house length (minimum 5 feet).');
        return;
      }
      if (!inputs.houseWidthFeet || inputs.houseWidthFeet < 5) {
        setValidationError('Please enter a valid house width (minimum 5 feet).');
        return;
      }
    }
    if (currentStep === 3) {
      if (!inputs.defaultWallHeightFeet || inputs.defaultWallHeightFeet < 7) {
        setValidationError('Please enter a valid wall height (standard is 10 to 12 feet).');
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetAll = () => {
    setInputs({
      houseType: 'single',
      houseLengthFeet: 40,
      houseWidthFeet: 30,
      defaultWallHeightFeet: 10,
      floors: [{ storeyId: 'ground', label: 'Ground Floor', lengthFeet: 40, widthFeet: 30, heightFeet: 10 }],
      rooms: [
        { id: 'r1', category: 'bedroom', name: 'Master Bedroom', lengthFeet: 14, widthFeet: 16, heightFeet: 10, floorId: 'ground' },
        { id: 'r2', category: 'bedroom', name: 'Bedroom 2', lengthFeet: 12, widthFeet: 14, heightFeet: 10, floorId: 'ground' },
        { id: 'r3', category: 'living', name: 'Living / TV Lounge', lengthFeet: 16, widthFeet: 18, heightFeet: 10, floorId: 'ground' }
      ],
      kitchens: [
        { id: 'k1', category: 'kitchen', name: 'Main Kitchen', lengthFeet: 10, widthFeet: 12, heightFeet: 10, floorId: 'ground' }
      ],
      washrooms: [
        { id: 'w1', category: 'washroom', name: 'Washroom 1', lengthFeet: 6, widthFeet: 8, heightFeet: 10, floorId: 'ground' },
        { id: 'w2', category: 'washroom', name: 'Washroom 2', lengthFeet: 6, widthFeet: 8, heightFeet: 10, floorId: 'ground' }
      ],
      otherSpaces: [],
      wallThicknessType: 'dual',
      doorsCount: 6,
      doorWidthFeet: 3,
      doorHeightFeet: 7,
      windowsCount: 5,
      windowWidthFeet: 4,
      windowHeightFeet: 4,
      brickDimensions: {
        type: 'standard-pakistani',
        lengthInches: 9,
        widthInches: 4.5,
        heightInches: 3
      },
      wastagePercent: 5
    });
    setCurrentStep(1);
    setShowResults(false);
    setValidationError(null);
  };

  // Add/Remove Helpers
  const handleAddRoom = (category: RoomCategoryType = 'bedroom') => {
    const defaultLabels: Record<string, string> = {
      bedroom: `Bedroom ${inputs.rooms.filter(r => r.category === 'bedroom').length + 1}`,
      living: 'Living Room',
      drawing: 'Drawing Room',
      dining: 'Dining Room',
      other: `Room ${inputs.rooms.length + 1}`
    };
    const newRoom: HouseRoomItem = {
      id: Date.now().toString(),
      category,
      name: defaultLabels[category] || 'New Room',
      lengthFeet: category === 'living' ? 16 : 14,
      widthFeet: category === 'living' ? 18 : 14,
      heightFeet: inputs.defaultWallHeightFeet || 10,
      floorId: 'ground'
    };
    setInputs(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
  };

  const handleRemoveRoom = (id: string) => {
    setInputs(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r.id !== id)
    }));
  };

  const handleUpdateRoom = (id: string, field: keyof HouseRoomItem, val: any) => {
    setInputs(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === id ? { ...r, [field]: val } : r)
    }));
  };

  // Kitchen Helpers
  const handleSetKitchenCount = (count: number) => {
    const current = [...inputs.kitchens];
    if (count > current.length) {
      for (let i = current.length; i < count; i++) {
        current.push({
          id: `k_${Date.now()}_${i}`,
          category: 'kitchen',
          name: count === 1 ? 'Kitchen' : `Kitchen ${i + 1}`,
          lengthFeet: 10,
          widthFeet: 12,
          heightFeet: inputs.defaultWallHeightFeet || 10,
          floorId: 'ground'
        });
      }
    } else if (count < current.length) {
      current.splice(count);
    }
    setInputs(prev => ({ ...prev, kitchens: current }));
  };

  // Washroom Helpers
  const handleSetWashroomCount = (count: number) => {
    const current = [...inputs.washrooms];
    if (count > current.length) {
      for (let i = current.length; i < count; i++) {
        current.push({
          id: `w_${Date.now()}_${i}`,
          category: 'washroom',
          name: `Washroom ${i + 1}`,
          lengthFeet: 6,
          widthFeet: 8,
          heightFeet: inputs.defaultWallHeightFeet || 10,
          floorId: 'ground'
        });
      }
    } else if (count < current.length) {
      current.splice(count);
    }
    setInputs(prev => ({ ...prev, washrooms: current }));
  };

  // Other Spaces Helpers
  const handleAddOtherSpace = (category: RoomCategoryType) => {
    const labels: Record<string, string> = {
      store: 'Store Room',
      laundry: 'Laundry Area',
      office: 'Home Office / Study',
      garage: 'Garage / Car Porch',
      other: 'Custom Space'
    };
    const defaultSizes: Record<string, [number, number]> = {
      store: [6, 8],
      laundry: [6, 6],
      office: [10, 12],
      garage: [12, 18],
      other: [10, 10]
    };
    const [defL, defW] = defaultSizes[category] || [10, 10];
    const newSpace: HouseRoomItem = {
      id: `oth_${Date.now()}`,
      category,
      name: labels[category] || 'Custom Space',
      lengthFeet: defL,
      widthFeet: defW,
      heightFeet: inputs.defaultWallHeightFeet || 10,
      floorId: 'ground'
    };
    setInputs(prev => ({
      ...prev,
      otherSpaces: [...prev.otherSpaces, newSpace]
    }));
  };

  const handleRemoveOtherSpace = (id: string) => {
    setInputs(prev => ({
      ...prev,
      otherSpaces: prev.otherSpaces.filter(s => s.id !== id)
    }));
  };

  // WhatsApp & Sharing Handlers
  const handleWhatsAppShare = () => {
    const phone = config.phone || "923108002863";
    const msg = buildHouseBrickEstimateWhatsAppMessage(result, config.name);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopySummary = () => {
    const msg = buildHouseBrickEstimateWhatsAppMessage(result, config.name);
    navigator.clipboard.writeText(msg);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Top Professional Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 border border-orange-900/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider mb-3 border border-orange-500/30">
            <Boxes className="w-3.5 h-3.5" />
            Pakistani House Brick Calculator
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            House Brick Calculator
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
            Estimate the accurate number of bricks required for your home construction. Enter your house details step-by-step to calculate brick quantities, wastage allowances, and mortar cement bags.
          </p>
        </div>
      </div>

      {/* Main Wizard & Results Body */}
      {!showResults ? (
        <div className="space-y-6">
          
          {/* Progress Indicator Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-600 text-white font-bold text-xs">
                  Step {currentStep} of {TOTAL_STEPS}
                </span>
                <span className="text-sm font-bold text-white">
                  {STEP_LABELS[currentStep - 1]}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-600 to-amber-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Quick Step Chips for Desktop Navigation */}
            <div className="hidden md:grid grid-cols-8 gap-1.5 mt-4 pt-3 border-t border-slate-800/80">
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isCurrent = stepNum === currentStep;
                const isDone = stepNum < currentStep;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setValidationError(null);
                      setCurrentStep(stepNum);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-center truncate transition-all ${
                      isCurrent
                        ? 'bg-orange-600 text-white font-bold shadow'
                        : isDone
                        ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                        : 'bg-slate-950/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isDone ? `✓ ${label}` : `${stepNum}. ${label}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Step Card Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: HOUSE TYPE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    What type of house are you building?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select your planned number of floors. We'll automatically calculate exterior walls and floor heights.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'single', label: 'Single Storey', desc: 'Ground Floor only', badge: '1 Floor' },
                    { id: 'double', label: 'Double Storey', desc: 'Ground + First Floor', badge: '2 Floors (Most Popular)' },
                    { id: 'triple', label: 'Triple Storey', desc: 'Ground + First + Second Floor', badge: '3 Floors' }
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleHouseTypeChange(type.id as HouseStoreyType)}
                      className={`p-5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                        inputs.houseType === type.id
                          ? 'bg-orange-950/40 border-orange-500 text-white shadow-xl shadow-orange-950/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-orange-400 text-[10px] font-bold uppercase mb-2">
                          {type.badge}
                        </div>
                        <h3 className="text-lg font-black text-white">{type.label}</h3>
                        <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold">
                        <span className={inputs.houseType === type.id ? 'text-orange-400' : 'text-slate-500'}>
                          {inputs.houseType === type.id ? 'Selected' : 'Select'}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          inputs.houseType === type.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Multi-storey floor height preview */}
                {inputs.houseType !== 'single' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <span className="font-bold text-orange-400 block">Floors Included in Calculation:</span>
                    <div className="flex flex-wrap gap-2">
                      {inputs.floors.map((fl, idx) => (
                        <div key={fl.storeyId} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-semibold text-slate-200">
                          {fl.label} (Length: {fl.lengthFeet} ft × Width: {fl.widthFeet} ft)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: HOUSE SIZE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    What is the approximate size of your house?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Enter the approximate covered area of your house in feet.
                  </p>
                </div>

                {/* Popular Pakistani Plot Presets */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Popular Plot Size Presets (1-Click Fill)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: '3 Marla', l: 35, w: 20 },
                      { label: '5 Marla', l: 45, w: 25 },
                      { label: '7 Marla', l: 52, w: 30 },
                      { label: '10 Marla', l: 65, w: 35 },
                      { label: '1 Kanal', l: 90, w: 50 }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyPresetSize(p.l, p.w, p.label)}
                        className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                          inputs.houseLengthFeet === p.l && inputs.houseWidthFeet === p.w
                            ? 'bg-orange-600 text-white border-orange-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>{p.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.w}' × {p.l}'</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Dimension Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      House Length (Feet)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={inputs.houseLengthFeet || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setInputs(prev => ({
                          ...prev,
                          houseLengthFeet: val,
                          floors: prev.floors.map(f => ({ ...f, lengthFeet: val }))
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      placeholder="e.g. 40"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Front-to-back length of the building</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      House Width (Feet)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={inputs.houseWidthFeet || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setInputs(prev => ({
                          ...prev,
                          houseWidthFeet: val,
                          floors: prev.floors.map(f => ({ ...f, widthFeet: val }))
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      placeholder="e.g. 30"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Front width / building frontage</span>
                  </div>
                </div>

                {/* Covered Area Badge */}
                <div className="p-4 rounded-2xl bg-orange-950/30 border border-orange-800/40 flex items-center justify-between text-xs sm:text-sm">
                  <div className="text-slate-300">
                    Calculated Covered Area: <strong className="text-white font-mono">{inputs.houseLengthFeet * inputs.houseWidthFeet} Sq Ft</strong> (Per Floor)
                  </div>
                  <div className="font-bold text-orange-400 font-mono">
                    Approx {Math.round(((inputs.houseLengthFeet * inputs.houseWidthFeet) / 225) * 10) / 10} Marla
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: WALL / CEILING HEIGHT */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    How high will your walls be?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Standard floor-to-ceiling height in Pakistani houses is 10 ft. You can choose a quick preset or enter a custom height.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[9, 10, 11, 12].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setInputs(prev => ({
                        ...prev,
                        defaultWallHeightFeet: h,
                        floors: prev.floors.map(f => ({ ...f, heightFeet: h }))
                      }))}
                      className={`p-4 rounded-2xl text-center border-2 transition-all ${
                        inputs.defaultWallHeightFeet === h
                          ? 'bg-orange-950/40 border-orange-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-2xl font-black font-mono text-white">{h} ft</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {h === 10 ? 'Standard Height' : `${h} Feet Walls`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Wall Height */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-300">
                      Custom Wall Height (Feet)
                    </label>
                    <span className="text-[11px] text-slate-500">Edit if your house has non-standard ceilings</span>
                  </div>
                  <input
                    type="number"
                    min="7"
                    max="20"
                    step="0.5"
                    value={inputs.defaultWallHeightFeet || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 10;
                      setInputs(prev => ({
                        ...prev,
                        defaultWallHeightFeet: val,
                        floors: prev.floors.map(f => ({ ...f, heightFeet: val }))
                      }));
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white text-center focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: ROOMS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      How many rooms will your house have?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Add your bedrooms, drawing room, living lounge, and dining spaces with their dimensions.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddRoom('bedroom')}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Bedroom
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRoom('living')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      + Add Living/Drawing
                    </button>
                  </div>
                </div>

                {/* Rooms List */}
                <div className="space-y-3">
                  {inputs.rooms.map((room, idx) => (
                    <div 
                      key={room.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/20">
                          {idx + 1}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-orange-500 pb-0.5"
                            placeholder="Room Name"
                          />
                          <span className="text-[11px] text-slate-500 block capitalize">{room.category}</span>
                        </div>
                      </div>

                      {/* Dimensions: Length x Width x Height */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium">L:</span>
                          <input
                            type="number"
                            value={room.lengthFeet}
                            onChange={(e) => handleUpdateRoom(room.id, 'lengthFeet', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>
                        </div>

                        <span className="text-slate-600 font-bold">×</span>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium">W:</span>
                          <input
                            type="number"
                            value={room.widthFeet}
                            onChange={(e) => handleUpdateRoom(room.id, 'widthFeet', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>
                        </div>

                        <span className="text-slate-600 font-bold">×</span>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium">H:</span>
                          <input
                            type="number"
                            value={room.heightFeet}
                            onChange={(e) => handleUpdateRoom(room.id, 'heightFeet', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(room.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors ml-2"
                          title="Remove Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {inputs.rooms.length === 0 && (
                    <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                      No custom rooms added yet. Click "+ Add Bedroom" above to specify individual room dimensions.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 5: KITCHENS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    How many kitchens will your house have?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select the quantity of kitchens across all storeys.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSetKitchenCount(k)}
                      className={`p-4 rounded-2xl text-center border-2 transition-all ${
                        inputs.kitchens.length === k
                          ? 'bg-orange-950/40 border-orange-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-2xl font-black font-mono text-white">{k}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {k === 0 ? 'No Kitchen' : k === 1 ? '1 Kitchen' : `${k} Kitchens`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Kitchens Dimensions List */}
                {inputs.kitchens.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Kitchen Dimensions (Length × Width × Height)
                    </label>
                    {inputs.kitchens.map((kitch, idx) => (
                      <div 
                        key={kitch.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                          {kitch.name}
                        </span>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">L:</span>
                          <input
                            type="number"
                            value={kitch.lengthFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                kitchens: prev.kitchens.map(k => k.id === kitch.id ? { ...k, lengthFeet: val } : k)
                              }));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>

                          <span className="text-slate-600 font-bold">×</span>

                          <span className="text-slate-400">W:</span>
                          <input
                            type="number"
                            value={kitch.widthFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                kitchens: prev.kitchens.map(k => k.id === kitch.id ? { ...k, widthFeet: val } : k)
                              }));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>

                          <span className="text-slate-600 font-bold">×</span>

                          <span className="text-slate-400">H:</span>
                          <input
                            type="number"
                            value={kitch.heightFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                kitchens: prev.kitchens.map(k => k.id === kitch.id ? { ...k, heightFeet: val } : k)
                              }));
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 6: WASHROOMS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    How many washrooms will your house have?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select your total attached and powder washrooms. Standard size is 6 ft × 8 ft.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleSetWashroomCount(w)}
                      className={`p-3 sm:p-4 rounded-2xl text-center border-2 transition-all ${
                        inputs.washrooms.length === w
                          ? 'bg-orange-950/40 border-orange-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl font-black font-mono text-white">{w}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                        {w === 1 ? '1 Bath' : `${w} Baths`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Washrooms Dimensions List */}
                {inputs.washrooms.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Washroom Dimensions (Length × Width × Height)
                    </label>
                    {inputs.washrooms.map((wash, idx) => (
                      <div 
                        key={wash.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <Bath className="w-4 h-4 text-cyan-400" />
                          {wash.name}
                        </span>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">L:</span>
                          <input
                            type="number"
                            value={wash.lengthFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                washrooms: prev.washrooms.map(w => w.id === wash.id ? { ...w, lengthFeet: val } : w)
                              }));
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>

                          <span className="text-slate-600 font-bold">×</span>

                          <span className="text-slate-400">W:</span>
                          <input
                            type="number"
                            value={wash.widthFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                washrooms: prev.washrooms.map(w => w.id === wash.id ? { ...w, widthFeet: val } : w)
                              }));
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>

                          <span className="text-slate-600 font-bold">×</span>

                          <span className="text-slate-400">H:</span>
                          <input
                            type="number"
                            value={wash.heightFeet}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInputs(prev => ({
                                ...prev,
                                washrooms: prev.washrooms.map(w => w.id === wash.id ? { ...w, heightFeet: val } : w)
                              }));
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                          />
                          <span className="text-slate-500">ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 7: WALL DETAILS & OTHER SPACES */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    What will be the wall thickness?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    9-inch walls require more bricks than 4.5-inch walls. Standard Pakistani practice uses 9" for exterior & 4.5" for interior rooms.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dual', label: 'Standard Dual (Recommended)', desc: '9" Exterior Walls + 4.5" Interior Partitions (Pakistani Standard)' },
                    { id: '9-inch', label: '9" (Double Leaf All Walls)', desc: 'Heavy load-bearing, exterior and all interior partition walls' },
                    { id: '4.5-inch', label: '4.5" (Single Leaf All Walls)', desc: 'Single brick thickness / boundary and partition walls' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, wallThicknessType: t.id as any }))}
                      className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                        inputs.wallThicknessType === t.id
                          ? 'bg-orange-950/40 border-orange-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{t.label}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{t.desc}</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs font-bold">
                        <span className={inputs.wallThicknessType === t.id ? 'text-orange-400' : 'text-slate-500'}>
                          {inputs.wallThicknessType === t.id ? 'Active' : 'Select'}
                        </span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          inputs.wallThicknessType === t.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-transparent'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Optional Other Spaces */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Do you have any other spaces? (Optional)
                      </h3>
                      <p className="text-[11px] text-slate-400">Add store room, laundry, garage, or office spaces.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'store', label: '+ Store Room' },
                      { id: 'laundry', label: '+ Laundry' },
                      { id: 'office', label: '+ Office / Study' },
                      { id: 'garage', label: '+ Garage / Porch' },
                      { id: 'other', label: '+ Custom Space' }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleAddOtherSpace(btn.id as any)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {inputs.otherSpaces.map(sp => (
                    <div 
                      key={sp.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">{sp.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{sp.lengthFeet}' × {sp.widthFeet}' × {sp.heightFeet}'</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOtherSpace(sp.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 8: DOORS, WINDOWS, BRICK DETAILS & WASTAGE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Doors, Windows & Brick Specifications
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Wall openings will be automatically subtracted from the brick count to give you an accurate estimate.
                  </p>
                </div>

                {/* Doors & Windows Quantities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <DoorClosed className="w-4 h-4 text-amber-400" />
                        Number of Doors
                      </label>
                      <span className="text-[11px] text-orange-400 font-mono">
                        Default: {inputs.doorWidthFeet}' × {inputs.doorHeightFeet}'
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.doorsCount}
                        onChange={(e) => setInputs(prev => ({ ...prev, doorsCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Deduction: -{(inputs.doorsCount * inputs.doorWidthFeet * inputs.doorHeightFeet)} sq ft
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-cyan-400" />
                        Number of Windows
                      </label>
                      <span className="text-[11px] text-orange-400 font-mono">
                        Default: {inputs.windowWidthFeet}' × {inputs.windowHeightFeet}'
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.windowsCount}
                        onChange={(e) => setInputs(prev => ({ ...prev, windowsCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Deduction: -{(inputs.windowsCount * inputs.windowWidthFeet * inputs.windowHeightFeet)} sq ft
                    </span>
                  </div>
                </div>

                {/* Brick Dimensions Selection */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block">
                        Brick Size / Dimensions
                      </label>
                      <span className="text-[11px] text-slate-400">Standard Pakistani Kiln Baked Awwal Brick (9" × 4.5" × 3")</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({
                          ...prev,
                          brickDimensions: { type: 'standard-pakistani', lengthInches: 9, widthInches: 4.5, heightInches: 3 }
                        }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          inputs.brickDimensions.type === 'standard-pakistani'
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Standard Pakistani (9"×4.5"×3")
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputs(prev => ({
                          ...prev,
                          brickDimensions: { ...prev.brickDimensions, type: 'custom' }
                        }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          inputs.brickDimensions.type === 'custom'
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Custom Brick Size
                      </button>
                    </div>
                  </div>

                  {inputs.brickDimensions.type === 'custom' && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Length (Inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={inputs.brickDimensions.lengthInches}
                          onChange={(e) => setInputs(prev => ({
                            ...prev,
                            brickDimensions: { ...prev.brickDimensions, lengthInches: parseFloat(e.target.value) || 9 }
                          }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Width (Inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={inputs.brickDimensions.widthInches}
                          onChange={(e) => setInputs(prev => ({
                            ...prev,
                            brickDimensions: { ...prev.brickDimensions, widthInches: parseFloat(e.target.value) || 4.5 }
                          }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Height (Inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={inputs.brickDimensions.heightInches}
                          onChange={(e) => setInputs(prev => ({
                            ...prev,
                            brickDimensions: { ...prev.brickDimensions, heightInches: parseFloat(e.target.value) || 3 }
                          }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Bricks for Wastage */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block">
                      Extra Bricks for Wastage / Breakage
                    </label>
                    <span className="text-[11px] text-slate-500">Standard construction breakage buffer is 5%</span>
                  </div>

                  <div className="flex gap-1.5">
                    {[3, 5, 8, 10].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, wastagePercent: w }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          inputs.wastagePercent === w
                            ? 'bg-orange-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {w}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResults(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-orange-300 text-xs font-bold transition-all"
                >
                  Quick Calculate
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-orange-950/50"
                >
                  <span>{currentStep === TOTAL_STEPS ? 'Calculate Bricks' : 'Next Step'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* RESULTS SCREEN */
        /* ------------------------------------------------------------- */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Hero Result Card */}
          <div className="bg-slate-900 border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider border border-orange-500/30">
                  Recommended Masonry Estimate
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  Estimated Bricks Required
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inputs.houseType === 'triple' ? 'Triple Storey' : inputs.houseType === 'double' ? 'Double Storey' : 'Single Storey'} House ({inputs.houseLengthFeet}' × {inputs.houseWidthFeet}' — {result.approxMarla} Marla)
                </p>
              </div>

              {/* Large Estimated Count */}
              <div className="text-left sm:text-right">
                <div className="text-4xl sm:text-5xl font-black text-orange-400 font-mono tracking-tight">
                  ~{result.recommendedBricks.toLocaleString()}
                  <span className="text-xl sm:text-2xl font-bold text-slate-300 ml-2">Bricks</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Estimated Range: <strong className="text-white">{result.totalBricksMin.toLocaleString()} – {result.totalBricksMax.toLocaleString()}</strong> Bricks
                </div>
              </div>
            </div>

            {/* Direct 3-Part Quantity Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-xs font-medium">Calculated Bricks:</span>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {result.rawBricksCount.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Net brickwork requirement</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-xs font-medium">Wastage ({inputs.wastagePercent}%):</span>
                <div className="text-xl font-bold text-orange-400 font-mono mt-1">
                  +{result.wastageBricksCount.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Site breakage & cutting buffer</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-orange-500/30 bg-orange-950/20">
                <span className="text-orange-300 block text-xs font-medium">Total Recommended:</span>
                <div className="text-xl font-bold text-orange-400 font-mono mt-1">
                  {result.recommendedBricks.toLocaleString()}
                </div>
                <span className="text-[10px] text-orange-300/70">Final order quantity</span>
              </div>
            </div>

            {/* Floor Breakdown If Multi-Storey */}
            {result.floorBreakdowns && result.floorBreakdowns.length > 1 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Floor-by-Floor Requirement Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.floorBreakdowns.map((fl) => (
                    <div key={fl.floorId} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                      <div className="font-bold text-white">{fl.label}</div>
                      <div className="text-base font-black text-orange-400 font-mono mt-1">
                        ~{fl.totalBricks.toLocaleString()} Bricks
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Net Masonry: {fl.netMasonryAreaSqFt} sq ft
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mortar Cement & Sand Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs block">Mortar Cement Needed:</span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    ~{Math.ceil(result.approxCementBags)} Bags (50kg)
                  </span>
                  <span className="text-[10px] text-slate-500 block">Based on 1:6 cement-sand mortar</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  🏗️
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs block">Mortar Sand (Chenab/Ravi):</span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    ~{result.approxSandCft.toLocaleString()} CFT Sand
                  </span>
                  <span className="text-[10px] text-slate-500 block">Cubic feet of masonry sand</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  ⏳
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/50"
              >
                <Send className="w-4 h-4" />
                Share Estimate on WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all"
              >
                <Share2 className="w-4 h-4" />
                {copiedToast ? 'Copied to Clipboard!' : 'Copy Summary'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Expandable Calculation Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowBreakdown(prev => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    View Calculation Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    See covered area, room measurements, openings deductions, and masonry volume.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-orange-400 underline">
                {showBreakdown ? 'Hide Breakdown' : 'Expand Breakdown'}
              </span>
            </button>

            {showBreakdown && (
              <div className="pt-4 border-t border-slate-800 space-y-4 text-xs animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Left Column: Dimensions & Areas */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block border-b border-slate-800 pb-1.5">
                      Wall Areas & Deductions
                    </span>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Covered Area:</span>
                      <strong className="text-white font-mono">{result.totalCoveredAreaSqFt.toLocaleString()} sq ft ({result.approxMarla} Marla)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Gross Wall Surface Area:</span>
                      <strong className="text-white font-mono">{result.grossWallAreaSqFt.toLocaleString()} sq ft</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Doors & Windows Deductions:</span>
                      <strong className="text-orange-400 font-mono">-{result.totalOpeningsDeductionSqFt.toLocaleString()} sq ft</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Net Masonry Wall Area:</span>
                      <strong className="text-white font-mono">{result.netWallAreaSqFt.toLocaleString()} sq ft</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Net Masonry Volume:</span>
                      <strong className="text-white font-mono">{result.netMasonryVolumeCft} CFT</strong>
                    </div>
                  </div>

                  {/* Right Column: Bricks & Specifications */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block border-b border-slate-800 pb-1.5">
                      Masonry Assumptions Used
                    </span>
                    <div className="flex justify-between text-slate-300">
                      <span>Brick Dimensions:</span>
                      <strong className="text-white">{result.brickSizeLabel}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Wall Thickness Mode:</span>
                      <strong className="text-white capitalize">{inputs.wallThicknessType === 'dual' ? '9" Exterior + 4.5" Interior' : inputs.wallThicknessType}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Wastage Allowance:</span>
                      <strong className="text-orange-400 font-mono">{inputs.wastagePercent}% (+{result.wastageBricksCount.toLocaleString()} bricks)</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Mortar Mix Ratio:</span>
                      <strong className="text-white">1:6 (Cement : Sand)</strong>
                    </div>
                  </div>
                </div>

                {/* Rooms List Breakdown */}
                {result.roomBreakdowns && result.roomBreakdowns.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block border-b border-slate-800 pb-1.5">
                      Individual Spaces Breakdown
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {result.roomBreakdowns.map((rb, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[11px] text-slate-300 font-bold block truncate">{rb.name}</span>
                          <span className="text-xs font-mono font-bold text-orange-400">~{rb.bricksCount.toLocaleString()} Bricks</span>
                          <span className="text-[10px] text-slate-500 block">{rb.areaSqFt} sq ft wall</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prominent Mandatory Disclaimer */}
          <div className="p-5 rounded-2xl bg-orange-950/30 border border-orange-800/40 text-xs text-orange-200/90 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block font-bold text-orange-200 uppercase tracking-wider text-[11px]">
                Important Construction Disclaimer
              </strong>
              <p>{result.disclaimer}</p>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Edit Details & Recalculate
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Calculation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
