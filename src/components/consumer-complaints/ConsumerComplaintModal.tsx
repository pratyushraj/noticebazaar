"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConsumerComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | null;
  categoryName?: string;
  onSubmit: () => void;
}

const issueTypes = [
  'Refund not processed',
  'Wrong product/service delivered',
  'Poor customer service',
  'Billing error',
  'Delivery delay',
  'Product quality issue',
  'Other',
];

const ConsumerComplaintModal: React.FC<ConsumerComplaintModalProps> = ({
  open,
  onOpenChange,
  category,
  categoryName,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    issueType: '',
    description: '',
    amount: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Please enter company/platform name');
      return;
    }
    if (!formData.issueType) {
      toast.error('Please select an issue type');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setIsSubmitting(true);

    // Mock submission - simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset form after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          companyName: '',
          issueType: '',
          description: '',
          amount: '',
        });
        setUploadedFile(null);
        onOpenChange(false);
        onSubmit();
        toast.success('Your complaint has been received. Our team will take it forward.');
      }, 2000);
    }, 1500);
  };

  const handleClose = () => {
    if (!isSubmitting && !isSuccess) {
      setFormData({
        companyName: '',
        issueType: '',
        description: '',
        amount: '',
      });
      setUploadedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Complaint Received!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Your complaint has been received. Our team will take it forward.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Raise Consumer Complaint
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                {categoryName && (
                  <span className="text-emerald-400">Category: {categoryName}</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white">
                  Company / Platform Name *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g., Amazon, Swiggy, IRCTC"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Issue Type */}
              <div className="space-y-2">
                <Label htmlFor="issueType" className="text-white">
                  Issue Type *
                </Label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => handleInputChange('issueType', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {issueTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Short Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Amount (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount Involved (Optional)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="₹0"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* File Upload (Optional) */}
              <div className="space-y-2">
                <Label className="text-white">Upload Proof (Optional)</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <span className="flex-1 text-sm text-white truncate">
                      {uploadedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 p-0 hover:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors bg-gray-800/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConsumerComplaintModal;




