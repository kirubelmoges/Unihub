import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./context";
import axios from "axios";

export default function AuthStatus() {
  const { user } = useContext(AuthContext);
  const [csrfToken, setCsrfToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCsrfFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') return value;
    }
    return null;
  };

  const getSessionFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionid') return value;
    }
    return null;
  };

  const fetchCsrfFromServer = async () => {
    try {
      const response = await axios.get('/api/exam-ai/csrf/', {
        withCredentials: true
      });
      if (response.data.csrfToken) {
        document.cookie = `csrftoken=${response.data.csrfToken}; path=/; SameSite=Lax`;
        setCsrfToken(response.data.csrfToken);
      }
    } catch (error) {
      console.error("CSRF fetch failed:", error);
    }
  };

  const refreshStatus = () => {
    setCsrfToken(getCsrfFromCookie());
    setSessionId(getSessionFromCookie());
    setLoading(false);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">🔐 Authentication Status</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-gray-600">User</span>
          <span className="font-medium text-green-600">{user?.username || 'Not logged in'}</span>
        </div>
        
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-gray-600">CSRF Token</span>
          <span className={`font-mono text-sm ${csrfToken ? 'text-green-600' : 'text-red-600'}`}>
            {csrfToken ? csrfToken.substring(0, 20) + '...' : 'Not found'}
          </span>
        </div>
        
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-gray-600">Session Cookie</span>
          <span className={`font-medium ${sessionId ? 'text-green-600' : 'text-red-600'}`}>
            {sessionId ? '✅ Present' : '❌ Missing'}
          </span>
        </div>
        
        <button
          onClick={() => {
            fetchCsrfFromServer();
            setTimeout(refreshStatus, 500);
          }}
          className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Status
        </button>
        
        {!sessionId && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            ⚠️ Session missing. Please login at: 
            <a href="/login" className="ml-2 text-blue-600 underline">Login Page</a>
            {' or '}
            <a href="http://localhost:8000/admin/login/" target="_blank" className="text-blue-600 underline">
              Django Admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}