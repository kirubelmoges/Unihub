import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../static/context";
import { toast } from "react-toastify";

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualQuestions, setManualQuestions] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  
  const [examConfig, setExamConfig] = useState({
    totalQuestions: 10,
    easyPercent: 30,
    mediumPercent: 50,
    hardPercent: 20
  });

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError(null);
    setShowManualEntry(false);
    setDebugInfo(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);
    setDebugInfo({ step: "Starting upload..." });
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    
    let fileType = 'TXT';
    if (selectedFile.type === 'application/pdf') fileType = 'PDF';
    else if (selectedFile.type.includes('word')) fileType = 'DOCX';
    formData.append('file_type', fileType);

    try {
      setDebugInfo({ step: "Uploading file...", fileType });
      const response = await axios.post('/api/exam-ai/documents/', formData);
      setDocumentId(response.data.id);
      setDebugInfo({ step: "Upload complete", documentId: response.data.id });
      toast.success("File uploaded!");
      await processDocument(response.data.id);
    } catch (error) {
      console.error("Upload error:", error);
      setDebugInfo({ step: "Upload failed", error: error.message });
      toast.error("Upload failed: " + (error.response?.data?.error || error.message));
      setUploading(false);
    }
  };

  const processDocument = async (docId) => {
    setProcessing(true);
    setDebugInfo({ step: "Processing document...", docId });
    
    try {
      const response = await axios.post(`/api/exam-ai/documents/${docId}/process/`);
      const data = response.data;
      
      setDebugInfo({ 
        step: "Processing complete", 
        questions: data.questions_count,
        chapters: data.chapters_count,
        examples: data.examples_count,
        rawResponse: data 
      });
      
      setExtractedData(data);
      
      if (data.questions_count === 0) {
        console.warn("No questions found! Raw response:", data);
        toast.warning("No questions found in the document!");
        setError(`No questions were detected. Found: ${data.chapters_count || 0} chapters, ${data.examples_count || 0} examples.`);
        setShowManualEntry(true);
        setProcessing(false);
        return;
      }
      
      toast.success(`Extracted ${data.questions_count} questions!`);
      await generateExam(docId, data.questions_count);
      
    } catch (error) {
      console.error("Processing error:", error);
      console.error("Error details:", error.response?.data);
      setDebugInfo({ step: "Processing failed", error: error.response?.data || error.message });
      toast.error("Failed to extract questions: " + (error.response?.data?.error || error.message));
      setError("Failed to process the document. " + (error.response?.data?.error || "Unknown error"));
      setProcessing(false);
      setShowManualEntry(true);
    }
  };

  const generateExam = async (docId, questionCount = null) => {
    setGenerating(true);
    setDebugInfo({ step: "Generating exam...", docId, questionCount });
    
    let totalQuestions = examConfig.totalQuestions;
    if (questionCount && questionCount < totalQuestions) {
      totalQuestions = questionCount;
      toast.info(`Document only has ${questionCount} questions. Using all available.`);
    }
    
    try {
      const response = await axios.post('/api/exam-ai/exam-generation/generate/', {
        document_id: docId,
        total_questions: totalQuestions,
        difficulty_easy_percentage: examConfig.easyPercent,
        difficulty_medium_percentage: examConfig.mediumPercent,
        difficulty_hard_percentage: examConfig.hardPercent,
        auto_duration: true,
        title: "Generated Exam"
      });
      
      setDebugInfo({ step: "Exam generated", examId: response.data.id });
      toast.success("Exam generated! Redirecting...");
      navigate(`/exam/${response.data.id}`);
      
    } catch (error) {
      console.error("Generation error:", error);
      setDebugInfo({ step: "Generation failed", error: error.response?.data });
      toast.error("Failed to generate exam: " + (error.response?.data?.error || error.message));
      setGenerating(false);
    }
  };

  const createExamFromManualQuestions = async () => {
    if (manualQuestions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setGenerating(true);
    setDebugInfo({ step: "Creating exam from manual questions", count: manualQuestions.length });
    
    try {
      // Step 1: Create a document
      const docResponse = await axios.post('/api/exam-ai/documents/', {
        title: "Manual Questions",
        file_type: "TXT",
        extracted_text: manualQuestions.map(q => q.text).join("\n")
      });
      
      const docId = docResponse.data.id;
      setDebugInfo({ step: "Document created", docId });
      
      // Step 2: Create each question
      const createdQuestions = [];
      for (const q of manualQuestions) {
        const questionData = {
          text: q.text,
          answer: q.answer,
          question_type: q.type || 'SHORT',
          difficulty: q.difficulty || 'MEDIUM',
          marks: q.marks || 10,
          options: q.options || null
        };
        
        const questionResponse = await axios.post(`/api/exam-ai/documents/${docId}/questions/`, questionData);
        createdQuestions.push(questionResponse.data);
        setDebugInfo({ step: `Created question ${createdQuestions.length}` });
      }
      
      toast.success(`Created ${createdQuestions.length} questions!`);
      
      // Step 3: Generate exam
      const examResponse = await axios.post('/api/exam-ai/exam-generation/generate/', {
        document_id: docId,
        total_questions: createdQuestions.length,
        difficulty_easy_percentage: examConfig.easyPercent,
        difficulty_medium_percentage: examConfig.mediumPercent,
        difficulty_hard_percentage: examConfig.hardPercent,
        auto_duration: true,
        title: "Manual Questions Exam"
      });
      
      setDebugInfo({ step: "Exam created", examId: examResponse.data.id });
      toast.success("Exam created! Redirecting...");
      navigate(`/exam/${examResponse.data.id}`);
      
    } catch (error) {
      console.error("Manual exam creation error:", error);
      setDebugInfo({ step: "Manual creation failed", error: error.response?.data });
      toast.error("Failed to create exam: " + (error.response?.data?.error || error.message));
      setGenerating(false);
    }
  };

  const handleManualQuestionAdd = () => {
    setManualQuestions([...manualQuestions, {
      id: Date.now(),
      text: '',
      answer: '',
      type: 'SHORT',
      difficulty: 'MEDIUM',
      marks: 10,
      options: null
    }]);
  };

  const updateManualQuestion = (index, field, value) => {
    const updated = [...manualQuestions];
    updated[index][field] = value;
    setManualQuestions(updated);
  };

  // Show debug panel
  const DebugPanel = () => {
    if (!debugInfo) return null;
    return (
      <div className="mt-4 p-3 bg-gray-900 text-white text-xs font-mono rounded-xl overflow-auto max-h-40">
        <p className="font-bold mb-1 text-indigo-400">🔍 Debug Info:</p>
        <pre className="whitespace-pre-wrap text-gray-300">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  };

  // Manual Question Entry Form
  if (showManualEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">📝 Add Questions Manually</h1>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl mb-6">
              <p className="text-amber-800 font-medium">⚠️ No questions were found in your document!</p>
              <p className="text-amber-700 text-sm mt-1">
                Possible reasons: The document might be scanned (image-based PDF), questions aren't formatted with numbers, or the text isn't extractable.
                You can add questions manually below.
              </p>
              {extractedData && (
                <p className="text-amber-600 text-xs mt-2">
                  Extracted: {extractedData.chapters_count || 0} chapters, {extractedData.examples_count || 0} examples
                </p>
              )}
            </div>
            
            {manualQuestions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                <div className="flex justify-between mb-3">
                  <h3 className="font-medium text-gray-800">Question {idx + 1}</h3>
                  <button
                    onClick={() => setManualQuestions(manualQuestions.filter((_, i) => i !== idx))}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    placeholder="Question text"
                    value={q.text}
                    onChange={(e) => updateManualQuestion(idx, 'text', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                  
                  <textarea
                    placeholder="Correct answer"
                    value={q.answer}
                    onChange={(e) => updateManualQuestion(idx, 'answer', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={q.type}
                      onChange={(e) => updateManualQuestion(idx, 'type', e.target.value)}
                      className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SHORT">Short Answer</option>
                      <option value="LONG">Long Answer</option>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="TRUE_FALSE">True/False</option>
                      <option value="CALCULATION">Calculation</option>
                    </select>
                    
                    <select
                      value={q.difficulty}
                      onChange={(e) => updateManualQuestion(idx, 'difficulty', e.target.value)}
                      className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                    
                    <input
                      type="number"
                      placeholder="Marks"
                      value={q.marks}
                      onChange={(e) => updateManualQuestion(idx, 'marks', parseInt(e.target.value))}
                      className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  {q.type === 'MCQ' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Option 1, Option 2, Option 3, Option 4"
                        value={q.options ? q.options.join(', ') : ''}
                        onChange={(e) => updateManualQuestion(idx, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <button
              onClick={handleManualQuestionAdd}
              className="w-full py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl hover:bg-indigo-50 mb-4 transition"
            >
              + Add Question
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={createExamFromManualQuestions}
                disabled={manualQuestions.length === 0 || generating}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 font-semibold shadow-md"
              >
                {generating ? "Creating Exam..." : "Create Exam with Manual Questions"}
              </button>
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setError(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
            
            {generating && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-indigo-700 text-center border border-indigo-100">
                ⏳ Creating your exam from manual questions...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Upload UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">📄 Upload Document</h1>
          <p className="text-gray-600 mb-8">Upload a PDF or Word document to create an exam. The AI will automatically extract questions.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">❌ Error: {error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-8 hover:border-indigo-400 transition">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
            >
              📁 Select File
            </label>
            {selectedFile && (
              <p className="mt-4 text-gray-600">Selected: {selectedFile.name}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">Supports: PDF, Word, Text files</p>
          </div>

          {!uploading && !processing && !generating && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Exam Configuration</h3>
              <div className="space-y-4">
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
                    className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Distribution
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Easy: {examConfig.easyPercent}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={examConfig.easyPercent}
                        onChange={(e) => {
                          const newEasy = parseInt(e.target.value);
                          const remaining = 100 - newEasy;
                          setExamConfig({
                            ...examConfig,
                            easyPercent: newEasy,
                            mediumPercent: Math.floor(remaining * 0.7),
                            hardPercent: Math.floor(remaining * 0.3)
                          });
                        }}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Medium: {examConfig.mediumPercent}%</span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{width: `${examConfig.mediumPercent}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hard: {examConfig.hardPercent}%</span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{width: `${examConfig.hardPercent}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || processing || generating || !selectedFile}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 font-semibold shadow-md transition-all"
          >
            {uploading ? "📤 Uploading..." : 
             processing ? "🔍 Extracting Questions..." : 
             generating ? "🎯 Generating Exam..." : 
             "Upload & Start Exam"}
          </button>

          {uploading && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-indigo-700 text-center border border-indigo-100">
              ⏳ Uploading your document...
            </div>
          )}
          
          {processing && (
            <div className="mt-4 p-3 bg-purple-50 rounded-xl text-purple-700 text-center border border-purple-100">
              🤖 AI is extracting questions and chapters...
            </div>
          )}
          
          {generating && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-center border border-emerald-100">
              ✨ Creating your personalized exam...
            </div>
          )}

          {extractedData && !generating && extractedData.questions_count > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold text-emerald-600 mb-2">✅ Extraction Complete!</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{extractedData.chapters_count || 0}</p>
                  <p className="text-sm text-gray-600">Chapters</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{extractedData.questions_count || 0}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{extractedData.examples_count || 0}</p>
                  <p className="text-sm text-gray-600">Examples</p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Panel - shows in development */}
          <DebugPanel />
        </div>
      </div>
    </div>
  );
}