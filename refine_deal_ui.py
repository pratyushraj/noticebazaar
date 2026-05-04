import sys

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'r') as f:
    lines = f.readlines()

# 1. Update Campaign Brief default text
for i in range(len(lines)):
    if 'No description provided.' in lines[i]:
        lines[i] = lines[i].replace('No description provided.', 'Ensure high-quality lighting, no competitor branding, and a clear product focus in your content.')

# 2. Add gradient overlay to deal hero image
for i in range(len(lines)):
    if 'resolveCreatorDealProductImage(selectedItem)' in lines[i] and '<img' in lines[i]:
        # Wrap img in relative div if not already, and add overlay
        if 'className="absolute inset-0 bg-gradient-to-t' not in lines[i]:
            lines[i] = lines[i].replace('<img', '<div className="relative w-full h-full"><img')
            lines[i] = lines[i].replace('/>', '/><div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14]/80 via-transparent to-transparent pointer-events-none" /></div>')

# 3. Consolidate Security/Protection Sections
# We will search for the "Payment Protection" section and merge it with legal.
# We'll also remove the old legal section.

new_content = "".join(lines)

# Find the start of Payment Protection
p_start = new_content.find('PAYMENT PROTECTION')
if p_start != -1:
    # Find the container start (usually <div className="mb-8"> or similar before it)
    div_start = new_content.rfind('<div', 0, p_start)
    # Find the end of the next section (LEGAL PROTECTION)
    l_end = new_content.find('LEGAL PROTECTION')
    if l_end != -1:
        legal_container_end = new_content.find('</div>', new_content.find('Full dispute protection & legal mediation', l_end)) + 6
        # Replace the whole block with a unified "Verified Security" card
        unified_security = """
                                            <div className="mb-10">
                                                <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-4 opacity-50 px-1", textColor)}>Verified Protection</h4>
                                                <div className={cn("rounded-[28px] border p-6 relative overflow-hidden", isDark ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100")}>
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", isDark ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-emerald-600 text-white shadow-emerald-600/10")}>
                                                            <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-[15px] font-black tracking-tight", textColor)}>Security & Legal Shield</p>
                                                            <p className={cn("text-[11px] font-bold opacity-50", textColor)}>Managed by Creator Armour</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {[
                                                            { icon: '💰', text: 'Escrow Protection Active', desc: 'Brand payment is already secured by platform' },
                                                            { icon: '📜', text: 'Legally Binding Contract', desc: 'Auto-generated contract protecting your rights' },
                                                            { icon: '⚖️', text: 'Dispute & Mediation', desc: '72h Auto-release & full mediation support' }
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-start gap-3">
                                                                <span className="text-[14px] mt-0.5">{item.icon}</span>
                                                                <div>
                                                                    <p className={cn("text-[12px] font-bold", textColor)}>{item.text}</p>
                                                                    <p className={cn("text-[10px] opacity-40 font-bold", textColor)}>{item.desc}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
"""
        # Slice it out
        prefix = new_content[:div_start]
        # Find the real end of the protection section
        real_end = new_content.find('</div>', new_content.find('Full dispute protection & legal mediation'))
        # Search deeper for the parent div closure
        real_end = new_content.find('</div>', real_end + 6) + 6
        
        suffix = new_content[real_end:]
        new_content = prefix + unified_security + suffix

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'w') as f:
    f.write(new_content)
