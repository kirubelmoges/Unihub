import React from "react";

import One from "../assets/One.png";
import Analytics from "../dynamic/Analytics.jsx";
import Register from "./Register.jsx";

function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 bg-opacity-50">
      
      <div className="flex flex-col md:flex-row justify-between items-start w-full">

        <div>
        <div className="flex flex-row items-start gap-4">
          <div className="flex flex-col">
          <div className="font-poppins text-3xl font-medium flex gap-1">
            <span className="text-red-500">U</span>
            <span className="text-blue-500">n</span>
            <span className="text-yellow-500">i</span>
            <span className="text-green-500">H</span>
            <span className="text-purple-500">U</span>
            <span className="text-orange-500">b</span>
          </div>
          <img src={One} alt="icon" className="h-12 w-12 mt-2" />
          </div>
          
          <div className="text-4xl md:text-6xl mt-6 font-extrabold tracking-tight leading-tight text-gray-900">
             Advance your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
             career
          </span>
         </div>
        </div>
        <div>
          <Analytics class='bg-opacity-50'></Analytics>
        </div>
        </div>
        

        
        <div className="w-full max-w-md bg-white/20 rounded-2xl">
        <Register class='bg-opacity-50'></Register>
          
        </div>
        

      </div>
    </div>
  );
}

export default Home;

