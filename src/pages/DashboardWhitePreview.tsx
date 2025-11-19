import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, IndianRupee, CheckCircle, AlertTriangle, ChevronRight, ArrowRight, DollarSign } from "lucide-react";

/**
 * White SaaS Dashboard Preview
 * Minimal black/white/gray palette inspired by Linear, Stripe, Vercel
 */
export default function DashboardWhitePreview() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 antialiased p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            White SaaS Dashboard Preview
          </h1>
          <p className="text-sm text-gray-600">
            Minimal black/white/gray palette — Linear × Stripe × Vercel style
          </p>
        </div>

        {/* Earnings Card - White Style */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[15px] font-semibold text-gray-900 tracking-tight">
                This Month's Earnings
              </CardTitle>
              <button className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors font-medium active:scale-[0.97] flex items-center gap-1">
                View Breakdown
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                ₹2,85,700
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <div className="flex items-center gap-1 font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>₹30,500 (12%)</span>
                </div>
                <span className="text-gray-500">vs last month</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-gray-600">Monthly Goal Progress</span>
                <span className="text-gray-900 font-semibold">82% of ₹3,50,000 goal</span>
              </div>
              <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 h-full rounded-full bg-gray-900"
                  style={{ width: '82%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention - White Style */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <AlertTriangle className="w-4 h-4 text-gray-700" />
                </div>
                Needs Your Attention
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                  1
                </span>
              </CardTitle>
              <button className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors font-medium active:scale-[0.97]">
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900">
                      boAt • Payment Overdue
                    </h3>
                    <p className="text-[13px] text-gray-600 mt-0.5">
                      Due since: 9 days
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                  Overdue
                </span>
              </div>
              <div className="text-[14px] text-gray-700 leading-relaxed space-y-1.5">
                <p>₹12,000 • Instagram</p>
                <p className="text-[13px] text-gray-600">
                  Due Date: 9 Nov 2025
                </p>
                <p className="text-[12px] text-gray-500 mt-2">
                  Last reminder sent: 5 days ago
                </p>
              </div>
              <div className="space-y-2 pt-1">
                <button className="w-full py-3 rounded-[12px] bg-gray-900 text-white font-semibold text-[15px] active:scale-[0.97] active:opacity-80 transition-all duration-150">
                  Send Reminder
                </button>
                <button className="w-full py-3 rounded-[12px] bg-gray-100 text-gray-700 font-semibold text-[15px] active:scale-[0.97] active:opacity-80 transition-all duration-150 border border-gray-200">
                  Escalate
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments - White Style */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent>
            <div className="flex items-center justify-between mb-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <IndianRupee className="h-5 w-5 text-gray-700" />
                </div>
                <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Payments</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="text-[12px] text-gray-500">
                Pending (5) • Due Soon (1)
              </div>
              <div className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
                ₹73,754
              </div>
              <div className="text-[14px] text-gray-600 tracking-tight mt-2">
                Zepto. Nike. Mamaearth
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines - White Style */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <Calendar className="w-4 h-4 text-gray-700" />
                </div>
                Coming Up
              </CardTitle>
              <button className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors font-medium active:scale-[0.97]">
                View Calendar →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {/* Deadline Item 1 */}
              <div className="flex gap-3 p-3.5 rounded-[12px] border border-gray-200 hover:bg-gray-50 active:bg-gray-50 transition-all duration-150 cursor-pointer group bg-white">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-[12px] shrink-0 border border-gray-300 bg-gray-50">
                  <div className="text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700">
                    NOV
                  </div>
                  <div className="text-[20px] font-bold leading-tight tracking-tight mt-0.5 text-gray-900">
                    21
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900 mb-1 leading-tight tracking-[-0.2px]">
                    Ajio payment due
                  </div>
                  <div className="text-[12px] text-gray-600 leading-relaxed font-medium">
                    General • 2 days left
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
              </div>

              {/* Deadline Item 2 */}
              <div className="flex gap-3 p-3.5 rounded-[12px] border border-gray-200 hover:bg-gray-50 active:bg-gray-50 transition-all duration-150 cursor-pointer group bg-white">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-[12px] shrink-0 border border-gray-300 bg-gray-50">
                  <div className="text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700">
                    NOV
                  </div>
                  <div className="text-[20px] font-bold leading-tight tracking-tight mt-0.5 text-gray-900">
                    29
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900 mb-1 leading-tight tracking-[-0.2px]">
                    Nike payment due
                  </div>
                  <div className="text-[12px] text-gray-600 leading-relaxed font-medium">
                    General • 10 days left
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
              </div>

              {/* Deadline Item 3 */}
              <div className="flex gap-3 p-3.5 rounded-[12px] border border-gray-200 hover:bg-gray-50 active:bg-gray-50 transition-all duration-150 cursor-pointer group bg-white">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-[12px] shrink-0 border border-gray-300 bg-gray-50">
                  <div className="text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-700">
                    DEC
                  </div>
                  <div className="text-[20px] font-bold leading-tight tracking-tight mt-0.5 text-gray-900">
                    3
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900 mb-1 leading-tight tracking-[-0.2px]">
                    Zepto payment due
                  </div>
                  <div className="text-[12px] text-gray-600 leading-relaxed font-medium">
                    General • 14 days left
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns - White Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="relative z-10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                <CardTitle className="text-gray-900">Active Campaigns</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-semibold text-gray-900 tracking-tight">1 running</div>
              <div className="text-[13px] text-gray-600">
                2 deliverables due in 5 days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="relative z-10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <CheckCircle className="h-5 w-5 text-gray-700" />
                </div>
                <CardTitle className="text-gray-900">Completed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-semibold text-gray-900 tracking-tight">0 this month</div>
              <div className="text-[13px] text-gray-600">
                100% on-time rate
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Cards - White Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                Weekly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600 text-[13px]">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Brand Inquiries</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">+5</p>
                <p className="text-[12px] text-gray-500">this week</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600 text-[13px]">
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span>Est. Incoming</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">₹74k</p>
                <p className="text-[12px] text-gray-500">pending payments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gray-100">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
                Brand Interest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">78/100</div>
                  <div className="text-[13px] text-gray-600 mt-1">Good — Brands trust you</div>
                </div>
                <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-gray-900 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">78</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This is a preview of the minimal white/black/gray palette applied across the dashboard.
            All components use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">bg-white</code>, <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">border-gray-200</code>, and <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">text-gray-900</code> for a clean, professional SaaS look.
          </p>
        </div>
      </div>
    </div>
  );
}

