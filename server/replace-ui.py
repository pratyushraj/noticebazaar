import re

with open('src/pages/CollabLinkLanding.tsx', 'r') as f:
    content = f.read()

# We want to replace the whole left column.
# Start text: <div className="w-full shrink-0 space-y-3 lg:space-y-5 z-10">
# End text: {/* RIGHT COLUMN - Offer Form */}

start_idx = content.find('<div className="w-full shrink-0 space-y-3 lg:space-y-5 z-10">')
end_idx = content.find('{/* RIGHT COLUMN - Offer Form */}')

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end block")
    exit(1)

replacement = """<div className="w-full shrink-0 z-10">
  <div className="flex flex-col items-center justify-center pt-8 pb-4">
    <div className="w-[100px] h-[100px] rounded-full overflow-hidden border border-slate-100 shadow-sm relative mb-4">
      {creator.profile_photo ? (
        <img src={creator.profile_photo} alt={displayCreatorName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-700 font-black text-3xl">
          {displayCreatorName.charAt(0)}
        </div>
      )}
      <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5">
        <VerificationBadge size="sm" />
      </div>
    </div>
    
    <h1 className="text-2xl font-black text-slate-900 mb-1">{displayCreatorName}</h1>
    <h2 className="text-[12px] font-black text-emerald-600 tracking-wider uppercase">@{normalizedHandle}</h2>
    
    <div className="flex justify-center flex-wrap gap-2 mt-4">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Typical Collab: {creator.collab_deal_preference === 'barter_only' ? 'Barter' : 'Paid'}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span className="text-[9px] font-black tracking-widest text-amber-700 uppercase">Fast Response</span>
      </div>
    </div>
  </div>

  {showPackagesSection && (
    <div className="mt-8 mb-12 w-full max-w-[500px] mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <h3 className="text-[20px] font-bold text-slate-900 leading-tight">Services</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select a package to start</p>
      </div>

      <div className="flex flex-col gap-5">
        {dealTemplates.map((template, idx) => {
          const isBarter = template.type === 'barter';
          const formatPrice = (p) => "₹" + p.toLocaleString('en-IN');
          
          return (
            <div key={template.id} className={cn(
              "rounded-[28px] p-5 sm:p-6 relative shadow-sm transition-all duration-200 hover:-translate-y-0.5",
              template.isPopular ? "border-2 border-emerald-500 bg-white" : "border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
            )}>
              {template.isPopular && (
                <div className="absolute -top-3 left-6 z-10">
                  <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-[18px] sm:text-[20px] font-black text-slate-900 leading-tight">{template.label}</h4>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border",
                  template.isPopular ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                )}>
                  {template.icon || '📦'}
                </div>
              </div>
              
              <p className="text-[14px] text-slate-500 font-medium mb-8 leading-relaxed max-w-[85%]">
                {template.description}
              </p>
              
              <div className="flex justify-between items-end mt-auto">
                <span className={cn(
                  "text-[22px] sm:text-[26px] font-black tracking-tight",
                  template.isPopular ? "text-emerald-500" : "text-slate-900"
                )}>
                  {isBarter ? "Barter" : formatPrice(template.budget)}
                </span>
                
                <button
                  onClick={() => {
                    handleTemplateSelect(template);
                    setCurrentStep(2);
                    scrollFormToTop();
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-bold text-[13px] transition-all active:scale-95 shadow-sm transform hover:-translate-y-0.5",
                    template.isPopular 
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  Select
                </button>
              </div>
            </div>
          );
        })}

        <button 
          onClick={() => {
            setCollabType('paid');
            setExactBudget('');
            setSelectedTemplateId(null);
            setCurrentStep(2);
            scrollFormToTop();
          }}
          className="w-full py-5 mt-4 rounded-[28px] border border-dashed border-slate-300 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:border-slate-400 hover:text-slate-500 transition-colors bg-white/40 active:scale-95 hover:bg-slate-50/50"
        >
          + Propose Custom Service
        </button>
      </div>

      <div className="mt-14 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">About Creator</p>
        <p className="text-[13px] font-semibold italic text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          "{formatFollowers(primaryFollowers)} Followers, 1 Following, 2,438 Posts"
        </p>
      </div>

      <div className="mt-16 text-center pb-12 border-t border-slate-100/80 pt-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400/60" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Secured by CreatorArmour</span>
        </div>
        <p className="text-[12px] font-medium text-slate-400/80 max-w-[240px] mx-auto leading-relaxed">
          By sending an offer, you agree to our standard terms and creator's specific rules.
        </p>
      </div>
    </div>
  )}

</div>
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open('src/pages/CollabLinkLanding.tsx', 'w') as f:
    f.write(new_content)

print("Successfully replaced layout via script")
