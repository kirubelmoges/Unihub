import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import axiosInstance from "../static/csrf";
import { toast } from "react-toastify";

export default function MarriageResultDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = async () => {
    try {
      const response = await axiosInstance.get(`/api/marriage/results/${id}/`);
      setResult(response.data);
    } catch (error) {
      console.error("Failed to fetch result:", error);
      
      if (error.response?.status === 404) {
        toast.error("Result not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied or session expired");
      } else {
        toast.error("Failed to load result");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user && id) {
      fetchResult();
    }
  }, [user, authLoading, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Result Not Found</h2>
          <p className="text-gray-600 mb-6">The match result you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/marriage-history')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const isMatch = result.is_match;
  const score = result.final_score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/marriage-history')}
          className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          ← Back to History
        </button>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Your Compatibility Result</h1>
          
          {/* Score Circle */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="#EDE9FE"
                strokeWidth="10"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isMatch ? "#7C3AED" : "#9CA3AF"}
                strokeWidth="10"
                strokeDasharray={`${score * 2.83} 283`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text
                x="50" y="50"
                textAnchor="middle"
                dy="0.3em"
                className="text-2xl font-bold"
                fill={isMatch ? "#7C3AED" : "#6B7280"}
              >
                {Math.round(score)}%
              </text>
            </svg>
          </div>
          
          {/* Verdict Badge */}
          <div className={`inline-block px-8 py-3 rounded-full text-2xl font-bold mb-6 ${
            isMatch 
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' 
              : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
          }`}>
            {isMatch ? '💍 MATCH' : '💔 NO MATCH'}
          </div>
          
          {/* Date */}
          <p className="text-sm text-gray-500 mb-4">
            {new Date(result.created_at).toLocaleDateString()} at {new Date(result.created_at).toLocaleTimeString()}
          </p>
          
          {/* Score Breakdown */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-left border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-3">Score Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Model Score (AI Analysis):</span>
                <span className="font-bold">{result.model_score}/60</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Chance Score (Cosmic Luck):</span>
                <span className="font-bold">{result.chance_score}/40</span>
              </div>
              {result.same_gender_penalty_applied && (
                <div className="flex justify-between text-amber-600">
                  <span>Gender Penalty:</span>
                  <span className="font-bold">-{result.gender_penalty_amount}</span>
                </div>
              )}
              <div className="border-t border-indigo-200 pt-2 flex justify-between font-bold text-indigo-900">
                <span>Final Score:</span>
                <span>{result.final_score}%</span>
              </div>
            </div>
          </div>
          
          {/* Gender Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <p className="text-blue-800 text-sm">
              🔍 Detected Gender: {result.detected_gender === 'M' ? 'Male' : result.detected_gender === 'F' ? 'Female' : 'Unknown'}
              {result.user_gender && (
                <span> | Your Gender: {result.user_gender === 'M' ? 'Male' : 'Female'}</span>
              )}
            </p>
          </div>
          
          {/* Cosmic Message */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
            <p className="text-indigo-700 italic text-lg">"{result.cosmic_message}"</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/marriage')}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
            >
              Start New Journey
            </button>
            <button
              onClick={() => navigate('/marriage-history')}
              className="px-6 py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition font-medium"
            >
              View All History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}