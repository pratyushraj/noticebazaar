const fs = require('fs');
const content = fs.readFileSync('src/pages/CollabLinkLanding.tsx', 'utf8');

const regex = /(<div className="w-full shrink-0 space-y-3 lg:space-y-5 z-10">)[\s\S]*?(?=\{\/\* RIGHT COLUMN - Step Form \*\/})/m;

const replacement = `$1
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
    <div className="mt-6 mb-8 w-full max-w-sm mx-auto px-4">
      <div className="mb-5">
        <h3 className="text-[18px] font-bold text-slate-900">Services</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Select a package to start</p>
      </div>

      <div className="flex flex-col gap-4">
        {dealTemplates.map((template, idx) => {
          const isBarter = template.type === 'barter';
          const formatPrice = (p) => "₹" + p.toLocaleString('en-IN');
          
          return (
            <div key={template.id} className={cn(
              "rounded-[24px] p-5 relative shadow-sm transition-all duration-200 hover:-translate-y-0.5",
              template.isPopular ? "border-2 border-emerald-500" : "border border-slate-100 bg-white"
            )}>
              {template.isPopular && (
                <div className="absolute -top-3 left-6 z-10">
                  <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-2 pt-1">
                <h4 className="text-[17px] font-black text-slate-900 leading-tight">{template.label}</h4>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border",
                  template.isPopular ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100 text-slate-600"
                )}>
                  {template.icon || '📦'}
                </div>
              </div>
              
              <p className="text-[13px] text-slate-500 font-medium mb-6 leading-snug">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className={cn(
                  "text-[20px] font-black tracking-tight",
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
                    "px-6 py-2.5 rounded-full font-bold text-[13px] transition-colors active:scale-95",
                    template.isPopular 
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm" 
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
          className="w-full py-4 mt-2 rounded-[24px] border border-dashed border-slate-300 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-slate-400 hover:text-slate-500 transition-colors bg-white/50 active:scale-95"
        >
          + Propose Custom Service
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">About Creator</p>
        <p className="text-[12px] font-semibold italic text-slate-400 max-w-[260px] mx-auto leading-relaxed">
          "{formatFollowers(primaryFollowers)} Followers, 1 Following, 2,438 Posts"
        </p>
      </div>

      <div className="mt-14 text-center pb-8 border-t border-slate-100/60 pt-8">
        <div className="flex items-center justify-center gap-1.5 mb-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Secured by CreatorArmour</span>
        </div>
        <p className="text-[11px] font-medium text-slate-400/60 max-w-[200px] mx-auto leading-relaxed">
          By sending an offer, you agree to our standard terms and creator's specific rules.
        </p>
      </div>
    </div>
  )}

</div>
`;

const updatedContent = content.replace(regex, replacement);
fs.writeFileSync('src/pages/CollabLinkLanding.tsx', updatedContent);
console.log('Successfully replaced layout!');
