import { Link } from "@remix-run/react";

interface Step {
  icon: string;
  title: string;
  description: string;
  image: string;
}

export function HowItWorks() {
  const steps = [
    {
      title: "Add Your Result",
      description:
        "Input your academic records, test scores, and achievements with our intuitive form. Our system makes it easy to enter all your credentials in one place, with helpful tips and validation to ensure accuracy.",
      image: "/howto/1.png",
    },
    {
      title: "Smart Matching Algorithm",
      description:
        "Our AI analyzes thousands of programs to find your perfect matches based on your profile. The algorithm considers acceptance rates, historical data, and success patterns to identify programs where you'll thrive.",
      image: "/howto/2.png",
    },
    {
      title: "Get Personalized Matches",
      description:
        "Receive tailored program recommendations with compatibility scores and insights. Each match includes detailed information about why it's a good fit and what you might need to strengthen your application.",
      image: "/howto/3.png",
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
            Our intelligent platform matches your results with the best
            educational opportunities in three simple steps
          </p>
        </div>

        <div className="space-y-28">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-12 items-center`}
            >
              {/* Text Content */}

              <div className="flex-1">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-lg rounded shadow-md mr-4 mb-4">
                  <span>Step {index + 1}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {index === 0 && (
                  <button className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 shadow-sm">
                    <Link to={"/auth/login"}>Get Started Now</Link>
                  </button>
                )}
              </div>

              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-md bg-white p-4 rounded-2xl shadow-lg border border-purple-100 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-auto rounded-xl object-contain"
                    style={{ maxHeight: "200px" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
