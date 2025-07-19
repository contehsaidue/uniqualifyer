import { GraduationCap, Search, User, LogIn, ChevronRight } from "lucide-react";
import { Link } from "@remix-run/react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative isolate px-6 lg:px-8 min-h-[90vh] flex items-center">
      {/* Next-gen background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute right-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl">
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] opacity-20"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </div>

      {/* Floating auth buttons */}
      <div className="absolute right-6 top-6 z-50">
        <div className="flex space-x-3 backdrop-blur-sm bg-white/30 rounded-full p-1 shadow-surface">
          <Link
            to="/auth/login"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-full hover:bg-white/20 transition-all"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-full bg-white text-indigo-600 shadow-sm hover:bg-white/90 transition-all"
          >
            <User className="w-4 h-4 mr-2" />
            Join now
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-32 sm:py-48 lg:py-56">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Animated logo/text */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <GraduationCap className="w-14 h-14 text-indigo-500 mb-4" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                UniQualifyer
              </span>
            </h1>
          </div>

          {/* Dynamic headline */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-5xl font-semibold text-gray-900 mb-6 max-w-4xl mx-auto"
          >
            The{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative">
                <span
                  className="absolute -inset-1 block -skew-y-3 bg-indigo-100/50"
                  aria-hidden="true"
                ></span>
                <span className="relative">future</span>
              </span>
            </span>{" "}
            of university matching
          </motion.h2>

          {/* Interactive CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-10"
          >
            <Link
              to="/checker"
              className="group relative inline-flex items-center px-8 py-4 overflow-hidden text-lg font-medium text-white bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-2xl hover:shadow-indigo-500/30 transition-all"
            >
              <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-40"></span>
              <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Discover your path
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Floating stats grid */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: "6,400+", label: "Programs" },
              { value: "93%", label: "Match accuracy" },
              { value: "347", label: "Universities" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="p-4 backdrop-blur-sm bg-white/30 rounded-xl border border-white/20 shadow-surface"
              >
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Animated cursor follower */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{ left: "50%", top: "50%" }}
        />
      </div>
    </section>
  );
}
