"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit, IndianRupee, FileText, ReceiptText, Trash2 } from 'lucide-react';
import { BrandDeal } from '@/types';

interface DealActionsMenuProps {
  deal: BrandDeal;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onMarkPaid: (deal: BrandDeal) => void;
  onDelete: (deal: BrandDeal) => void;
  isDeleting?: boolean;
}

const DealActionsMenu: React.FC<DealActionsMenuProps> = ({
  deal,
  onView,
  onEdit,
  onMarkPaid,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
        <DropdownMenuItem 
          onClick={() => onView(deal)}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onEdit(deal)}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Deal
        </DropdownMenuItem>
        {deal.contract_file_url && (
          <DropdownMenuItem asChild>
            <a
              href={deal.contract_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer hover:bg-accent/50"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Contract
            </a>
          </DropdownMenuItem>
        )}
        {deal.invoice_file_url && (
          <DropdownMenuItem asChild>
            <a
              href={deal.invoice_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer hover:bg-accent/50"
            >
              <ReceiptText className="mr-2 h-4 w-4" />
              View Invoice
            </a>
          </DropdownMenuItem>
        )}
        {deal.status === 'Payment Pending' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onMarkPaid(deal)}
              className="cursor-pointer hover:bg-green-500/10 text-green-400"
            >
              <IndianRupee className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(deal)}
          disabled={isDeleting}
          className="cursor-pointer hover:bg-destructive/10 text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Deal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DealActionsMenu;

