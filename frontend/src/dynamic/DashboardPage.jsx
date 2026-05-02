import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import axiosInstance, { ensureCsrfToken } from "../static/csrf";
import { toast } from "react-toastify";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  const [exams, setExams] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      if (!authLoading && user) {
        await fetchData();
      }
    };
    init();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await ensureCsrfToken();
      
      const [examsRes, docsRes] = await Promise.all([
        axiosInstance.get('/api/exam-ai/temp-exams/'),
        axiosInstance.get('/api/exam-ai/documents/')
      ]);
      setExams(examsRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const startExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  // ========== UPLOAD FUNCTIONS ==========
  const getFileType = (file) => {
    const ext = file.name.split('.').pop().toUpperCase();
    const docTypes = ['DOCX', 'DOC'];
    
    if (file.type === 'application/pdf') return 'PDF';
    if (docTypes.includes(ext) || file.type.includes('word')) return 'DOCX';
    return 'TXT';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setExtractedInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('file_type', getFileType(selectedFile));
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await axiosInstance.post('/api/exam-ai/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success("File uploaded successfully!");
      await processDocument(response.data.id);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Upload failed");
      setUploading(false);
    }
  };

  const processDocument = async (docId) => {
    setProcessing(true);
    
    try {
      const response = await axiosInstance.post(`/api/exam-ai/documents/${docId}/process/`);
      
      setExtractedInfo({
        questions_count: response.data.questions_count,
        chapters_count: response.data.chapters_count,
        examples_count: response.data.examples_count,
        document_id: docId
      });
      
      toast.success(`✅ Extracted ${response.data.questions_count} questions!`);
      
      await generateExam(docId);
      
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error.response?.data?.error || "Processing failed");
    } finally {
      setProcessing(false);
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchData();
    }
  };

  const generateExam = async (docId) => {
    try {
      const response = await axiosInstance.post('/api/exam-ai/exam-generation/generate/', {
        document_id: docId,
        total_questions: extractedInfo?.questions_count || 5,
        custom_duration: 30,
        auto_duration: false,
        title: `Exam from ${selectedFile?.name}`
      });
      
      toast.success("Exam generated! Taking you there...");
      setShowUploadModal(false);
      setSelectedFile(null);
      setExtractedInfo(null);
      setUploadProgress(0);
      setProcessing(false);
      setUploading(false);
      
      navigate(`/exam/${response.data.id}`);
      
    } catch (error) {
      console.error("Exam generation error:", error);
      toast.error(error.response?.data?.error || "Failed to generate exam");
      setProcessing(false);
      setUploading(false);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      'PDF': '📄',
      'DOCX': '📝',
      'DOC': '📝',
      'TXT': '📃',
    };
    return icons[fileType] || '📎';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-mono">Loading Dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl text-center border border-gray-200">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Required</h2>
        <p className="text-gray-600 mb-6">Please login to access the dashboard.</p>
        <a href="/login" className="inline-block px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">📚 My Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{user?.username}</span>!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md"
            >
              <span>+</span> Upload Document
            </button>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">📤 Upload Document</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setExtractedInfo(null);
                    setUploadProgress(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Upload a PDF or Word document to extract questions.
                <br />
                <span className="text-xs text-gray-400">Supported: PDF, DOCX, TXT</span>
              </p>
              
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 hover:border-indigo-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <span className="text-5xl mb-2">📁</span>
                  <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Click to select file
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    or drag and drop
                  </span>
                </label>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(getFileType(selectedFile))}</span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {getFileType(selectedFile)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {processing && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    <span>Extracting questions with AI...</span>
                  </div>
                </div>
              )}
              
              {/* Extraction Results */}
              {extractedInfo && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="font-medium text-emerald-800 mb-1">✅ Extraction Complete!</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="font-bold text-emerald-700">{extractedInfo.questions_count}</p>
                      <p className="text-xs text-emerald-600">Questions</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-700">{extractedInfo.chapters_count || 0}</p>
                      <p className="text-xs text-emerald-600">Chapters</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-700">{extractedInfo.examples_count || 0}</p>
                      <p className="text-xs text-emerald-600">Examples</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading || processing}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload & Extract'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setExtractedInfo(null);
                    setUploadProgress(0);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exams Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 My Exams ({exams.length})</h2>
          {exams.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-12 text-center border border-gray-200">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 mb-2">No exams yet</p>
              <p className="text-sm text-gray-400">Upload a document to create your first exam!</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
              >
                + Upload Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-200">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                    <h3 className="font-bold text-white text-lg truncate">{exam.title}</h3>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Questions</span>
                        <span className="font-semibold text-gray-800">{exam.total_questions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Duration</span>
                        <span className="font-semibold text-gray-800">{exam.duration_minutes} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Total Marks</span>
                        <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{exam.total_marks}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startExam(exam.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 font-medium transition-all shadow-md"
                    >
                      Take Exam →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📄 My Documents ({documents.length})</h2>
          {documents.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border border-gray-200">
              <p className="text-gray-500">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-300 border border-gray-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl flex-shrink-0">{getFileIcon(doc.file_type)}</span>
                        <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {doc.processed ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">✓ Processed</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">Processing</span>
                      )}
                    </div>
                  </div>
                  {doc.question_count > 0 && (
                    <p className="text-xs text-indigo-600 mt-2 font-medium truncate">{doc.question_count} questions extracted</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}