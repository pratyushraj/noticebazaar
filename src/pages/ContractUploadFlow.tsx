import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader, Sparkles, Shield, Eye, Download, IndianRupee, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';

type RiskLevel = 'low' | 'medium' | 'high';

const ContractUploadFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload, uploading, scanning, analyzing, results
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated contract analysis results
  const analysisResults = {
    overallRisk: 'low' as RiskLevel,
    score: 85,
    issues: [
      {
        id: 1,
        severity: 'warning',
        category: 'Exclusivity',
        title: 'Extended Exclusivity Period',
        description: 'Contract requires 60-day exclusivity with competing brands. Industry standard is 30 days.',
        clause: 'Section 4.2',
        recommendation: 'Negotiate to reduce exclusivity period to 30 days or request additional compensation.'
      }
    ],
    verified: [
      {
        id: 1,
        category: 'Payment Terms',
        title: 'Clear Payment Schedule',
        description: 'Payment milestones are clearly defined with specific amounts and dates.',
        clause: 'Section 3.1'
      },
      {
        id: 2,
        category: 'Termination Rights',
        title: 'Fair Termination Clause',
        description: 'Both parties can terminate with 30-day notice. No unfair penalties.',
        clause: 'Section 7.3'
      },
      {
        id: 3,
        category: 'IP Rights',
        title: 'Creator Retains IP',
        description: 'You retain full ownership of content after campaign completion.',
        clause: 'Section 5.4'
      },
      {
        id: 4,
        category: 'Liability',
        title: 'Limited Liability',
        description: 'Liability is capped at contract value. Standard and reasonable.',
        clause: 'Section 8.1'
      }
    ],
    keyTerms: {
      dealValue: '₹150,000',
      duration: '3 months',
      deliverables: '3 videos',
      paymentSchedule: 'Milestone-based',
      exclusivity: '60 days'
    }
  };

  // Simulate file upload
  useEffect(() => {
    if (step === 'uploading') {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('scanning'), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Simulate scanning
  useEffect(() => {
    if (step === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('analyzing'), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Simulate analysis
  useEffect(() => {
    if (step === 'analyzing') {
      setTimeout(() => setStep('results'), 3000);
    }
  }, [step]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or DOCX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setStep('uploading');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or DOCX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setStep('uploading');
    }
  };

  const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string; icon: typeof CheckCircle }> = {
    low: { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Low Risk', icon: CheckCircle },
    medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Medium Risk', icon: AlertTriangle },
    high: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'High Risk', icon: XCircle }
  };

  const RiskIcon = riskConfig[analysisResults.overallRisk as RiskLevel].icon;

  return (
    <ContextualTipsProvider currentView="upload">
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => step === 'results' ? setStep('upload') : navigate('/creator-dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Upload Contract</div>
          
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Upload Step */}
        {step === 'upload' && (
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
              
              <button 
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
        )}

        {/* Uploading Step */}
        {step === 'uploading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <Upload className="w-12 h-12 text-purple-400" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Uploading Contract...</h2>
              <p className="text-purple-300 mb-6">{fileName}</p>
              
              <div className="w-full max-w-xs mx-auto">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300">{uploadProgress}%</span>
                  <span className="text-purple-300">{fileSize}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <FileText className="w-12 h-12 text-blue-400" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Scanning Document...</h2>
              <p className="text-purple-300 mb-6">Reading contract clauses</p>
              
              <div className="w-full max-w-xs mx-auto">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300">{scanProgress}%</span>
                  <span className="text-purple-300">12 pages</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-8 space-y-2 text-sm text-purple-300">
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Extracting text from PDF...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 relative animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">AI Analyzing Contract...</h2>
              <p className="text-purple-300 mb-8">Checking for potential issues</p>
              
              <div className="space-y-3 text-sm max-w-xs mx-auto">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-purple-200">Payment terms</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-purple-200">Termination rights</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-purple-200">IP ownership</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-purple-200">Exclusivity clause</span>
                  <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-purple-200">Liability terms</span>
                  <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Overall Score Card */}
            <div className={`backdrop-blur-md rounded-2xl p-6 border ${
              analysisResults.overallRisk === 'low' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30' :
              analysisResults.overallRisk === 'medium' ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30' :
              'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-400/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-16 h-16 rounded-2xl ${riskConfig[analysisResults.overallRisk as RiskLevel].bgColor} flex items-center justify-center`}>
                    <RiskIcon className={`w-8 h-8 ${riskConfig[analysisResults.overallRisk as RiskLevel].color}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Contract Analyzed</h2>
                    <p className={`text-sm ${riskConfig[analysisResults.overallRisk as RiskLevel].color} font-medium`}>
                      {riskConfig[analysisResults.overallRisk as RiskLevel].label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{analysisResults.score}</div>
                  <div className="text-sm text-purple-300">Protection Score</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  View Full Contract
                </button>
                <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>

            {/* Key Terms */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Key Terms
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1">Deal Value</div>
                  <div className="font-semibold flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-green-400" />
                    {analysisResults.keyTerms.dealValue}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1">Duration</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    {analysisResults.keyTerms.duration}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1">Deliverables</div>
                  <div className="font-semibold">{analysisResults.keyTerms.deliverables}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1">Payment</div>
                  <div className="font-semibold">{analysisResults.keyTerms.paymentSchedule}</div>
                </div>
              </div>
            </div>

            {/* Issues Found */}
            {analysisResults.issues.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Issues Found ({analysisResults.issues.length})
                </h3>
                <div className="space-y-3">
                  {analysisResults.issues.map(issue => (
                    <div key={issue.id} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{issue.title}</h4>
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                              {issue.category}
                            </span>
                          </div>
                          <p className="text-sm text-purple-200 mb-2">{issue.description}</p>
                          <div className="text-xs text-purple-400 mb-3">📄 {issue.clause}</div>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="text-xs text-purple-300 mb-1">💡 Recommendation</div>
                            <div className="text-sm">{issue.recommendation}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Items */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Verified ({analysisResults.verified.length})
              </h3>
              <div className="space-y-3">
                {analysisResults.verified.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-purple-200 mb-1">{item.description}</p>
                      <div className="text-xs text-purple-400">📄 {item.clause}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 border border-purple-400/30">
              <h3 className="font-semibold text-lg mb-3">Next Steps</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold">1</div>
                  <span>Review the identified exclusivity issue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold">2</div>
                  <span>Message your legal advisor for guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold">3</div>
                  <span>Negotiate better terms with the brand</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/messages')}
                className="flex-1 bg-white/10 hover:bg-white/15 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Get Legal Review
              </button>
              <button 
                onClick={() => navigate('/creator-contracts')}
                className="flex-1 bg-green-600 hover:bg-green-700 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Accept & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </ContextualTipsProvider>
  );
};

export default ContractUploadFlow;

