"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { CalendarDays } from 'lucide-react';

interface ConsultationBookingFormProps {
  onBookingSuccess: () => void;
  onClose: () => void;
}

// Function to initialize and open the Calendly widget
const openCalendlyWidget = () => {
  const calendlyUrl = 'https://calendly.com/creatorarmour/15-minute-legal-consultation';
  if (typeof (window as any).Calendly !== 'undefined') {
    (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
  } else {
    toast.error('Scheduling service not available.', { description: 'Please refresh the page or contact support.' });
    console.warn("Calendly script not loaded. Cannot open widget.");
  }
};

const ConsultationBookingForm = ({ onBookingSuccess, onClose }: ConsultationBookingFormProps) => {
  // We don't need state or mutations here anymore, as Calendly handles the booking and data collection.
  // We just need to ensure the Calendly script is loaded (it's loaded in index.html).

  // We call onBookingSuccess immediately after the user clicks the button, 
  // assuming they will proceed with the external booking.
  const handleOpenCalendly = () => {
    openCalendlyWidget();
    // We assume success and close the modal, letting the user complete the booking externally.
    // In a real app, we might wait for a webhook, but here we rely on the client action.
    onBookingSuccess(); 
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click the button below to open the secure scheduling window. You will be able to select a date, time, and topic directly with your advisor.
      </p>
      <Button 
        onClick={handleOpenCalendly} 
        className="w-full bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90"
      >
        <CalendarDays className="mr-2 h-4 w-4" /> Open Scheduling Calendar
      </Button>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ConsultationBookingForm;