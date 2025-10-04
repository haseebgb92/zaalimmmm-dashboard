'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';

interface SalesData {
  id: string;
  date: string;
  source: 'spot' | 'foodpanda';
  orders: number;
  grossAmount: string;
  notes?: string;
  createdAt: string;
}

interface SalesTableProps {
  data: SalesData[];
  onRefresh: () => void;
  currency: string;
}

export function SalesTable({ data, onRefresh, currency }: SalesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SalesData>>({});
  const [addForm, setAddForm] = useState({
    date: '',
    source: 'spot' as 'spot' | 'foodpanda',
    orders: 0,
    grossAmount: '',
    notes: '',
  });

  const handleEdit = (item: SalesData) => {
    setEditingId(item.id);
    setEditForm({
      date: item.date,
      source: item.source,
      orders: item.orders,
      grossAmount: item.grossAmount,
      notes: item.notes || '',
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/sales/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          source: editForm.source,
          orders: editForm.orders,
          grossAmount: parseFloat(editForm.grossAmount || '0'),
          notes: editForm.notes,
        }),
      });

      if (response.ok) {
        toast.success('Sale updated successfully');
        setEditingId(null);
        onRefresh();
      } else {
        toast.error('Failed to update sale');
      }
    } catch {
      toast.error('Error updating sale');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Sale deleted successfully');
        onRefresh();
      } else {
        toast.error('Failed to delete sale');
      }
    } catch {
      toast.error('Error deleting sale');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addForm.date,
          source: addForm.source,
          orders: addForm.orders,
          grossAmount: parseFloat(addForm.grossAmount),
          notes: addForm.notes,
        }),
      });

      if (response.ok) {
        toast.success('Sale added successfully');
        setIsAddDialogOpen(false);
        setAddForm({
          date: '',
          source: 'spot',
          orders: 0,
          grossAmount: '',
          notes: '',
        });
        onRefresh();
      } else {
        toast.error('Failed to add sale');
      }
    } catch {
      toast.error('Error adding sale');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales Log</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={addForm.source} onValueChange={(value: 'spot' | 'foodpanda') => setAddForm({ ...addForm, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="foodpanda">Foodpanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Orders</label>
                <Input
                  type="number"
                  value={addForm.orders}
                  onChange={(e) => setAddForm({ ...addForm, orders: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Gross Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={addForm.grossAmount}
                  onChange={(e) => setAddForm({ ...addForm, grossAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Add Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Orders</th>
                <th className="text-left p-2">Gross Amount</th>
                <th className="text-left p-2">Notes</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
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
                      <Select value={editForm.source} onValueChange={(value: 'spot' | 'foodpanda') => setEditForm({ ...editForm, source: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spot">Spot</SelectItem>
                          <SelectItem value="foodpanda">Foodpanda</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      item.source.charAt(0).toUpperCase() + item.source.slice(1)
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editForm.orders}
                        onChange={(e) => setEditForm({ ...editForm, orders: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      item.orders
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.grossAmount}
                        onChange={(e) => setEditForm({ ...editForm, grossAmount: e.target.value })}
                      />
                    ) : (
                      formatCurrency(parseFloat(item.grossAmount), currency)
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
