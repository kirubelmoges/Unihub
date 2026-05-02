import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../static/context";
import { UserCircleIcon, UsersIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import One from "../assets/One.png";
import axios from "axios";

export default function Home1() {
  const [scrolled, setScrolled] = useState(false);
  const [showFloating, setShowFloating] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout/', {}, { withCredentials: true });
      localStorage.removeItem('user');
      if (setUser) setUser(null);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
      window.location.reload();
    }
  };

  // Logo Component inline
  const Logo = ({ variant = "default", className = "" }) => {
    const variants = {
      navbar: (
        <Link to="/" className={`flex items-center gap-2 group ${className}`}>
          <div className="flex flex-row items-center gap-2">
            <div className="font-poppins text-2xl font-medium flex gap-1">
              <span className="text-red-500">U</span>
              <span className="text-blue-500">n</span>
              <span className="text-yellow-500">i</span>
              <span className="text-green-500">H</span>
              <span className="text-purple-500">U</span>
              <span className="text-orange-500">b</span>
            </div>
            <img src={One} alt="UniHub Icon" className="h-8 w-8" />
          </div>
        </Link>
      ),
      hero: (
        <Link to="/" className={`flex flex-col items-center gap-3 group ${className}`}>
          <div className="flex flex-col items-center">
            <div className="font-poppins text-5xl md:text-6xl font-medium flex gap-2">
              <span className="text-red-500 drop-shadow-lg">U</span>
              <span className="text-blue-500 drop-shadow-lg">n</span>
              <span className="text-yellow-500 drop-shadow-lg">i</span>
              <span className="text-green-500 drop-shadow-lg">H</span>
              <span className="text-purple-500 drop-shadow-lg">U</span>
              <span className="text-orange-500 drop-shadow-lg">b</span>
            </div>
            <img src={One} alt="UniHub Icon" className="h-16 w-16 mt-2" />
          </div>
        </Link>
      ),
      footer: (
        <Link to="/" className={`flex flex-col items-center gap-2 group ${className}`}>
          <div className="flex flex-row items-center gap-2">
            <img src={One} alt="UniHub Icon" className="h-8 w-8" />
            <div className="font-poppins text-xl font-medium flex gap-1">
              <span className="text-red-500">U</span>
              <span className="text-blue-500">n</span>
              <span className="text-yellow-500">i</span>
              <span className="text-green-500">H</span>
              <span className="text-purple-500">U</span>
              <span className="text-orange-500">b</span>
            </div>
          </div>
        </Link>
      ),
      default: (
        <Link to="/" className={`flex items-center gap-2 group ${className}`}>
          <div className="font-poppins text-2xl font-medium flex gap-1">
            <span className="text-red-500">U</span>
            <span className="text-blue-500">n</span>
            <span className="text-yellow-500">i</span>
            <span className="text-green-500">H</span>
            <span className="text-purple-500">U</span>
            <span className="text-orange-500">b</span>
          </div>
          <img src={One} alt="UniHub Icon" className="h-8 w-8" />
        </Link>
      )
    };
    return variants[variant] || variants.default;
  };

  const apps = [
    {
      id: 1,
      name: "Communicate",
      description: "Real-time messaging with friends and colleagues",
      icon: "💬",
      color: "from-blue-500 to-cyan-500",
      link: "/chat",
      type: "logo"
    },
    {
      id: 2,
      name: "Webcam",
      description: "High-quality video conferencing for remote meetings",
      icon: "🎥",
      color: "from-purple-500 to-pink-500",
      link: "/vidiochat",
      type: "logo"
    },
    {
      id: 3,
      name: "Examine Yourself",
      description: "Take online exams and track your performance",
      icon: "📝",
      color: "from-red-500 to-orange-500",
      link: "/dashboard",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
      type: "image"
    },
    {
      id: 4,
      name: "Task Scheduler",
      description: "Organize your daily tasks and boost productivity",
      icon: "✅",
      color: "from-green-500 to-emerald-500",
      link: "/TaskScheduler",
      type: "logo"
    },
    {
      id: 5,
      name: "Internship",
      description: "Find and apply for internships at top companies",
      icon: "💼",
      color: "from-indigo-500 to-blue-500",
      link: "/StudentSide",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop",
      type: "image"
    },
    {
      id: 6,
      name: "Book Library",
      description: "Discover, read, and save your favorite books",
      icon: "📚",
      color: "from-yellow-500 to-amber-500",
      link: "/BookViewer",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=400&fit=crop",
      type: "image"
    },
    {
      id: 7,
      name: "From YouTube",
      description: "Stream and watch educational and entertainment videos",
      icon: "🎬",
      color: "from-rose-500 to-red-500",
      link: "/YouTubePlayer",
      type: "logo"
    },
    {
      id: 8,
      name: "PDF Reader",
      description: "View, edit, and manage all your PDF documents",
      icon: "📄",
      color: "from-gray-500 to-slate-500",
      link: "/EducationalViewer",
      type: "logo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      
      {/* Floating Elements */}
      {showFloating && (
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 space-y-4">
          <Link to="/marriage" className="block group">
            <div className="relative w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 overflow-hidden cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop" 
                alt="Wedding"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/60 to-rose-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-white text-xs font-bold text-center px-1">Will she be my queen?</span>
              </div>
            </div>
          </Link>

          <Link to="/TaskScheduler" className="block group">
            <div className="relative w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 overflow-hidden cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop" 
                alt="Calendar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/60 to-emerald-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-white text-xs font-bold">Task</span>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setShowFloating(false)}
            className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-gray-700 transition-colors shadow-lg mx-auto"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Navigation Toolbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-lg" : "bg-white/70 backdrop-blur-sm"
      } border-b border-gray-200`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Logo variant="navbar" />

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Contact</Link>
              
              {/* Profile Dropdown - Only show if user is logged in */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    Profile
                    <svg className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-50 py-2 border border-gray-200">
                      {/* My Profile */}
                      <Link 
                        to="/profile" 
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      
                      {/* Community / All Profiles */}
                      <Link 
                        to="/profiles" 
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <UsersIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Community</span>
                      </Link>
                      
                      {/* Logout */}
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full border-t border-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-8 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Logo variant="hero" className="justify-center mb-6" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Your All-in-One Digital Learning Platform
          </h1>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
              Get Started Free
            </Link>
            <Link to="#apps" className="px-6 py-2.5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg font-semibold border border-gray-200 hover:border-indigo-300 transition-all">
              Explore Apps
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="relative group">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">9+</div>
              <div className="text-gray-500 text-sm">Applications</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="relative group">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">1000+</div>
              <div className="text-gray-500 text-sm">Active Users</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="relative group">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">24/7</div>
              <div className="text-gray-500 text-sm">Support Available</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="relative group">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">50+</div>
              <div className="text-gray-500 text-sm">Expert Instructors</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Grid Section */}
      <section id="apps" className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              <span className="text-gray-900">Explore Our</span>{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Applications</span>
            </h2>
          </div>

          {/* Image Cards - Full Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {apps.filter(app => app.type === "image").map((app) => (
              <Link to={app.link} key={app.id}>
                <div className="group cursor-pointer transition-all duration-300 hover:-translate-y-2">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg h-64">
                    <img 
                      src={app.image} 
                      alt={app.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{app.icon}</span>
                        <h3 className="text-2xl font-bold text-white">{app.name}</h3>
                      </div>
                      <p className="text-white/80 text-sm">{app.description}</p>
                      <div className="mt-3 inline-flex items-center text-white text-sm font-medium gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        Launch App
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Logo Cards - Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {apps.filter(app => app.type === "logo").map((app, index) => (
              <Link to={app.link} key={app.id}>
                <div 
                  className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 hover:border-indigo-300 transition-all duration-300 text-center hover:shadow-xl">
                    <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${app.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md`}>
                      <span className="text-3xl">{app.icon}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{app.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4"></div>
              <h2 className="text-2xl font-bold mb-3">
                <span className="text-gray-900">Why Choose</span>{' '}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">UniHub?</span>
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                UniHub is a comprehensive digital learning platform designed to provide students and instructors with all the tools they need in one place.
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">All-in-One Platform</h4>
                    <p className="text-xs text-gray-500">Access all learning tools from a single dashboard</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Real-Time Communication</h4>
                    <p className="text-xs text-gray-500">Chat and video call with peers and instructors</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Career Opportunities</h4>
                    <p className="text-xs text-gray-500">Find internships and job opportunities</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonials */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-gray-800">What Our Users Say</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-600 italic text-sm">"UniHub has transformed the way I learn. Everything I need is in one place!"</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">- Sarah Johnson, Student</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-600 italic text-sm">"The video call feature is amazing for my online classes. Highly recommended!"</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">- Michael Chen, Instructor</p>
                </div>
                <div>
                  <p className="text-gray-600 italic text-sm">"The internship site helped me land my dream job. Thank you UniHub!"</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">- Emily Rodriguez, Graduate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Ready to Get Started?
            </h2>
            <p className="text-indigo-100 mb-5 text-sm">
              Join thousands of students and instructors using UniHub today
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="px-6 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md">
                Sign Up Now
              </Link>
              <Link to="/login" className="px-6 py-2 bg-transparent border-2 border-white text-white rounded-lg text-sm font-semibold hover:bg-white/10 transition-all duration-300">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo variant="footer" />
            <div className="text-center text-gray-400 text-xs">
              © 2024 UniHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}