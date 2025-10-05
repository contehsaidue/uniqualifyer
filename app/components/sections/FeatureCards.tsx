import { CheckCircle, BookOpen, BarChart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";

const colors = [
  "from-indigo-500 to-blue-500",
  "from-blue-500 to-purple-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-purple-500",
];

export function FeatureCards() {
  const navigate = useNavigate();
  const [hoverStates, setHoverStates] = useState<Record<number, string>>({});

  const features = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Instant Results",
      description:
        "Get immediate feedback on your eligibility for hundreds of university courses worldwide.",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Comprehensive Database",
      description:
        "Access up-to-date admission requirements from top universities all in one place.",
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      title: "Smart Recommendations",
      description:
        "Receive personalized course suggestions based on your academic profile.",
    },
  ];

  const getRandomColor = (index: number) => {
    const availableColors = colors.filter(
      (color) => color !== hoverStates[index]
    );
    const randomColor =
      availableColors[Math.floor(Math.random() * availableColors.length)];
    setHoverStates((prev) => ({ ...prev, [index]: randomColor }));
    return randomColor;
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
    hover: {
      y: -12,
      transition: {
        type: "spring",
        stiffness: 300,
      },
    },
  };

  const handleNavigation = (link: string) => {
    navigate(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="mx-auto max-w-7xl px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Discover Your Educational Path
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Our platform helps you find the perfect university course with
            powerful tools and comprehensive data.
          </motion.p>
        </div>

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
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                  hoverStates[index] || colors[index]
                } opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-xl -z-10`}
              />

              {/* Main card */}
              <div
                className="relative h-full bg-white/95 backdrop-blur-sm p-8 rounded-xl border border-gray-200/70 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Learn more about ${feature.title}`}
              >
                {/* Dynamic gradient icon */}
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 bg-gradient-to-br ${
                    hoverStates[index] || colors[index]
                  } shadow-lg group-hover:shadow-xl transition-all duration-300`}
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
                <p className="text-gray-600 mb-6 text-sm lg:text-base leading-relaxed">
                  {feature.description}
                </p>

                {/* Interactive CTA */}
                <motion.div
                  whileHover={{ x: 4 }}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 cursor-pointer mt-auto group/cta"
                >
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                    className="ml-2"
                  ></motion.div>
                </motion.div>

                {/* Hover border animation */}
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-hover:border-indigo-200/50 transition-all duration-300`}
                  style={{
                    background: `linear-gradient(to right, transparent, transparent), 
                                linear-gradient(to right, ${
                                  hoverStates[index]
                                    ? hoverStates[index]
                                        .replace("from-", "")
                                        .replace("to-", "")
                                        .split(" ")
                                        .map(
                                          (c) => `var(--${c.split("-")[0]}-500)`
                                        )
                                        .join(", ")
                                    : "var(--indigo-500), var(--blue-500)"
                                })`,
                    backgroundClip: "padding-box, border-box",
                    backgroundOrigin: "padding-box, border-box",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => handleNavigation("/register")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:from-indigo-700 hover:to-purple-700"
          >
            Get Started Today
          </button>
          <p className="text-gray-600 mt-4">
            Join thousands of students who found their perfect course
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
