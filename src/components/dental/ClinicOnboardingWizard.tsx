import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Stethoscope,
  Building2,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ShieldCheck
} from 'lucide-react';

interface ClinicOnboardingWizardProps {
  onSuccess: (clinicId: string) => void;
}

export const ClinicOnboardingWizard: React.FC<ClinicOnboardingWizardProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCredentials, setDoctorCredentials] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 8:00 PM');
  const [timingsNote, setTimingsNote] = useState('Sunday Closed');

  // Input validation for each step
  const isStepValid = () => {
    switch (step) {
      case 1:
        return clinicName.trim().length > 2 && doctorName.trim().length > 2;
      case 2:
        return phone.trim().length >= 10 && address.trim().length > 5;
      case 3:
        return workingHours.trim().length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep((prev) => prev + 1);
    } else {
      toast.error('Please fill in all fields correctly before continuing.');
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication error. Please log in again.');
        return;
      }

      const fullName = doctorCredentials ? `${doctorName}, ${doctorCredentials}` : doctorName;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: doctorName,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Failed to update doctor name in profiles, continuing...', profileError);
      }

      // Insert clinic row
      const { data, error } = await supabase
        .from('dental_clinics')
        .insert({
          name: clinicName,
          address: address,
          phone: phone,
          working_hours: workingHours,
          timings_note: timingsNote || `${fullName} - BDS / Clinic Head`,
          owner_id: user.id
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (data?.id) {
        toast.success(`Successfully registered ${clinicName}! Welcome doctor.`);
        onSuccess(data.id);
      } else {
        throw new Error('No ID returned from clinic registration.');
      }
    } catch (err: any) {
      console.error('Clinic onboarding error:', err);
      toast.error(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step renderers
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Clinic Details</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Clinic Name (e.g. Patna Dental Care)"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Doctor Info</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Stethoscope size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Doctor Name (e.g. Dr. Amit Kumar)"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Credentials (e.g. BDS, MDS)"
                    value={doctorCredentials}
                    onChange={(e) => setDoctorCredentials(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Contact Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  placeholder="Clinic Contact Phone Number (10 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Clinic Location / Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start text-slate-400">
                  <MapPin size={16} />
                </span>
                <textarea
                  placeholder="Full Address (e.g. 2nd Floor, Boring Road Crossing, Patna - 800001)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm resize-none"
                  required
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Working Hours</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Clock size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 8:00 PM"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Timings Notes (Off Day)</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Closed"
                  value={timingsNote}
                  onChange={(e) => setTimingsNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="text-teal-400" size={14} /> Local Patna Clinic Verification
              </span>
              <p>
                By completing onboarding, you initialize your clinic space. Patients you add will be fully isolated and associated with your clinic profile.
              </p>
            </div>
          </motion.div>
        );

      case 4:
        const doctorFull = doctorCredentials ? `${doctorName}, ${doctorCredentials}` : doctorName;
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/30">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h3 className="font-bold text-white text-base">Almost Ready to Go Live!</h3>
              <p className="text-slate-400 text-xs mt-1">Review your details before finishing setup</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Clinic Name:</span>
                <span className="font-semibold text-white">{clinicName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Doctor in Charge:</span>
                <span className="font-semibold text-white">{doctorFull}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-white">{phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Working Hours:</span>
                <span className="font-semibold text-white">{workingHours} ({timingsNote})</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-slate-500 text-xs">Address:</span>
                <span className="text-slate-300 text-xs leading-relaxed">{address}</span>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl shadow-teal-950/20 overflow-hidden flex flex-col my-8">
        
        {/* Top Branding Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600" />

        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <span className="text-teal-400 text-xs font-bold tracking-widest uppercase">Dental CRM Setup</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">Setup Your Clinic</h2>
            </div>
            
            {/* Step Counter Bubble */}
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs font-semibold text-slate-300 tracking-wide">
              Step {step} of 4
            </div>
          </div>

          {/* Step Progress Tracker */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step
                    ? 'bg-teal-500'
                    : i === step
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Form Content Sandbox */}
          <div className="flex-1 mb-8 min-h-[200px]">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 gap-3">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold rounded-xl text-sm transition-all duration-150 flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-all duration-150 flex items-center gap-2 ${
                  isStepValid()
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/15 hover:opacity-90 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black rounded-xl text-sm transition-all duration-150 hover:opacity-90 active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-400/25"
              >
                {loading ? (
                  <>Initializing Workspace...</>
                ) : (
                  <>
                    Launch Clinic <Check size={16} />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
