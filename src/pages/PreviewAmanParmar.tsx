import { useMemo, useState } from "react";

type EligibilityForm = {
  name: string;
  businessName: string;
  monthlyTurnover: string;
  existingLoan: string;
  requiredAmount: string;
  phone: string;
};

const PreviewAmanParmar = () => {
  const [formData, setFormData] = useState<EligibilityForm>({
    name: "",
    businessName: "",
    monthlyTurnover: "",
    existingLoan: "",
    requiredAmount: "",
    phone: "",
  });

  const stats = useMemo(
    () => [
      { label: "Raised", value: "₹128+ Cr" },
      { label: "MSMEs Funded", value: "538+" },
      { label: "Avg Approval Time", value: "45 Days" },
      { label: "Success Rate", value: "82%" },
    ],
    []
  );

  const offerings = [
    "Working Capital Loans",
    "Machinery Loans",
    "CC Limit Enhancement",
    "Startup Debt",
    "Project Financing",
  ];

  const idealFor = [
    "GST Businesses",
    "1+ Year Vintage",
    "₹25L+ Revenue",
    "Expansion / Machinery / Cashflow Needs",
  ];

  const timeline = [
    "Week 1: Eligibility Mapping",
    "Week 2-3: Structuring",
    "Week 4-8: Bank Submission",
    "Week 6-12: Sanction",
  ];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("[preview/aman-parmar] eligibility-submit", formData);
  };

  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#11142a] px-4 py-2 text-center text-xs font-medium tracking-wide text-amber-200">
        Preview Version - Not Final Website
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#1f2a5f_0%,#121633_35%,#090c1a_100%)] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                Funding Strategy Desk
              </p>
              <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
                Get ₹50L - ₹5Cr Business Funding Without Collateral Delays
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-200/85 sm:text-base">
                Govt Schemes | Bank Loans | Strategic Debt Structuring
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:from-cyan-300 hover:to-blue-400">
                  Check Eligibility
                </button>
                <button className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  See Success Stories
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(145deg,#263678_0%,#18204a_55%,#0e1634_100%)] p-6 min-h-[220px] flex items-end">
                <p className="text-sm text-cyan-100/90">Strategic Debt & MSME Funding Advisory</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4">
                <p className="text-lg font-semibold text-white">Aman Parmar</p>
                <p className="text-sm text-slate-300">Revenue Head, Satya Support Pvt. Ltd.</p>
                <p className="mt-3 text-sm text-cyan-100">📞 +91 63582 59021</p>
                <p className="text-sm text-cyan-100">✉️ amanparmar@satyasupport.co.in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-black/25 p-4 text-center">
              <p className="text-lg font-bold text-cyan-200 sm:text-2xl">{item.value}</p>
              <p className="mt-1 text-xs text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">What You Can Get</h2>
          <ul className="mt-4 space-y-3">
            {offerings.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Who This Is For</h2>
          <ul className="mt-4 space-y-3">
            {idealFor.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Process Timeline</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {timeline.map((step) => (
              <div key={step} className="rounded-lg border border-indigo-300/20 bg-indigo-400/10 px-4 py-3 text-sm text-indigo-100">
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6">
          <h2 className="text-xl font-semibold">Case Study</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-100/90">
            A Noida-based industrial components MSME with ₹4.2Cr annual turnover needed expansion capital for new
            machinery. We restructured existing liabilities and prepared a lender-ready file; sanction came in 52 days
            with a blended facility of ₹1.35Cr.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Eligibility Form</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <input
              required
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <input
              required
              placeholder="Monthly Turnover"
              value={formData.monthlyTurnover}
              onChange={(e) => setFormData((prev) => ({ ...prev, monthlyTurnover: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <input
              placeholder="Existing Loan"
              value={formData.existingLoan}
              onChange={(e) => setFormData((prev) => ({ ...prev, existingLoan: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <input
              required
              placeholder="Required Amount"
              value={formData.requiredAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, requiredAmount: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <input
              required
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
            />
            <button
              type="submit"
              className="sm:col-span-2 mt-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:from-emerald-300 hover:to-cyan-300"
            >
              Check Funding Potential
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(130deg,#1d2f6f_0%,#0e173d_45%,#0a0f21_100%)] p-6 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">See How Much Funding You Can Unlock in 2 Minutes</h2>
          <button className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
            Check Eligibility
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-400">
        Preview hosted via Creator Armour
      </footer>
    </main>
  );
};

export default PreviewAmanParmar;
