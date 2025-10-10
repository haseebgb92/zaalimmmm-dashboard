'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/date-utils';

interface KeyItemData {
  item: string;
  totalAmount: number;
  totalQuantity: number;
  unit: string;
  entries: number;
}

interface KeyItemsBreakdownProps {
  expensesByItem: Record<string, { total: number; qty: number; unit: string; entries: number }>;
  expenseForecast?: Record<string, { 
    predictedAmount: number; 
    avgPerDay: number; 
    confidence: string;
    factors: string[];
    trend: 'up' | 'down' | 'stable';
  }>;
  currency: string;
}

export function KeyItemsBreakdown({ expensesByItem, expenseForecast, currency }: KeyItemsBreakdownProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(true);
  
  // Get all unique items from the expenses data
  const allItems = Object.keys(expensesByItem).sort();
  
  // Filter and process selected items
  const keyItemsData: KeyItemData[] = [];
  
  const itemsToProcess = showAll ? allItems : selectedItems;
  
  itemsToProcess.forEach(itemName => {
    const itemData = expensesByItem[itemName];
    if (itemData) {
      keyItemsData.push({
        item: itemName,
        totalAmount: itemData.total,
        totalQuantity: itemData.qty,
        unit: itemData.unit,
        entries: itemData.entries
      });
    }
  });

  // Filter displayed items based on selection
  const displayedItems = showAll 
    ? keyItemsData 
    : keyItemsData.filter(item => selectedItems.includes(item.item));

  if (keyItemsData.length === 0) {
    return null;
  }

  const handleAddItem = (item: string) => {
    if (item === 'clear-all') {
      setSelectedItems([]);
      setShowAll(true);
    } else if (item === 'select-all') {
      setSelectedItems(allItems);
      setShowAll(false);
    } else if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
      setShowAll(false);
    }
  };

  const handleRemoveItem = (item: string) => {
    setSelectedItems(selectedItems.filter(i => i !== item));
  };

  const handleShowAll = () => {
    setShowAll(true);
    setSelectedItems([]);
  };

  const handleShowSelected = () => {
    setShowAll(false);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Key Items Breakdown</CardTitle>
        <p className="text-sm text-gray-600">
          Total amount spent and quantity purchased for key items
        </p>
        
        {/* Filter Controls */}
        <div className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button 
                variant={showAll ? "default" : "outline"} 
                size="sm"
                onClick={handleShowAll}
              >
                Show All Items
              </Button>
              <Button 
                variant={!showAll ? "default" : "outline"} 
                size="sm"
                onClick={handleShowSelected}
                disabled={selectedItems.length === 0}
              >
                Show Selected ({selectedItems.length})
              </Button>
            </div>
            
            {/* Enhanced Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Select onValueChange={handleAddItem}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="🔍 Filter by specific items..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear-all">Clear All Filters</SelectItem>
                  <SelectItem value="select-all">Select All Items</SelectItem>
                  <div className="border-t my-1"></div>
                  {allItems
                    .filter(item => !selectedItems.includes(item))
                    .map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Selected Items */}
          {!showAll && selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <Badge 
                  key={item} 
                  variant="secondary" 
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {item}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map((item) => (
            <div key={item.item} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{item.item}</h3>
                <Badge variant="secondary">{item.entries} entries</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Spent:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.totalAmount, currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Quantity:</span>
                  <span className="font-semibold text-blue-600">
                    {item.totalQuantity.toFixed(2)} {item.unit}
                  </span>
                </div>
                
                {item.totalQuantity > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Price:</span>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(item.totalAmount / item.totalQuantity, currency)}/{item.unit}
                    </span>
                  </div>
                )}
                
                {expenseForecast && expenseForecast[item.item] && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Next Period Forecast:</span>
                      <span className="text-sm font-semibold text-orange-600">
                        {formatCurrency(expenseForecast[item.item].predictedAmount, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Avg per Day:</span>
                      <span className="text-xs text-gray-600">
                        {formatCurrency(expenseForecast[item.item].avgPerDay, currency)}
                      </span>
                    </div>
                    
                    {/* Enhanced Forecast Details */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <span className={`text-xs font-medium ${
                          expenseForecast[item.item].confidence === 'high' ? 'text-green-600' :
                          expenseForecast[item.item].confidence === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {expenseForecast[item.item].confidence.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Trend:</span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${
                          expenseForecast[item.item].trend === 'up' ? 'text-red-600' :
                          expenseForecast[item.item].trend === 'down' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {expenseForecast[item.item].trend === 'up' ? '↗️' : 
                           expenseForecast[item.item].trend === 'down' ? '↘️' : '→'}
                          {expenseForecast[item.item].trend.toUpperCase()}
                        </span>
                      </div>
                      
                      {expenseForecast[item.item].factors.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Factors:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {expenseForecast[item.item].factors.map((factor, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {displayedItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {showAll 
              ? "No key items found in the selected date range"
              : "No items selected. Please select items to view their breakdown."
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
