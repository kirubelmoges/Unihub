import React, { useState, useEffect } from 'react';
import axiosInstance from '../static/csrf';
import toast from 'react-hot-toast';

const YouTubePlayer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default video
  const [currentVideoTitle, setCurrentVideoTitle] = useState('Never Gonna Give You Up');
  const [watchAgain, setWatchAgain] = useState([]);
  const [showWatchAgain, setShowWatchAgain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // YouTube API Key - Get from Google Cloud Console (free)
  const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE';

  useEffect(() => {
    fetchWatchAgain();
    // Load trending videos on first load
    searchTrendingVideos();
  }, []);

  const fetchWatchAgain = async () => {
    try {
      const response = await axiosInstance.get('/videos/list/');
      setWatchAgain(response.data);
    } catch (error) {
      console.error('Failed to fetch watch again:', error);
    }
  };

  const searchTrendingVideos = async () => {
    setSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        setSearchResults(data.items);
      }
    } catch (error) {
      console.error('Failed to load trending:', error);
    } finally {
      setSearching(false);
    }
  };

  const searchVideos = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        setSearchResults(data.items);
        toast.success(`Found ${data.items.length} videos`);
      } else {
        toast.error('No videos found');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search videos');
    } finally {
      setSearching(false);
    }
  };

  const playVideo = (videoId, title) => {
    setVideoId(videoId);
    setCurrentVideoTitle(title);
    toast.success(`Now playing: ${title}`);
  };

  const saveToWatchAgain = async () => {
    setLoading(true);
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      await axiosInstance.post('/videos/save/', { video_url: videoUrl });
      toast.success('Saved to Watch Again!');
      fetchWatchAgain();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchAgain = async (videoId) => {
    try {
      await axiosInstance.delete(`/videos/remove/${videoId}/`);
      toast.success('Removed from Watch Again');
      fetchWatchAgain();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchVideos();
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      {/* Header with Search */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🎬</div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">VideoHub</h1>
              </div>
              <button
                onClick={() => setShowWatchAgain(!showWatchAgain)}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg md:hidden"
              >
                <span>📚</span>
                {watchAgain.length > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {watchAgain.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Search Bar - Like YouTube */}
            <div className="flex-1 max-w-2xl w-full">
              <div className="flex shadow-md rounded-full overflow-hidden">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search videos..."
                    className="w-full px-5 py-2.5 bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={searchVideos}
                  disabled={searching}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 transition-all duration-300 disabled:opacity-50"
                >
                  {searching ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🔍'
                  )}
                </button>
              </div>
            </div>
            
            {/* Watch Again Button - Desktop */}
            <button
              onClick={() => setShowWatchAgain(!showWatchAgain)}
              className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/90 transition-colors border border-gray-200 shadow-sm"
            >
              <span>📚</span>
              <span className="text-gray-700 text-sm">Watch Again</span>
              {watchAgain.length > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {watchAgain.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Video Player */}
          <div className="flex-1">
            <div className="sticky top-20">
              {/* Video Player */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title="YouTube video player"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex-1">
                      <h2 className="text-gray-800 font-semibold text-lg">{currentVideoTitle}</h2>
                      <p className="text-gray-500 text-sm mt-1">Video ID: {videoId}</p>
                    </div>
                    <button
                      onClick={saveToWatchAgain}
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 shadow-md"
                    >
                      <span>🔖</span>
                      <span>{loading ? 'Saving...' : 'Save to Watch Later'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Sidebar */}
          <div className="lg:w-96">
            <div className="sticky top-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span>{searchQuery ? '🔍 Search Results' : '🔥 Trending Now'}</span>
                    {searching && <span className="text-sm text-gray-400">Loading...</span>}
                  </h3>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {searchResults.length === 0 && !searching ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-3">🎬</div>
                      <p className="text-gray-500">Search for videos</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Try searching for music, tutorials, or entertainment
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {searchResults.map((video) => (
                        <div
                          key={video.id.videoId || video.id}
                          onClick={() => playVideo(
                            video.id.videoId || video.id,
                            video.snippet.title
                          )}
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={video.snippet.thumbnails.medium.url}
                                alt={video.snippet.title}
                                className="w-40 h-24 rounded-lg object-cover shadow-sm"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100">
                                  <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-full p-2 shadow-md">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-sm font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {video.snippet.title}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                {video.snippet.channelTitle}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(video.snippet.publishedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Again Sidebar - Slide from right */}
      {showWatchAgain && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setShowWatchAgain(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-lg">📚 Watch Again</h3>
                <button
                  onClick={() => setShowWatchAgain(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {watchAgain.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">🎬</div>
                  <p className="text-gray-500">No saved videos</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click "Save" on any video
                  </p>
                </div>
              ) : (
                watchAgain.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-3 hover:bg-indigo-50 cursor-pointer group transition-all duration-300 border border-gray-200"
                    onClick={() => {
                      setVideoId(item.video_id);
                      setShowWatchAgain(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <img
                        src={`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`}
                        alt="thumbnail"
                        className="w-24 h-14 rounded-lg object-cover shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-medium truncate">
                          Video: {item.video_id}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(item.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchAgain(item.video_id);
                        }}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          borderRadius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
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
};

export default YouTubePlayer;