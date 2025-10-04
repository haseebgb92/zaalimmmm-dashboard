'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getTodayInKarachi } from '@/lib/date-utils';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRange } from '@/lib/date-utils';

interface PersonalExpenseData {
  id: string;
  date: string;
  head: string;
  amount: string;
  notes?: string;
  createdAt: string;
}

interface PersonalExpenseTotals {
  head: string;
  total: number;
  entries: number;
}

interface PersonalExpensesTableProps {
  currency: string;
}

export function PersonalExpensesTable({ currency }: PersonalExpensesTableProps) {
  const [data, setData] = useState<PersonalExpenseData[]>([]);
  const [totals, setTotals] = useState<PersonalExpenseTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '', kind: 'today' });
  const [selectedHead, setSelectedHead] = useState<string>('all');
  const [addForm, setAddForm] = useState({
    date: getTodayInKarachi(),
    head: '',
    amount: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    head: '',
    amount: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (selectedHead !== 'all') params.append('head', selectedHead);

      const [expensesResponse, totalsResponse] = await Promise.all([
        fetch(`/api/personal-expenses?${params}`),
        fetch(`/api/personal-expenses/totals?${params}`)
      ]);

      if (expensesResponse.ok && totalsResponse.ok) {
        const expensesData = await expensesResponse.json();
        const totalsData = await totalsResponse.json();
        setData(expensesData);
        setTotals(totalsData);
      } else {
        toast.error('Failed to fetch personal expenses');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch personal expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedHead]);

  const handleAdd = async () => {
    if (!addForm.head || !addForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/personal-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addForm.date,
          head: addForm.head,
          amount: parseFloat(addForm.amount),
          notes: addForm.notes,
        }),
      });

      if (response.ok) {
        toast.success('Personal expense added successfully');
        setAddForm({
          date: getTodayInKarachi(),
          head: '',
          amount: '',
          notes: '',
        });
        fetchData();
      } else {
        toast.error('Failed to add personal expense');
      }
    } catch (error) {
      console.error('Error adding personal expense:', error);
      toast.error('Failed to add personal expense');
    }
  };

  const handleEdit = (expense: PersonalExpenseData) => {
    setEditingId(expense.id);
    setEditForm({
      date: expense.date,
      head: expense.head,
      amount: expense.amount,
      notes: expense.notes || '',
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/personal-expenses/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          head: editForm.head,
          amount: parseFloat(editForm.amount),
          notes: editForm.notes,
        }),
      });

      if (response.ok) {
        toast.success('Personal expense updated successfully');
        setEditingId(null);
        fetchData();
      } else {
        toast.error('Failed to update personal expense');
      }
    } catch (error) {
      console.error('Error updating personal expense:', error);
      toast.error('Failed to update personal expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this personal expense?')) return;

    try {
      const response = await fetch(`/api/personal-expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Personal expense deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete personal expense');
      }
    } catch (error) {
      console.error('Error deleting personal expense:', error);
      toast.error('Failed to delete personal expense');
    }
  };

  const getUniqueHeads = () => {
    const heads = new Set(data.map(item => item.head));
    return Array.from(heads).sort();
  };

  const getTotalForHead = (head: string) => {
    const total = totals.find(t => t.head === head);
    return total ? total.total : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading personal expenses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grand Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Grand Totals by Person</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {totals.map((total) => (
              <div key={total.head} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{total.head}</h3>
                  <Badge variant={total.total >= 0 ? "default" : "destructive"}>
                    {formatCurrency(total.total, currency)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {total.entries} entries
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <div className="min-w-48">
              <label className="text-sm font-medium mb-2 block">Person</label>
              <Select value={selectedHead} onValueChange={setSelectedHead}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  {getUniqueHeads().map((head) => (
                    <SelectItem key={head} value={head}>
                      {head}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Person</label>
              <Input
                placeholder="Person name"
                value={addForm.head}
                onChange={(e) => setAddForm({ ...addForm, head: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount (positive for credit, negative for debit)"
                value={addForm.amount}
                onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Input
                placeholder="Notes (optional)"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} className="w-full">
                Add Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Person</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Notes</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {editingId === expense.id ? (
                        <Input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      ) : (
                        formatDate(expense.date)
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === expense.id ? (
                        <Input
                          value={editForm.head}
                          onChange={(e) => setEditForm({ ...editForm, head: e.target.value })}
                        />
                      ) : (
                        expense.head
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === expense.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        />
                      ) : (
                        <Badge variant={parseFloat(expense.amount) >= 0 ? "default" : "destructive"}>
                          {formatCurrency(parseFloat(expense.amount), currency)}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === expense.id ? (
                        <Input
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      ) : (
                        expense.notes || '-'
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === expense.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No personal expenses found for the selected filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
