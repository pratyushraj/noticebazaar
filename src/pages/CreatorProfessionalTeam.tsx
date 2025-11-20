"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatorProfessionalTeam from '@/components/creator-dashboard/CreatorProfessionalTeam';
import ChatWindow from '@/components/ChatWindow';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Navbar from '@/components/navbar/Navbar';

const CreatorProfessionalTeamPage = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);

  const handleOpenMessageDialog = (receiverId: string, receiverName: string) => {
    setSelectedReceiverId(receiverId);
    setSelectedReceiverName(receiverName);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedReceiverId(null);
    setSelectedReceiverName(null);
  };

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0A0F1A]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header with Back Button */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-dashboard')}
              className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Chat with Your Professional Team</h1>
            <p className="text-sm sm:text-base text-white/60 mt-2">
              Connect with your Chartered Accountant and Legal Advisor
            </p>
          </div>

          {/* Professional Team Component */}
          <div className="max-w-5xl">
            <CreatorProfessionalTeam onSendMessage={handleOpenMessageDialog} />
          </div>
        </div>

        {/* Chat Window */}
        {isChatOpen && selectedReceiverId && selectedReceiverName && (
          <ChatWindow
            receiverId={selectedReceiverId}
            receiverName={selectedReceiverName}
            onClose={handleCloseChat}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default CreatorProfessionalTeamPage;

