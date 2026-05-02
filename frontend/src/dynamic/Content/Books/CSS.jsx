
import One from "../../../assets/One.png";
import { Link } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
function SocialBooks() {
  return (
    <div class='p-2'>
    <nav className="bg-gradient-to-r from-blue-400 shadow-lg bg-opacity-50 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 bg-opacity-50">

        {/* TOP ROW */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-opacity-50">

          {/* Brand */}
          <div class='bg-opacity-50'>
            <div className="flex flex-raw gap-2">
                      <div className="font-poppins text-3xl font-medium flex gap-1">
                        <span className="text-red-500">U</span>
                        <span className="text-blue-500">n</span>
                        <span className="text-yellow-500">i</span>
                        <span className="text-green-500">H</span>
                        <span className="text-purple-500">U</span>
                        <span className="text-orange-500">b</span>
                      </div>
                      <img src={One} alt="icon" className="h-12 w-12 " />
                      </div>
          </div>

          
          
          <div className="flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 md:flex-none px-4 py-2 rounded-l-lg outline-none text-sm"
            />
            <button className="bg-blue-400 text-white px-4 py-2 rounded-r-lg hover:bg-blue-900">
              Search
            </button>
          </div>

        </div>
      </div>
    </nav>
    <div>
      <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6">
          <h3 className="text-lg font-semibold mb-2">Books</h3>
          <p className="text-sm text-gray-600 mb-4">
            Study books and materials
          </p>
          <button className="text-blue-600 font-medium hover:underline">
            Open
          </button>
        </div>

        
       

       
      </div>
    </div>
    </div>
    </div>
  );
}


export default SocialBooks;