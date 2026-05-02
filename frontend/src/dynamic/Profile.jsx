import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../static/context";

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Determine which user to show (if userId in URL show that user, else show current user)
  const targetUserId = userId || currentUser?.id;

  useEffect(() => {
    // Check authentication first
    if (!currentUser) {
      setError("Please login to view profiles");
      setLoading(false);
      return;
    }

    if (targetUserId) {
      fetchUserProfile(targetUserId);
    }
  }, [currentUser, targetUserId]);

  const fetchUserProfile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // If viewing own profile, use /profile/ endpoint
      // If viewing another user, use /user/{id}/ endpoint
      const endpoint = id === currentUser?.id ? '/profile/' : `/user/${id}/`;
      
      const response = await axios.get(endpoint);
      
      console.log('Profile loaded:', response.data);
      setProfileData(response.data);
      
    } catch (err) {
      console.error('Error:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else {
        setError('Failed to load profile. Please try again.');
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
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
            onClick={() => navigate('/profiles')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
          >
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 flex items-center justify-center">
        <p className="text-gray-500">No profile data found.</p>
      </div>
    );
  }

  // Extract user and profile data based on your API structure
  const userData = profileData.user;
  const profile = profileData.profile;

  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.id === userData?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-4">
              {/* Profile Image */}
              <img
                src={profile?.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop"}
                alt={userData?.username}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              
              <div className="mt-4 md:mt-0 md:ml-4 flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {userData?.full_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || userData?.username}
                </h1>
                <p className="text-gray-500">@{userData?.username}</p>
                
                {/* User Type Badge */}
                {profile?.student_or_instractor && (
                  <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full capitalize font-medium">
                    {profile.student_or_instractor}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 md:mt-0">
                {isOwnProfile ? (
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-2 rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-md">
                    Follow
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 border-t border-gray-200 pt-4">
              <div>
                <span className="font-bold text-gray-800">0</span>
                <span className="text-gray-500 ml-1">Posts</span>
              </div>
              <div>
                <span className="font-bold text-gray-800">0</span>
                <span className="text-gray-500 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-800">0</span>
                <span className="text-gray-500 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Personal Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Info
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800 break-words">{userData?.email || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium text-gray-800">{userData?.username}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-800">
                  {userData?.date_joined 
                    ? new Date(userData.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium text-gray-800">
                  {userData?.last_login 
                    ? new Date(userData.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Column - Academic Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Academic Info
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">University</p>
                <p className="font-medium text-gray-800">{profile?.university || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-800">{profile?.department || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">ID Number</p>
                <p className="font-medium text-gray-800">{profile?.id_no || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-medium text-gray-800">{profile?.country || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Additional Info
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-800 capitalize">
                  {profile?.student_or_instractor?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Study Level</p>
                <p className="font-medium text-gray-800 capitalize">
                  {profile?.grad_undergrad?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Career Year</p>
                <p className="font-medium text-gray-800">{profile?.career_year || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {profile?.description && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mt-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              About
            </h2>
            <p className="text-gray-600">{profile.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;