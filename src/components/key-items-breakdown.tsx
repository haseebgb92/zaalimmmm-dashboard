'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  currency: string;
}

const KEY_ITEMS = [
  'Chicken',
  'Bread',
  'Burgers', 
  'Olives',
  'Chips',
  'Jalapeno',
  'Cheese',
  'Oil',
  'Eggs'
];

export function KeyItemsBreakdown({ expensesByItem, currency }: KeyItemsBreakdownProps) {
  // Filter and process key items
  const keyItemsData: KeyItemData[] = [];
  
  KEY_ITEMS.forEach(itemName => {
    // Find all items that match this key item (case insensitive)
    const matchingItems = Object.entries(expensesByItem).filter(([item]) => 
      item.toLowerCase().includes(itemName.toLowerCase())
    );
    
    if (matchingItems.length > 0) {
      const totalAmount = matchingItems.reduce((sum, [, data]) => sum + data.total, 0);
      const totalQuantity = matchingItems.reduce((sum, [, data]) => sum + data.qty, 0);
      const totalEntries = matchingItems.reduce((sum, [, data]) => sum + data.entries, 0);
      
      // Use the unit from the first matching item (they should be consistent)
      const unit = matchingItems[0][1].unit || 'units';
      
      keyItemsData.push({
        item: itemName,
        totalAmount,
        totalQuantity,
        unit,
        entries: totalEntries
      });
    }
  });

  if (keyItemsData.length === 0) {
    return null;
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Key Items Breakdown</CardTitle>
        <p className="text-sm text-gray-600">
          Total amount spent and quantity purchased for key items
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyItemsData.map((item) => (
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
              </div>
            </div>
          ))}
        </div>
        
        {keyItemsData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No key items found in the selected date range
          </div>
        )}
      </CardContent>
    </Card>
  );
}
