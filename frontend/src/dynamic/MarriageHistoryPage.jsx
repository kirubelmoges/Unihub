import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import axiosInstance from "../static/csrf";
import { toast } from "react-toastify";

export default function MarriageHistoryPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get('/api/marriage/results/history/');
      setResults(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      
      if (error.response?.status === 403) {
        toast.error("Session expired. Please refresh the page.");
      } else {
        toast.error("Failed to load history");
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
    
    if (user) {
      fetchHistory();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Your Match History</h1>
          <button 
            onClick={() => navigate('/marriage')}
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            ← Back to Test
          </button>
        </div>
        
        {results.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Results Yet</h2>
            <p className="text-gray-500 mb-6">Take your first compatibility test to see results here!</p>
            <button 
              onClick={() => navigate('/marriage')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
            >
              Start Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {new Date(result.created_at).toLocaleDateString()} at {new Date(result.created_at).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        result.is_match 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {result.is_match ? '💍 MATCH' : '💔 NO MATCH'}
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {Math.round(result.final_score)}%
                      </span>
                    </div>
                    {result.same_gender_penalty_applied && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Gender penalty applied
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/marriage-result/${result.id}`)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}