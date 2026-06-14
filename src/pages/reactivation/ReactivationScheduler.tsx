import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Stethoscope,
  Plus,
  Trash2,
  CalendarCheck,
  Send,
  X,
  Bot
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  doctor_name: string;
  treatment_name: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

export default function ReactivationScheduler() {
  const { organizationId } = useSession();
  const clinicId = organizationId || '';

  // Credentials for sending WhatsApp alerts
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappBusinessPhone, setWhatsappBusinessPhone] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('11:00 AM');
  const [doctorName, setDoctorName] = useState('Dr. Nilmani');
  const [treatmentName, setTreatmentName] = useState('General Consultation');
  const [submitting, setSubmitting] = useState(false);

  // Fetch appointments & patient references
  useEffect(() => {
    if (!clinicId) return;

    async function loadData() {
      try {
        setLoading(true);
        
        // Load Clinic WhatsApp configuration first
        const { data: clinic } = await supabase
          .from('dental_clinics')
          .select('*')
          .eq('id', clinicId)
          .single();
        if (clinic) {
          setWhatsappPhoneNumberId(clinic.whatsapp_phone_number_id || '');
          setWhatsappAccessToken(clinic.whatsapp_access_token || '');
          setWhatsappBusinessPhone(clinic.whatsapp_business_phone || '');
        }

        // Fetch all appointments ordered by date
        const { data: appts, error: apptsError } = await supabase
          .from('dental_appointments')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('appointment_date', { ascending: true });

        if (apptsError) throw apptsError;
        setAppointments(appts || []);

        // Fetch patients for drop-down selection
        const { data: pts, error: ptsError } = await supabase
          .from('dental_patients')
          .select('id, name, phone')
          .eq('clinic_id', clinicId)
          .order('name', { ascending: true });

        if (ptsError) throw ptsError;
        setPatients(pts || []);
      } catch (err) {
        console.error('Error loading scheduler data:', err);
        toast.error('Failed to load appointments. Please refresh.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clinicId]);

  // Handle selected patient change to autofill phone details
  const handlePatientSelectChange = (pId: string) => {
    setSelectedPatientId(pId);
    if (pId === 'new') {
      setManualName('');
      setManualPhone('');
    } else {
      const selected = patients.find((p) => p.id === pId);
      if (selected) {
        setManualName(selected.name);
        setManualPhone(selected.phone);
      }
    }
  };

  // Create Appointment & Trigger WhatsApp Template Confirmation Alert
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !manualName || !manualPhone || !apptDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const insertRow = {
        clinic_id: clinicId,
        patient_id: selectedPatientId && selectedPatientId !== 'new' ? selectedPatientId : null,
        patient_name: manualName,
        patient_phone: manualPhone,
        appointment_date: apptDate,
        appointment_time: apptTime,
        doctor_name: doctorName,
        treatment_name: treatmentName,
        status: 'Confirmed' as const
      };

      const { data, error } = await supabase
        .from('dental_appointments')
        .insert(insertRow)
        .select()
        .single();

      if (error) throw error;

      // Update state immediately
      setAppointments((prev) => [...prev, data].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()));
      toast.success('Appointment booked successfully!');
      setIsModalOpen(false);

      // Trigger automated WhatsApp confirmation using approved Meta template
      if (whatsappPhoneNumberId && whatsappAccessToken) {
        const cleanPhone = manualPhone.replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const formattedDateString = new Date(apptDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'appointment_booking_confirmation',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: manualName },
                  { type: 'text', text: formattedDateString },
                  { type: 'text', text: apptTime },
                  { type: 'text', text: doctorName },
                  { type: 'text', text: whatsappBusinessPhone || '+91 75448 60350' }
                ]
              }
            ]
          }
        };

        const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const responseJson = await response.json();
        if (response.ok) {
          toast.success('WhatsApp confirmation alert sent automatically!');
        } else {
          console.warn('Meta API returned template warning (likely template pending review):', responseJson);
        }
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      toast.error('Booking failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
      // Reset form variables
      setSelectedPatientId('');
      setManualName('');
      setManualPhone('');
      setApptDate('');
      setApptTime('11:00 AM');
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dental_appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Appointment deleted.');
    } catch (err: any) {
      console.error('Delete appointment error:', err);
      toast.error('Delete failed.');
    }
  };

  const inputBase =
    'w-full px-3 py-2 rounded-lg text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all border border-slate-200 bg-[#F8FAFC] focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40';

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">Scheduler</span>
          <h1 className="text-[20px] font-semibold text-slate-800 leading-none">Live Appointments</h1>
          <p className="text-[12px] text-slate-500 mt-1">Book slots and automatically trigger WhatsApp confirmation alerts</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[12.5px] transition-all shadow-md shadow-indigo-500/25"
        >
          <Plus size={15} /> Book Appointment
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Schedule List (Left, Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-250/60 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-indigo-500" /> Clinic Bookings Calendar
              </span>
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                {appointments.length} active
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-450 text-xs">Loading Live Appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-[12px] space-y-2">
                <p>No appointments booked yet.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-indigo-500 font-bold hover:underline"
                >
                  Book the first appointment now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50/45 transition-colors group">
                    <div className="flex items-center gap-4">
                      {/* Avatar initial badge */}
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                        {appt.patient_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800">{appt.patient_name}</h4>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wide">
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={11} className="text-slate-400" /> {appt.appointment_date} @ {appt.appointment_time}</span>
                          <span className="flex items-center gap-1"><User size={11} className="text-slate-400" /> {appt.doctor_name}</span>
                          <span className="flex items-center gap-1"><Stethoscope size={11} className="text-slate-400" /> {appt.treatment_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Setup Overview (Right, Span 1) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-250/60 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bot size={13} className="text-emerald-500" /> WhatsApp Integration
            </h3>
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              Whenever you book a slot, the CRM will hit Meta's servers directly using the permanent access token. The patient will receive a transactional template alert on their mobile number.
            </p>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Phone ID:</span>
                <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{whatsappPhoneNumberId || 'Unset'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Business Phone:</span>
                <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{whatsappBusinessPhone || 'Unset'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Access Token:</span>
                <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  {whatsappAccessToken ? 'Active (••••)' : 'Unset'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={(v) => !v && setIsModalOpen(false)}>
        <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 text-left">
            <DialogTitle className="text-slate-800 text-[16px] font-semibold">Book Live Appointment</DialogTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">Select a patient profile or enter manual details below</p>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
            {/* Patient dropdown selection */}
            <div>
              <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Select Registered Patient</label>
              <select
                className={inputBase}
                value={selectedPatientId}
                onChange={(e) => handlePatientSelectChange(e.target.value)}
              >
                <option value="">-- Choose Patient (Optional) --</option>
                <option value="new">+ Book New Walk-in Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                ))}
              </select>
            </div>

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Patient Name *</label>
                <input
                  className={inputBase}
                  required
                  placeholder="Rahul Sharma"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <input
                  className={inputBase}
                  required
                  placeholder="+91 98765 43210"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Appointment Date *</label>
                <input
                  type="date"
                  className={inputBase}
                  required
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Select Time Slot *</label>
                <select
                  className={inputBase}
                  required
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                >
                  {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doctor + Treatment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Assigned Dentist</label>
                <input
                  className={inputBase}
                  placeholder="Dr. Nilmani"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Treatment / Note</label>
                <input
                  className={inputBase}
                  placeholder="Root Canal Treatment"
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[12.5px] text-slate-550 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-[12.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <CalendarCheck size={14} />
                {submitting ? 'Booking...' : 'Book & Alert'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
