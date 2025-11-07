"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileUp, CheckCircle, Clock, FileText, Lightbulb, FileWarning, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Document, Category } from '@/types';

interface BusinessIncorporationChecklistProps {
  uploadedDocuments: Document[];
  isLoadingDocuments: boolean;
  onUploadDocument: (documentName: string, categoryId: string) => void;
  businessIncCategory: Category | undefined;
}

// Define the essential business documents for the checklist
const BUSINESS_INCORPORATION_CHECKLIST_ITEMS = [
  { name: 'Certificate of Incorporation / Registration Certificate' },
  { name: 'Company PAN Card' },
  { name: 'Company TAN Number' },
  { name: 'Memorandum of Association (MOA)' },
  { name: 'Articles of Association (AOA)' },
  { name: 'GST Registration Certificate' },
  { name: 'MSME Registration (Udyam Certificate)' },
  { name: 'Shop & Establishment Act Registration' },
  { name: 'Professional Tax Registration (PT)' },
  { name: 'Import Export Code (IEC)' },
  { name: 'Startup India Recognition Certificate' },
];

const BusinessIncorporationChecklist: React.FC<BusinessIncorporationChecklistProps> = ({
  uploadedDocuments,
  isLoadingDocuments,
  onUploadDocument,
  businessIncCategory,
}) => {
  if (isLoadingDocuments) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading checklist documents...</p>
      </div>
    );
  }

  if (!businessIncCategory) {
    return (
      <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
        <p className="text-destructive">Error: 'Business & Incorporation' category not found.</p>
      </Card>
    );
  }

  const getDocumentStatus = (itemName: string) => {
    const uploadedDoc = uploadedDocuments.find(
      (doc) => doc.name.toLowerCase().trim() === itemName.toLowerCase().trim()
    );

    if (uploadedDoc) {
      switch (uploadedDoc.status) {
        case 'Approved':
          return { status: 'Verified', variant: 'success', icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
        case 'Awaiting Review':
          return { status: 'Awaiting Verification', variant: 'secondary', icon: <Clock className="h-4 w-4 text-orange-500" /> };
        case 'Action Required':
          return { status: 'Action Required', variant: 'destructive', icon: <FileWarning className="h-4 w-4 text-red-500" /> };
        case 'Rejected':
          return { status: 'Rejected', variant: 'destructive', icon: <XCircle className="h-4 w-4 text-red-500" /> };
        default:
          return { status: 'Uploaded', variant: 'default', icon: <FileText className="h-4 w-4 text-blue-500" /> };
      }
    }
    return { status: 'Pending Upload', variant: 'outline', icon: <FileUp className="h-4 w-4 text-muted-foreground" /> };
  };

  return (
    <div className="space-y-6">
      <Card className="bg-secondary border-border text-foreground p-4 text-sm rounded-lg flex items-center">
        <Lightbulb className="h-5 w-5 mr-3 text-yellow-500 flex-shrink-0" />
        <p>
          Welcome to your Business & Incorporation checklist! Upload these essential documents to ensure your business is fully compliant.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUSINESS_INCORPORATION_CHECKLIST_ITEMS.map((item) => {
          const { status, variant, icon } = getDocumentStatus(item.name);
          const isUploaded = status !== 'Pending Upload';

          return (
            <Card key={item.name} className="bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-2">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  {icon}
                  <span className="ml-2">{item.name}</span>
                </CardTitle>
                <Badge variant={variant}>{status}</Badge>
              </CardHeader>
              <CardContent className="p-0 flex-grow flex items-end justify-end mt-4">
                {!isUploaded ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUploadDocument(item.name, businessIncCategory.id)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <span> {/* Wrap icon and text in a span */}
                      <FileUp className="h-4 w-4 mr-2" /> Upload Document
                    </span>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="text-muted-foreground border-border">
                    {status === 'Verified' ? 'Document Verified' : 'Document Uploaded'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessIncorporationChecklist;