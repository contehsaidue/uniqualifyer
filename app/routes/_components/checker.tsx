import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from '@remix-run/react';

export default function Checker() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
            Course Eligibility Checker
          </h1>
          <p className="text-gray-600 mb-8">Enter your details to check your university options</p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none">
                    <option>Select Exam</option>
                    <option>SAT</option>
                    <option>ACT</option>
                    <option>A-Levels</option>
                    <option>IB Diploma</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your score"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desired Subject Area</label>
              <div className="relative">
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none">
                  <option>Select Subject</option>
                  <option>Computer Science</option>
                  <option>Medicine</option>
                  <option>Engineering</option>
                  <option>Business</option>
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <button className="w-full flex justify-center items-center px-6 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow">
              <CheckCircle2 className="w-6 h-6 mr-2" />
              Check Eligibility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}