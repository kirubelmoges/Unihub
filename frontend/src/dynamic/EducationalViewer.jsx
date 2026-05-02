import React, { useState, useEffect } from 'react';
import axiosInstance from '../static/csrf';
import toast from 'react-hot-toast';

const EducationalViewer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [readLater, setReadLater] = useState([]);
  const [showReadLater, setShowReadLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Default Presentations
  const defaultPresentations = [
    {
      content_id: 'cs101',
      title: 'Introduction to Computer Science',
      source: 'oer',
      source_name: 'OER Commons',
      content_type: 'presentation',
      embed_url: 'https://docs.google.com/presentation/d/e/2PACX-1vQ7rX8qWEqL8kqWqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqY/embed',
      source_url: 'https://www.oercommons.org/courses/introduction-to-computer-science',
      thumbnail: 'https://img.youtube.com/vi/6JwEYamjXpA/mqdefault.jpg',
      description: 'Complete introduction to computer science concepts including programming fundamentals.',
      author: 'MIT OpenCourseWare',
      course_code: 'CS101'
    },
    {
      content_id: 'cs201',
      title: 'Data Structures and Algorithms',
      source: 'oer',
      source_name: 'OER Commons',
      content_type: 'presentation',
      embed_url: 'https://docs.google.com/presentation/d/e/2PACX-1vRkzX8qWEqL8kqWqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqY/embed',
      source_url: 'https://www.oercommons.org/courses/data-structures-and-algorithms',
      thumbnail: 'https://img.youtube.com/vi/RBSGKlAvoiM/mqdefault.jpg',
      description: 'Learn essential data structures: arrays, linked lists, trees, graphs, and algorithms.',
      author: 'Stanford University',
      course_code: 'CS201'
    },
    {
      content_id: 'web101',
      title: 'Web Development Fundamentals',
      source: 'oer',
      source_name: 'OER Commons',
      content_type: 'presentation',
      embed_url: 'https://docs.google.com/presentation/d/e/2PACX-1vRpWqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq/embed',
      source_url: 'https://www.oercommons.org/courses/web-development',
      thumbnail: 'https://img.youtube.com/vi/3JluqToq-6E/mqdefault.jpg',
      description: 'HTML, CSS, JavaScript, React - complete web development bootcamp.',
      author: 'FreeCodeCamp',
      course_code: 'WEB101'
    },
    {
      content_id: 'db301',
      title: 'Database Management Systems',
      source: 'oer',
      source_name: 'OER Commons',
      content_type: 'presentation',
      embed_url: 'https://docs.google.com/presentation/d/e/2PACX-1vRsWqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq/embed',
      source_url: 'https://www.oercommons.org/courses/database-systems',
      thumbnail: 'https://img.youtube.com/vi/4cWkVbC2bNE/mqdefault.jpg',
      description: 'SQL, database design, normalization, transactions, and management.',
      author: 'Harvard University',
      course_code: 'DB301'
    },
    {
      content_id: 'ai401',
      title: 'Artificial Intelligence Basics',
      source: 'oer',
      source_name: 'OER Commons',
      content_type: 'presentation',
      embed_url: 'https://docs.google.com/presentation/d/e/2PACX-1vRtWqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq/embed',
      source_url: 'https://www.oercommons.org/courses/ai-basics',
      thumbnail: 'https://img.youtube.com/vi/5NgNicANyqM/mqdefault.jpg',
      description: 'Introduction to AI, machine learning, neural networks, and deep learning.',
      author: 'Google AI',
      course_code: 'AI401'
    }
  ];

  useEffect(() => {
    fetchReadLater();
    setSearchResults(defaultPresentations);
    setCurrentContent(defaultPresentations[0]);
  }, []);

  const fetchReadLater = async () => {
    try {
      const response = await axiosInstance.get('/api/pdf/content/read-later/');
      setReadLater(response.data);
    } catch (error) {
      console.error('Failed to fetch read later:', error);
    }
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    // Filter presentations by search query
    const filtered = defaultPresentations.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.course_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setTimeout(() => {
      setSearchResults(filtered.length > 0 ? filtered : defaultPresentations);
      if (filtered.length > 0) {
        setCurrentContent(filtered[0]);
        toast.success(`Found ${filtered.length} results`);
      } else {
        toast.error('No results found. Showing default content.');
      }
      setSearching(false);
    }, 500);
  };

  const addToReadLater = async () => {
    if (!currentContent) return;
    
    setLoading(true);
    try {
      await axiosInstance.post('/api/pdf/content/save-for-later/', {
        content_id: currentContent.content_id,
        title: currentContent.title,
        source: currentContent.source,
        content_type: currentContent.content_type,
        embed_url: currentContent.embed_url,
        source_url: currentContent.source_url,
        thumbnail: currentContent.thumbnail,
        description: currentContent.description,
        author: currentContent.author,
        course_code: currentContent.course_code
      });
      toast.success('Added to Read Later! 📖');
      fetchReadLater();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromReadLater = async (contentId) => {
    try {
      await axiosInstance.delete(`/api/pdf/content/remove/${contentId}/`);
      toast.success('Removed from Read Later');
      fetchReadLater();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const playContent = (content) => {
    setCurrentContent(content);
    toast.success(`Now viewing: ${content.title}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchContent();
    }
  };

  const isInReadLater = (contentId) => {
    return readLater.some(item => item.content_id === contentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      {/* Header - YouTube Style */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="text-2xl">📚</div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">PPT Viewer</h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl min-w-[200px]">
              <div className="flex shadow-md rounded-full overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search presentations..."
                  className="w-full px-5 py-2.5 bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={searchContent}
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
            
            {/* Read Later Button */}
            <button
              onClick={() => setShowReadLater(!showReadLater)}
              className="relative flex items-center gap-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 px-4 py-2 rounded-full transition-all duration-300 border border-gray-200 shadow-sm"
            >
              <span className="text-xl">📖</span>
              <span className="text-gray-700 text-sm hidden sm:inline">Read Later</span>
              {readLater.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {readLater.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT ZONE - PPT Viewer (Like YouTube Video Player) */}
          <div className="flex-1">
            {currentContent ? (
              <div>
                {/* PPT Viewer */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                  <div className="relative pb-[56.25%] h-0">
                    <iframe
                      src={currentContent.embed_url}
                      title={currentContent.title}
                      className="absolute top-0 left-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
                
                {/* PPT Info */}
                <div className="mt-4">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="flex-1">
                      <h2 className="text-gray-800 font-bold text-xl">{currentContent.title}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-500 text-sm">{currentContent.author}</span>
                        <span className="text-gray-300 text-sm">•</span>
                        <span className="text-gray-400 text-sm">{currentContent.course_code}</span>
                      </div>
                    </div>
                    
                    {/* Save to Read Later Button */}
                    <button
                      onClick={addToReadLater}
                      disabled={loading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                        isInReadLater(currentContent.content_id)
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-default shadow-md'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md'
                      }`}
                    >
                      <span>{isInReadLater(currentContent.content_id) ? '✓' : '🔖'}</span>
                      <span>
                        {loading 
                          ? 'Saving...' 
                          : isInReadLater(currentContent.content_id) 
                            ? 'Saved to Read Later' 
                            : 'Save for Later'
                        }
                      </span>
                    </button>
                  </div>
                  
                  {/* Description */}
                  if (currentContent.description && (
                    <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <p className="text-gray-600 text-sm">{currentContent.description}</p>
                      <div className="mt-2">
                        <a
                          href={currentContent.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 text-sm hover:text-indigo-700 font-medium"
                        >
                          View original source →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200 shadow-xl">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-gray-800 text-xl mb-2">Select a presentation</h3>
                <p className="text-gray-500">Choose from the sidebar to start viewing</p>
              </div>
            )}
          </div>

          {/* RIGHT ZONE - Search Results / Recommendations */}
          <div className="lg:w-96">
            <div className="sticky top-20">
              <h3 className="text-gray-800 font-semibold mb-3">
                {searchQuery ? `Search Results (${searchResults.length})` : `Recommended for you (${searchResults.length})`}
              </h3>
              
              <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
                {searching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Searching...</p>
                  </div>
                ) : (
                  searchResults.map((content) => (
                    <div
                      key={content.content_id}
                      onClick={() => playContent(content)}
                      className={`group cursor-pointer transition-all duration-300 p-3 rounded-xl ${
                        currentContent?.content_id === content.content_id 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 shadow-md' 
                          : 'bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-gray-200'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-40">
                          <img
                            src={content.thumbnail}
                            alt={content.title}
                            className="w-full h-24 rounded-lg object-cover shadow-sm"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&h=90&fit=crop';
                            }}
                          />
                          {isInReadLater(content.content_id) && (
                            <div className="absolute top-1 right-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-1 shadow-md">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {content.title}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">{content.author}</p>
                          <p className="text-gray-400 text-xs">{content.course_code}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-gray-500">No results found</p>
                    <p className="text-gray-400 text-sm mt-1">Try different keywords</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* READ LATER SIDEBAR - Slide from right */}
      {showReadLater && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowReadLater(false)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform overflow-y-auto border-l border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    <span>📖</span> Read Later
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{readLater.length} saved items</p>
                </div>
                <button
                  onClick={() => setShowReadLater(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Read Later List */}
            <div className="p-4 space-y-3">
              {readLater.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">📚</div>
                  <p className="text-gray-500">Your Read Later list is empty</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click "Save for Later" on any presentation
                  </p>
                </div>
              ) : (
                readLater.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-3 hover:bg-indigo-50 cursor-pointer group transition-all duration-300 border border-gray-200"
                    onClick={() => {
                      playContent({
                        content_id: item.content_id,
                        title: item.title,
                        source: item.source,
                        source_name: item.source === 'oer' ? 'OER Commons' : 'MIT OCW',
                        content_type: item.content_type,
                        embed_url: item.embed_url,
                        source_url: item.source_url,
                        thumbnail: item.thumbnail,
                        description: item.description,
                        author: item.author,
                        course_code: item.course_code
                      });
                      setShowReadLater(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-20 h-14 rounded-lg object-cover shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=60&fit=crop';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-medium truncate">{item.title}</p>
                        <p className="text-gray-500 text-xs mt-1">{item.author}</p>
                        <p className="text-gray-400 text-xs">{item.course_code}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Saved: {new Date(item.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromReadLater(item.content_id);
                        }}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
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
          border-radius: 10px;
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

export default EducationalViewer;