import { Link } from "@remix-run/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Variants } from "framer-motion";

export function CTASection() {
  const shouldReduceMotion = useReducedMotion();

  // Configurable animation variants for reduced motion preference
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 15,
        delay: 0.4,
      },
    },
  };

  return (
    <section
      className="relative py-24 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Optimized background animation with reduced motion support */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 20 + 5}px`,
              height: `${Math.random() * 20 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -100],
                    opacity: [0.2, 0],
                    scale: [1, 1.5],
                  }
            }
            transition={
              shouldReduceMotion
                ? {}
                : {
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 5,
                    ease: "linear",
                  }
            }
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            id="cta-heading"
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            Ready to Discover Your{" "}
            <span className="text-yellow-300 relative inline-block">
              Perfect
              <Sparkles className="absolute -top-4 -right-4 w-5 h-5 text-yellow-300 animate-pulse" />
            </span>{" "}
            University Match?
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Join{" "}
            <span className="font-semibold text-white">10,000+ students</span>{" "}
            who found their ideal courses with our AI-powered matching system.
          </motion.p>

          <motion.div
            variants={buttonVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/register"
              className="relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
              aria-label="Get started for free"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-0"></span>

              <span className="relative z-10 flex items-center">
                Get Started For Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              to="/demo"
              className="relative inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/30 text-white text-lg font-semibold rounded-lg hover:border-white/60 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
              aria-label="Watch demo"
            >
              <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center">
                Watch Demo
                <Sparkles className="w-5 h-5 ml-2 text-yellow-300 group-hover:animate-pulse" />
              </span>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 text-indigo-200 text-sm flex items-center justify-center gap-3 flex-wrap"
          >
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-yellow-300 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              No credit card required
            </div>
            <div
              className="h-1 w-1 bg-indigo-300 rounded-full"
              aria-hidden="true"
            ></div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-yellow-300 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              98% match accuracy
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
