import { CheckCircle, BookOpen, BarChart, ArrowRight } from 'lucide-react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { useState } from 'react';

const colors = [
  'from-indigo-500 to-blue-500',
  'from-blue-500 to-purple-500',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500'
];

export function FeatureCards() {
  const [hoverStates, setHoverStates] = useState<Record<number, string>>({});

  const features = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Instant Results",
      description: "Get immediate feedback on your eligibility for hundreds of university courses worldwide.",
      cta: "Check eligibility"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Comprehensive Database",
      description: "Access up-to-date admission requirements from top universities all in one place.",
      cta: "Browse universities"
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      title: "Smart Recommendations",
      description: "Receive personalized course suggestions based on your academic profile.",
      cta: "Get recommendations"
    }
  ];

  const getRandomColor = (index: number) => {
    const availableColors = colors.filter(color => color !== hoverStates[index]);
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    setHoverStates(prev => ({ ...prev, [index]: randomColor }));
    return randomColor;
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    },
    hover: {
      y: -12,
      transition: { 
        type: "spring",
        stiffness: 300
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      
      variants={container}
      className="mx-auto max-w-7xl px-6 lg:px-8 py-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={item}
            whileHover="hover"
            className="group relative"
            onHoverStart={() => getRandomColor(index)}
          >
            {/* Glow effect */}
            <div 
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${hoverStates[index] || colors[index]} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-lg -z-10`}
            />
            
            {/* Main card */}
            <div className="relative h-full bg-white/90 backdrop-blur-sm p-8 rounded-xl border border-gray-200/70 shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Dynamic gradient icon */}
              <div 
                className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 bg-gradient-to-br ${hoverStates[index] || colors[index]} shadow-lg group-hover:shadow-xl transition-shadow`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="text-white"
                >
                  {feature.icon}
                </motion.div>
              </div>
              
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 text-sm lg:text-base">
                {feature.description}
              </p>
              
              {/* Interactive CTA */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="inline-flex items-center text-sm font-medium text-indigo-600 cursor-pointer mt-auto"
              >
                <span>{feature.cta}</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className="ml-2"
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
              
              {/* Hover border animation */}
              <div 
                className={`absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-hover:border-indigo-200/50 transition-all duration-300`}
                style={{
                  background: `linear-gradient(to right, transparent, transparent), 
                              linear-gradient(to right, ${hoverStates[index] ? hoverStates[index].replace('from-', '').replace('to-', '').split(' ').map(c => `var(--${c.split('-')[0]}-500)`).join(', ') : 'var(--indigo-500), var(--blue-500)'})`,
                  backgroundClip: 'padding-box, border-box',
                  backgroundOrigin: 'padding-box, border-box'
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}