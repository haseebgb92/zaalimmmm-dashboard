'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/date-range-picker';
import { SalesTable } from '@/components/sales-table';
import { ExpensesTable } from '@/components/expenses-table';
import { DateRange, getDateRange } from '@/lib/date-utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SalesData {
  id: string;
  date: string;
  source: 'spot' | 'foodpanda';
  orders: number;
  grossAmount: string;
  notes?: string;
  createdAt: string;
}

interface ExpensesData {
  id: string;
  date: string;
  category: string;
  item?: string;
  qty?: string;
  unit?: string;
  unitPrice?: string;
  amount: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
}

export default function LogsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('today'));
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [expensesData, setExpensesData] = useState<ExpensesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('PKR');

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        setCurrency(settings.CURRENCY || 'PKR');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sales data
      const salesResponse = await fetch(
        `/api/sales?start=${dateRange.start}&end=${dateRange.end}`
      );
      if (salesResponse.ok) {
        const sales = await salesResponse.json();
        setSalesData(sales);
      }

      // Fetch expenses data
      const expensesResponse = await fetch(
        `/api/expenses?start=${dateRange.start}&end=${dateRange.end}`
      );
      if (expensesResponse.ok) {
        const expenses = await expensesResponse.json();
        setExpensesData(expenses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Logs</h1>
            <p className="text-gray-600">Manage sales and expenses</p>
          </div>
        </div>

        {/* Date Range Picker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </CardContent>
              </Card>
            ) : (
              <SalesTable 
                data={salesData} 
                onRefresh={fetchData} 
                currency={currency}
              />
            )}
          </TabsContent>

          <TabsContent value="expenses">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </CardContent>
              </Card>
            ) : (
              <ExpensesTable 
                data={expensesData} 
                onRefresh={fetchData} 
                currency={currency}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
