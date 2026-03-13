import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Image as ImageIcon, 
  Search, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionCard } from '@/components/ui/card-variants';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const SeoDashboard: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const stats = [
    { label: 'Overall SEO Score', value: '92', color: 'text-emerald-500', icon: ShieldCheck },
    { label: 'Site Health', value: 'Excellent', color: 'text-blue-500', icon: Globe },
    { label: 'Page Speed', value: 'Mobile: 88%', color: 'text-orange-500', icon: Zap },
    { label: 'Indexed Pages', value: '1,240', color: 'text-purple-500', icon: Search },
  ];

  const coreWebVitals = [
    { label: 'Large Contentful Paint (LCP)', value: '1.2s', status: 'Good', progress: 95, icon: <Clock className="w-4 h-4 text-emerald-500" /> },
    { label: 'First Input Delay (FID)', value: '12ms', status: 'Good', progress: 98, icon: <Zap className="w-4 h-4 text-emerald-500" /> },
    { label: 'Cumulative Layout Shift (CLS)', value: '0.02', status: 'Good', progress: 94, icon: <BarChart3 className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <div className={cn(
      "min-h-screen p-6 transition-colors duration-300",
      isDark ? "bg-[#030303] text-white" : "bg-slate-50 text-slate-900"
    )}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">SEO Dashboard</h1>
            <p className={cn("text-sm font-semibold mt-1", isDark ? "text-white/40" : "text-slate-500")}>
              Performance metrics & Core Web Vitals monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-dashed font-black uppercase text-[10px] tracking-widest">
              Export Report
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              Run Audit
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-5 rounded-2xl border transition-all hover:shadow-xl group",
                isDark ? "bg-white/[0.03] border-white/5 hover:border-white/10" : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-xl bg-opacity-10", stat.color.replace('text', 'bg'))}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-4">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.15em]", isDark ? "text-white/30" : "text-slate-400")}>
                  {stat.label}
                </p>
                <p className="text-2xl font-black mt-1 tabular-nums">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Core Web Vitals & Image Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SectionCard
            title="Core Web Vitals"
            subtitle="7-day rolling average"
            icon={<Zap className="w-4 h-4 text-emerald-400" />}
            variant="tertiary"
          >
            <div className="space-y-6 mt-4">
              {coreWebVitals.map((v) => (
                <div key={v.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {v.icon}
                      <span className="text-xs font-black uppercase tracking-widest">{v.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{v.value}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">
                        {v.status}
                      </span>
                    </div>
                  </div>
                  <Progress value={v.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Image Performance"
            subtitle="Optimization & delivery status"
            icon={<ImageIcon className="w-4 h-4 text-blue-400" />}
            variant="tertiary"
          >
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Optimized Images</p>
                <p className="text-2xl font-black mt-1">98.2%</p>
                <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[98%]" />
                </div>
              </div>
              <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">WebP Adoption</p>
                <p className="text-2xl font-black mt-1">85%</p>
                <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]" />
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold">Lazy loading implemented on all listing images</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase">Verify</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold">3 images missing explicit width/height attributes</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase">Fix</Button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer Note */}
        <div className={cn(
          "p-6 rounded-3xl border border-dashed flex items-center gap-4",
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-white"
        )}>
          <div className="p-3 rounded-2xl bg-primary/10">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest">SEO Heartbeat Integration</p>
            <p className={cn("text-xs font-medium mt-1", isDark ? "text-white/40" : "text-slate-500")}>
              This dashboard is currently displaying static metrics. Connecting your SEO-heartbeat background workers will enable real-time tracking of Core Web Vitals and image-loading efficiency.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SeoDashboard;
