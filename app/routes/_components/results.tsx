import { ArrowLeft, Bookmark, Check, X } from 'lucide-react';
import { Link } from '@remix-run/react';

export default function Results() {
  const results = [
    {
      university: "Stanford University",
      course: "Computer Science",
      match: 92,
      status: "eligible",
      requirements: "SAT ≥ 1450, Math ≥ 750"
    },
    {
      university: "Harvard University",
      course: "Economics",
      match: 87,
      status: "eligible",
      requirements: "SAT ≥ 1480, Math ≥ 780"
    },
    {
      university: "MIT",
      course: "Electrical Engineering",
      match: 65,
      status: "borderline",
      requirements: "SAT ≥ 1500, Math ≥ 800"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-indigo-600 text-white">
            <h1 className="text-2xl font-bold">Your Eligibility Results</h1>
            <p className="opacity-90">Based on your academic profile</p>
          </div>

          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{result.course}</h3>
                    <p className="text-indigo-600 font-medium">{result.university}</p>
                    <p className="text-sm text-gray-500 mt-2">{result.requirements}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === "eligible" 
                        ? "bg-green-100 text-green-800" 
                        : result.status === "borderline" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      {result.match}% Match
                    </span>
                    <button className="ml-4 p-2 text-gray-400 hover:text-indigo-600">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {result.status === "eligible" ? (
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <X className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">
                    {result.status === "eligible" 
                      ? "You meet all requirements" 
                      : result.status === "borderline" 
                        ? "You meet some requirements" 
                        : "You don't meet the requirements"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}