"use client";

import React, { useState } from 'react';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToJSON } from '@/utils/export';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: {
    earnings?: number;
    payments?: Array<{
      brand: string;
      amount: number;
      date: string;
      status: string;
    }>;
    deals?: Array<{
      brand: string;
      amount: number;
      status: string;
      date: string;
    }>;
  };
  className?: string;
}

export function ExportButton({ data, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        exportToCSV(data, 'dashboard-export');
      } else {
        exportToJSON(data, 'dashboard-export');
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className={className}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0F121A] border-white/10">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          className="cursor-pointer hover:bg-white/10 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('json')}
          className="cursor-pointer hover:bg-white/10 text-white"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

