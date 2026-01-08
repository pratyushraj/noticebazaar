"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import { DealStage } from '@/components/creator-contracts/DealStatusBadge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DealKanbanProps {
  brandDeals: BrandDeal[] | undefined;
  onDealUpdate?: (dealId: string, newStatus: string) => void;
}

type KanbanColumn = {
  id: string;
  title: string;
  statuses: string[];
  stage: DealStage;
};

const columns: KanbanColumn[] = [
  { id: 'negotiating', title: 'Negotiating', statuses: ['Drafting'], stage: 'draft' },
  { id: 'signed', title: 'Signed', statuses: ['Approved'], stage: 'in_progress' },
  { id: 'delivered', title: 'Delivered', statuses: ['Payment Pending'], stage: 'review_pending' },
  { id: 'paid', title: 'Paid', statuses: ['Completed'], stage: 'completed' },
];

export const DealKanban: React.FC<DealKanbanProps> = ({ brandDeals, onDealUpdate }) => {
  const [draggedDeal, setDraggedDeal] = useState<BrandDeal | null>(null);
  const navigate = useNavigate();

  const dealsByColumn = useMemo(() => {
    const grouped: Record<string, BrandDeal[]> = {
      negotiating: [],
      signed: [],
      delivered: [],
      paid: [],
    };

    brandDeals?.forEach(deal => {
      const column = columns.find(col => col.statuses.includes(deal.status));
      if (column) {
        grouped[column.id].push(deal);
      }
    });

    return grouped;
  }, [brandDeals]);

  const handleDragStart = (deal: BrandDeal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-white/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-white/10');
  };

  const handleDrop = (e: React.DragEvent, targetColumn: KanbanColumn) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-white/10');

    if (!draggedDeal) return;

    // Don't allow dropping in the same column
    const currentColumn = columns.find(col => col.statuses.includes(draggedDeal.status));
    if (currentColumn?.id === targetColumn.id) {
      setDraggedDeal(null);
      return;
    }

    // Update deal status
    const newStatus = targetColumn.statuses[0];
    onDealUpdate?.(draggedDeal.id, newStatus);
    toast.success(`Moved ${draggedDeal.brand_name} to ${targetColumn.title}`);
    setDraggedDeal(null);
  };

  const getDealStage = (deal: BrandDeal): DealStage => {
    // Use canonical status mapping
    return getDealStageFromStatus(deal.status, deal.progress_percentage);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map(column => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 w-80 bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-2xl p-4"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-full">
                {dealsByColumn[column.id]?.length || 0}
              </span>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {dealsByColumn[column.id]?.map(deal => (
                <motion.div
                  key={deal.id}
                  draggable
                  onDragStart={() => handleDragStart(deal)}
                  className="cursor-move"
                  whileHover={{ scale: 1.02 }}
                  whileDrag={{ scale: 1.05, opacity: 0.8 }}
                >
                  <ProjectDealCard
                    deal={deal}
                    stage={getDealStage(deal)}
                    onView={(d) => navigate(`/creator-contracts/${d.id}`)}
                    onEdit={() => toast.info('Edit functionality coming soon')}
                    onManageDeliverables={() => toast.info('Deliverables management coming soon')}
                    onUploadContent={() => toast.info('Content upload coming soon')}
                    onContactBrand={() => navigate('/messages')}
                    onViewContract={async (d) => {
                      if (d.contract_file_url) {
                        window.open(d.contract_file_url, '_blank');
                      } else {
                        toast.info('No contract file available');
                      }
                    }}
                  />
                </motion.div>
              ))}
              {(!dealsByColumn[column.id] || dealsByColumn[column.id].length === 0) && (
                <div className="text-center py-8 text-white/40 text-sm">
                  No deals
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DealKanban;

