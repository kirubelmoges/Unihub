import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./context"; // Ensure this path is correct
import { fetchCsrfToken } from "./csrf"; // Use the helper we built

export default function Login() {
  const { login, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 1. PRIME CSRF ON MOUNT
   * This ensures that when the user clicks "Login", 
   * the CSRF cookie is already present in the browser.
   */
  useEffect(() => {
    const initLogin = async () => {
      try {
        await fetchCsrfToken();
      } catch (err) {
        console.error("Failed to initialize CSRF for login:", err);
      }
    };
    initLogin();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username or Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 2. The AuthContext login function uses axiosInstance
      // This will handle the withCredentials: true automatically
      await login(formData);
      
      // 3. Success! Redirect to your diagnostic page
      navigate("/home1"); 
    } catch (err) {
      console.error("Login component caught error:", err);
      
      // Parse the error message from Django
      const backendMessage = 
        err.response?.data?.error || 
        err.response?.data?.detail || 
        "Invalid username or password. Please try again.";
        
      setServerError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gray-900">Welcome</span>{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Back</span>
          </div>
          <p className="text-gray-500 text-sm">
            Sign in to your account
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            create a new student profile
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl border border-gray-200 rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Server Error Alert */}
            {serverError && (
              <div className="rounded-xl bg-red-50/80 backdrop-blur-sm p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">{serverError}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Username/Email */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Username or Email
              </label>
              <div className="mt-1">
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 sm:text-sm ${
                    errors.username ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="kirubel"
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="mt-2 text-xs text-red-500 font-medium">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 sm:text-sm ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02] ${
                  (isLoading || authLoading) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}