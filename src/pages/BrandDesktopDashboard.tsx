import React from 'react';
import { motion } from 'framer-motion';
import {
    Search, Bell, User, Plus, FileText, CheckCircle2,
    Clock, AlertCircle, TrendingUp, Filter, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrandDesktopDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">

            {/* Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 8.216c-3.111.96-6.666 1.838-10.592 1.838-5.333 0-10.37-.878-13.408-2.676v.053c0 6.666 4.667 9.889 10.963 9.889 4.333 0 8.703-1.89 13.037-5.592v-3.512z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-[14px] font-bold text-slate-900 leading-tight">Nike India</h1>
                            <p className="text-[11px] text-slate-500 font-medium">Creator Partnerships</p>
                        </div>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        <button className="px-3 py-1.5 text-[13px] font-bold text-slate-900 bg-slate-100 rounded-md">Pipeline</button>
                        <button className="px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Payments</button>
                        <button className="px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Creators</button>
                        <button className="px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Analytics</button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative hidden lg:block w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="Find a creator or deal..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                            <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-slate-200" />

                    <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>

                    <button className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <User className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-6 py-8">

                {/* Header & Primary Action */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Partnership Pipeline</h2>
                        <p className="text-[14px] text-slate-500 mt-1">Manage and execute active creator deals.</p>
                    </div>

                    <button className="bg-[#0F172A] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold shadow-[0_4px_12px_rgba(15,23,42,0.15)] flex items-center gap-2 hover:bg-slate-800 transition-colors">
                        <Plus className="w-4 h-4" strokeWidth={3} /> Send New Offer
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">

                    {/* Left Column: Pipeline Table */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">

                        {/* Filters */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-md text-[13px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5 hover:bg-slate-50">
                                    <Filter className="w-3.5 h-3.5" /> All Stages
                                </button>
                                <button className="px-3 py-1.5 border border-transparent text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                    Needs Action <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">2</span>
                                </button>
                                <button className="px-3 py-1.5 border border-transparent text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                    Active <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">8</span>
                                </button>
                            </div>
                        </div>

                        {/* Pipeline Table */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-5 py-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Creator</th>
                                        <th className="px-5 py-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                                        <th className="px-5 py-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                                        <th className="px-5 py-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                                        <th className="px-5 py-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">

                                    {/* Row 1: Needs Action */}
                                    <tr className="hover:bg-slate-50/50 transition-colors bg-orange-50/30">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src="https://i.pravatar.cc/150?img=47" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                                                <div>
                                                    <div className="text-[14px] font-bold text-slate-900">@thebloomingmiss</div>
                                                    <div className="text-[12px] text-slate-500">1 Instagram Reel</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100/50 border border-orange-200">
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                <span className="text-[12px] font-bold text-orange-700">Countered</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[13px] font-medium text-slate-700">Needs Review</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Updated 2h ago</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[14px] font-bold text-slate-900">₹85,000</div>
                                            <div className="text-[11px] text-slate-400 line-through">₹70,000</div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-slate-50 shadow-sm">
                                                Review
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Row 2: Payment Pending */}
                                    <tr className="hover:bg-slate-50/50 transition-colors bg-blue-50/30">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[14px]">📸</div>
                                                <div>
                                                    <div className="text-[14px] font-bold text-slate-900">@techninja</div>
                                                    <div className="text-[12px] text-slate-500">YouTube Deep-Dive</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/50 border border-blue-200">
                                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-[12px] font-bold text-blue-700">Payment Due</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1">Oct 12 <span className="text-red-500 text-[11px] font-bold">(Tomorrow)</span></div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[14px] font-bold text-slate-900">₹45,000</div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="bg-[#0F172A] text-white px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-slate-800 shadow-sm shadow-slate-900/10 border border-slate-900">
                                                Fund Escrow
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Row 3: Accepted */}
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src="https://i.pravatar.cc/150?img=12" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                                                <div>
                                                    <div className="text-[14px] font-bold text-slate-900">@stylewithme</div>
                                                    <div className="text-[12px] text-slate-500">2x Stories + 1 Post</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/50 border border-emerald-200">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[12px] font-bold text-emerald-700">Accepted</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[13px] font-medium text-slate-700">Oct 20</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[14px] font-bold text-slate-900">₹30,000</div>
                                            <div className="text-[11px] text-emerald-600 font-bold">Funded</div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors inline-block">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Row 4: Offer Sent */}
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[14px]">🎮</div>
                                                <div>
                                                    <div className="text-[14px] font-bold text-slate-900">@gamerguy</div>
                                                    <div className="text-[12px] text-slate-500">Twitch Stream Integration</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white">
                                                <div className="w-2 h-2 rounded-full border-2 border-slate-400" />
                                                <span className="text-[12px] font-bold text-slate-600">Sent</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[13px] font-medium text-slate-700">Nov 01</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[14px] font-bold text-slate-900">₹1,20,000</div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-[12px] text-slate-500 font-medium">Waiting...</span>
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        </div>

                    </div>

                    {/* Right Column: System Nudges & Metrics */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">

                        {/* Financial Snapshot */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">Financial Overview</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] font-medium text-slate-600">In Escrow</span>
                                        <span className="text-[13px] font-bold text-slate-900">₹75,000</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] font-medium text-slate-600">Pending Payments</span>
                                        <span className="text-[13px] font-bold text-red-600">₹45,000</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-5 py-2 text-[12px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                                View Invoices
                            </button>
                        </div>

                        {/* Recent Activity / Nudges */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-4">Activity Log</h3>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <FileText className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] text-slate-900"><span className="font-bold">@thebloomingmiss</span> countered your offer.</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">2 hours ago</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] text-slate-900"><span className="font-bold">@stylewithme</span> accepted the terms.</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Yesterday</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertCircle className="w-3 h-3 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] text-slate-900">Payment due for <span className="font-bold">@techninja</span>.</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Required before Oct 12</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
};

export default BrandDesktopDashboard;
