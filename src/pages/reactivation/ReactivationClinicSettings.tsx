import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone, Mail, Save, CheckCircle2, FileText, Stethoscope } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClinicBranding {
  clinicName: string;
  doctorName: string;
  qualifications: string;
  address: string;
  phone: string;
  email: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

export const BRANDING_KEY = (orgId: string) => `clinic_branding_${orgId}`;

export const loadClinicBranding = (orgId: string, fallbackName?: string | null): ClinicBranding => {
  try {
    const raw = localStorage.getItem(BRANDING_KEY(orgId));
    if (raw) return JSON.parse(raw) as ClinicBranding;
  } catch {}
  return {
    clinicName: fallbackName || '',
    doctorName: '',
    qualifications: 'BDS, MDS',
    address: '',
    phone: '',
    email: '',
  };
};

export const saveClinicBranding = (orgId: string, data: ClinicBranding) => {
  localStorage.setItem(BRANDING_KEY(orgId), JSON.stringify(data));
};

// ─── Prescription Preview ─────────────────────────────────────────────────────

const PrescriptionPreview: React.FC<{ branding: ClinicBranding }> = ({ branding }) => (
  <div
    className="rounded-xl border border-indigo-200/60 overflow-hidden shadow-lg shadow-indigo-500/10"
    style={{ fontFamily: 'Georgia, serif' }}
  >
    {/* Header */}
    <div
      className="px-6 py-5"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)', borderBottom: '2px solid #4F46E5' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold text-indigo-900 leading-tight tracking-tight truncate">
            {branding.clinicName || <span className="text-slate-400 italic text-[15px]">Clinic Name</span>}
          </h2>
          <p className="text-[12px] text-indigo-700 mt-0.5 font-medium truncate">
            {branding.doctorName || <span className="text-slate-400 italic font-normal">Doctor Name</span>}
            {branding.qualifications && branding.doctorName && (
              <span className="text-indigo-500 font-normal ml-1">· {branding.qualifications}</span>
            )}
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-500 space-y-0.5 leading-snug shrink-0">
          {branding.phone && <div>📞 {branding.phone}</div>}
          {branding.email && <div>✉ {branding.email}</div>}
        </div>
      </div>
      {branding.address && (
        <p className="text-[10px] text-slate-500 mt-2">📍 {branding.address}</p>
      )}
    </div>

    {/* Patient strip */}
    <div className="bg-white px-6 py-2.5 flex gap-6 border-b border-slate-100">
      {[['Patient', 'Ravi Kumar'], ['Date', new Date().toLocaleDateString('en-IN')], ['Age/Sex', '34 / M']].map(([label, val]) => (
        <div key={label}>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{label}</span>
          <p className="text-[11px] text-slate-800 font-medium">{val}</p>
        </div>
      ))}
    </div>

    {/* Rx body */}
    <div className="bg-white px-6 py-3">
      <div className="flex items-start gap-3">
        <span className="text-[26px] text-indigo-400 font-serif leading-none mt-0.5">℞</span>
        <div className="space-y-0.5 text-[11px] text-slate-700">
          <p>• Tab. Amoxicillin 500mg — 1 cap thrice daily × 5 days</p>
          <p>• Tab. Paracetamol 650mg — 1 tab SOS for pain</p>
          <p>• Hexidine Mouthwash — rinse twice daily</p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div
      className="px-6 py-2 flex items-center justify-between"
      style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}
    >
      <span className="text-[9px] text-slate-400">Valid for 30 days · Not valid without signature</span>
      <span className="text-[9px] text-slate-400 italic">Signature ___________</span>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ReactivationClinicSettings: React.FC = () => {
  const { organizationId, profile } = useSession();
  const orgId = organizationId || 'default';

  const [branding, setBranding] = useState<ClinicBranding>(() =>
    loadClinicBranding(orgId, profile?.business_name)
  );
  const [saved, setSaved] = useState(false);

  // Sync clinic name from profile on first load if empty
  useEffect(() => {
    if (!branding.clinicName && profile?.business_name) {
      setBranding((prev) => ({ ...prev, clinicName: profile.business_name || '' }));
    }
  }, [profile?.business_name]);

  const handleChange = (field: keyof ClinicBranding, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveClinicBranding(orgId, branding);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="max-w-5xl mx-auto space-y-6 pb-12"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Clinic Branding</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Your clinic details appear on prescription PDFs and throughout the app.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 shadow-sm ${
            saved
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 shadow-md'
          }`}
        >
          {saved ? (
            <><CheckCircle2 size={15} /> Saved!</>
          ) : (
            <><Save size={15} /> Save Changes</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left: Form ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Clinic Identity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Building2 size={14} className="text-indigo-500" />
              </div>
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Clinic Identity</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Clinic Name
                </label>
                <input
                  type="text"
                  value={branding.clinicName}
                  onChange={(e) => handleChange('clinicName', e.target.value)}
                  placeholder="e.g. Sharma Dental Care"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Clinic Address
                </label>
                <textarea
                  value={branding.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123, MG Road, Sector 5, New Delhi — 110001"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Doctor Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Stethoscope size={14} className="text-violet-500" />
              </div>
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Doctor Profile</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={branding.doctorName}
                  onChange={(e) => handleChange('doctorName', e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={branding.qualifications}
                  onChange={(e) => handleChange('qualifications', e.target.value)}
                  placeholder="e.g. BDS, MDS (Orthodontics)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Phone size={14} className="text-sky-500" />
              </div>
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={branding.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={branding.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="clinic@example.com"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button (bottom, for mobile) */}
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 lg:hidden ${
              saved
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
            }`}
          >
            {saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>

        {/* ── Right: Preview ─────────────────────────────────── */}
        <div className="space-y-3 lg:sticky lg:top-4">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Prescription Preview</span>
          </div>
          <PrescriptionPreview branding={branding} />
          <p className="text-[10.5px] text-slate-400 text-center">
            This is how your clinic header will appear on printed prescription PDFs.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReactivationClinicSettings;
