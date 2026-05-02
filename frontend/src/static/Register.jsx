import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./context";

export default function Register() {
  const { register, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
    id_no: "",
    country: "",
    university: "",
    student_or_instractor: "",
    department: "",
    career_year: "",
    grad_undergrad: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.password2) {
      newErrors.password2 = "Please confirm your password";
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }
    
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.student_or_instractor) {
      newErrors.student_or_instractor = "Please select user type";
    }
    
    if (!formData.country) {
      newErrors.country = "Country is required";
    }
    
    return newErrors;
  };

  const handleNextStep = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    
    // Validate step 2
    const step2Errors = validateStep2();
    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      navigate("/login"); 
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response) {
        if (err.response.data.error) {
          setServerError(err.response.data.error);
        } else if (err.response.data.message) {
          setServerError(err.response.data.message);
        } else if (typeof err.response.data === 'object') {
          // Handle field errors
          setErrors(err.response.data);
        } else {
          setServerError("Registration failed. Please try again.");
        }
      } else if (err.code === 'ERR_NETWORK') {
        setServerError("Cannot connect to server. Please check your internet connection.");
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gray-900">Create</span>{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Account</span>
          </div>
          <p className="text-gray-500">Join our community </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header with Steps */}
          <div className="bg-white/50 backdrop-blur-sm px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Register</h2>
              <span className="text-sm text-gray-500">Step {currentStep} of 2</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: currentStep === 1 ? '50%' : '100%' }}
              ></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Server Error Message */}
            {serverError && (
              <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-4 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{serverError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Bereket"
                      disabled={isLoading || authLoading}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Moges"
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ${
                      errors.username ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Bereket123"
                    disabled={isLoading || authLoading}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="bereket@example.com"
                    disabled={isLoading || authLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 transition-all duration-300 ${
                        errors.password ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="********"
                      disabled={isLoading || authLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 transition-all duration-300 ${
                        errors.password2 ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="********"
                      disabled={isLoading || authLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password2 && (
                    <p className="mt-1 text-sm text-red-500">{errors.password2}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Profile Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Profile Information</h3>
                
                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="id_no"
                    value={formData.id_no}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your ID number"
                    disabled={isLoading || authLoading}
                  />
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="student_or_instractor"
                    value={formData.student_or_instractor}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ${
                      errors.student_or_instractor ? 'border-red-500' : 'border-gray-200'
                    }`}
                    disabled={isLoading || authLoading}
                  >
                    <option value="">Select user type</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                  {errors.student_or_instractor && (
                    <p className="mt-1 text-sm text-red-500">{errors.student_or_instractor}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ${
                      errors.country ? 'border-red-500' : 'border-gray-200'
                    }`}
                    disabled={isLoading || authLoading}
                  >
                    <option value="">Select country</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                  )}
                </div>

                {/* University */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your university"
                    disabled={isLoading || authLoading}
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., Computer Science"
                    disabled={isLoading || authLoading}
                  />
                </div>

                {/* Study Level & Career Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Study Level
                    </label>
                    <select
                      name="grad_undergrad"
                      value={formData.grad_undergrad}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      disabled={isLoading || authLoading}
                    >
                      <option value="">Select level</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Career Year
                    </label>
                    <input
                      type="number"
                      name="career_year"
                      value={formData.career_year}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="e.g., 2024"
                      min="1900"
                      max="2100"
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                >
                  Previous
                </button>
              )}
              
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className={`flex-1 py-3 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 transform hover:scale-[1.02] ${
                    (isLoading || authLoading) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {(isLoading || authLoading) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            © 2024 Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}