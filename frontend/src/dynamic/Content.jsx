import One from "../assets/One.png";
import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../static/context";

// Configure axios exactly like your working test
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

function Content() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication first
    if (!user) {
      setError("Please login to view departments");
      setLoading(false);
      return;
    }

    fetchDepartments();
  }, [user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using the exact URL you specified
      const response = await axios.get('/department/departments/');
      
      console.log('Departments loaded:', response.data);
      
      // Handle the response data
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.results) {
        setDepartments(response.data.results);
      } else {
        setDepartments([]);
      }
      
    } catch (err) {
      console.error('Error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Departments endpoint not found. Check URL.');
      } else {
        setError('Failed to load departments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle menu toggle
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-6 rounded-xl max-w-md w-full">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDepartments}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-4">
            
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="font-poppins text-3xl font-bold flex gap-1">
                <span className="text-red-500">U</span>
                <span className="text-blue-500">n</span>
                <span className="text-yellow-500">i</span>
                <span className="text-green-500">H</span>
                <span className="text-purple-500">U</span>
                <span className="text-orange-500">b</span>
              </div>
              <img src={One} alt="icon" className="h-10 w-10 group-hover:scale-110 transition-transform duration-300" />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Books Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu('books')}
                  className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Books
                  <svg className={`w-4 h-4 transition-transform ${openMenu === 'books' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMenu === 'books' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-50 py-2 border border-gray-200">
                    <Link to="/engineeringbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Engineering</Link>
                    <Link to="/healthbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Health Science</Link>
                    <Link to="/naturalbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Natural Science</Link>
                    <Link to="/socialbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Social Science</Link>
                    <Link to="/hljcbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Other Social</Link>
                    <Link to="/educationbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Education Science</Link>
                    <Link to="/artbooks" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Art & Music</Link>
                  </div>
                )}
              </div>

              {/* Videos Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu('videos')}
                  className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Videos
                  <svg className={`w-4 h-4 transition-transform ${openMenu === 'videos' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMenu === 'videos' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-50 py-2 border border-gray-200">
                    <Link to="/engineeringvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Engineering</Link>
                    <Link to="/healthvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Health Science</Link>
                    <Link to="/naturalvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Natural Science</Link>
                    <Link to="/socialvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Social Science</Link>
                    <Link to="/hljcvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Other Social</Link>
                    <Link to="/educationvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Education Science</Link>
                    <Link to="/artvideos" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Art & Music</Link>
                  </div>
                )}
              </div>

              {/* PowerPoints Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu('ppt')}
                  className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  PowerPoints
                  <svg className={`w-4 h-4 transition-transform ${openMenu === 'ppt' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMenu === 'ppt' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-50 py-2 border border-gray-200">
                    <Link to="/engineeringppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Engineering</Link>
                    <Link to="/healthppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Health Science</Link>
                    <Link to="/naturalppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Natural Science</Link>
                    <Link to="/socialppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Social Science</Link>
                    <Link to="/hljcppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Other Social</Link>
                    <Link to="/educationppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Education Science</Link>
                    <Link to="/artppt" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Art & Music</Link>
                  </div>
                )}
              </div>

              {/* Exams Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu('exams')}
                  className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Exams
                  <svg className={`w-4 h-4 transition-transform ${openMenu === 'exams' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMenu === 'exams' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-50 py-2 border border-gray-200">
                    <Link to="/engineeringexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Engineering</Link>
                    <Link to="/healthexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Health Science</Link>
                    <Link to="/naturalexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Natural Science</Link>
                    <Link to="/socialexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Social Science</Link>
                    <Link to="/hljcexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Other Social</Link>
                    <Link to="/educationexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Education Science</Link>
                    <Link to="/artexams" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Art & Music</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <input
                type="text"
                name="search"
                placeholder="Search..."
                className="flex-1 md:w-80 px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-r-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Search
              </button>
            </form>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-gray-700 text-sm bg-gray-100 px-3 py-1.5 rounded-full">
                  {user.username}
                </span>
                <Link
                  to="/profile"
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Academic Departments
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore our wide range of academic departments and discover learning resources
          </p>
        </div>
        
        {departments.length === 0 ? (
          <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-gray-500">No departments available</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-2 border border-gray-200"
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={dept.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop'}
                    alt={dept.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {dept.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {dept.description || 'No description available'}
                  </p>
                  <Link
                    to={`/department/${dept.id}`}
                    className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-all gap-1 group-hover:gap-2"
                  >
                    View Department
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Content;