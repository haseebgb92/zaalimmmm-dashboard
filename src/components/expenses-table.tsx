'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatDate, getTodayInKarachi } from '@/lib/date-utils';
import { toast } from 'sonner';
import { Calculator } from '@/components/calculator';

interface ExpensesData {
  id: string;
  date: string;
  item: string;
  qty?: string;
  unit?: string;
  amount: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

interface ExpensesTableProps {
  data: ExpensesData[];
  onRefresh: () => void;
  currency: string;
}

const presetItems = [
  'Chicken', 'Vegetables', 'Bread Small', 'Bread Medium', 'Bread Large', 'Burger Bun',
  'Cheese', 'Fries', 'Oil', 'Olives', 'Jalapeno', 'Packing Material', 'Tortilla Wrap'
];

export function ExpensesTable({ data, onRefresh, currency }: ExpensesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ExpensesData>>({});
  const [filterText, setFilterText] = useState('');
  
  // Load last used values from localStorage
  const getLastUsedValues = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastExpenseValues');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      unit: '',
    };
  };

  const [addForm, setAddForm] = useState({
    date: getTodayInKarachi(),
    item: '',
    qty: '',
    ...getLastUsedValues(),
    amount: '',
    notes: '',
    receiptUrl: '',
  });

  // Filter data based on item name or notes
  const filteredData = data.filter((item) => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      item.item.toLowerCase().includes(searchText) ||
      (item.notes && item.notes.toLowerCase().includes(searchText))
    );
  });

  const handleEdit = (item: ExpensesData) => {
    setEditingId(item.id);
    setEditForm({
      date: item.date,
      item: item.item,
      qty: item.qty || '',
      unit: item.unit || '',
      amount: item.amount,
      notes: item.notes || '',
      receiptUrl: item.receiptUrl || '',
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/expenses/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          item: editForm.item,
          qty: editForm.qty ? parseFloat(editForm.qty) : undefined,
          unit: editForm.unit,
          amount: editForm.amount ? parseFloat(editForm.amount) : undefined,
          notes: editForm.notes,
          receiptUrl: editForm.receiptUrl,
        }),
      });

      if (response.ok) {
        toast.success('Expense updated successfully');
        setEditingId(null);
        onRefresh();
      } else {
        toast.error('Failed to update expense');
      }
    } catch {
      toast.error('Error updating expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Expense deleted successfully');
        onRefresh();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('Error deleting expense');
    }
  };

  const handleAdd = async () => {
    try {
      // Save last used values to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastExpenseValues', JSON.stringify({
          unit: addForm.unit,
        }));
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addForm.date,
          item: addForm.item,
          qty: addForm.qty ? parseFloat(addForm.qty) : undefined,
          unit: addForm.unit,
          amount: addForm.amount ? parseFloat(addForm.amount) : undefined,
          notes: addForm.notes,
          receiptUrl: addForm.receiptUrl,
        }),
      });

      if (response.ok) {
        toast.success('Expense added successfully');
        setIsAddDialogOpen(false);
        setAddForm({
          date: getTodayInKarachi(),
          item: '',
          qty: '',
          unit: addForm.unit, // Keep last used unit
          amount: '',
          notes: '',
          receiptUrl: '',
        });
        onRefresh();
      } else {
        toast.error('Failed to add expense');
      }
    } catch {
      toast.error('Error adding expense');
    }
  };

  const handlePresetClick = (item: string) => {
    setAddForm({ ...addForm, item });
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses Log</CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Filter by item or notes..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="max-w-xs"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Item</label>
                <Input
                  value={addForm.item}
                  onChange={(e) => setAddForm({ ...addForm, item: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={addForm.qty}
                    onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  />
                  <Calculator onInsert={(value) => setAddForm({ ...addForm, amount: value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Receipt URL (optional)</label>
                <Input
                  type="url"
                  placeholder="https://example.com/receipt.jpg"
                  value={addForm.receiptUrl}
                  onChange={(e) => setAddForm({ ...addForm, receiptUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload receipt to cloud storage and paste URL here
                </p>
              </div>
              <Button onClick={handleAdd} className="w-full">
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filterText && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} entries
          </div>
        )}
        {/* Quick Add Presets */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Quick Add Presets</h4>
          <div className="flex flex-wrap gap-2">
            {presetItems.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handlePresetClick(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Item</th>
                <th className="text-left p-2">Qty/Unit</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Notes</th>
                <th className="text-left p-2">Receipt</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    ) : (
                      formatDate(item.date)
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        value={editForm.item}
                        onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                      />
                    ) : (
                      item.item
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Qty"
                          value={editForm.qty}
                          onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                          className="w-16"
                        />
                        <Input
                          placeholder="Unit"
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="w-16"
                        />
                      </div>
                    ) : (
                      item.qty && item.unit ? `${item.qty} ${item.unit}` : '-'
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        />
                        <Calculator onInsert={(value) => setEditForm({ ...editForm, amount: value })} />
                      </div>
                    ) : (
                      formatCurrency(parseFloat(item.amount), currency)
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      />
                    ) : (
                      item.notes || '-'
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        type="url"
                        placeholder="Receipt URL"
                        value={editForm.receiptUrl}
                        onChange={(e) => setEditForm({ ...editForm, receiptUrl: e.target.value })}
                        className="w-32"
                      />
                    ) : item.receiptUrl ? (
                      <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        View
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
