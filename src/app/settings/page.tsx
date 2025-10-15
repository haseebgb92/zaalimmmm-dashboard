'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileNav } from '@/components/mobile-nav';
import { ArrowLeft, Download, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Settings {
  FP_PROFIT_RATE: string;
  CURRENCY: string;
  EXPENSE_CATEGORIES?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    FP_PROFIT_RATE: '0.70',
    CURRENCY: 'PKR',
    EXPENSE_CATEGORIES: '[]',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/backup/schedule');
      if (response.ok) {
        const data = await response.json();
        setAutoBackupEnabled(data.enabled);
        setLastBackupDate(data.lastBackup);
      }
    } catch (error) {
      console.error('Error fetching backup status:', error);
    }
  };

  const handleEnableAutoBackup = async () => {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable' }),
      });

      if (response.ok) {
        toast.success('Automatic backups enabled! Backups will be sent every 3 days.');
        setAutoBackupEnabled(true);
      } else {
        toast.error('Failed to enable automatic backups');
      }
    } catch (error) {
      console.error('Error enabling auto backup:', error);
      toast.error('Error enabling automatic backups');
    }
  };

  const handleDisableAutoBackup = async () => {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      });

      if (response.ok) {
        toast.success('Automatic backups disabled.');
        setAutoBackupEnabled(false);
      } else {
        toast.error('Failed to disable automatic backups');
      }
    } catch (error) {
      console.error('Error disabling auto backup:', error);
      toast.error('Error disabling automatic backups');
    }
  };

  const handleTestBackup = async () => {
    try {
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });

      if (response.ok) {
        toast.success('Test backup sent to haseeb.gbpk@gmail.com');
        fetchBackupStatus(); // Refresh status
      } else {
        toast.error('Failed to send test backup');
      }
    } catch (error) {
      console.error('Error sending test backup:', error);
      toast.error('Error sending test backup');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          FP_PROFIT_RATE: data.FP_PROFIT_RATE || '0.70',
          CURRENCY: data.CURRENCY || 'PKR',
          EXPENSE_CATEGORIES: data.EXPENSE_CATEGORIES || '[]',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FP_PROFIT_RATE: parseFloat(settings.FP_PROFIT_RATE),
          CURRENCY: settings.CURRENCY,
          categories: JSON.parse(settings.EXPENSE_CATEGORIES || '[]'),
        }),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = (type: 'sales' | 'expenses') => {
    let csvContent = '';
    
    if (type === 'sales') {
      csvContent = 'date,source,orders,gross_amount,notes\n2025-01-01,spot,45,125000.00,"Evening rush"\n2025-01-01,foodpanda,62,98000.00,"Rainy day"';
    } else {
      csvContent = 'date,item,qty,unit,amount,notes\n2025-01-01,Chicken,25,kg,15500.00,"Fresh"\n2025-01-01,Bread Small,60,packs,9000.00,"Morning delivery"';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `zaalimmmm-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup downloaded successfully');
      } else {
        toast.error('Failed to create backup');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Error creating backup');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will restore data from the backup file. Duplicate records will be skipped. Continue?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        const response = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backupData),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success(`${result.message} (Sales: ${result.results.sales.success}, Expenses: ${result.results.expenses.success}, Personal: ${result.results.personalExpenses.success})`);
        } else {
          toast.error(result.error || 'Restore failed');
        }
      } catch (error) {
        console.error('Restore error:', error);
        toast.error('Failed to restore backup. Please check the file format.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'sales' | 'expenses') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast.error('CSV file must have at least a header row and one data row');
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          console.log('CSV Headers:', headers);
          
          const data = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
              const row: Record<string, unknown> = {};
              
              headers.forEach((header, index) => {
                const value = values[index] || '';
                if (header === 'date') {
                  // Convert date format from M/D/YYYY to YYYY-MM-DD
                  if (value) {
                    // Parse date without timezone conversion
                    const parts = value.split('/');
                    if (parts.length === 3) {
                      const month = parts[0].padStart(2, '0');
                      const day = parts[1].padStart(2, '0');
                      const year = parts[2];
                      row[header] = `${year}-${month}-${day}`;
                    } else {
                      // If already in YYYY-MM-DD format, use as-is
                      row[header] = value;
                    }
                  } else {
                    row[header] = value;
                  }
                } else if (header === 'source') {
                  row[header] = value;
                } else if (header === 'orders') {
                  row[header] = parseInt(value) || 0;
                } else if (header === 'gross_amount' || header === 'amount' || header === 'qty') {
                  row[header] = parseFloat(value) || 0;
                } else {
                  row[header] = value;
                }
              });
              
              console.log('Parsed row:', row);
              data.push(row);
            }
          }
          
          console.log('Total parsed data:', data);
          
          // Send to import API
          const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data }),
          });
          
          const result = await response.json();
          
          if (response.ok) {
            if (result.results.errors.length > 0) {
              toast.error(`Import completed with errors. ${result.results.success} records imported, ${result.results.errors.length} failed. Check console for details.`);
              console.log('Import errors:', result.results.errors);
            } else {
              toast.success(result.message);
            }
          } else {
            toast.error(result.error || 'Import failed');
          }
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          const data = JSON.parse(content);
          
          const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data }),
          });
          
          const result = await response.json();
          
          if (response.ok) {
            if (result.results.errors.length > 0) {
              toast.error(`Import completed with errors. ${result.results.success} records imported, ${result.results.errors.length} failed. Check console for details.`);
              console.log('Import errors:', result.results.errors);
            } else {
              toast.success(result.message);
            }
          } else {
            toast.error(result.error || 'Import failed');
          }
        } else {
          toast.error('Unsupported file format. Please use CSV or JSON.');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="hidden md:block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your dashboard settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="profit-rate">Foodpanda Profit Rate</Label>
                <Input
                  id="profit-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.FP_PROFIT_RATE}
                  onChange={(e) => setSettings({ ...settings, FP_PROFIT_RATE: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Percentage of Foodpanda gross sales (0.70 = 70%)
                </p>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.CURRENCY}
                  onChange={(e) => setSettings({ ...settings, CURRENCY: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Currency code (e.g., PKR, USD)
                </p>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle>Import & Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Download Templates</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('sales')}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Sales CSV Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('expenses')}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Expenses CSV Template
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Import Data</h4>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="sales-import">Import Sales</Label>
                    <Input
                      id="sales-import"
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => handleFileUpload(e, 'sales')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenses-import">Import Expenses</Label>
                    <Input
                      id="expenses-import"
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => handleFileUpload(e, 'expenses')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Manual Backup</h4>
                  <p className="text-sm text-gray-500">
                    Download a complete backup of all your data (sales, expenses, settings)
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleBackup}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Restore Data</h4>
                  <p className="text-sm text-gray-500">
                    Upload a backup file to restore your data (skips duplicates)
                  </p>
                  <Label htmlFor="restore-file" className="sr-only">Restore Backup</Label>
                  <Input
                    id="restore-file"
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Automatic Backup Section */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Automatic Email Backups</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Automatic backups sent to haseeb.gbpk@gmail.com every 3 days
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleEnableAutoBackup}
                    disabled={autoBackupEnabled}
                  >
                    {autoBackupEnabled ? '✓ Enabled' : 'Enable Auto Backup'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDisableAutoBackup}
                    disabled={!autoBackupEnabled}
                  >
                    Disable
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTestBackup}
                  >
                    Send Test Backup
                  </Button>
                </div>
                {lastBackupDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last backup: {new Date(lastBackupDate).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
