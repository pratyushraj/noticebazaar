import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import BrandDealForm from '@/components/forms/BrandDealForm';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BrandNewDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSession();

  const handleSuccess = () => {
    toast.success('Offer sent successfully!');
    navigate('/brand-dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-black text-white">Send New Offer</h1>
        <p className="text-sm text-white/60 mt-1">Find creators and send them collaboration offers</p>
      </div>

      <div className="px-4 py-6">
        <BrandDealForm
          onSaveSuccess={handleSuccess}
          onClose={() => navigate('/brand-dashboard')}
        />
      </div>
    </div>
  );
};

export default BrandNewDealPage;
