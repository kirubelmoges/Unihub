import React, { useState, useEffect } from 'react';
import axiosInstance from '../static/csrf';
import toast from 'react-hot-toast';

const BookViewer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [readLater, setReadLater] = useState([]);
  const [showReadLater, setShowReadLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const defaultBooks = [
    {
      id: 'TheAdventuresOfSherlockHolmes',
      title: 'The Adventures of Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      cover: 'https://archive.org/services/img/TheAdventuresOfSherlockHolmes',
      description: 'A collection of twelve short stories featuring the famous detective Sherlock Holmes.',
      year: '1892',
      language: 'English'
    },
    {
      id: 'frankenstein',
      title: 'Frankenstein',
      author: 'Mary Shelley',
      cover: 'https://archive.org/services/img/frankenstein',
      description: 'The classic gothic novel about Victor Frankenstein and his creature.',
      year: '1818',
      language: 'English'
    },
    {
      id: 'prideandprejudice',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      cover: 'https://archive.org/services/img/prideandprejudice',
      description: 'A romantic novel of manners set in Georgian England.',
      year: '1813',
      language: 'English'
    },
    {
      id: 'mobydick',
      title: 'Moby-Dick',
      author: 'Herman Melville',
      cover: 'https://archive.org/services/img/mobydick',
      description: 'The saga of Captain Ahab and his obsessive quest for the white whale.',
      year: '1851',
      language: 'English'
    },
    {
      id: 'greatgatsby',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      cover: 'https://archive.org/services/img/greatgatsby',
      description: 'A story of wealth, love, and the American Dream in the Jazz Age.',
      year: '1925',
      language: 'English'
    },
    {
      id: 'dracula',
      title: 'Dracula',
      author: 'Bram Stoker',
      cover: 'https://archive.org/services/img/dracula',
      description: 'The classic vampire novel that defined the genre.',
      year: '1897',
      language: 'English'
    }
  ];

  useEffect(() => {
    fetchReadLater();
    setSearchResults(defaultBooks);
    setCurrentBook(defaultBooks[0]);
  }, []);

  const fetchReadLater = async () => {
    try {
      const response = await axiosInstance.get('/books/read-later/');
      setReadLater(response.data);
    } catch (error) {
      console.error('Failed to fetch read later:', error);
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    try {
      const response = await axiosInstance.get(`/books/search/?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.data.results && response.data.results.length > 0) {
        setSearchResults(response.data.results);
        setCurrentBook(response.data.results[0]);
        toast.success(`Found ${response.data.results.length} books`);
      } else {
        setSearchResults(defaultBooks);
        toast.error('No results found. Showing featured books.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(defaultBooks);
      toast.error('Search failed. Showing featured books.');
    } finally {
      setSearching(false);
    }
  };

  const loadBook = async (book) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/books/book/${book.id}/`);
      setCurrentBook(response.data);
      toast.success(`Now reading: ${response.data.title}`);
    } catch (error) {
      toast.error('Failed to load book');
      setCurrentBook(book);
    } finally {
      setLoading(false);
    }
  };

  const addToReadLater = async () => {
    if (!currentBook) return;
    
    setLoading(true);
    try {
      const bookData = {
        book_id: currentBook.id,
        title: currentBook.title,
        author: currentBook.author,
        embed_url: currentBook.embed_url || `https://archive.org/download/${currentBook.id}/${currentBook.id}.pdf`,
        source_url: currentBook.source_url || `https://archive.org/details/${currentBook.id}`,
        thumbnail: currentBook.cover,
        description: currentBook.description,
        year: currentBook.year,
        language: currentBook.language
      };
      
      await axiosInstance.post('/books/save-for-later/', bookData);
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

  const removeFromReadLater = async (bookId) => {
    try {
      await axiosInstance.delete(`/books/remove/${bookId}/`);
      toast.success('Removed from Read Later');
      fetchReadLater();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  const isInReadLater = (bookId) => {
    return readLater.some(item => item.book_id === bookId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">📚</div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">BookHub</h1>
                <p className="text-xs text-gray-500">Internet Archive Books</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl min-w-[200px]">
              <div className="flex shadow-md rounded-full overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search millions of free books, texts, and documents..."
                  className="w-full px-5 py-2.5 bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={searchBooks}
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
          {/* LEFT - Book Viewer (PDF Reader) */}
          <div className="flex-1">
            {currentBook ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                {/* PDF Viewer */}
                <div className="relative bg-gray-100 min-h-[600px]">
                  <iframe
                    src={`https://archive.org/embed/${currentBook.id}?&zoom=1`}
                    title={currentBook.title}
                    className="w-full h-[600px]"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                
                {/* Book Info */}
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="flex-1">
                      <h2 className="text-gray-900 font-bold text-xl">{currentBook.title}</h2>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-gray-600 text-sm">By {currentBook.author}</span>
                        {currentBook.year && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-500 text-sm">{currentBook.year}</span>
                          </>
                        )}
                        {currentBook.language && (
                          <>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-500 text-sm">{currentBook.language}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={addToReadLater}
                      disabled={loading}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ${
                        isInReadLater(currentBook.id)
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-default shadow-md'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span>{isInReadLater(currentBook.id) ? '✓' : '🔖'}</span>
                      <span>
                        {loading 
                          ? 'Saving...' 
                          : isInReadLater(currentBook.id) 
                            ? 'Saved to Read Later' 
                            : 'Read Later'
                      }
                      </span>
                    </button>
                  </div>
                  
                  {/* Description */}
                  {currentBook.description && (
                    <div className="mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-700 text-sm leading-relaxed">{currentBook.description}</p>
                      <div className="mt-2">
                        <a
                          href={`https://archive.org/details/${currentBook.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 text-sm hover:text-indigo-700 font-medium"
                        >
                          View on Internet Archive →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200 shadow-xl">
                <div className="text-6xl mb-4 animate-bounce">📚</div>
                <h3 className="text-gray-800 text-xl mb-2 font-semibold">Welcome to BookHub</h3>
                <p className="text-gray-500">Search millions of free books from Internet Archive</p>
              </div>
            )}
          </div>

          {/* RIGHT - Book List */}
          <div className="lg:w-96">
            <div className="sticky top-20">
              <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2 text-lg">
                <span className="text-xl">📚</span>
                {searchQuery ? `Search Results (${searchResults.length})` : `Featured Books (${searchResults.length})`}
              </h3>
              
              <div className="space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
                {searching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Searching...</p>
                  </div>
                ) : (
                  searchResults.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => loadBook(book)}
                      className={`group cursor-pointer transition-all duration-300 p-3 rounded-xl ${
                        currentBook?.id === book.id 
                          ? 'bg-indigo-50 border-l-4 border-indigo-500 shadow-md' 
                          : 'bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-gray-200'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Book Cover Thumbnail */}
                        <div className="relative flex-shrink-0 w-16 h-20">
                          <img
                            src={book.cover || `https://archive.org/services/img/${book.id}`}
                            alt={book.title}
                            className="w-full h-full rounded-lg object-cover shadow-md"
                            onError={(e) => {
                              e.target.src = 'https://archive.org/images/favicon.ico';
                            }}
                          />
                          {isInReadLater(book.id) && (
                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-0.5 shadow-md">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {book.title}
                          </p>
                          <p className="text-gray-500 text-xs mt-1 truncate">{book.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {book.year && (
                              <p className="text-gray-400 text-xs">{book.year}</p>
                            )}
                            {book.language && (
                              <>
                                <span className="text-gray-300 text-xs">•</span>
                                <p className="text-gray-400 text-xs">{book.language}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-gray-500">No books found</p>
                    <p className="text-gray-400 text-sm mt-1">Try searching for "science", "history", "fiction"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* READ LATER SIDEBAR */}
      {showReadLater && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowReadLater(false)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform overflow-y-auto border-l border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800 text-xl flex items-center gap-2">
                    <span>📖</span> Read Later
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{readLater.length} saved books</p>
                </div>
                <button
                  onClick={() => setShowReadLater(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
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
                    Click "Read Later" on any book you want to save
                  </p>
                </div>
              ) : (
                readLater.map((book) => (
                  <div
                    key={book.id}
                    className="bg-gray-50 rounded-xl p-3 hover:bg-indigo-50 cursor-pointer group transition-all duration-300 border border-gray-200"
                    onClick={() => {
                      loadBook({
                        id: book.book_id,
                        title: book.title,
                        author: book.author,
                        cover: book.thumbnail,
                        description: book.description,
                        year: book.year,
                        language: book.language
                      });
                      setShowReadLater(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <img
                        src={book.thumbnail || `https://archive.org/services/img/${book.book_id}`}
                        alt={book.title}
                        className="w-12 h-16 rounded-lg object-cover shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://archive.org/images/favicon.ico';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-medium truncate">{book.title}</p>
                        <p className="text-gray-500 text-xs mt-1 truncate">{book.author}</p>
                        {book.year && (
                          <p className="text-gray-400 text-xs mt-1">{book.year}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          Saved: {new Date(book.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromReadLater(book.book_id);
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

export default BookViewer;