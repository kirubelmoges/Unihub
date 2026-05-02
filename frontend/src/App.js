import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./static/Dashboard.jsx";
import Register from "./static/Register.jsx";
import Login from "./static/Login.jsx";
import ProtectedRoute from "../src/static/ProtectedRoute.jsx";
import Home from "./static/Home.jsx";
import Home1 from "./static/Home1.jsx";
import Loogin from "./static/Login.jsx";
import Profile from './dynamic/Profile.jsx'
import ProfilesList from './dynamic/ProfileList.jsx'


import DepartmentLibrary from './dynamic/DepartmentLibrary.jsx';
import InternDashboard from './dynamic/InternDashboard.jsx';
import CompanySide from './dynamic/CompanySide.jsx';
import StudentSide from './dynamic/StudentSide.jsx';
import TaskScheduler from './dynamic/TaskScheduler.jsx';
import YouTubePlayer from './dynamic/YouTubePlayer';
import EducationalViewer from './dynamic/EducationalViewer';
import BookViewer from './dynamic/BookViewer';


// Dynamic main pages
import Analytics from "./dynamic/Analytics.jsx";

import Content from "./dynamic/Content.jsx";
import Vidio from "./dynamic/VidioChat.jsx";
import White from './assets/White.png'
import comp from './assets/comp.jpg'
import comp1 from './assets/comp1.jpg'
import comp2 from './assets/comp2.jpg'
import comp4 from './assets/comp4.jpg'
// Books
import EngineeringBooks from "./dynamic/Content/Books/CEAT.jsx";
import HljcBooks from "./dynamic/Content/Books/CHLJCS.jsx";
import HealthBooks from "./dynamic/Content/Books/CHS.jsx";
import NaturalBooks from "./dynamic/Content/Books/CNCS.jsx";
import SocialBooks from "./dynamic/Content/Books/CSS.jsx";
import ArtBooks from "./dynamic/Content/Books/FDPV.jsx";
import EducationBooks from "./dynamic/Content/Books/SOE.jsx";

// Exams
import EngineeringExams from "./dynamic/Content/Exams/CEAT.jsx";
import HljcExams from "./dynamic/Content/Exams/CHLJCS.jsx";
import HealthExams from "./dynamic/Content/Exams/CHS.jsx";
import NaturalExams from "./dynamic/Content/Exams/CNCS.jsx";
import SocialExams from "./dynamic/Content/Exams/CSS.jsx";
import ArtExams from "./dynamic/Content/Exams/FDPV.jsx";
import EducationExams from "./dynamic/Content/Exams/SOE.jsx";

// PowerPoint
import EngineeringPowerpoint from "./dynamic/Content/Powerpoint/CEAT.jsx";
import HljcPowerpoint from "./dynamic/Content/Powerpoint/CHLJCS.jsx";
import HealthPowerpoint from "./dynamic/Content/Powerpoint/CHS.jsx";
import NaturalPowerpoint from "./dynamic/Content/Powerpoint/CNCS.jsx";
import SocialPowerpoint from "./dynamic/Content/Powerpoint/CSS.jsx";
import ArtPowerpoint from "./dynamic/Content/Powerpoint/FDPV.jsx";
import EducationPowerpoint from "./dynamic/Content/Powerpoint/SOE.jsx";

// Videos
import EngineeringVidios from "./dynamic/Content/Vidios/CEAT.jsx";
import HljcVidios from "./dynamic/Content/Vidios/CHLJCS.jsx";
import HealthVidios from "./dynamic/Content/Vidios/CHS.jsx";
import NaturalVidios from "./dynamic/Content/Vidios/CNCS.jsx";
import SocialVidios from "./dynamic/Content/Vidios/CSS.jsx";
import ArtVidios from "./dynamic/Content/Vidios/FDPV.jsx";
import EducationVidios from "./dynamic/Content/Vidios/SOE.jsx";
import Chat from './dynamic/chat.jsx'
import ExamPage from './dynamic/exampage.jsx';
import GradePage from "./dynamic/gradepage.jsx";

import UploadPage from './dynamic/UploadPage.jsx';
import DashboardPage from './dynamic/DashboardPage.jsx';

import MarriageMysteryPage from './dynamic/MarriageMysteryPage.jsx';
import MarriageHistoryPage from './dynamic/MarriageHistoryPage.jsx';
import MarriageResultDetailPage from './dynamic/MarriageResultDetailPage.jsx';


// In your Routes:



function App() {
  return (
      
      <div
      className=" inset-0 bg-cover bg-center -z-20"
      style={{ backgroundImage: `url(${comp4})` }}
    >
<Router>
   <div
      className="fixed inset-0 bg-cover bg-center -z-20"
      style={{ backgroundImage: `url(${comp4})` }}
    ></div>
      <Routes>
        <Route path="/BookViewer" element={<BookViewer />} />
        <Route path="/EducationalViewer" element={<EducationalViewer />} />
        <Route path="/YouTubePlayer" element={<YouTubePlayer />} />
        <Route path="/TaskScheduler" element={<TaskScheduler />} />
        <Route path="/StudentSide" element={<StudentSide />} />
        <Route path="/CompanySide" element={<CompanySide />} />
        <Route path="/InternDashboard" element={<InternDashboard />} />
        
        
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/exam/:examId" element={<ExamPage />} />
        <Route path="/exam-result/:submissionId" element={<GradePage />} />
        <Route path="/profiles" element={<ProfilesList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat roomName="general" />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/grade" element={<GradePage />} />
        <Route path="/home1" element={<Home1 />} />

 
        <Route path="/library" element={<DepartmentLibrary />} />
        <Route path="/library/faculty/:facultyId" element={<DepartmentLibrary />} />
        <Route path="/library/faculty/:facultyId/department/:departmentId" element={<DepartmentLibrary />} />

        
        <Route className="bg-opacity-50" path="/analytics" element={<Analytics />} />
        <Route path="/content" element={<Content />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/vidiochat" element={<ProtectedRoute><Vidio /></ProtectedRoute>} />

        
        <Route path="/engineeringbooks" element={<EngineeringBooks />} />
        <Route path="/hljcbooks" element={<HljcBooks />} />
        <Route path="/healthbooks" element={<HealthBooks />} />
        <Route path="/naturalbooks" element={<ProtectedRoute><NaturalBooks /></ProtectedRoute>} />
        <Route path="/socialbooks" element={<ProtectedRoute><SocialBooks /></ProtectedRoute>} />
        <Route path="/artbooks" element={<ProtectedRoute><ArtBooks /></ProtectedRoute>} />
        <Route path="/educationbooks" element={<ProtectedRoute><EducationBooks /></ProtectedRoute>} />

        
        <Route path="/engineeringexams" element={<ProtectedRoute><EngineeringExams /></ProtectedRoute>} />
        <Route path="/hljcexams" element={<ProtectedRoute><HljcExams /></ProtectedRoute>} />
        <Route path="/healthexams" element={<ProtectedRoute><HealthExams /></ProtectedRoute>} />
        <Route path="/naturalexams" element={<ProtectedRoute><NaturalExams /></ProtectedRoute>} />
        <Route path="/socialexams" element={<ProtectedRoute><SocialExams /></ProtectedRoute>} />
        <Route path="/artexams" element={<ProtectedRoute><ArtExams /></ProtectedRoute>} />
        <Route path="/educationexams" element={<ProtectedRoute><EducationExams /></ProtectedRoute>} />

        
        <Route path="/engineeringpowerpoint" element={<ProtectedRoute><EngineeringPowerpoint /></ProtectedRoute>} />
        <Route path="/hljcpowerpoint" element={<ProtectedRoute><HljcPowerpoint /></ProtectedRoute>} />
        <Route path="/healthpowerpoint" element={<ProtectedRoute><HealthPowerpoint /></ProtectedRoute>} />
        <Route path="/naturalpowerpoint" element={<ProtectedRoute><NaturalPowerpoint /></ProtectedRoute>} />
        <Route path="/socialpowerpoint" element={<ProtectedRoute><SocialPowerpoint /></ProtectedRoute>} />
        <Route path="/artpowerpoint" element={<ProtectedRoute><ArtPowerpoint /></ProtectedRoute>} />
        <Route path="/educationpowerpoint" element={<ProtectedRoute><EducationPowerpoint /></ProtectedRoute>} />

       
        <Route path="/engineeringvidios" element={<ProtectedRoute><EngineeringVidios /></ProtectedRoute>} />
        <Route path="/hljcvidios" element={<ProtectedRoute><HljcVidios /></ProtectedRoute>} />
        <Route path="/healthvidios" element={<ProtectedRoute><HealthVidios /></ProtectedRoute>} />
        <Route path="/naturalvidios" element={<ProtectedRoute><NaturalVidios /></ProtectedRoute>} />
        <Route path="/socialvidios" element={<ProtectedRoute><SocialVidios /></ProtectedRoute>} />
        <Route path="/artvidios" element={<ProtectedRoute><ArtVidios /></ProtectedRoute>} />
        <Route path="/educationvidios" element={<ProtectedRoute><EducationVidios /></ProtectedRoute>} />


        <Route path="/marriage" element={<ProtectedRoute><MarriageMysteryPage /></ProtectedRoute>} />
        <Route path="/marriage-history" element={<ProtectedRoute><MarriageHistoryPage /></ProtectedRoute>} />
        <Route path="/marriage-result/:id" element={<ProtectedRoute><MarriageResultDetailPage/></ProtectedRoute>} />
      </Routes>
      
      
  
    </Router>
     
    </div>
    
  );
}

export default App;






