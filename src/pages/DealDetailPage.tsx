"use client";

import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Building2, DollarSign, Calendar, FileText, MessageCircle, AlertCircle, CheckCircle, Clock, TrendingUp, User, MapPin, Mail, Phone, ExternalLink, Upload, Download, Edit, Trash2, Share2, Flag, Eye, Lock } from 'lucide-react';

const DealDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMenu, setShowMenu] = useState(false);

  const dealData = {
    id: 1,
    title: "TechGear Pro Sponsorship Agreement",
    brand: {
      name: "TechGear",
      logo: "TG",
      industry: "Technology",
      location: "San Francisco, CA",
      contact: {
        name: "Sarah Johnson",
        email: "sarah@techgear.com",
        phone: "+1 (555) 123-4567"
      }
    },
    value: 150000,
    currency: "INR",
    status: "negotiation",
    risk: "low",
    progress: 60,
    created: "Nov 10, 2024",
    updated: "Nov 24, 2024",
    deadline: "Dec 15, 2024",
    startDate: "Dec 1, 2024",
    endDate: "Feb 28, 2025",
    platform: "YouTube",
    type: "Sponsored Video Series",
    deliverables: [
      {
        id: 1,
        title: "Product Review Video (10-15 min)",
        status: "pending",
        dueDate: "Dec 10, 2024",
        payment: 50000
      },
      {
        id: 2,
        title: "Unboxing & Setup Tutorial",
        status: "pending",
        dueDate: "Dec 20, 2024",
        payment: 50000
      },
      {
        id: 3,
        title: "30-day Follow-up Review",
        status: "pending",
        dueDate: "Jan 15, 2025",
        payment: 50000
      }
    ],
    paymentSchedule: [
      {
        id: 1,
        amount: 50000,
        milestone: "Contract signing",
        status: "pending",
        dueDate: "Dec 1, 2024"
      },
      {
        id: 2,
        amount: 50000,
        milestone: "First video published",
        status: "pending",
        dueDate: "Dec 12, 2024"
      },
      {
        id: 3,
        amount: 50000,
        milestone: "Campaign completion",
        status: "pending",
        dueDate: "Jan 20, 2025"
      }
    ],
    contract: {
      uploaded: true,
      fileName: "TechGear_Agreement_2024.pdf",
      uploadDate: "Nov 20, 2024",
      reviewStatus: "reviewed",
      issues: []
    },
    timeline: [
      {
        id: 1,
        event: "Deal Created",
        date: "Nov 10, 2024",
        time: "10:30 AM",
        user: "You",
        type: "create"
      },
      {
        id: 2,
        event: "Contract Uploaded",
        date: "Nov 20, 2024",
        time: "2:15 PM",
        user: "You",
        type: "document"
      },
      {
        id: 3,
        event: "Brand Responded",
        date: "Nov 22, 2024",
        time: "11:45 AM",
        user: "TechGear",
        type: "message"
      },
      {
        id: 4,
        event: "Counter Proposal Sent",
        date: "Nov 24, 2024",
        time: "4:20 PM",
        user: "You",
        type: "update"
      }
    ],
    notes: "Brand is interested in long-term partnership. Negotiating exclusivity terms. They want 30-day exclusivity window after each video."
  };

  const statusConfig = {
    negotiation: { 
      color: 'bg-blue-500', 
      label: 'In Negotiation', 
      icon: Clock, 
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    active: { 
      color: 'bg-green-500', 
      label: 'Active', 
      icon: CheckCircle, 
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    pending: { 
      color: 'bg-yellow-500', 
      label: 'Pending', 
      icon: Clock, 
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    completed: { 
      color: 'bg-purple-500', 
      label: 'Completed', 
      icon: CheckCircle, 
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  };

  const riskConfig = {
    low: { color: 'bg-green-500', label: 'Low Risk', textColor: 'text-green-400' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', textColor: 'text-yellow-400' },
    high: { color: 'bg-red-500', label: 'High Risk', textColor: 'text-red-400' }
  };

  const StatusIcon = statusConfig[dealData.status].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Deal Details</div>
          
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        {/* Action Menu Dropdown */}
        {showMenu && (
          <div className="absolute top-16 right-4 w-56 bg-purple-800/95 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
              <Edit className="w-4 h-4" />
              <span className="text-sm">Edit Deal</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
              <Download className="w-4 h-4" />
              <span className="text-sm">Download Contract</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
              <Flag className="w-4 h-4" />
              <span className="text-sm">Report Issue</span>
            </button>
            <div className="border-t border-white/10"></div>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors text-left">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete Deal</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Deal Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {dealData.brand.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-2 leading-tight">{dealData.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[dealData.status].bgColor} ${statusConfig[dealData.status].textColor} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[dealData.status].label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400`}>
                  {riskConfig[dealData.risk].label}
                </span>
              </div>
            </div>
          </div>

          {/* Deal Value Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-purple-200 mb-1">Total Deal Value</div>
                <div className="text-3xl font-bold text-green-400">₹{(dealData.value / 1000).toFixed(0)}K</div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-purple-200 mb-2">
                <span>Deal Progress</span>
                <span>{dealData.progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${dealData.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-purple-300 text-xs mb-1">Start Date</div>
                <div className="font-medium">{dealData.startDate}</div>
              </div>
              <div>
                <div className="text-purple-300 text-xs mb-1">End Date</div>
                <div className="font-medium">{dealData.endDate}</div>
              </div>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Platform</div>
              <div className="font-semibold">{dealData.platform}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Type</div>
              <div className="font-semibold text-sm">{dealData.type}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Created</div>
              <div className="font-semibold">{dealData.created}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Deadline</div>
              <div className="font-semibold">{dealData.deadline}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'deliverables'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            Deliverables
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'payments'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'timeline'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            Timeline
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Brand Contact */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Brand Contact
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium">{dealData.brand.contact.name}</div>
                    <div className="text-sm text-purple-300">{dealData.brand.industry}</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${dealData.brand.contact.email}`} className="hover:text-white transition-colors">
                      {dealData.brand.contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200">
                    <Phone className="w-4 h-4" />
                    <span>{dealData.brand.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200">
                    <MapPin className="w-4 h-4" />
                    <span>{dealData.brand.location}</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message Brand
                </button>
              </div>
            </div>

            {/* Contract Status */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract
              </h2>
              
              {dealData.contract.uploaded ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium">{dealData.contract.fileName}</div>
                        <div className="text-xs text-purple-300">Uploaded {dealData.contract.uploadDate}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <button className="w-full bg-white/10 hover:bg-white/15 border-2 border-dashed border-white/20 font-medium py-8 rounded-xl transition-colors flex flex-col items-center justify-center gap-2">
                  <Upload className="w-8 h-8 text-purple-300" />
                  <span>Upload Contract</span>
                  <span className="text-xs text-purple-300">PDF, DOCX up to 10MB</span>
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-3">Notes</h2>
              <p className="text-sm text-purple-200 leading-relaxed">{dealData.notes}</p>
              <button className="mt-3 text-sm text-purple-300 hover:text-white transition-colors flex items-center gap-1">
                <Edit className="w-3 h-3" />
                Edit Notes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-3">
            {dealData.deliverables.map((item, index) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-purple-200 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {item.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>₹{(item.payment / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'completed' ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : item.status === 'in_progress' ? (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          In Progress
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium">
              <Upload className="w-4 h-4" />
              Submit Deliverable
            </button>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-4">
              <div className="text-sm text-purple-200 mb-2">Total Payment Received</div>
              <div className="text-3xl font-bold text-green-400 mb-1">₹0</div>
              <div className="text-sm text-purple-300">₹{(dealData.value / 1000).toFixed(0)}K remaining</div>
            </div>

            {dealData.paymentSchedule.map((payment, index) => (
              <div key={payment.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Payment #{index + 1}</div>
                      <div className="text-sm text-purple-200 mb-2">{payment.milestone}</div>
                      <div className="text-xs text-purple-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {payment.dueDate}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      ₹{(payment.amount / 1000).toFixed(0)}K
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${
                      payment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      payment.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {payment.status === 'completed' ? '✓ Paid' :
                       payment.status === 'processing' ? '○ Processing' :
                       '○ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {dealData.timeline.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    event.type === 'create' ? 'bg-purple-500/20' :
                    event.type === 'document' ? 'bg-blue-500/20' :
                    event.type === 'message' ? 'bg-green-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {event.type === 'create' ? <CheckCircle className="w-5 h-5 text-purple-400" /> :
                     event.type === 'document' ? <FileText className="w-5 h-5 text-blue-400" /> :
                     event.type === 'message' ? <MessageCircle className="w-5 h-5 text-green-400" /> :
                     <TrendingUp className="w-5 h-5 text-yellow-400" />}
                  </div>
                  {index < dealData.timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-white/10"></div>
                  )}
                </div>
                
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="font-semibold mb-1">{event.event}</div>
                  <div className="text-sm text-purple-200 mb-2">by {event.user}</div>
                  <div className="text-xs text-purple-300">{event.date} at {event.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-900/90 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="flex gap-3">
          <button className="flex-1 bg-white/10 hover:bg-white/15 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Message
          </button>
          <button className="flex-1 bg-green-600 hover:bg-green-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;
