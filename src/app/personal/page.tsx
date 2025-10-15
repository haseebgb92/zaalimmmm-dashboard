'use client';

import { useState, useEffect } from 'react';
import { PersonalExpensesTable } from '@/components/personal-expenses-table';
import { MobileNav } from '@/components/mobile-nav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Settings } from 'lucide-react';
import Link from 'next/link';

export default function PersonalExpensesPage() {
  const [currency, setCurrency] = useState('PKR');

  useEffect(() => {
    // Fetch currency setting
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
        const settings = await response.json();
        const currencySetting = settings.find((s: { key: string; value: string }) => s.key === 'CURRENCY');
          if (currencySetting) {
            setCurrency(currencySetting.value);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden md:block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personal Expense Management</h1>
              <p className="text-gray-600">
                Track personal expenses with debit/credit system. Debit (negative) reduces total, Credit (positive) adds to total.
              </p>
            </div>
          </div>
          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden md:flex gap-2">
            <Link href="/logs">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Logs
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <PersonalExpensesTable currency={currency} />
      </div>
    </div>
  );
}
