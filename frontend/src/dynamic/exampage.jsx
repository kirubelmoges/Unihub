import { useState, useContext, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import { toast } from "react-toastify";

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // ========== STATE MANAGEMENT ==========
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [calculationSteps, setCalculationSteps] = useState({});
  const [diagramFiles, setDiagramFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [savedStatus, setSavedStatus] = useState({});
  const [subQuestionsStatus, setSubQuestionsStatus] = useState({});
  const [error, setError] = useState(null);
  
  // ========== REFS ==========
  const timerInterval = useRef(null);
  const warningShown = useRef({ fiveMin: false, oneMin: false });
  const fileInputRef = useRef({});
  const hasSubmitted = useRef(false);

  // ========== HELPER FUNCTIONS ==========
  const getCsrfToken = () => {
    const token = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
    return token;
  };

  // ========== AUTHENTICATION CHECK ==========
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to take exam");
      navigate('/login');
      return;
    }
    if (examId) fetchExam();
    return () => clearInterval(timerInterval.current);
  }, [examId, user, authLoading]);

  // ========== TIMER LOGIC ==========
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            handleTimeUp();
            return 0;
          }
          
          if (prev === 300 && !warningShown.current.fiveMin) {
            toast.warning("⚠️ Only 5 minutes remaining!");
            warningShown.current.fiveMin = true;
          } else if (prev === 60 && !warningShown.current.oneMin) {
            toast.warning("⏰ Last minute! Hurry up!");
            warningShown.current.oneMin = true;
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [timerActive, timeLeft]);

  // ========== AUTO-SAVE EVERY 30 SECONDS ==========
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        autoSaveAll();
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [answers, calculationSteps, submissionId]);

  // ========== FETCH EXAM ==========
  const fetchExam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const csrfToken = getCsrfToken();
      console.log("🚀 Starting exam with CSRF:", csrfToken);
      
      const response = await fetch(`http://localhost:8000/api/exam-ai/temp-exams/${examId}/start/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) throw new Error("CSRF_ERROR");
        if (response.status === 404) throw new Error("Exam not found");
        throw new Error(`Failed to start exam: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Start exam response:", data);
      
      const examData = data.exam || data;
      const questions = examData.questions || examData.tempexamquestion_set || [];
      
      if (questions.length === 0) {
        throw new Error("This exam has no questions");
      }
      
      setExam(examData);
      setSubmissionId(data.submission_id);
      
      const durationMinutes = examData.duration_minutes;
      const remainingSeconds = durationMinutes * 60;
      setTimeLeft(remainingSeconds);
      setTimerActive(true);
      
      // Initialize answers
      const initialAnswers = {};
      const initialSaved = {};
      const initialCalcSteps = {};
      const initialSubStatus = {};
      
      questions.forEach(q => {
        const qId = q.question?.id || q.id;
        initialAnswers[qId] = '';
        initialSaved[qId] = false;
        initialCalcSteps[qId] = '';
        
        // Handle sub-questions
        if (q.sub_questions && q.sub_questions.length > 0) {
          initialSubStatus[qId] = {
            expanded: false,
            subAnswers: {}
          };
          q.sub_questions.forEach(sq => {
            const sqId = `${qId}_${sq.letter}`;
            initialAnswers[sqId] = '';
            initialSaved[sqId] = false;
            initialCalcSteps[sqId] = '';
          });
        }
      });
      
      setAnswers(initialAnswers);
      setSavedStatus(initialSaved);
      setCalculationSteps(initialCalcSteps);
      setSubQuestionsStatus(initialSubStatus);
      
      toast.success(`Exam loaded! You have ${durationMinutes} minutes.`);
      
    } catch (error) {
      console.error("Fetch error:", error);
      
      if (error.message === "CSRF_ERROR") {
        toast.error("CSRF error. Refreshing...");
        await fetch('http://localhost:8000/api/exam-ai/csrf/', { credentials: 'include' });
        setTimeout(() => fetchExam(), 1000);
      } else {
        setError(error.message);
        toast.error(error.message || "Failed to load exam");
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLE ANSWER CHANGES ==========
  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setSavedStatus(prev => ({ ...prev, [qId]: false }));
  };

  const handleCalculationStepsChange = (qId, steps) => {
    setCalculationSteps(prev => ({ ...prev, [qId]: steps }));
    setSavedStatus(prev => ({ ...prev, [qId]: false }));
  };

  const handleDiagramUpload = (qId, file) => {
    if (file) {
      setDiagramFiles(prev => ({ ...prev, [qId]: file }));
      toast.info(`Diagram "${file.name}" ready for upload`);
      setSavedStatus(prev => ({ ...prev, [qId]: false }));
    }
  };

  const toggleSubQuestions = (qId) => {
    setSubQuestionsStatus(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        expanded: !prev[qId]?.expanded
      }
    }));
  };

  // ========== SAVE ANSWER ==========
  const saveAnswer = async (qId) => {
    if (!answers[qId]?.trim() && !calculationSteps[qId]?.trim()) {
      toast.warning("Please enter an answer or calculation steps");
      return;
    }
    
    try {
      // Mark as saved locally
      setSavedStatus(prev => ({ ...prev, [qId]: true }));
      toast.success("Answer saved!", { autoClose: 1000 });
      
      // Upload diagram if exists
      if (diagramFiles[qId]) {
        const formData = new FormData();
        formData.append('diagram', diagramFiles[qId]);
        formData.append('question_id', qId);
        formData.append('submission_id', submissionId);
        // await axiosInstance.post('/api/exam-ai/upload-diagram/', formData);
        toast.info("Diagram uploaded", { autoClose: 1000 });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save answer");
    }
  };

  const autoSaveAll = async () => {
    const unsaved = Object.keys(answers).filter(
      qId => answers[qId] && !savedStatus[qId]
    );
    
    for (const qId of unsaved) {
      await saveAnswer(qId);
    }
  };

  // ========== SUBMIT EXAM ==========
  const handleSubmitExam = () => {
    if (answeredCount === 0) {
      toast.error("Please answer at least one question");
      return;
    }
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    if (hasSubmitted.current) {
      toast.warning("Exam already submitted!");
      return;
    }
    
    hasSubmitted.current = true;
    setShowConfirmSubmit(false);
    setSubmitting(true);
    setTimerActive(false);
    clearInterval(timerInterval.current);

    try {
      const csrfToken = getCsrfToken();
      
      const answersArray = Object.entries(answers)
        .filter(([_, text]) => text?.trim())
        .map(([qId, text]) => ({
          question_id: qId,
          answer_text: text,
          calculation_steps: calculationSteps[qId] || '',
          has_diagram: !!diagramFiles[qId]
        }));
      
      // Submit exam
      const submitResponse = await fetch('http://localhost:8000/api/exam-ai/temp-exams/submit_exam/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
          submission_id: submissionId,
          answers: answersArray
        })
      });
      
      const submitData = await submitResponse.json();
      
      if (!submitResponse.ok) {
        throw new Error(submitData.error || `Submit failed: ${submitResponse.status}`);
      }
      
      if (submitData.already_submitted) {
        toast.warning("⚠️ Exam was already submitted!");
        navigate(`/exam-result/${submissionId}`);
        return;
      }
      
      toast.success(`✅ Exam submitted! (${submitData.answers_created || answersArray.length} answers saved)`);
      
      // Grade submission
      toast.info("📝 Grading your exam...");
      const gradeResponse = await fetch('http://localhost:8000/api/exam-ai/grading/grade_submission/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ submission_id: submissionId })
      });
      
      if (!gradeResponse.ok) {
        throw new Error(`Grading failed: ${gradeResponse.status}`);
      }
      
      toast.success("✅ Grading complete!");
      navigate(`/exam-result/${submissionId}`);
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Submission failed");
      setTimerActive(true);
      hasSubmitted.current = false; // Reset so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    clearInterval(timerInterval.current);
    toast.warning("⏰ Time's up! Submitting your exam...");
    confirmSubmit();
  };

  // ========== UTILITY FUNCTIONS ==========
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 60) return 'text-red-600 animate-pulse';
    if (timeLeft < 300) return 'text-orange-600';
    return 'text-emerald-600';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'EASY': 'bg-emerald-100 text-emerald-700',
      'MEDIUM': 'bg-amber-100 text-amber-700',
      'HARD': 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-600';
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      'MCQ': '☑️', 'SHORT': '📝', 'LONG': '📄', 'TRUE_FALSE': '✓/✗',
      'FILL_BLANK': '___', 'CALCULATION': '🧮', 'NUMERICAL': '#️⃣',
      'DERIVATION': '∫', 'PROOF': '⇒', 'DIAGRAM': '📊',
      'MATCHING': '🔄', 'ESSAY': '✍️', 'CASE_STUDY': '📋',
      'ANALYSIS': '🔍', 'COMPREHENSION': '📖'
    };
    return icons[type] || '❓';
  };

  // ========== CALCULATIONS ==========
  const answeredCount = Object.values(answers).filter(a => a?.trim()).length;
  const savedCount = Object.values(savedStatus).filter(Boolean).length;
  const totalQuestions = exam?.questions?.length || exam?.tempexamquestion_set?.length || 0;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;
  const saveProgress = totalQuestions ? (savedCount / totalQuestions) * 100 : 0;
  
  const questions = exam?.questions || exam?.tempexamquestion_set || [];
  const currentQ = questions[currentQuestionIndex]?.question || questions[currentQuestionIndex];
  const currentSubQuestions = questions[currentQuestionIndex]?.sub_questions || [];
  const currentQId = currentQ?.id;
  const currentMarks = questions[currentQuestionIndex]?.marks || currentQ?.marks || 10;

  // ========== LOADING STATE ==========
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md text-center border border-gray-200">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Exam</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md">Refresh</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ========== NO EXAM STATE ==========
  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Exam not found</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ========== NO QUESTIONS STATE ==========
  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-md border border-gray-200">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">This exam has no questions.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      {/* Header with Progress */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{exam.title}</h1>
              <div className="flex gap-4 text-sm text-gray-500">
                <p>{answeredCount} of {totalQuestions} answered</p>
                <p>•</p>
                <p>{savedCount} saved</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-2xl font-mono font-bold ${getTimeColor()}`}>{formatTime(timeLeft)}</div>
                <p className="text-xs text-gray-400">Remaining</p>
              </div>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 font-semibold shadow-md transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Saved</span>
              <span>{Math.round(saveProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-emerald-600 h-1 rounded-full transition-all" style={{ width: `${saveProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Question Navigator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-5 mb-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Navigator</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const qId = q.question?.id || q.id;
              const isAnswered = answers[qId]?.trim();
              const isCurrent = idx === currentQuestionIndex;
              const hasSubQuestions = q.sub_questions && q.sub_questions.length > 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`relative w-10 h-10 rounded-xl font-medium transition-all shadow-sm
                    ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                    ${isAnswered 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title={`Question ${idx + 1}${isAnswered ? ' - Answered' : ''}${hasSubQuestions ? ' (Has sub-questions)' : ''}`}
                >
                  {idx + 1}
                  {hasSubQuestions && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                      {q.sub_questions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded"></div><span className="text-gray-600">Answered</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded"></div><span className="text-gray-600">Not saved</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-200 rounded"></div><span className="text-gray-600">Not answered</span></div>
          </div>
        </div>

        {/* Main Question Card */}
        {currentQ && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            {/* Question Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <span>{getQuestionTypeIcon(currentQ.question_type)}</span>
                  {currentQ.question_type}
                </span>
                {currentSubQuestions.length > 0 && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {currentSubQuestions.length} sub-questions
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQ.difficulty)}`}>
                  {currentQ.difficulty}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  {currentMarks} marks
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="prose max-w-none mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-lg text-gray-800 whitespace-pre-wrap">{currentQ.text}</p>
            </div>

            {/* Sub-questions Toggle */}
            if (currentSubQuestions.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSubQuestions(currentQId)}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <span className="text-sm">
                    {subQuestionsStatus[currentQId]?.expanded ? '▼' : '▶'} 
                    {subQuestionsStatus[currentQId]?.expanded ? ' Hide' : ' Show'} Sub-questions
                  </span>
                </button>
              </div>
            )}

            {/* Answer Area */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Answer:
                {!savedStatus[currentQId] && answers[currentQId] && (
                  <span className="ml-2 text-amber-600 text-xs">(not saved)</span>
                )}
              </label>
              
              {/* MCQ */}
              {currentQ.question_type === 'MCQ' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => (
                    <label key={idx} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${answers[currentQId] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name={`q-${currentQId}`} value={opt} checked={answers[currentQId] === opt} onChange={(e) => handleAnswerChange(currentQId, e.target.value)} className="h-4 w-4 text-indigo-600" />
                      <span className="ml-3 text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {currentQ.question_type === 'TRUE_FALSE' && (
                <div className="flex gap-4">
                  {['True', 'False'].map(opt => (
                    <label key={opt} className={`flex-1 flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer ${answers[currentQId] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                      <input type="radio" name={`q-${currentQId}`} value={opt} checked={answers[currentQId] === opt} onChange={(e) => handleAnswerChange(currentQId, e.target.value)} className="h-4 w-4 text-indigo-600" />
                      <span className="ml-3 text-gray-700 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Text Answers */}
              {['SHORT', 'LONG', 'ESSAY', 'ANALYSIS', 'COMPREHENSION'].includes(currentQ.question_type) && (
                <textarea
                  value={answers[currentQId] || ''}
                  onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                  rows={currentQ.question_type === 'SHORT' ? 4 : 8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="Type your answer here..."
                />
              )}

              {/* Calculation/Numerical */}
              {(currentQ.question_type === 'CALCULATION' || currentQ.question_type === 'NUMERICAL') && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={answers[currentQId] || ''}
                    onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your final answer..."
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Show your calculations (for partial credit):
                    </label>
                    <textarea
                      value={calculationSteps[currentQId] || ''}
                      onChange={(e) => handleCalculationStepsChange(currentQId, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-white/50 backdrop-blur-sm"
                      placeholder="Show your step-by-step calculations here..."
                    />
                  </div>
                </div>
              )}

              {/* Derivation/Proof */}
              {(currentQ.question_type === 'DERIVATION' || currentQ.question_type === 'PROOF') && (
                <textarea
                  value={answers[currentQId] || ''}
                  onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-white/50 backdrop-blur-sm"
                  placeholder="Write your derivation or proof here..."
                />
              )}

              {/* Diagram */}
              if (currentQ.requires_diagram && (
                <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Diagram (optional):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => fileInputRef.current[currentQId] = el}
                    onChange={(e) => e.target.files[0] && handleDiagramUpload(currentQId, e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {diagramFiles[currentQId] && (
                    <p className="mt-2 text-sm text-emerald-600">
                      ✓ Ready: {diagramFiles[currentQId].name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sub-questions Section */}
            {subQuestionsStatus[currentQId]?.expanded && currentSubQuestions.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Sub-questions:</h3>
                <div className="space-y-4 pl-4">
                  {currentSubQuestions.map((sq, idx) => {
                    const sqId = `${currentQId}_${sq.letter}`;
                    return (
                      <div key={idx} className="border-l-4 border-orange-300 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-orange-600">{sq.letter})</span>
                          <span className="text-gray-700">{sq.text}</span>
                          <span className="text-xs text-gray-400">(2 marks)</span>
                        </div>
                        <textarea
                          value={answers[sqId] || ''}
                          onChange={(e) => handleAnswerChange(sqId, e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                          placeholder="Your answer for this sub-question..."
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hints */}
            {currentQ.hints && currentQ.hints.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="font-medium text-indigo-800 mb-2">💡 Hints:</p>
                <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1">
                  {currentQ.hints.map((hint, idx) => <li key={idx}>{hint}</li>)}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => saveAnswer(currentQId)}
                disabled={!answers[currentQId] || savedStatus[currentQId]}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${!answers[currentQId] || savedStatus[currentQId] ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {savedStatus[currentQId] ? '✓ Saved' : 'Save Answer'}
              </button>
              <div className="text-sm text-gray-500">
                {answers[currentQId] ? 'Answered' : 'Not answered'} • 
                {savedStatus[currentQId] ? ' Saved' : ' Not saved'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition text-gray-700"
          >
            ← Previous
          </button>
          <button
            onClick={handleSubmitExam}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-md"
          >
            Submit Exam
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="px-6 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition text-gray-700"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Exam?</h3>
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Questions answered:</span>
                  <span className="font-bold text-gray-800">{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Questions saved:</span>
                  <span className="font-bold text-gray-800">{savedCount}/{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time remaining:</span>
                  <span className={`font-bold ${getTimeColor()}`}>{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              {answeredCount < totalQuestions && (
                <p className="text-orange-600 flex items-center gap-2">
                  <span>⚠️</span> {totalQuestions - answeredCount} unanswered
                </p>
              )}
              
              {savedCount < answeredCount && (
                <p className="text-amber-600 flex items-center gap-2">
                  <span>⚠️</span> {answeredCount - savedCount} not saved
                </p>
              )}
              
              <p className="text-sm text-gray-500 mt-4">
                Once submitted, you cannot change your answers.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 font-medium shadow-md transition-all"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}