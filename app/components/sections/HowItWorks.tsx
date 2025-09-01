import { Link } from "@remix-run/react";
import React from "react";

export function HowItWorks() {
  const steps = [
    {
      icon: "📝",
      title: "Add Your Qualifications",
      description:
        "Input your academic records, test scores, and achievements with our intuitive form",
    },
    {
      icon: "🔍",
      title: "Smart Matching Algorithm",
      description:
        "Our AI analyzes thousands of programs to find your perfect matches based on your profile",
    },
    {
      icon: "🎯",
      title: "Get Personalized Matches",
      description:
        "Receive tailored program recommendations with compatibility scores and insights",
    },
  ];

  return (
    <section
      className="relative py-20 overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 -z-10"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full opacity-20 blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            How it works
          </div>
          <h2
            id="how-it-works-heading"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Find Your Perfect Program
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent platform matches your qualifications with the best
            educational opportunities in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm transform group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 -z-10"></div>

              <div className="h-full p-8 flex flex-col items-center text-center">
                {/* Step number */}
                <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-100 flex items-center justify-center text-blue-600 font-semibold mb-6 shadow-sm">
                  {index + 1}
                </div>

                {/* Icon container */}
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16">
          <Link
            to="/auth/register"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Get Started Today
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
