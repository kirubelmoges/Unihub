import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../static/context";

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

function ProfilesList() {
  const [profiles, setProfiles] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication first
    if (!user) {
      setError("Please login to view profiles");
      setLoading(false);
      return;
    }

    fetchAllProfiles();
  }, [user]);

  const fetchAllProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // You need to create this endpoint in Django
      // This should return a list of users with their profiles
      const response = await axios.get('/users/');
      
      console.log('Profiles loaded:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setProfiles(response.data);
      } else if (response.data.results) {
        setProfiles(response.data.results);
      } else if (response.data.users) {
        setProfiles(response.data.users);
      } else {
        setProfiles([]);
      }
      
    } catch (err) {
      console.error('Error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Users endpoint not found. Please create /users/ endpoint in Django.');
      } else {
        setError('Failed to load profiles. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
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
            onClick={fetchAllProfiles}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Community Members</h1>
          <p className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium">{profiles.length} members</p>
        </div>

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-800">No profiles found</h3>
            <p className="mt-2 text-gray-500">Check back later for new members.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profileItem) => {
              // Handle different response structures
              const userData = profileItem.user || profileItem;
              const profileData = profileItem.profile || profileItem;
              
              return (
                <Link
                  key={userData.id}
                  to={`/profile/${userData.id}`}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 border border-gray-200"
                >
                  <div className="relative">
                    {/* Cover gradient */}
                    <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    
                    {/* Profile Image */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-10">
                      <img
                        src={profileData?.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"}
                        alt={userData?.username}
                        className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop";
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-12 pb-6 px-4 text-center">
                    <h3 className="font-semibold text-gray-800">
                      {userData?.full_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || userData?.username}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">@{userData?.username}</p>
                    
                    {/* Role Badge */}
                    {profileData?.student_or_instractor && (
                      <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize font-medium">
                        {profileData.student_or_instractor}
                      </span>
                    )}
                    
                    {/* University */}
                    {profileData?.university && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                        {profileData.university}
                      </p>
                    )}
                    
                    {/* Department */}
                    {profileData?.department && (
                      <p className="text-xs text-gray-400">
                        {profileData.department}
                      </p>
                    )}

                    {/* View Profile Button */}
                    <div className="mt-4">
                      <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                        View Profile
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilesList;