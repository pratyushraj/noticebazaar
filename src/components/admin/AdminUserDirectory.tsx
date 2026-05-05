import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  MoreVertical,
  Ban,
  UserCheck
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

interface AdminUserDirectoryProps {
  users: any[];
  onVerify?: (id: string) => void;
  onSuspend?: (id: string) => void;
}

export const AdminUserDirectory: React.FC<AdminUserDirectoryProps> = ({ users, onVerify, onSuspend }) => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Joined</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                      {u.profile_photo ? (
                        <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        @{u.username}
                        {u.upi_verified_at && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    u.role === 'creator' ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm text-slate-400">
                  {format(new Date(u.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    {u.onboarding_complete ? (
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-tight">
                        <CheckCircle2 className="w-3 h-3" /> Onboarded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black uppercase tracking-tight">
                        <Clock className="w-3 h-3" /> Incomplete
                      </span>
                    )}
                    {u.upi_verified_at ? (
                      <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-black uppercase tracking-tight">
                        <ShieldCheck className="w-3 h-3" /> KYC Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-tight">
                        <ShieldAlert className="w-3 h-3" /> No KYC
                      </span>
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
                        <DropdownMenuLabel>User Management</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                          <ChevronRight className="w-4 h-4 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                          <Users className="w-4 h-4 mr-2" /> View Deals
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        {!u.upi_verified_at && (
                          <DropdownMenuItem 
                            onClick={() => onVerify?.(u.id)}
                            className="text-emerald-400 focus:bg-emerald-500/10 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4 mr-2" /> Force Verify KYC
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => onSuspend?.(u.id)}
                          className="text-red-400 focus:bg-red-500/10 cursor-pointer"
                        >
                          <Ban className="w-4 h-4 mr-2" /> Suspend Account
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
