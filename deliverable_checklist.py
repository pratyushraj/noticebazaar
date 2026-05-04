import sys

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'r') as f:
    content = f.read()

# Refine Deliverables to Checklist Style
old_deliverable_block_start = 'items.map((d, i) => ('
# This is tricky because it's in a map. I'll replace the JSX inside the map.

old_jsx = """                                                        <div key={i} className={cn(
                                                            "px-4 py-3.5 rounded-[20px] border flex items-center gap-3.5 transition-all duration-300",
                                                            isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-200"
                                                        )}>
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                                                d.type === 'reel' ? "bg-gradient-to-br from-purple-500/80 to-indigo-600/80 text-white" : 
                                                                d.type === 'story' ? "bg-gradient-to-br from-orange-400/80 to-rose-500/80 text-white" : 
                                                                "bg-gradient-to-br from-blue-400/80 to-cyan-500/80 text-white"
                                                            )}>
                                                                {d.type === 'reel' ? <Film className="w-3.5 h-3.5" /> : 
                                                                 d.type === 'story' ? <Smartphone className="w-3.5 h-3.5" /> : 
                                                                 <FileText className="w-3.5 h-3.5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("text-[13px] font-black leading-tight tracking-tight", textColor)}>{d.label}</p>
                                                                <p className={cn("text-[11px] font-bold opacity-40 mt-0.5", textColor)}>{d.count} {d.count === 1 ? 'piece' : 'pieces'}</p>
                                                            </div>
                                                            <div className={cn(
                                                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                                                                isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-100"
                                                            )}>Pending</div>
                                                        </div>"""

new_jsx = """                                                        <div key={i} className={cn(
                                                            "px-5 py-4 rounded-[24px] border flex items-center gap-4 group transition-all duration-300",
                                                            isDark ? "bg-[#0B0F14] border-white/5 active:border-info/30" : "bg-white border-slate-200 shadow-sm active:border-info/30"
                                                        )}>
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 relative",
                                                                d.type === 'reel' ? "bg-purple-500/10 text-purple-400" : 
                                                                d.type === 'story' ? "bg-rose-500/10 text-rose-400" : 
                                                                "bg-blue-500/10 text-blue-400"
                                                            )}>
                                                                {d.type === 'reel' ? <Film className="w-5 h-5" /> : 
                                                                 d.type === 'story' ? <Smartphone className="w-5 h-5" /> : 
                                                                 <FileText className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("text-[14px] font-black tracking-tight", textColor)}>{d.label}</p>
                                                                <p className={cn("text-[11px] font-bold opacity-40 uppercase tracking-widest", textColor)}>{d.count} Required</p>
                                                            </div>
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                isDark ? "border-white/10" : "border-slate-200"
                                                            )}>
                                                                <div className="w-2 h-2 rounded-full bg-info/40 animate-pulse" />
                                                            </div>
                                                        </div>"""

# Replace with regex or direct string if possible. 
# The string replacement is safer if the whitespace is exactly matching.
# I'll use a more flexible search for the map inner content.

import re
pattern = re.escape(old_jsx).replace(r'\ ', r'\s*')
content = re.sub(pattern, new_jsx, content, flags=re.MULTILINE)

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'w') as f:
    f.write(content)
