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
import { MoreVertical, Eye, Edit, FileText, Package, Upload, MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { BrandDeal } from '@/types';
import { useNavigate } from 'react-router-dom';

interface DealActionsMenuProps {
  deal: BrandDeal;
  onView: (deal: BrandDeal) => void;
  onEdit: (deal: BrandDeal) => void;
  onManageDeliverables?: (deal: BrandDeal) => void;
  onUploadContent?: (deal: BrandDeal) => void;
  onContactBrand?: (deal: BrandDeal) => void;
  onViewContract?: (deal: BrandDeal) => void;
  onDelete: (deal: BrandDeal) => void;
  isDeleting?: boolean;
}

const DealActionsMenu: React.FC<DealActionsMenuProps> = ({
  deal,
  onView,
  onEdit,
  onManageDeliverables,
  onUploadContent,
  onContactBrand,
  onViewContract,
  onDelete,
  isDeleting = false,
}) => {
  const navigate = useNavigate();

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
      <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
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
        {deal.contract_file_url && onViewContract && (
          <DropdownMenuItem 
            onClick={() => onViewContract(deal)}
            className="cursor-pointer hover:bg-accent/50"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Contract
          </DropdownMenuItem>
        )}
        {onManageDeliverables && (
          <DropdownMenuItem 
            onClick={() => onManageDeliverables(deal)}
            className="cursor-pointer hover:bg-accent/50"
          >
            <Package className="mr-2 h-4 w-4" />
            Manage Deliverables
          </DropdownMenuItem>
        )}
        {onUploadContent && (
          <DropdownMenuItem 
            onClick={() => onUploadContent(deal)}
            className="cursor-pointer hover:bg-accent/50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Content
          </DropdownMenuItem>
        )}
        {onContactBrand && (
          <DropdownMenuItem 
            onClick={() => onContactBrand(deal)}
            className="cursor-pointer hover:bg-accent/50"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Brand
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate('/creator-payments')}
          className="cursor-pointer hover:bg-blue-500/10 text-blue-400"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Payment Status
        </DropdownMenuItem>
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

