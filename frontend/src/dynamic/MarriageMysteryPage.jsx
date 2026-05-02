import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import axiosInstance, { ensureCsrfToken } from "../static/csrf";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Confetti from 'react-confetti';

export default function MarriageMysteryPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [sessionId] = useState(uuidv4());
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('quiz');
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const response = await axiosInstance.get('/api/marriage/questions/');
      setCategories(response.data);
      const flatQuestions = response.data.flatMap(cat => cat.questions);
      setQuestions(flatQuestions);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (!authLoading && !user) {
        toast.error("Please login first");
        navigate('/login');
        return;
      }
      await ensureCsrfToken();
      await fetchQuestions();
    };
    init();
  }, [user, authLoading]);

  // Handle answer selection
  const handleAnswer = (questionId, option) => {
    const updated = { ...answers, [questionId]: option };
    setAnswers(updated);
    
    if (currentIndex === questions.length - 1) {
      submitAnswers(updated);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  // Submit answers and go to photo page
  const submitAnswers = async (allAnswers) => {
    try {
      const csrfToken = await ensureCsrfToken();
      const payload = {
        session_id: sessionId,
        responses: Object.entries(allAnswers).map(([qId, opt]) => ({
          question: parseInt(qId),
          selected_option: opt.id
        }))
      };
      
      await axiosInstance.post('/api/marriage/questions/submit/', payload, {
        headers: { 'X-CSRFToken': csrfToken }
      });
      
      setStep('photo');
      toast.success("Questions completed! Now upload a photo");
      
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save answers");
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      return;
    }
    
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('session_id', sessionId);
    
    setAnalyzing(true);
    
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await axiosInstance.post('/api/marriage/facial/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-CSRFToken': csrfToken }
      });
      
      setStep('result');
      calculateCompatibility();
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error.response?.data?.error || "Failed to analyze photo");
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate compatibility
  const calculateCompatibility = async () => {
    try {
      const csrfToken = await ensureCsrfToken();
      const response = await axiosInstance.post('/api/marriage/compatibility/calculate/', {
        session_id: sessionId
      }, { headers: { 'X-CSRFToken': csrfToken } });
      
      setCompatibility(response.data);
      toast.success(`Compatibility: ${response.data.final_score}% - ${response.data.verdict}`);
    } catch (error) {
      console.error("Calculate error:", error);
      toast.error("Failed to calculate compatibility");
    }
  };

  const resetJourney = () => {
    setAnswers({});
    setCurrentIndex(0);
    setPhotoPreview(null);
    setCompatibility(null);
    setStep('quiz');
    window.location.reload();
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="text-5xl mb-4">💍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please login to discover your cosmic connection.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md">Go to Login</button>
        </div>
      </div>
    );
  }

  // Quiz Step
  if (step === 'quiz' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Marriage Mystery AI</h1>
            <p className="text-gray-500 mt-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-sm text-indigo-600 mt-1">
              Answered: {answeredCount} / {questions.length}
            </p>
          </div>
          
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="mb-4">
                  <span className="text-sm text-indigo-600 font-medium">
                    {currentQuestion.category?.name || 'Question'}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  {currentQuestion.text}
                </h2>
                <div className="space-y-3">
                  {currentQuestion.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[currentQuestion.id]?.id === option.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-between mt-6">
            {currentIndex > 0 && (
              <button
                onClick={handleBack}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Previous
              </button>
            )}
            <div className="text-sm text-gray-400 ml-auto">
              {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photo Upload Step
  if (step === 'photo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-200">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Upload Your Photo</h1>
            <p className="text-gray-600 mb-6">
              Upload a clear front facing photo for facial analysis.
              Your photo will be deleted immediately after processing.
            </p>
            
            {!photoPreview ? (
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  className="hidden"
                  disabled={analyzing}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-indigo-400 transition hover:bg-indigo-50/30">
                  <div className="text-5xl mb-3">📸</div>
                  <p className="text-gray-600">Click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">JPG PNG WEBP max 10MB</p>
                </div>
              </label>
            ) : (
              <div>
                <img src={photoPreview} alt="Preview" className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 border-2 border-indigo-200" />
                {analyzing && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-indigo-600">Analyzing your photo...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result Step
  if (step === 'result' && compatibility) {
    const isMatch = compatibility.is_match;
    const score = compatibility.final_score;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12 px-4">
        {isMatch && <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} recycle={false} />}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-200">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Your Compatibility Result</h1>
            
            <div className="w-48 h-48 mx-auto mb-6">
              <CircularProgressbar
                value={score}
                text={`${Math.round(score)}%`}
                styles={buildStyles({ 
                  textColor: isMatch ? '#7C3AED' : '#6B7280', 
                  pathColor: isMatch ? '#7C3AED' : '#9CA3AF', 
                  trailColor: '#EDE9FE' 
                })}
              />
            </div>
            
            <div className={`inline-block px-8 py-3 rounded-full text-2xl font-bold mb-6 ${
              isMatch 
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' 
                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
            }`}>
              {isMatch ? '💍 MATCH' : '💔 NO MATCH'}
            </div>
            
            <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-left border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Model Score:</span>
                  <span className="font-bold">{compatibility.model_score}/60</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Chance Score:</span>
                  <span className="font-bold">{compatibility.chance_score}/40</span>
                </div>
                {compatibility.same_gender_detected && (
                  <div className="flex justify-between text-amber-600">
                    <span>Gender Penalty:</span>
                    <span className="font-bold">-{compatibility.gender_penalty}</span>
                  </div>
                )}
                <div className="border-t border-indigo-200 pt-2 flex justify-between font-bold text-indigo-900">
                  <span>Final Score:</span>
                  <span>{compatibility.final_score}%</span>
                </div>
              </div>
            </div>
            
            {compatibility.detected_gender && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                <p className="text-blue-800">
                  🔍 Detected Gender: {compatibility.detected_gender === 'M' ? 'Male' : 'Female'}
                  {compatibility.user_gender && (
                    <span> | Your Gender: {compatibility.user_gender === 'M' ? 'Male' : 'Female'}</span>
                  )}
                </p>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
              <p className="text-indigo-700 italic text-lg">"{compatibility.cosmic_message}"</p>
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={resetJourney}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              >
                Start New Journey
              </button>
              <button
                onClick={() => navigate('/marriage-history')}
                className="px-6 py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition font-medium"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}