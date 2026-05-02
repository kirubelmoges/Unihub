/// frontend/src/pages/DepartmentLibrary.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../static/context';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { Link, useParams, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

// Department Data Structure with search subjects
const DEPARTMENTS = {
  ENGINEERING: {
    id: 'engineering',
    name: 'Faculty of Engineering',
    icon: '🔧',
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    departments: [
      { id: 'mechanical', name: 'Mechanical Engineering', bookCount: 1250, icon: '⚙️', searchSubjects: ['Mechanical Engineering', 'Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Robotics', 'Manufacturing'] },
      { id: 'electrical', name: 'Electrical Engineering', bookCount: 980, icon: '⚡', searchSubjects: ['Electrical Engineering', 'Electronics', 'Power Systems', 'Circuit Analysis', 'Control Systems'] },
      { id: 'civil', name: 'Civil Engineering', bookCount: 1100, icon: '🏗️', searchSubjects: ['Civil Engineering', 'Structural Engineering', 'Construction', 'Geotechnical Engineering', 'Transportation'] },
      { id: 'computer', name: 'Computer Engineering', bookCount: 1500, icon: '💻', searchSubjects: ['Computer Engineering', 'Computer Architecture', 'Embedded Systems', 'Digital Logic', 'Hardware Design'] },
      { id: 'chemical', name: 'Chemical Engineering', bookCount: 850, icon: '🧪', searchSubjects: ['Chemical Engineering', 'Process Engineering', 'Thermodynamics', 'Reaction Engineering', 'Separation Processes'] },
      { id: 'biomedical', name: 'Biomedical Engineering', bookCount: 620, icon: '🫀', searchSubjects: ['Biomedical Engineering', 'Medical Devices', 'Biomaterials', 'Tissue Engineering', 'Bioinstrumentation'] },
      { id: 'aerospace', name: 'Aerospace Engineering', bookCount: 450, icon: '✈️', searchSubjects: ['Aerospace Engineering', 'Aerodynamics', 'Propulsion', 'Flight Mechanics', 'Spacecraft Design'] },
      { id: 'industrial', name: 'Industrial Engineering', bookCount: 780, icon: '🏭', searchSubjects: ['Industrial Engineering', 'Operations Research', 'Supply Chain', 'Quality Control', 'Ergonomics'] },
    ]
  },
  SCIENCE: {
    id: 'science',
    name: 'Faculty of Science',
    icon: '🔬',
    color: 'from-green-500 to-green-700',
    bgColor: 'bg-green-50',
    departments: [
      { id: 'physics', name: 'Physics', bookCount: 2100, icon: '⚛️', searchSubjects: ['Physics', 'Quantum Mechanics', 'Astrophysics', 'Nuclear Physics', 'Optics', 'Thermodynamics'] },
      { id: 'chemistry', name: 'Chemistry', bookCount: 1800, icon: '🧪', searchSubjects: ['Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Biochemistry', 'Analytical Chemistry'] },
      { id: 'biology', name: 'Biology', bookCount: 1950, icon: '🧬', searchSubjects: ['Biology', 'Molecular Biology', 'Genetics', 'Ecology', 'Cell Biology', 'Evolution'] },
      { id: 'mathematics', name: 'Mathematics', bookCount: 2300, icon: '📐', searchSubjects: ['Mathematics', 'Calculus', 'Algebra', 'Geometry', 'Statistics', 'Number Theory'] },
      { id: 'computer_science', name: 'Computer Science', bookCount: 3200, icon: '💻', searchSubjects: ['Computer Science', 'Programming', 'Algorithms', 'Data Structures', 'Software Development'] },
      { id: 'statistics', name: 'Statistics', bookCount: 1200, icon: '📊', searchSubjects: ['Statistics', 'Data Analysis', 'Probability', 'Regression', 'Biostatistics'] },
      { id: 'geology', name: 'Geology', bookCount: 890, icon: '⛰️', searchSubjects: ['Geology', 'Mineralogy', 'Petrology', 'Stratigraphy', 'Paleontology'] },
      { id: 'environmental', name: 'Environmental Science', bookCount: 950, icon: '🌍', searchSubjects: ['Environmental Science', 'Ecology', 'Climate Change', 'Conservation', 'Pollution Control'] },
    ]
  },
  MEDICINE: {
    id: 'medicine',
    name: 'Faculty of Medicine',
    icon: '🏥',
    color: 'from-red-500 to-red-700',
    bgColor: 'bg-red-50',
    departments: [
      { id: 'general_medicine', name: 'General Medicine', bookCount: 2450, icon: '🩺', searchSubjects: ['Medicine', 'Clinical Medicine', 'Internal Medicine', 'Diagnosis', 'Treatment'] },
      { id: 'surgery', name: 'Surgery', bookCount: 1200, icon: '🔪', searchSubjects: ['Surgery', 'Surgical Techniques', 'Operative Surgery', 'Minimally Invasive Surgery'] },
      { id: 'pediatrics', name: 'Pediatrics', bookCount: 890, icon: '👶', searchSubjects: ['Pediatrics', 'Child Health', 'Neonatology', 'Pediatric Diseases'] },
      { id: 'cardiology', name: 'Cardiology', bookCount: 760, icon: '❤️', searchSubjects: ['Cardiology', 'Heart Diseases', 'Cardiovascular Medicine', 'ECG'] },
      { id: 'neurology', name: 'Neurology', bookCount: 650, icon: '🧠', searchSubjects: ['Neurology', 'Brain Disorders', 'Neuroscience', 'Stroke'] },
      { id: 'pharmacy', name: 'Pharmacy', bookCount: 980, icon: '💊', searchSubjects: ['Pharmacy', 'Pharmacology', 'Clinical Pharmacy', 'Drug Development'] },
      { id: 'nursing', name: 'Nursing', bookCount: 1100, icon: '👩‍⚕️', searchSubjects: ['Nursing', 'Patient Care', 'Clinical Nursing', 'Nursing Practice'] },
      { id: 'dentistry', name: 'Dentistry', bookCount: 720, icon: '🦷', searchSubjects: ['Dentistry', 'Oral Health', 'Dental Surgery', 'Orthodontics'] },
    ]
  },
  BUSINESS: {
    id: 'business',
    name: 'School of Business',
    icon: '💼',
    color: 'from-amber-500 to-amber-700',
    bgColor: 'bg-amber-50',
    departments: [
      { id: 'accounting', name: 'Accounting', bookCount: 1450, icon: '💰', searchSubjects: ['Accounting', 'Financial Accounting', 'Managerial Accounting', 'Auditing'] },
      { id: 'finance', name: 'Finance', bookCount: 1320, icon: '📈', searchSubjects: ['Finance', 'Corporate Finance', 'Investment', 'Financial Management'] },
      { id: 'marketing', name: 'Marketing', bookCount: 1100, icon: '📢', searchSubjects: ['Marketing', 'Digital Marketing', 'Consumer Behavior', 'Brand Management'] },
      { id: 'management', name: 'Management', bookCount: 1580, icon: '📊', searchSubjects: ['Management', 'Business Management', 'Organizational Behavior', 'Leadership'] },
      { id: 'economics', name: 'Economics', bookCount: 2100, icon: '📉', searchSubjects: ['Economics', 'Microeconomics', 'Macroeconomics', 'Econometrics'] },
      { id: 'entrepreneurship', name: 'Entrepreneurship', bookCount: 890, icon: '🚀', searchSubjects: ['Entrepreneurship', 'Startup', 'Business Planning', 'Innovation'] },
      { id: 'hr', name: 'Human Resources', bookCount: 720, icon: '👥', searchSubjects: ['Human Resources', 'HR Management', 'Talent Management', 'Recruitment'] },
      { id: 'supply_chain', name: 'Supply Chain', bookCount: 650, icon: '🚚', searchSubjects: ['Supply Chain', 'Logistics', 'Operations Management', 'Inventory'] },
    ]
  },
  LAW: {
    id: 'law',
    name: 'Faculty of Law',
    icon: '⚖️',
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    departments: [
      { id: 'constitutional', name: 'Constitutional Law', bookCount: 890, icon: '📜', searchSubjects: ['Constitutional Law', 'Constitution', 'Public Law', 'Fundamental Rights'] },
      { id: 'criminal', name: 'Criminal Law', bookCount: 760, icon: '🔒', searchSubjects: ['Criminal Law', 'Criminal Justice', 'Penal Law', 'Criminal Procedure'] },
      { id: 'civil_law', name: 'Civil Law', bookCount: 820, icon: '🏛️', searchSubjects: ['Civil Law', 'Tort Law', 'Contract Law', 'Property Law'] },
      { id: 'corporate', name: 'Corporate Law', bookCount: 680, icon: '🏢', searchSubjects: ['Corporate Law', 'Business Law', 'Company Law', 'Securities Law'] },
      { id: 'international', name: 'International Law', bookCount: 590, icon: '🌐', searchSubjects: ['International Law', 'Public International Law', 'Treaties', 'International Relations'] },
      { id: 'human_rights', name: 'Human Rights Law', bookCount: 540, icon: '🤝', searchSubjects: ['Human Rights', 'International Human Rights Law', 'Civil Rights'] },
      { id: 'tax', name: 'Tax Law', bookCount: 480, icon: '📑', searchSubjects: ['Tax Law', 'Taxation', 'Income Tax', 'Corporate Tax'] },
      { id: 'environmental_law', name: 'Environmental Law', bookCount: 450, icon: '🌿', searchSubjects: ['Environmental Law', 'Climate Change Law', 'Natural Resources Law'] },
    ]
  },
  ARTS_HUMANITIES: {
    id: 'arts',
    name: 'Faculty of Arts & Humanities',
    icon: '🎨',
    color: 'from-pink-500 to-pink-700',
    bgColor: 'bg-pink-50',
    departments: [
      { id: 'history', name: 'History', bookCount: 2450, icon: '📜', searchSubjects: ['History', 'World History', 'Ancient History', 'Modern History'] },
      { id: 'literature', name: 'Literature', bookCount: 2100, icon: '📖', searchSubjects: ['Literature', 'English Literature', 'Comparative Literature', 'Poetry'] },
      { id: 'philosophy', name: 'Philosophy', bookCount: 1800, icon: '🤔', searchSubjects: ['Philosophy', 'Ethics', 'Metaphysics', 'Epistemology', 'Logic'] },
      { id: 'linguistics', name: 'Linguistics', bookCount: 1200, icon: '🗣️', searchSubjects: ['Linguistics', 'Language', 'Phonetics', 'Syntax', 'Semantics'] },
      { id: 'art_history', name: 'Art History', bookCount: 980, icon: '🖼️', searchSubjects: ['Art History', 'Visual Arts', 'Renaissance Art', 'Modern Art'] },
      { id: 'music', name: 'Music', bookCount: 890, icon: '🎵', searchSubjects: ['Music', 'Music Theory', 'Music History', 'Composition'] },
      { id: 'theater', name: 'Theater Arts', bookCount: 650, icon: '🎭', searchSubjects: ['Theater', 'Drama', 'Performance Studies', 'Acting'] },
      { id: 'anthropology', name: 'Anthropology', bookCount: 1100, icon: '🗿', searchSubjects: ['Anthropology', 'Cultural Anthropology', 'Social Anthropology', 'Archaeology'] },
    ]
  },
  SOCIAL_SCIENCES: {
    id: 'social',
    name: 'Faculty of Social Sciences',
    icon: '🌍',
    color: 'from-teal-500 to-teal-700',
    bgColor: 'bg-teal-50',
    departments: [
      { id: 'psychology', name: 'Psychology', bookCount: 2100, icon: '🧠', searchSubjects: ['Psychology', 'Clinical Psychology', 'Cognitive Psychology', 'Developmental Psychology'] },
      { id: 'sociology', name: 'Sociology', bookCount: 1850, icon: '👥', searchSubjects: ['Sociology', 'Social Theory', 'Social Research', 'Urban Sociology'] },
      { id: 'political_science', name: 'Political Science', bookCount: 1650, icon: '🏛️', searchSubjects: ['Political Science', 'Political Theory', 'Comparative Politics', 'International Relations'] },
      { id: 'geography', name: 'Geography', bookCount: 1420, icon: '🗺️', searchSubjects: ['Geography', 'Physical Geography', 'Human Geography', 'GIS'] },
      { id: 'social_work', name: 'Social Work', bookCount: 1200, icon: '🤝', searchSubjects: ['Social Work', 'Social Welfare', 'Community Development', 'Counseling'] },
      { id: 'communication', name: 'Communication', bookCount: 1100, icon: '📺', searchSubjects: ['Communication', 'Mass Communication', 'Media Studies', 'Journalism'] },
      { id: 'journalism', name: 'Journalism', bookCount: 980, icon: '📰', searchSubjects: ['Journalism', 'News Writing', 'Broadcast Journalism', 'Digital Media'] },
      { id: 'international_relations', name: 'International Relations', bookCount: 890, icon: '🌐', searchSubjects: ['International Relations', 'Global Politics', 'Diplomacy', 'Foreign Policy'] },
    ]
  },
  EDUCATION: {
    id: 'education',
    name: 'College of Education',
    icon: '📚',
    color: 'from-orange-500 to-orange-700',
    bgColor: 'bg-orange-50',
    departments: [
      { id: 'elementary', name: 'Elementary Education', bookCount: 1450, icon: '📘', searchSubjects: ['Elementary Education', 'Primary Education', 'Teaching Methods', 'Early Childhood'] },
      { id: 'secondary', name: 'Secondary Education', bookCount: 1320, icon: '📗', searchSubjects: ['Secondary Education', 'High School Teaching', 'Curriculum Development'] },
      { id: 'special_ed', name: 'Special Education', bookCount: 890, icon: '🤗', searchSubjects: ['Special Education', 'Inclusive Education', 'Learning Disabilities'] },
      { id: 'educational_leadership', name: 'Educational Leadership', bookCount: 780, icon: '🎓', searchSubjects: ['Educational Leadership', 'School Administration', 'Educational Management'] },
      { id: 'curriculum', name: 'Curriculum & Instruction', bookCount: 920, icon: '📋', searchSubjects: ['Curriculum', 'Instructional Design', 'Educational Technology'] },
      { id: 'ed_psychology', name: 'Educational Psychology', bookCount: 850, icon: '🧠', searchSubjects: ['Educational Psychology', 'Learning Theories', 'Child Development'] },
      { id: 'tesol', name: 'TESOL', bookCount: 670, icon: '🌏', searchSubjects: ['TESOL', 'ESL', 'Language Teaching', 'Applied Linguistics'] },
      { id: 'early_childhood', name: 'Early Childhood', bookCount: 980, icon: '🧸', searchSubjects: ['Early Childhood Education', 'Preschool', 'Child Development'] },
    ]
  },
  AGRICULTURE: {
    id: 'agriculture',
    name: 'Faculty of Agriculture',
    icon: '🌾',
    color: 'from-lime-500 to-lime-700',
    bgColor: 'bg-lime-50',
    departments: [
      { id: 'agronomy', name: 'Agronomy', bookCount: 1100, icon: '🌽', searchSubjects: ['Agronomy', 'Crop Science', 'Soil Management', 'Sustainable Agriculture'] },
      { id: 'animal_science', name: 'Animal Science', bookCount: 980, icon: '🐄', searchSubjects: ['Animal Science', 'Livestock', 'Animal Nutrition', 'Animal Breeding'] },
      { id: 'horticulture', name: 'Horticulture', bookCount: 890, icon: '🌺', searchSubjects: ['Horticulture', 'Plant Science', 'Gardening', 'Floriculture'] },
      { id: 'food_science', name: 'Food Science', bookCount: 760, icon: '🍎', searchSubjects: ['Food Science', 'Food Technology', 'Food Safety', 'Nutrition'] },
      { id: 'agricultural_economics', name: 'Agricultural Economics', bookCount: 680, icon: '💰', searchSubjects: ['Agricultural Economics', 'Farm Management', 'Agribusiness'] },
      { id: 'plant_pathology', name: 'Plant Pathology', bookCount: 590, icon: '🌿', searchSubjects: ['Plant Pathology', 'Plant Diseases', 'Phytopathology'] },
      { id: 'soil_science', name: 'Soil Science', bookCount: 550, icon: '🪨', searchSubjects: ['Soil Science', 'Soil Chemistry', 'Soil Physics', 'Pedology'] },
      { id: 'veterinary', name: 'Veterinary Medicine', bookCount: 720, icon: '🐕', searchSubjects: ['Veterinary Medicine', 'Animal Health', 'Veterinary Surgery'] },
    ]
  },
  ARCHITECTURE: {
    id: 'architecture',
    name: 'School of Architecture',
    icon: '🏛️',
    color: 'from-cyan-500 to-cyan-700',
    bgColor: 'bg-cyan-50',
    departments: [
      { id: 'architecture', name: 'Architecture', bookCount: 890, icon: '🏗️', searchSubjects: ['Architecture', 'Architectural Design', 'Building Design', 'Architectural Theory'] },
      { id: 'urban_planning', name: 'Urban Planning', bookCount: 670, icon: '🏙️', searchSubjects: ['Urban Planning', 'City Planning', 'Regional Planning', 'Urban Design'] },
      { id: 'landscape', name: 'Landscape Architecture', bookCount: 560, icon: '🌳', searchSubjects: ['Landscape Architecture', 'Landscape Design', 'Garden Design'] },
      { id: 'interior_design', name: 'Interior Design', bookCount: 490, icon: '🛋️', searchSubjects: ['Interior Design', 'Interior Architecture', 'Space Planning'] },
      { id: 'construction', name: 'Construction Management', bookCount: 620, icon: '🔨', searchSubjects: ['Construction Management', 'Project Management', 'Building Construction'] },
      { id: 'sustainable_design', name: 'Sustainable Design', bookCount: 450, icon: '♻️', searchSubjects: ['Sustainable Design', 'Green Building', 'Eco-Architecture'] },
    ]
  },
  INFORMATION_TECHNOLOGY: {
    id: 'it',
    name: 'School of Information Technology',
    icon: '💻',
    color: 'from-indigo-500 to-indigo-700',
    bgColor: 'bg-indigo-50',
    departments: [
      { id: 'cs', name: 'Computer Science', bookCount: 3200, icon: '💻', searchSubjects: ['Computer Science', 'Programming', 'Algorithms', 'Data Structures', 'Software Engineering'] },
      { id: 'information_systems', name: 'Information Systems', bookCount: 2100, icon: '📊', searchSubjects: ['Information Systems', 'Database', 'System Analysis', 'IT Management'] },
      { id: 'cybersecurity', name: 'Cybersecurity', bookCount: 1850, icon: '🔒', searchSubjects: ['Cybersecurity', 'Information Security', 'Network Security', 'Cryptography'] },
      { id: 'data_science', name: 'Data Science', bookCount: 1650, icon: '📈', searchSubjects: ['Data Science', 'Big Data', 'Data Analytics', 'Machine Learning'] },
      { id: 'software_eng', name: 'Software Engineering', bookCount: 1950, icon: '⚙️', searchSubjects: ['Software Engineering', 'Software Development', 'Agile', 'DevOps'] },
      { id: 'networking', name: 'Networking', bookCount: 1200, icon: '🌐', searchSubjects: ['Networking', 'Computer Networks', 'TCP/IP', 'Network Security'] },
      { id: 'ai_ml', name: 'AI & Machine Learning', bookCount: 1450, icon: '🤖', searchSubjects: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Networks'] },
      { id: 'cloud_computing', name: 'Cloud Computing', bookCount: 980, icon: '☁️', searchSubjects: ['Cloud Computing', 'AWS', 'Azure', 'Distributed Systems'] },
    ]
  },
  RELIGION_STUDIES: {
    id: 'religion',
    name: 'Faculty of Religion Studies',
    icon: '🕊️',
    color: 'from-violet-500 to-violet-700',
    bgColor: 'bg-violet-50',
    departments: [
      { id: 'islamic', name: 'Islamic Studies', bookCount: 850, icon: '🕌', searchSubjects: ['Islam', 'Quran', 'Hadith', 'Islamic Law', 'Sharia', 'Islamic History'] },
      { id: 'christian', name: 'Christian Studies', bookCount: 920, icon: '⛪', searchSubjects: ['Christianity', 'Bible', 'Theology', 'Church History', 'New Testament'] },
      { id: 'judaism', name: 'Jewish Studies', bookCount: 450, icon: '✡️', searchSubjects: ['Judaism', 'Torah', 'Jewish History', 'Talmud', 'Hebrew Bible'] },
      { id: 'hinduism', name: 'Hindu Studies', bookCount: 380, icon: '🕉️', searchSubjects: ['Hinduism', 'Vedas', 'Bhagavad Gita', 'Indian Philosophy'] },
      { id: 'buddhism', name: 'Buddhist Studies', bookCount: 420, icon: '☸️', searchSubjects: ['Buddhism', 'Dharma', 'Meditation', 'Buddhist Philosophy'] },
      { id: 'comparative', name: 'Comparative Religion', bookCount: 560, icon: '🌍', searchSubjects: ['Comparative Religion', 'World Religions', 'Interfaith', 'Religious Studies'] },
      { id: 'philosophy_religion', name: 'Philosophy of Religion', bookCount: 490, icon: '🤔', searchSubjects: ['Philosophy of Religion', 'Theology', 'Religious Philosophy', 'Ethics'] },
    ]
  },
  HIGH_SCHOOL: {
    id: 'highschool',
    name: 'High School Section',
    icon: '📘',
    color: 'from-sky-500 to-sky-700',
    bgColor: 'bg-sky-50',
    departments: [
      { id: 'mathematics_hs', name: 'Mathematics', bookCount: 1250, icon: '📐', searchSubjects: ['Algebra', 'Geometry', 'Calculus', 'Trigonometry', 'Statistics'] },
      { id: 'physics_hs', name: 'Physics', bookCount: 980, icon: '⚛️', searchSubjects: ['Physics', 'Mechanics', 'Electricity', 'Magnetism', 'Waves'] },
      { id: 'chemistry_hs', name: 'Chemistry', bookCount: 890, icon: '🧪', searchSubjects: ['Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Periodic Table'] },
      { id: 'biology_hs', name: 'Biology', bookCount: 760, icon: '🧬', searchSubjects: ['Biology', 'Cell Biology', 'Genetics', 'Human Anatomy', 'Ecology'] },
      { id: 'english_hs', name: 'English', bookCount: 1100, icon: '📖', searchSubjects: ['English Literature', 'Grammar', 'Writing', 'Poetry', 'Shakespeare'] },
      { id: 'history_hs', name: 'History', bookCount: 890, icon: '🏛️', searchSubjects: ['World History', 'American History', 'European History', 'Ancient Civilizations'] },
      { id: 'geography_hs', name: 'Geography', bookCount: 560, icon: '🗺️', searchSubjects: ['Geography', 'Map Reading', 'Physical Geography', 'Human Geography'] },
      { id: 'economics_hs', name: 'Economics', bookCount: 480, icon: '📊', searchSubjects: ['Economics', 'Microeconomics', 'Macroeconomics', 'Personal Finance'] },
    ]
  }
};

// Simple PDF Viewer Component (inline)
const PDFViewer = ({ pdfUrl, title, onClose }) => {
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use Google Docs Viewer as fallback (most reliable)
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
  // Direct PDF URL
  const directUrl = pdfUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg truncate">{title}</h2>
          <p className="text-gray-400 text-sm">PDF Document</p>
        </div>
        <div className="flex gap-3 ml-4">
          <a
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Download PDF
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-800">
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="text-xl mb-4">Unable to display PDF directly</p>
            <p className="text-gray-400 mb-4">You can still download the PDF using the button above</p>
            <a
              href={pdfUrl}
              download
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Download PDF
            </a>
          </div>
        ) : (
          <iframe
            src={googleViewerUrl}
            className="w-full h-full"
            title={title}
            onLoad={() => setLoading(false)}
            onError={() => setLoadError(true)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          />
        )}
      </div>
    </div>
  );
};

function DepartmentLibrary() {
  const { facultyId, departmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    if (facultyId) {
      const faculty = DEPARTMENTS[facultyId.toUpperCase()];
      if (faculty) {
        setCurrentFaculty(faculty);
        
        if (departmentId) {
          const dept = faculty.departments.find(d => d.id === departmentId);
          if (dept) {
            setCurrentDepartment(dept);
            fetchBooksByDepartment(dept);
          }
        } else {
          fetchBooksByFaculty(faculty);
        }
      }
    }
    
    if (user) {
      fetchBookmarks();
      fetchRecentBooks();
    }
  }, [facultyId, departmentId, user]);

  const fetchBooksByFaculty = async (faculty) => {
    setLoading(true);
    try {
      const allSearchTerms = faculty.departments.flatMap(d => d.searchSubjects || []);
      const uniqueTerms = [...new Set(allSearchTerms)].slice(0, 6);
      
      let allBooks = [];
      for (const term of uniqueTerms) {
        try {
          const response = await axios.get(`/api/library/books/search/`, {
            params: { q: term, limit: 15 }
          });
          if (response.data.results && response.data.results.length > 0) {
            allBooks = [...allBooks, ...response.data.results];
          }
        } catch (err) {
          console.error(`Error fetching for term ${term}:`, err);
        }
      }
      
      const uniqueBooks = Array.from(new Map(allBooks.map(b => [b.id, b])).values());
      setBooks(uniqueBooks.slice(0, 40));
      
      if (uniqueBooks.length === 0) {
        toast.info('No books found. Try searching for something specific.');
      }
    } catch (error) {
      console.error('Error fetching faculty books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksByDepartment = async (department) => {
    setLoading(true);
    try {
      const searchTerms = department.searchSubjects || [department.name];
      let allBooks = [];
      
      for (const term of searchTerms.slice(0, 4)) {
        try {
          const response = await axios.get(`/api/library/books/search/`, {
            params: { q: term, limit: 15 }
          });
          if (response.data.results && response.data.results.length > 0) {
            allBooks = [...allBooks, ...response.data.results];
          }
        } catch (err) {
          console.error(`Error fetching for term ${term}:`, err);
        }
      }
      
      const uniqueBooks = Array.from(new Map(allBooks.map(b => [b.id, b])).values());
      setBooks(uniqueBooks.slice(0, 30));
      
      if (uniqueBooks.length === 0) {
        toast.info(`No books found for ${department.name}. Try searching for something else.`);
      }
    } catch (error) {
      console.error('Error fetching department books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      toast.warning('Please enter a search term');
      return;
    }
    
    setLoading(true);
    try {
      let response;
      
      if (searchType === 'title') {
        response = await axios.get(`/api/library/books/search_by_title/`, {
          params: { title: searchQuery, limit: 30 }
        });
      } else if (searchType === 'author') {
        response = await axios.get(`/api/library/books/search_by_author/`, {
          params: { author: searchQuery, limit: 30 }
        });
      } else if (searchType === 'subject') {
        response = await axios.get(`/api/library/books/search_by_subject/`, {
          params: { subject: searchQuery, limit: 30 }
        });
      } else {
        response = await axios.get(`/api/library/books/search/`, {
          params: { q: searchQuery, limit: 30 }
        });
      }
      
      const results = response.data.results || [];
      setBooks(results);
      
      if (results.length === 0) {
        toast.info(`No books found for "${searchQuery}". Try a different search term.`);
      } else {
        toast.success(`Found ${results.length} books for "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/library/bookmarks/my_bookmarks/', { withCredentials: true });
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchRecentBooks = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/library/recent-views/', { withCredentials: true });
      setRecentBooks(response.data);
    } catch (error) {
      console.error('Error fetching recent books:', error);
    }
  };

  const addBookmark = async (bookId) => {
    if (!user) {
      toast.error('Please login to bookmark books');
      return;
    }
    
    try {
      await axios.post('/api/library/bookmarks/', { book_id: bookId }, { withCredentials: true });
      toast.success('Book added to bookmarks');
      fetchBookmarks();
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to add bookmark');
    }
  };

  const removeBookmark = async (bookmarkId) => {
    try {
      await axios.delete(`/api/library/bookmarks/${bookmarkId}/`, { withCredentials: true });
      toast.success('Bookmark removed');
      fetchBookmarks();
    } catch (error) {
      console.error('Remove bookmark error:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const readBook = (book) => {
    if (!book.pdf_url) {
      toast.error('No PDF available for this book');
      return;
    }
    setSelectedBook(book);
    setShowReader(true);
    
    // Track view
    axios.post(`/api/library/books/${book.id}/view/`, {}, { withCredentials: true })
      .catch(err => console.error('View tracking error:', err));
  };

  const downloadBook = (book, format = 'pdf') => {
    if (!book.pdf_url) {
      toast.error('No download URL available');
      return;
    }
    
    // Direct download using anchor tag
    const link = document.createElement('a');
    link.href = book.pdf_url;
    link.setAttribute('download', `${book.title.substring(0, 50)}.${format}`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success(`Downloading ${book.title}`);
  };

  const isBookmarked = (bookId) => {
    return bookmarks.some(b => b.book?.id === bookId);
  };

  const getBookmarkId = (bookId) => {
    const bookmark = bookmarks.find(b => b.book?.id === bookId);
    return bookmark?.id;
  };

  // Main Faculty Selection Page
  if (!facultyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-5xl">📚</span>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  UniHub Digital Library
                </h1>
              </div>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Access thousands of free academic books from the Directory of Open Access Books (DOAB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(DEPARTMENTS).map((faculty) => (
              <Link
                key={faculty.id}
                to={`/library/faculty/${faculty.id}`}
                className="group"
              >
                <div className={`bg-gradient-to-r ${faculty.color} rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl">{faculty.icon}</span>
                      <span className="text-white text-sm bg-white bg-opacity-30 px-3 py-1 rounded-full">
                        {faculty.departments.length} Departments
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{faculty.name}</h2>
                    <p className="text-white text-opacity-90 text-sm">
                      Access books, research papers, and academic resources
                    </p>
                    <div className="mt-4 flex items-center text-white">
                      <span className="text-sm">Explore →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Faculty/Department View
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg mb-8 border border-gray-200">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link to="/library" className="text-gray-600 hover:text-indigo-600 transition">
                  <span className="text-3xl">📚</span>
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{currentFaculty?.icon}</span>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{currentFaculty?.name}</h1>
                  </div>
                  {currentDepartment && (
                    <p className="text-gray-500 text-sm mt-1">
                      {currentDepartment.name} • {currentDepartment.bookCount}+ books
                    </p>
                  )}
                </div>
              </div>
              
              {/* Search Bar with Type Selector */}
              <div className="flex w-full md:w-auto gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 py-2 rounded-l-xl bg-white/70 backdrop-blur-sm text-gray-700 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Fields</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="subject">Subject</option>
                </select>
                <div className="flex flex-1 md:w-96">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                    placeholder={
                      searchType === 'title' ? "Search by title..." :
                      searchType === 'author' ? "Search by author..." :
                      searchType === 'subject' ? "Search by subject..." :
                      "Search by title, author, subject..."
                    }
                    className="flex-1 px-4 py-2 outline-none text-gray-800 bg-white/70 backdrop-blur-sm border-y border-gray-200"
                  />
                  <button
                    onClick={searchBooks}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-r-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'search' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Search Results
          </button>
          {user && (
            <>
              <button
                onClick={() => {
                  setActiveTab('bookmarks');
                  fetchBookmarks();
                }}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'bookmarks' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ❤️ My Bookmarks ({bookmarks.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('recent');
                  fetchRecentBooks();
                }}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'recent' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🕐 Recent Views ({recentBooks.length})
              </button>
            </>
          )}
          {!departmentId && currentFaculty && (
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'departments' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📂 Departments
            </button>
          )}
        </div>

        {/* Departments Section */}
        {activeTab === 'departments' && !departmentId && currentFaculty && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Departments</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFaculty.departments.map((dept) => (
                <Link
                  key={dept.id}
                  to={`/library/faculty/${currentFaculty.id}/department/${dept.id}`}
                  className={`${currentFaculty.bgColor} rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-105 border border-gray-100`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dept.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                      <p className="text-xs text-gray-500">{dept.bookCount} books</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'bookmarks' ? 'My Bookmarked Books' :
               activeTab === 'recent' ? 'Recently Viewed Books' :
               currentDepartment ? `${currentDepartment.name} Books` : 
               searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Books'}
            </h2>
            {books.length > 0 && (
              <p className="text-sm text-gray-500">{books.length} books found</p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-500 mb-4">
                {activeTab === 'bookmarks' ? 'You haven\'t bookmarked any books yet.' :
                 activeTab === 'recent' ? 'You haven\'t viewed any books yet.' :
                 'No books found. Try searching for something else.'}
              </p>
              {activeTab === 'search' && (
                <div className="flex flex-col gap-3 items-center">
                  <p className="text-sm text-gray-400">Try searching by:</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button onClick={() => setSearchType('title')} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition">Title</button>
                    <button onClick={() => setSearchType('author')} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition">Author</button>
                    <button onClick={() => setSearchType('subject')} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition">Subject</button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  if (currentDepartment) {
                    fetchBooksByDepartment(currentDepartment);
                  } else if (currentFaculty) {
                    fetchBooksByFaculty(currentFaculty);
                  }
                }}
                className="mt-6 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              >
                Retry Loading Books
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <div key={book.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col border border-gray-200">
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
                    {book.cover_url ? (
                      <img 
                        src={book.cover_url} 
                        alt={book.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=200&fit=crop`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-center p-4">
                        <div>
                          <span className="text-4xl block mb-2">📖</span>
                          <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                        </div>
                      </div>
                    )}
                    {/* Bookmark Button */}
                    <button
                      onClick={() => isBookmarked(book.id) 
                        ? removeBookmark(getBookmarkId(book.id))
                        : addBookmark(book.id)
                      }
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                      title={isBookmarked(book.id) ? "Remove from bookmarks" : "Add to bookmarks"}
                    >
                      <span className="text-xl">{isBookmarked(book.id) ? '❤️' : '🤍'}</span>
                    </button>
                  </div>
                  
                  <div className="p-4 flex-1">
                    <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 hover:text-indigo-600 transition">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                      {book.all_authors || 'Unknown Author'}
                    </p>
                    
                    {book.subtitle && (
                      <p className="text-xs text-gray-400 italic line-clamp-1 mb-2">{book.subtitle}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {book.subjects?.slice(0, 2).map((subject, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition"
                          onClick={() => {
                            setSearchQuery(subject);
                            setSearchType('subject');
                            setTimeout(() => searchBooks(), 100);
                          }}
                        >
                          {subject.length > 15 ? subject.substring(0, 15) + '...' : subject}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-3">
                      {book.publisher || 'Unknown Publisher'} • {book.publication_year || 'N/A'}
                    </p>
                    
                    <div className="flex gap-2">
                      {book.pdf_url ? (
                        <>
                          <button
                            onClick={() => readBook(book)}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm font-medium transition shadow-md"
                          >
                            📖 Read
                          </button>
                          <button
                            onClick={() => downloadBook(book, 'pdf')}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm transition shadow-md"
                            title="Download PDF"
                          >
                            ⬇️
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic text-center w-full">No PDF available</div>
                      )}
                      {book.epub_url && (
                        <button
                          onClick={() => downloadBook(book, 'epub')}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition shadow-md"
                          title="Download EPUB"
                        >
                          📱
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showReader && selectedBook && (
        <PDFViewer
          pdfUrl={selectedBook.pdf_url}
          title={selectedBook.title}
          onClose={() => {
            setShowReader(false);
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
}

export default DepartmentLibrary;