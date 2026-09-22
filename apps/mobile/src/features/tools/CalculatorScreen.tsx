import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { hapticImpact } from '../../lib/haptics';
import { useBannerAd } from '../../hooks/useBannerAd';

export function CalculatorScreen() {
  useBannerAd();
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState<boolean>(false);

  const performCalculation = (prev: string, current: string, op: string): string => {
    const a = parseFloat(prev);
    const b = parseFloat(current);
    if (isNaN(a) || isNaN(b)) return current;

    switch (op) {
      case '+': return (a + b).toString();
      case '-': return (a - b).toString();
      case '×': return (a * b).toString();
      case '÷':
        if (b === 0) return 'Error';
        return (a / b).toString();
      default: return current;
    }
  };

  const handleDigit = (digit: string) => {
    hapticImpact('light');
    if (displayValue === 'Error') {
      setDisplayValue(digit);
      setWaitingForNewValue(false);
      return;
    }

    if (waitingForNewValue) {
      setDisplayValue(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const handleDecimal = () => {
    hapticImpact('light');
    if (displayValue === 'Error') {
      setDisplayValue('0.');
      setWaitingForNewValue(false);
      return;
    }
    
    if (waitingForNewValue) {
      setDisplayValue('0.');
      setWaitingForNewValue(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handleOperator = (nextOperator: string) => {
    hapticImpact('medium');
    if (displayValue === 'Error') return;

    if (operator && !waitingForNewValue && previousValue) {
      const result = performCalculation(previousValue, displayValue, operator);
      setDisplayValue(result);
      setPreviousValue(result);
    } else {
      setPreviousValue(displayValue);
    }

    setOperator(nextOperator);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    hapticImpact('heavy');
    if (displayValue === 'Error') return;
    
    if (operator && previousValue) {
      const result = performCalculation(previousValue, displayValue, operator);
      setDisplayValue(result);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    hapticImpact('light');
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleToggleSign = () => {
    hapticImpact('light');
    if (displayValue === 'Error') return;
    setDisplayValue((parseFloat(displayValue) * -1).toString());
  };

  const handlePercentage = () => {
    hapticImpact('light');
    if (displayValue === 'Error') return;
    setDisplayValue((parseFloat(displayValue) / 100).toString());
  };

  const handleScientific = (op: string) => {
    hapticImpact('light');
    if (displayValue === 'Error') return;
    const val = parseFloat(displayValue);
    if (isNaN(val)) return;

    let res = val;
    switch(op) {
      case 'sin': res = Math.sin(val); break;
      case 'cos': res = Math.cos(val); break;
      case '√': 
        if (val < 0) { setDisplayValue('Error'); return; }
        res = Math.sqrt(val); 
        break;
      case 'x²': res = Math.pow(val, 2); break;
    }
    
    // limit long decimals for display
    let resStr = res.toString();
    if (resStr.length > 12 && resStr.includes('.')) {
      resStr = parseFloat(res.toFixed(8)).toString();
    }
    
    setDisplayValue(resStr);
    setWaitingForNewValue(true);
  };

  const Btn = ({ 
    label, 
    onClick, 
    variant = 'default',
    className = ''
  }: { 
    label: React.ReactNode, 
    onClick: () => void, 
    variant?: 'default' | 'operator' | 'modifier' | 'scientific',
    className?: string 
  }) => {
    let bg = 'bg-slate-200 dark:bg-slate-800 text-foreground'; // default
    if (variant === 'operator') bg = 'bg-teal-500 text-white';
    if (variant === 'modifier') bg = 'bg-slate-300 dark:bg-slate-700 text-foreground';
    if (variant === 'scientific') bg = 'bg-slate-100 dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-medium';

    return (
      <button 
        onClick={onClick}
        className={`flex items-center justify-center text-2xl sm:text-3xl rounded-2xl shadow-sm active:scale-95 transition-all h-16 sm:h-20 ${bg} ${className}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col min-h-screen sm:min-h-full pb-20">
      <header className="mb-4 mt-2 flex items-center shrink-0">
        <Link className="p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground" to="/tools">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Calculator</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-end mb-6 overflow-hidden">
        <div className="text-right text-muted-foreground text-sm h-6 mb-1 px-2">
          {previousValue && operator ? `${previousValue} ${operator}` : ''}
        </div>
        <div className="text-right text-5xl sm:text-6xl font-light tracking-tighter text-foreground break-all px-2 overflow-y-auto max-h-32 hide-scrollbar">
          {displayValue}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 shrink-0">
        {/* Row 1: Scientific */}
        <Btn label="sin" variant="scientific" onClick={() => handleScientific('sin')} className="text-lg" />
        <Btn label="cos" variant="scientific" onClick={() => handleScientific('cos')} className="text-lg" />
        <Btn label="√" variant="scientific" onClick={() => handleScientific('√')} />
        <Btn label="x²" variant="scientific" onClick={() => handleScientific('x²')} />

        {/* Row 2: Modifiers */}
        <Btn label="AC" variant="modifier" onClick={handleClear} />
        <Btn label="±" variant="modifier" onClick={handleToggleSign} />
        <Btn label="%" variant="modifier" onClick={handlePercentage} />
        <Btn label="÷" variant="operator" onClick={() => handleOperator('÷')} />

        {/* Row 3 */}
        <Btn label="7" onClick={() => handleDigit('7')} />
        <Btn label="8" onClick={() => handleDigit('8')} />
        <Btn label="9" onClick={() => handleDigit('9')} />
        <Btn label="×" variant="operator" onClick={() => handleOperator('×')} />

        {/* Row 4 */}
        <Btn label="4" onClick={() => handleDigit('4')} />
        <Btn label="5" onClick={() => handleDigit('5')} />
        <Btn label="6" onClick={() => handleDigit('6')} />
        <Btn label="-" variant="operator" onClick={() => handleOperator('-')} />

        {/* Row 5 */}
        <Btn label="1" onClick={() => handleDigit('1')} />
        <Btn label="2" onClick={() => handleDigit('2')} />
        <Btn label="3" onClick={() => handleDigit('3')} />
        <Btn label="+" variant="operator" onClick={() => handleOperator('+')} />

        {/* Row 6 */}
        <Btn label="0" onClick={() => handleDigit('0')} className="col-span-2" />
        <Btn label="." onClick={handleDecimal} />
        <Btn label="=" variant="operator" onClick={handleEqual} />
      </div>
    </div>
  );
}

