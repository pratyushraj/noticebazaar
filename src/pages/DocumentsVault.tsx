"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Tag,
  Calendar,
  Download,
  Trash2,
  Eye,
  FileCheck,
  Receipt,
  Shield,
  CreditCard,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/navbar/Navbar';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';

type DocumentType = 'contract' | 'invoice' | 'payment_proof' | 'legal_notice' | 'pan_gst' | 'other';
type DocumentCategory = 'All' | DocumentType;

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: string;
  size: number;
  url: string;
  tags: string[];
  dealId?: string;
  dealName?: string;
}

const DocumentsVault: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: brandDeals, isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && !!profile?.id,
  });

  // Generate demo documents from deals
  const documents: Document[] = useMemo(() => {
    if (!brandDeals) return [];
    
    const docs: Document[] = [];
    
    brandDeals.forEach((deal) => {
      // Contract
      if (deal.contract_file_url) {
        docs.push({
          id: `contract-${deal.id}`,
          name: `${deal.brand_name} - Contract`,
          type: 'contract',
          uploadedAt: deal.created_at || new Date().toISOString(),
          size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          url: deal.contract_file_url,
          tags: ['contract', deal.brand_name.toLowerCase(), deal.platform.toLowerCase()],
          dealId: deal.id,
          dealName: deal.brand_name,
        });
      }
      
      // Payment proof (if payment received)
      if (deal.payment_received_date) {
        docs.push({
          id: `payment-${deal.id}`,
          name: `${deal.brand_name} - Payment Receipt`,
          type: 'payment_proof',
          uploadedAt: deal.payment_received_date,
          size: Math.floor(Math.random() * 2000000) + 50000,
          url: '#',
          tags: ['payment', deal.brand_name.toLowerCase(), 'receipt'],
          dealId: deal.id,
          dealName: deal.brand_name,
        });
      }
      
      // Invoice (for all deals)
      docs.push({
        id: `invoice-${deal.id}`,
        name: `Invoice - ${deal.brand_name} (₹${deal.deal_amount.toLocaleString('en-IN')})`,
        type: 'invoice',
        uploadedAt: deal.payment_expected_date || deal.created_at || new Date().toISOString(),
        size: Math.floor(Math.random() * 1000000) + 50000,
        url: '#',
        tags: ['invoice', deal.brand_name.toLowerCase(), deal.status.toLowerCase()],
        dealId: deal.id,
        dealName: deal.brand_name,
      });
    });
    
    // Add PAN/GST documents if profile has them
    if (profile?.pan_number) {
      docs.push({
        id: 'pan-doc',
        name: 'PAN Card',
        type: 'pan_gst',
        uploadedAt: profile.created_at || new Date().toISOString(),
        size: 500000,
        url: '#',
        tags: ['pan', 'verification', 'identity'],
      });
    }
    
    if (profile?.gst_number) {
      docs.push({
        id: 'gst-doc',
        name: 'GST Certificate',
        type: 'pan_gst',
        uploadedAt: profile.created_at || new Date().toISOString(),
        size: 750000,
        url: '#',
        tags: ['gst', 'tax', 'certificate'],
      });
    }
    
    return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [brandDeals, profile]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = searchTerm === '' || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || doc.type === selectedCategory;
      const matchesTag = selectedTag === 'All' || doc.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [documents, searchTerm, selectedCategory, selectedTag]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Get document type icon
  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'contract':
        return FileCheck;
      case 'invoice':
        return Receipt;
      case 'payment_proof':
        return CreditCard;
      case 'legal_notice':
        return Shield;
      case 'pan_gst':
        return FileText;
      default:
        return FileText;
    }
  };

  // Get document type color
  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'contract':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'invoice':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'payment_proof':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'legal_notice':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pan_gst':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (sessionLoading) {
    return (
      <div className="nb-screen-height bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="nb-screen-height bg-[#0A0F1A]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header */}
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
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/30">
                <FolderOpen className="h-5 w-5 text-blue-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Documents Vault</h1>
            </div>
            <p className="text-sm text-white/60 mt-1">
              All your contracts, invoices, payment proofs, and legal documents in one place
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white/60">Contracts</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {documents.filter(d => d.type === 'contract').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/60">Invoices</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {documents.filter(d => d.type === 'invoice').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/60">Payments</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {documents.filter(d => d.type === 'payment_proof').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white/60">Legal</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {documents.filter(d => d.type === 'legal_notice' || d.type === 'pan_gst').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 bg-[#0F121A]/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0A0F1A] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as DocumentCategory)}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-[#0A0F1A] border-white/10 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="contract">Contracts</SelectItem>
                    <SelectItem value="invoice">Invoices</SelectItem>
                    <SelectItem value="payment_proof">Payment Proofs</SelectItem>
                    <SelectItem value="legal_notice">Legal Notices</SelectItem>
                    <SelectItem value="pan_gst">PAN/GST</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-[#0A0F1A] border-white/10 text-white">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          {filteredDocuments.length === 0 ? (
            <div className="py-8">
              {documents.length === 0 ? (
                <NoContractsEmptyState
                  onUpload={() => setIsUploadOpen(true)}
                />
              ) : searchTerm ? (
                <SearchNoResultsEmptyState
                  searchTerm={searchTerm}
                  onClearFilters={() => setSearchTerm('')}
                />
              ) : (
                <FilteredNoMatchesEmptyState
                  onClearFilters={() => {
                    setSelectedCategory('All');
                    setSelectedTag('All');
                    setSearchTerm('');
                  }}
                  filterCount={
                    (selectedCategory !== 'All' ? 1 : 0) +
                    (selectedTag !== 'All' ? 1 : 0)
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc, index) => {
                const Icon = getTypeIcon(doc.type);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-[#0F121A]/50 border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                            getTypeColor(doc.type)
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate mb-1">
                              {doc.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {doc.tags.slice(0, 3).map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 bg-white/5 border-white/10 text-white/70"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 bg-white/5 border-white/10 text-white/70"
                            >
                              +{doc.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <span className="text-xs text-white/50">{formatFileSize(doc.size)}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.url, '_blank');
                              }}
                            >
                              <Eye className="w-4 h-4 text-white/70" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Download logic
                              }}
                            >
                              <Download className="w-4 h-4 text-white/70" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DocumentsVault;

