'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calculator as CalcIcon } from 'lucide-react';

interface CalculatorProps {
  onInsert?: (value: string) => void;
}

export function Calculator({ onInsert }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    if (previousValue !== null && operation !== null && !newNumber) {
      handleEquals();
    }
    setPreviousValue(display);
    setOperation(op);
    setNewNumber(true);
  };

  const handleEquals = () => {
    if (previousValue !== null && operation !== null) {
      const prev = parseFloat(previousValue);
      const current = parseFloat(display);
      let result = 0;

      switch (operation) {
        case '+':
          result = prev + current;
          break;
        case '-':
          result = prev - current;
          break;
        case '×':
          result = prev * current;
          break;
        case '÷':
          result = current !== 0 ? prev / current : 0;
          break;
      }

      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handleInsert = () => {
    if (onInsert) {
      onInsert(display);
      setIsOpen(false);
      handleClear();
    }
  };

  const buttonClass = "h-12 text-lg font-medium";
  const operationClass = "h-12 text-lg font-medium bg-blue-500 hover:bg-blue-600 text-white";
  const equalsClass = "h-12 text-lg font-medium bg-green-500 hover:bg-green-600 text-white";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <CalcIcon className="h-4 w-4 mr-2" />
          Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Display */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-right text-3xl font-bold break-all">
              {display}
            </div>
            {operation && previousValue && (
              <div className="text-right text-sm text-gray-500 mt-1">
                {previousValue} {operation}
              </div>
            )}
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <Button onClick={handleClear} variant="destructive" className={buttonClass}>
              C
            </Button>
            <Button onClick={handleBackspace} variant="outline" className={buttonClass}>
              ⌫
            </Button>
            <Button onClick={() => handleOperation('÷')} className={operationClass}>
              ÷
            </Button>
            <Button onClick={() => handleOperation('×')} className={operationClass}>
              ×
            </Button>

            {/* Row 2 */}
            <Button onClick={() => handleNumber('7')} variant="outline" className={buttonClass}>
              7
            </Button>
            <Button onClick={() => handleNumber('8')} variant="outline" className={buttonClass}>
              8
            </Button>
            <Button onClick={() => handleNumber('9')} variant="outline" className={buttonClass}>
              9
            </Button>
            <Button onClick={() => handleOperation('-')} className={operationClass}>
              -
            </Button>

            {/* Row 3 */}
            <Button onClick={() => handleNumber('4')} variant="outline" className={buttonClass}>
              4
            </Button>
            <Button onClick={() => handleNumber('5')} variant="outline" className={buttonClass}>
              5
            </Button>
            <Button onClick={() => handleNumber('6')} variant="outline" className={buttonClass}>
              6
            </Button>
            <Button onClick={() => handleOperation('+')} className={operationClass}>
              +
            </Button>

            {/* Row 4 */}
            <Button onClick={() => handleNumber('1')} variant="outline" className={buttonClass}>
              1
            </Button>
            <Button onClick={() => handleNumber('2')} variant="outline" className={buttonClass}>
              2
            </Button>
            <Button onClick={() => handleNumber('3')} variant="outline" className={buttonClass}>
              3
            </Button>
            <Button onClick={handleEquals} className={equalsClass}>
              =
            </Button>

            {/* Row 5 */}
            <Button onClick={() => handleNumber('0')} variant="outline" className={`${buttonClass} col-span-2`}>
              0
            </Button>
            <Button onClick={handleDecimal} variant="outline" className={buttonClass}>
              .
            </Button>
            <Button onClick={handleInsert} className="h-12 text-lg font-medium bg-primary hover:bg-primary/90">
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

