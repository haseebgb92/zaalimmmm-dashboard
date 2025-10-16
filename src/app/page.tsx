'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/date-range-picker';
import { KPICards } from '@/components/kpi-cards';
import { Charts } from '@/components/charts';
import { MobileNav } from '@/components/mobile-nav';
import { DateRange, getDateRange } from '@/lib/date-utils';
import { Download, Settings, FileText, User, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SummaryData {
  kpis: {
    grossSalesTotal: number;
    foodpandaProfitTotal: number;
    spotSalesTotal: number;
    totalSales: number;
    ordersTotal: number;
    expensesTotal: number;
    netProfit: number;
    averageOrderValue: number;
    profitMargin: number;
    foodpandaCommission: number;
  };
  changes: {
    grossSales: number;
    foodpandaProfit: number;
    spotSales: number;
    totalSales: number;
    orders: number;
    expenses: number;
    netProfit: number;
  };
  previousPeriod: {
    start: string;
    end: string;
  };
  dailySeries: Array<{
    date: string;
    spotSales: number;
    foodpandaSales: number;
    netProfit: number;
    expenses: number;
  }>;
  expensesByItem: Record<string, { total: number; qty: number; unit: string; entries: number }>;
  expenseForecast: Record<string, { 
    predictedAmount: number; 
    avgPerDay: number; 
    confidence: string;
    factors: string[];
    trend: 'up' | 'down' | 'stable';
  }>;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('thisWeek'));
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currency, setCurrency] = useState('PKR');
  const router = useRouter();

  // Check authentication (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || (role !== 'dashboard' && role !== 'admin')) {
        router.push('/login');
        return;
      }
      
      // Set auth loading to false after auth check
      setAuthLoading(false);
    }
  }, [router]);

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

  const fetchSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/summary?start=${dateRange.start}&end=${dateRange.end}`
      );
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/export?start=${dateRange.start}&end=${dateRange.end}&format=csv`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zaalimmmm-dashboard-${dateRange.start}-${dateRange.end}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav onExport={handleExport} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zaalimmmm Shawarma</h1>
            <p className="text-gray-600">Analytics Dashboard</p>
          </div>
          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/logs">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Logs
              </Button>
            </Link>
            <Link href="/personal">
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Personal
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : summaryData ? (
          <>
            {/* KPI Cards */}
            <div className="mb-8">
              <KPICards 
                kpis={summaryData.kpis} 
                changes={summaryData.changes}
                currency={currency} 
              />
            </div>

            {/* Charts */}
            <Charts 
              dailySeries={summaryData.dailySeries} 
              expensesByItem={summaryData.expensesByItem}
              expenseForecast={summaryData.expenseForecast}
              currency={currency}
            />
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No data available for the selected date range.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}