import React from 'react';
import { Upload, Sparkles, CheckCircle, Shield } from 'lucide-react';

interface SelectFileStepProps {
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const SelectFileStep: React.FC<SelectFileStepProps> = ({
  handleDragOver,
  handleDrop,
  handleFileSelect,
  handleFileChange,
  fileInputRef,
}) => {
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-5 border border-blue-400/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">AI-Powered Review</h3>
            <p className="text-sm text-purple-200">Our AI instantly analyzes your contract for potential issues and unfair terms.</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/20 p-12 text-center hover:bg-white/15 transition-all cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-10 h-10 text-purple-400" />
        </div>

        <h3 className="text-xl font-semibold mb-2">Upload Contract</h3>
        <p className="text-sm text-purple-300 mb-4">Drag and drop or click to browse</p>

        <button type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Choose File
        </button>

        <div className="mt-4 text-xs text-purple-400">
          Supported: PDF, DOCX • Max 10MB
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Instant Analysis</div>
            <div className="text-purple-300">Get results in under 30 seconds</div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">100% Confidential</div>
            <div className="text-purple-300">Your contracts are encrypted and secure</div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Expert Insights</div>
            <div className="text-purple-300">AI trained on 10,000+ creator contracts</div>
          </div>
        </div>
      </div>
    </div>
  );
};
