'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange, DateRangeKind, getDateRange } from '@/lib/date-utils';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const quickFilters: { label: string; kind: DateRangeKind }[] = [
  { label: 'Today', kind: 'today' },
  { label: 'Yesterday', kind: 'yesterday' },
  { label: 'This Week', kind: 'thisWeek' },
  { label: 'Last Week', kind: 'lastWeek' },
  { label: 'This Month', kind: 'thisMonth' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const handleQuickFilter = (kind: DateRangeKind) => {
    const range = getDateRange(kind);
    onChange(range);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const range = getDateRange('custom', 
        format(customStart, 'yyyy-MM-dd'), 
        format(customEnd, 'yyyy-MM-dd')
      );
      onChange(range);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.kind}
            variant={value.kind === filter.kind ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter(filter.kind)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value.start && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.start && value.end ? (
              `${format(new Date(value.start), 'MMM dd, yyyy')} - ${format(new Date(value.end), 'MMM dd, yyyy')}`
            ) : (
              'Pick a date range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Calendar
                      mode="single"
                      selected={customStart}
                      onSelect={setCustomStart}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Calendar
                      mode="single"
                      selected={customEnd}
                      onSelect={setCustomEnd}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCustomRange}
                  disabled={!customStart || !customEnd}
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
