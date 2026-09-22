import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownUp, Ruler, Weight, Thermometer } from 'lucide-react';
import { Card, Input, Label } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { useBannerAd } from '../../hooks/useBannerAd';

const CATEGORIES = {
  length: {
    label: 'Length',
    icon: Ruler,
    units: {
      meters: { label: 'Meters (m)', toBase: 1 },
      kilometers: { label: 'Kilometers (km)', toBase: 1000 },
      centimeters: { label: 'Centimeters (cm)', toBase: 0.01 },
      millimeters: { label: 'Millimeters (mm)', toBase: 0.001 },
      miles: { label: 'Miles (mi)', toBase: 1609.344 },
      yards: { label: 'Yards (yd)', toBase: 0.9144 },
      feet: { label: 'Feet (ft)', toBase: 0.3048 },
      inches: { label: 'Inches (in)', toBase: 0.0254 }
    },
    defaultFrom: 'meters',
    defaultTo: 'feet'
  },
  weight: {
    label: 'Weight',
    icon: Weight,
    units: {
      kilograms: { label: 'Kilograms (kg)', toBase: 1 },
      grams: { label: 'Grams (g)', toBase: 0.001 },
      milligrams: { label: 'Milligrams (mg)', toBase: 0.000001 },
      pounds: { label: 'Pounds (lb)', toBase: 0.45359237 },
      ounces: { label: 'Ounces (oz)', toBase: 0.02834952 }
    },
    defaultFrom: 'kilograms',
    defaultTo: 'pounds'
  },
  temperature: {
    label: 'Temperature',
    icon: Thermometer,
    units: {
      celsius: { label: 'Celsius (°C)', toBase: 1 },
      fahrenheit: { label: 'Fahrenheit (°F)', toBase: 1 },
      kelvin: { label: 'Kelvin (K)', toBase: 1 }
    },
    defaultFrom: 'celsius',
    defaultTo: 'fahrenheit'
  }
};

type Category = keyof typeof CATEGORIES;

export function UnitConverterScreen() {
  useBannerAd();
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState<string>(CATEGORIES.length.defaultFrom);
  const [toUnit, setToUnit] = useState<string>(CATEGORIES.length.defaultTo);
  const [fromValue, setFromValue] = useState<string>('1');

  const handleCategoryChange = (newCat: Category) => {
    if (newCat === category) return;
    hapticImpact('light');
    setCategory(newCat);
    setFromUnit(CATEGORIES[newCat].defaultFrom);
    setToUnit(CATEGORIES[newCat].defaultTo);
  };

  const swapUnits = () => {
    hapticImpact('medium');
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const cleanFloatStr = (num: number) => {
    return parseFloat(num.toPrecision(10)).toString();
  };

  const toValue = useMemo(() => {
    const parsed = parseFloat(fromValue);
    if (isNaN(parsed)) return '';

    if (fromUnit === toUnit) return cleanFloatStr(parsed);

    if (category === 'temperature') {
      let celsius = parsed;
      if (fromUnit === 'fahrenheit') celsius = (parsed - 32) * 5/9;
      else if (fromUnit === 'kelvin') celsius = parsed - 273.15;

      let result = celsius;
      if (toUnit === 'fahrenheit') result = (celsius * 9/5) + 32;
      else if (toUnit === 'kelvin') result = celsius + 273.15;
      
      return cleanFloatStr(result);
    } else {
      const units = CATEGORIES[category].units;
      const unitsRecord = units as Record<string, { label: string; toBase: number }>;
      const fBase = unitsRecord[fromUnit]?.toBase || 1;
      const tBase = unitsRecord[toUnit]?.toBase || 1;
      const result = (parsed * fBase) / tBase;
      return cleanFloatStr(result);
    }
  }, [category, fromUnit, toUnit, fromValue]);

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-screen sm:min-h-full pb-20">
      <header className="mb-6 mt-2 flex items-center">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Unit Converter</h1>
          <p className="text-muted-foreground text-sm">Offline instant conversion.</p>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
        {(Object.keys(CATEGORIES) as Category[]).map(c => {
          const cat = CATEGORIES[c];
          const Icon = cat.icon;
          return (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center py-2.5 sm:py-2 text-xs font-bold rounded-lg transition-all ${
                category === c 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} className="mb-1 sm:mb-0 sm:mr-1.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <Card className="p-1 shadow-sm bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        
        {/* FROM BLOCK */}
        <div className="p-4">
          <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">From</Label>
          <div className="flex gap-3">
            <Input
              type="number"
              inputMode="decimal"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="flex-1 text-lg font-medium h-12 bg-white dark:bg-slate-950"
              placeholder="0"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-1/2 h-12 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {Object.entries(CATEGORIES[category].units).map(([key, unit]) => (
                <option key={key} value={key}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SWAP BUTTON */}
        <div className="relative h-4 flex items-center justify-center -my-2 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <button 
            onClick={swapUnits}
            className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-2 text-blue-500 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        {/* TO BLOCK */}
        <div className="p-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-b-xl">
          <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">To</Label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center px-3 h-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-lg font-medium text-foreground overflow-hidden">
              <span className="truncate">{toValue || '0'}</span>
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-1/2 h-12 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {Object.entries(CATEGORIES[category].units).map(([key, unit]) => (
                <option key={key} value={key}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

      </Card>
    </div>
  );
}


