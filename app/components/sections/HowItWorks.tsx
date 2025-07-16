import { Users, Search, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from '@remix-run/react';

export function HowItWorks() {
  const steps = [
    {
      step: "1",
      icon: <Users className="w-8 h-8" />,
      title: "Create Your Profile",
      description: "Enter your academic details and exam results to get started",
      color: "from-indigo-500 to-blue-500"
    },
    {
      step: "2",
      icon: <Search className="w-8 h-8" />,
      title: "Search Courses",
      description: "Select your desired courses or universities",
      color: "from-blue-500 to-purple-500"
    },
    {
      step: "3",
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Get Matches",
      description: "Receive instant eligibility results with AI accuracy",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const 
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">Uni-Qualifyer</span> Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your perfect university match in just three simple steps
          </p>
        </motion.div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 z-0"></div>
          
          {steps.map((step, index) => (
            <motion.div 
              key={step.step}
              variants={item}
              className="relative z-10"
            >
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col items-center text-center border border-gray-100"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-r ${step.color} shadow-lg`}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {step.icon}
                  </motion.div>
                </div>
                
                <div className="mb-4 flex items-center justify-center">
                  <span className="bg-gray-100 text-gray-800 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                    {step.step}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 flex-grow">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="md:hidden flex items-center justify-center text-blue-500 mt-4">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
     
<Link
  to="/register"
  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
>
  Get Started Now
  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
</Link>
        </motion.div>
      </div>
    </section>
  );
}