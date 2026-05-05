import React from 'react';
import { 
  ShieldCheck, 
  MoreVertical, 
  Zap, 
  Eye, 
  Trash2, 
  Ban,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminDealsTableProps {
  deals: any[];
  onForceApprove: (id: string) => void;
  onViewDetails?: (deal: any) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string, color: string, pulse?: boolean }> = {
    'DRAFT': { label: 'Draft', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    'OFFER_SENT': { label: 'Offer Sent', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'AGREEMENT_PENDING': { label: 'Pending Sign', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', pulse: true },
    'CONTENT_MAKING': { label: 'In Production', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    'CONTENT_DELIVERED': { label: 'Delivered', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', pulse: true },
    'CONTENT_APPROVED': { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    'PAYMENT_RELEASED': { label: 'Paid', color: 'bg-emerald-500 text-white border-emerald-400' },
    'DISPUTED': { label: 'Disputed', color: 'bg-red-500/10 text-red-400 border-red-500/20', pulse: true },
    'CANCELLED': { label: 'Cancelled', color: 'bg-slate-700/30 text-slate-500 border-slate-700/50' },
  };

  const { label, color, pulse } = config[status.toUpperCase()] || { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit",
      color
    )}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {label}
    </span>
  );
};

export const AdminDealsTable: React.FC<AdminDealsTableProps> = ({ deals, onForceApprove, onViewDetails }) => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Deal Info</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Creator</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Value</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {deals?.map((deal) => (
              <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div>
                    <p className="text-xs font-black text-blue-400 mb-1">#{deal.id.split('-')[0]}</p>
                    <p className="text-sm font-bold text-white">{deal.brand_name || 'Generic Deal'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{format(new Date(deal.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                      {deal.creator?.profile_photo ? (
                        <img src={deal.creator.profile_photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        deal.creator?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">@{deal.creator?.username}</p>
                      <p className="text-xs text-slate-500">{deal.creator?.first_name} {deal.creator?.last_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-sm font-black text-emerald-400">₹{(deal.deal_amount || 0).toLocaleString()}</p>
                    {deal.shipping_required && (
                      <p className="text-[10px] text-amber-500 font-bold uppercase mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" /> Shipping
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-200">
                        <DropdownMenuLabel>Deal Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => onViewDetails?.(deal)} className="focus:bg-white/5 cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Open Contract
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        {deal.status === 'CONTENT_DELIVERED' && (
                          <DropdownMenuItem 
                            onClick={() => onForceApprove(deal.id)}
                            className="text-emerald-400 focus:bg-emerald-500/10 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" /> Force Approve
                          </DropdownMenuItem>
                        )}
                        
                        {['ACTIVE', 'CONTENT_MAKING', 'CONTENT_DELIVERED', 'DISPUTED'].includes(deal.status.toUpperCase()) && (
                          <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 cursor-pointer">
                            <Ban className="w-4 h-4 mr-2" /> Cancel Deal
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
