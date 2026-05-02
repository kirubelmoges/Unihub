import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import axiosInstance, { ensureCsrfToken } from "../static/csrf";
import { toast } from "react-toastify";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Dashboard state
  const [exams, setExams] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [examConfig, setExamConfig] = useState({
    totalQuestions: 10,
    duration: 30
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Ensure CSRF token before fetching
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    
    let fileType = 'TXT';
    if (selectedFile.type === 'application/pdf') fileType = 'PDF';
    else if (selectedFile.type.includes('word')) fileType = 'DOCX';
    formData.append('file_type', fileType);

    try {
      const response = await axiosInstance.post('/api/exam-ai/documents/', formData);
      toast.success("File uploaded!");
      await processDocument(response.data.id);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (docId) => {
    setProcessing(true);
    try {
      const response = await axiosInstance.post(`/api/exam-ai/documents/${docId}/process/`);
      toast.success(`Extracted ${response.data.questions_count} questions!`);
      await generateExam(docId);
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error.response?.data?.error || "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const generateExam = async (docId) => {
    try {
      const response = await axiosInstance.post('/api/exam-ai/exam-generation/generate/', {
        document_id: docId,
        total_questions: examConfig.totalQuestions,
        custom_duration: examConfig.duration,
        auto_duration: false,
        title: "Generated Exam"
      });
      
      toast.success("Exam generated! Redirecting...");
      setShowUpload(false);
      setSelectedFile(null);
      await fetchData(); // Refresh the list
      navigate(`/exam/${response.data.id}`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error.response?.data?.error || "Failed to generate exam");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📚 My Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.username || 'Student'}!</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {showUpload ? '📋 View Dashboard' : '+ Upload Document'}
          </button>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Upload Document</h2>
            <p className="text-gray-600 mb-6">Upload a PDF or Word document to create an exam</p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📁 Select File
              </label>
              {selectedFile && (
                <p className="mt-4 text-gray-600">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Exam Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions (max 50)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={examConfig.totalQuestions}
                    onChange={(e) => setExamConfig({...examConfig, totalQuestions: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={examConfig.duration}
                    onChange={(e) => setExamConfig({...examConfig, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || processing || !selectedFile}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
            >
              {uploading ? "📤 Uploading..." : processing ? "🔍 Extracting Questions..." : "🚀 Upload & Create Exam"}
            </button>
          </div>
        )}

        {/* Exams Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📝</span> My Exams
            <span className="text-sm font-normal text-gray-500">({exams.length})</span>
          </h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 mb-2">No exams yet</p>
              <p className="text-sm text-gray-400">Upload a document to create your first exam!</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Upload Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                    <h3 className="font-bold text-white text-lg truncate">{exam.title}</h3>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2 mb-4">
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
                        <span className="font-semibold text-blue-600">{exam.total_marks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Expires</span>
                        <span className="text-xs text-gray-400">
                          {new Date(exam.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => startExam(exam.id)}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📄</span> My Documents
            <span className="text-sm font-normal text-gray-500">({documents.length})</span>
          </h2>
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    {doc.processed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Processed</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Processing</span>
                    )}
                  </div>
                  {doc.question_count > 0 && (
                    <p className="text-xs text-blue-600 mt-2">{doc.question_count} questions extracted</p>
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