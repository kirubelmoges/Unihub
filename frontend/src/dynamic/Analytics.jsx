import { useEffect, useState, useMemo } from "react";
import axios from "axios";

function Analytics() {
  const [analyticsList, setAnalyticsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://127.0.0.1:8000/analytics/analytics/');
        setAnalyticsList(response.data);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const leftGridCards = [
    {
      id: "Web-Design",
      title: "Create a university hear",
      description: "Build your own digital campus with custom departments, courses, and learning paths.",
      icon: "M4 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H4zM14 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM4 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H4zM14 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z",
    },
    {
      id: "free-support",
      title: "Free Support",
      description: "24/7 assistance whenever you need it",
      icon: "M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5zM15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z",
    },
    {
      id: "mobile-app",
      title: "Connect with anyone important",
      description: "Face to face connections with mentors, peers, and experts worldwide.",
      icon: "M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 1v6h8V7H6z",
    },
    {
      id: "cloud-storage",
      title: "Play games",
      description: "Discover your cosmic connection through playful compatibility tests",
      icon: "M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5zm1 2v6h8V7H6z",
    },
  ];

  const rightCards = useMemo(() => [...analyticsList], [analyticsList]);

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            </div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      <div className="container mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-gray-200 shadow-md">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Campus Insights Live
          </div>
          
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gray-900">Smart</span>{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Performance
            </span>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View your learning journey and campus insights instantly
          </p>
        </div>

        {/* Two Column Layout: Left = What We Do, Right = 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          
          {/* LEFT COLUMN - What We Do Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="space-y-6">
              <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              <h3 className="text-sm text-indigo-600 font-semibold tracking-wider uppercase">
                What We Do?
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                At our Digital University, we provide a comprehensive online learning experience designed for modern students. 
                Learners can attend interactive classes, take exams, and view their results seamlessly through our platform. 
                We also offer tools to explore career opportunities, engage in real-time chats via text and video, and communicate 
                directly with instructors for guidance and collaboration.
              </p>
              <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-100">
                <p className="text-indigo-800 font-medium text-sm">
                  ✨ Our goal is to create a connected, engaging, and accessible learning environment where students can study, 
                  interact, and grow academically and professionally, all in one integrated platform.
                </p>
              </div>
              <a 
                href="/login" 
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg gap-2"
              >
                Explore Platform
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN - 2x2 Grid Cards */}
          <div className="grid grid-cols-2 gap-4 content-start">
            {leftGridCards.map((item, index) => (
              <div 
                key={item.id} 
                className="group cursor-pointer transition-all duration-300 hover:-translate-y-2"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 hover:border-indigo-300 transition-all duration-300 h-full hover:shadow-xl">
                  <div className="space-y-3">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg 
                        className={`w-6 h-6 text-indigo-600 transition-all duration-300 ${hoveredCard === index ? 'scale-110' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d={item.icon} />
                      </svg>
                    </div>
                    
                    {/* Title */}
                    <h4 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                      {item.title}
                    </h4>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                    
                    {/* Link */}
                    <a 
                      href="#!" 
                      className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-all duration-300 gap-1"
                    >
                      Learn More
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Section Below */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {analyticsList.length + 4}
            </div>
            <div className="text-gray-500 text-xs mt-1">Total Services</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-gray-500 text-xs mt-1">Support Available</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              1000+
            </div>
            <div className="text-gray-500 text-xs mt-1">Happy Students</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-center border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              50+
            </div>
            <div className="text-gray-500 text-xs mt-1">Expert Instructors</div>
          </div>
        </div>

        {/* Analytics Cards Grid Below */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Analytics Dashboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rightCards.map((item, index) => (
              <div 
                key={item?.id || index} 
                className="group cursor-pointer transition-all duration-300 hover:-translate-y-2"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 transition-all duration-300 h-full hover:shadow-xl">
                  <h4 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {item?.title || "Analytics Item"}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {item?.description || "Analytics data will appear here"}
                  </p>
                  {item?.value && (
                    <p className="text-2xl font-bold mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Analytics;