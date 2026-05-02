import { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import { toast } from "react-toastify";

export default function GradePage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [expandedSubAnswers, setExpandedSubAnswers] = useState({});
  const [filterType, setFilterType] = useState('all');

  // Helper to get CSRF token
  const getCsrfToken = () => {
    const token = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
    return token;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to view results");
      navigate('/login');
      return;
    }
    if (submissionId) fetchResults();
  }, [submissionId, user, authLoading]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      const csrfToken = getCsrfToken();
      
      const response = await fetch(`http://localhost:8000/api/exam-ai/submissions/${submissionId}/`, {
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) throw new Error("CSRF_ERROR");
        throw new Error(`Failed to load results: ${response.status}`);
      }
      
      const data = await response.json();
      setSubmission(data);
      
      if (!data.graded) {
        await triggerGrading();
      }
      
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.message === "CSRF_ERROR") {
        toast.error("CSRF error. Refreshing...");
        await fetch('http://localhost:8000/api/exam-ai/csrf/', { credentials: 'include' });
        setTimeout(() => fetchResults(), 1000);
      } else {
        toast.error(error.message || "Failed to load results");
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerGrading = async () => {
    try {
      setGrading(true);
      toast.info("📝 Grading your exam...");
      
      const csrfToken = getCsrfToken();
      
      const response = await fetch('http://localhost:8000/api/exam-ai/grading/grade_submission/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ submission_id: submissionId })
      });
      
      if (!response.ok) {
        if (response.status === 403) throw new Error("CSRF_ERROR");
        throw new Error(`Grading failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Refresh submission data
      const refreshedResponse = await fetch(`http://localhost:8000/api/exam-ai/submissions/${submissionId}/`, {
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken }
      });
      const refreshedData = await refreshedResponse.json();
      setSubmission(refreshedData);
      
      toast.success("✅ Grading complete!");
      
    } catch (error) {
      console.error("Grading error:", error);
      if (error.message === "CSRF_ERROR") {
        toast.error("CSRF error. Please refresh.");
      } else {
        toast.error("Failed to grade exam");
      }
    } finally {
      setGrading(false);
    }
  };

  const toggleAnswer = (answerId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const toggleSubAnswer = (answerId) => {
    setExpandedSubAnswers(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    submission?.answers?.forEach(answer => {
      allExpanded[answer.id] = true;
    });
    setExpandedAnswers(allExpanded);
  };

  const collapseAll = () => {
    setExpandedAnswers({});
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreBadge = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (percentage >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const downloadResults = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Results - ${submission?.exam_title || 'Exam Results'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; line-height: 1.6; }
            h1 { color: #1e3a8a; margin-bottom: 10px; }
            .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
            .score-card { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px; }
            .score-item { text-align: center; }
            .score-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
            .question { border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; border-radius: 12px; page-break-inside: avoid; }
            .sub-question { margin-left: 30px; border-left: 3px solid #f59e0b; padding-left: 15px; margin-top: 15px; }
            .correct { color: #16a34a; font-weight: bold; }
            .incorrect { color: #dc2626; font-weight: bold; }
            .feedback { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-top: 15px; border-radius: 8px; }
            @media print { body { padding: 20px; } .no-print { display: none; } .question { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 ${submission?.exam_title || 'Exam Results'}</h1>
            <p>Student: ${submission?.student_name || 'N/A'} (${submission?.student_email || 'N/A'})</p>
            <p>Date: ${new Date(submission?.submitted_at || submission?.started_at).toLocaleString()}</p>
          </div>
          <div class="score-card">
            <div class="score-item"><div>Total Score</div><div class="score-value"><strong>${submission?.total_score?.toFixed(1) || 0} / ${submission?.total_possible_marks || 0}</strong></div></div>
            <div class="score-item"><div>Percentage</div><div class="score-value"><strong>${((submission?.total_score / submission?.total_possible_marks) * 100).toFixed(1) || 0}%</strong></div></div>
            <div class="score-item"><div>Grade</div><div class="score-value"><strong>${getGradeLetter((submission?.total_score / submission?.total_possible_marks) * 100)}</strong></div></div>
            <div class="score-item"><div>Time Taken</div><div class="score-value"><strong>${formatTime(submission?.time_taken_seconds)}</strong></div></div>
          </div>
          <h2 style="margin-bottom: 20px;">Detailed Answers</h2>
          ${submission?.answers?.map((answer, index) => {
            const percentage = (answer.score / answer.question_marks) * 100;
            const isCorrect = percentage >= 70;
            const isSubQuestion = answer.is_sub_question;
            return `
              <div class="question" style="${isSubQuestion ? 'margin-left: 30px; border-left: 3px solid #f59e0b;' : ''}">
                <h3>${isSubQuestion ? 'Sub-Question' : 'Question'} ${index + 1} (${answer.question_type})</h3>
                <p><strong>Question:</strong> ${answer.question_text}</p>
                <p><strong>Your Answer:</strong> ${answer.answer_text || 'No answer provided'}</p>
                <p><strong>Correct Answer:</strong> ${answer.correct_answer || 'Not available'}</p>
                <p><strong>Score:</strong> <span class="${isCorrect ? 'correct' : 'incorrect'}">${answer.score?.toFixed(1)} / ${answer.question_marks}</span></p>
                ${answer.feedback ? `<div class="feedback"><strong>Feedback:</strong> ${answer.feedback}</div>` : ''}
                ${answer.calculation_steps ? `<div class="feedback" style="background:#f0f0f0;"><strong>Your Calculations:</strong> ${answer.calculation_steps}</div>` : ''}
              </div>
            `;
          }).join('')}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;"><p>Generated on ${new Date().toLocaleString()}</p></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter answers
  const filteredAnswers = submission?.answers?.filter(answer => {
    if (filterType === 'all') return true;
    if (filterType === 'correct') return answer.score >= (answer.question_marks * 0.7);
    if (filterType === 'partial') return answer.score > 0 && answer.score < (answer.question_marks * 0.7);
    if (filterType === 'incorrect') return answer.score === 0;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-6 text-xl font-semibold text-gray-700">
            {grading ? '🤖 Grading your exam...' : 'Loading results...'}
          </p>
          {grading && <p className="mt-2 text-gray-500">This may take a few moments</p>}
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md text-center border border-gray-200">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-6">No submission data found.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const percentage = submission.total_possible_marks 
    ? (submission.total_score / submission.total_possible_marks) * 100 
    : 0;
  
  const gradeLetter = getGradeLetter(percentage);
  const gradeColor = getScoreColor(percentage, 100);
  const gradeBgColor = percentage >= 80 ? 'bg-emerald-100' : percentage >= 60 ? 'bg-amber-100' : 'bg-red-100';

  const totalQuestions = submission.total_questions || submission.answers?.length || 0;
  const correctCount = submission.answers?.filter(a => a.score >= (a.question_marks * 0.7)).length || 0;
  const partialCount = submission.answers?.filter(a => a.score > 0 && a.score < (a.question_marks * 0.7)).length || 0;
  const incorrectCount = submission.answers?.filter(a => a.score === 0).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">📊 Exam Results</h1>
              <p className="text-gray-600 mt-1 text-lg">{submission.exam_title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">
                  Submitted on {new Date(submission.submitted_at || submission.started_at).toLocaleString()}
                </span>
                {submission.graded && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">✓ Graded</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white/70 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-gray-100 transition border border-gray-200">← Dashboard</button>
              <button onClick={downloadResults} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition">📥 Download PDF</button>
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm uppercase tracking-wide">Total Score</p><p className={`text-4xl font-bold ${getScoreColor(submission.total_score, submission.total_possible_marks)}`}>{submission.total_score?.toFixed(1) || 0}</p><p className="text-gray-500 text-sm">out of {submission.total_possible_marks || 0}</p></div>
              <div className="text-5xl">🏆</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm uppercase tracking-wide">Percentage</p><p className={`text-4xl font-bold ${gradeColor}`}>{percentage.toFixed(1)}%</p><p className="text-gray-500 text-sm">Grade</p></div>
              <div className={`w-16 h-16 rounded-full ${gradeBgColor} flex items-center justify-center text-2xl font-bold ${gradeColor} border`}>{gradeLetter}</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm uppercase tracking-wide">Time Taken</p><p className="text-4xl font-bold text-gray-800">{formatTime(submission.time_taken_seconds)}</p><p className="text-gray-500 text-sm">of {submission.exam_duration || 0} min</p></div>
              <div className="text-5xl">⏱️</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm uppercase tracking-wide">Questions</p><p className="text-4xl font-bold text-gray-800">{totalQuestions}</p><div className="flex gap-2 mt-1"><span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">✓ {correctCount}</span><span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">~ {partialCount}</span><span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">✗ {incorrectCount}</span></div></div>
              <div className="text-5xl">📝</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white/50"
            >
              <option value="all">All Questions ({totalQuestions})</option>
              <option value="correct">Correct ({correctCount})</option>
              <option value="partial">Partial ({partialCount})</option>
              <option value="incorrect">Incorrect ({incorrectCount})</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={expandAll} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">Expand All</button>
            <button onClick={collapseAll} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">Collapse All</button>
          </div>
        </div>

        {/* Performance by Type */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">📊 Performance by Question Type</h3>
          <div className="space-y-4">
            {Object.entries(
              submission.answers?.reduce((acc, a) => {
                const type = a.question_type;
                if (!acc[type]) acc[type] = { total: 0, earned: 0 };
                acc[type].total += a.question_marks;
                acc[type].earned += a.score;
                return acc;
              }, {}) || {}
            ).map(([type, data]) => {
              const typePercentage = (data.earned / data.total) * 100;
              return (
                <div key={type} className="flex items-center flex-wrap gap-2">
                  <span className="w-32 text-sm font-medium text-gray-600">{type}</span>
                  <div className="flex-1 min-w-[150px]">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${typePercentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : typePercentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} style={{ width: `${typePercentage}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium w-24 text-right text-gray-700">{data.earned.toFixed(1)} / {data.total}</span>
                  <span className="text-xs text-gray-400">({typePercentage.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Answers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6 border border-gray-200">
          <div className="p-6">
            <div className="space-y-4">
              {filteredAnswers?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No answers match the selected filter</p>
                </div>
              ) : (
                filteredAnswers?.map((answer, idx) => (
                  <div key={answer.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                    <div
                      onClick={() => toggleAnswer(answer.id)}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-medium text-gray-700 min-w-[50px]">
                          Q{idx + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreBadge(answer.score, answer.question_marks)}`}>
                          {answer.score?.toFixed(1)} / {answer.question_marks}
                        </span>
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          {answer.question_type}
                        </span>
                        <span className="text-sm text-gray-500 truncate max-w-md">
                          {answer.question_text?.substring(0, 70)}...
                        </span>
                        {answer.is_sub_question && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Sub-question</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xl">
                        {expandedAnswers[answer.id] ? '▼' : '▶'}
                      </span>
                    </div>

                    {expandedAnswers[answer.id] && (
                      <div className="p-6 border-t bg-white space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm">Q</span>
                              Question:
                            </p>
                            <div className="bg-indigo-50 p-4 rounded-xl">
                              <p className="text-gray-800 whitespace-pre-wrap">{answer.question_text}</p>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-sm">A</span>
                              Your Answer:
                            </p>
                            <div className={`p-4 rounded-xl ${answer.score >= (answer.question_marks * 0.7) ? 'bg-emerald-50' : answer.score > 0 ? 'bg-amber-50' : 'bg-red-50'}`}>
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {answer.answer_text || 'No answer provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">✓</span>
                            Correct Answer:
                          </p>
                          <div className="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {answer.correct_answer || 'Answer not available'}
                            </p>
                          </div>
                        </div>

                        {answer.calculation_steps && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm">📐</span>
                              Your Calculations:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-xl font-mono text-sm border border-gray-200">
                              <p className="text-gray-800 whitespace-pre-wrap">{answer.calculation_steps}</p>
                            </div>
                          </div>
                        )}

                        {answer.feedback && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm">📝</span>
                              Feedback:
                            </p>
                            <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-500">
                              <p className="text-gray-700 whitespace-pre-line">{answer.feedback}</p>
                            </div>
                          </div>
                        )}

                        {answer.sub_answers && answer.sub_answers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubAnswer(answer.id);
                              }}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              {expandedSubAnswers[answer.id] ? '▼ Hide' : '▶ Show'} Sub-answers
                            </button>
                            {expandedSubAnswers[answer.id] && (
                              <div className="mt-3 pl-4 space-y-3">
                                {answer.sub_answers.map((sub, subIdx) => (
                                  <div key={subIdx} className="border-l-2 border-orange-300 pl-3">
                                    <p className="text-sm font-medium text-orange-700">{sub.letter}) {sub.question_text}</p>
                                    <p className="text-sm mt-1 text-gray-600">Your answer: {sub.answer_text || 'No answer'}</p>
                                    <p className="text-sm text-emerald-600">Correct: {sub.correct_answer}</p>
                                    <p className="text-sm font-medium text-gray-700">Score: {sub.score}/{sub.marks}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/upload')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md transition-all">
            📝 Generate New Exam
          </button>
          <button onClick={downloadResults} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-md transition-all">
            📥 Download Results
          </button>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all">
            ← Dashboard
          </button>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-5 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📈 Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Average Score:</span> <span className="font-medium text-gray-800">{(submission.total_score / totalQuestions).toFixed(1)} marks</span></div>
            <div><span className="text-gray-500">Highest Score:</span> <span className="font-medium text-emerald-600">{Math.max(...(submission.answers?.map(a => a.score) || [0])).toFixed(1)}</span></div>
            <div><span className="text-gray-500">Lowest Score:</span> <span className="font-medium text-red-500">{Math.min(...(submission.answers?.map(a => a.score) || [0])).toFixed(1)}</span></div>
            <div><span className="text-gray-500">Time Efficiency:</span> <span className="font-medium text-gray-800">{((submission.time_taken_seconds / (submission.exam_duration * 60)) * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}