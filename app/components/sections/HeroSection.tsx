import {
  GraduationCap,
  Search,
  User,
  LogIn,
  ChevronRight,
  Sparkles,
  BowArrowIcon,
  HomeIcon,
} from "lucide-react";
import { Link } from "@remix-run/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const backgroundImages = [
  {
    url: "/slides/1.jpeg",
    overlay: "bg-gradient-to-br from-indigo-600/40 to-purple-600/40",
  },
  {
    url: "/slides/2.jpeg",
    overlay: "bg-gradient-to-br from-purple-600/40 to-blue-600/40",
  },
  {
    url: "/slides/3.jpeg",
    overlay: "bg-gradient-to-br from-blue-600/40 to-indigo-600/40",
  },
  {
    url: "/slides/4.jpeg",
    overlay: "bg-gradient-to-br from-blue-600/40 to-indigo-600/40",
  },
];

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 300], [0, 100]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    backgroundImages.forEach((image) => {
      const img = new Image();
      img.src = image.url;
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isMounted]);

  // Memoized background images to prevent re-renders
  const BackgroundCarousel = useCallback(
    () => (
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {backgroundImages.map((image, index) => (
          <motion.div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image.url})`,
              y: yBg,
            }}
            aria-hidden="true"
          >
            <div className={`absolute inset-0 ${image.overlay}`} />
          </motion.div>
        ))}

        {/* Enhanced gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 via-transparent to-gray-900/20" />

        {/* Animated gradient blob */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 transform-gpu blur-3xl"
        >
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] opacity-20"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </motion.div>
      </div>
    ),
    [currentImageIndex, yBg]
  );

  return (
    <section className="relative isolate px-6 lg:px-8 min-h-[90vh] flex items-center overflow-hidden">
      <BackgroundCarousel />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute right-6 top-6 z-50"
      >
        <div className="flex space-x-3 backdrop-blur-sm bg-white/30 rounded-full p-1 shadow-surface border border-white/20">
          <Link
            to="/explorer"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-full hover:bg-white/20 transition-all text-gray-100 hover:text-white"
            prefetch="intent"
          >
            <BowArrowIcon className="w-4 h-4 mr-2" />
            Explorer
          </Link>
          <Link
            to="/login"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-full hover:bg-white/20 transition-all text-gray-100 hover:text-white"
            prefetch="intent"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </Link>
          <Link
            to="/register"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-full bg-white text-indigo-600 shadow-sm hover:bg-white/90 transition-all"
            prefetch="intent"
          >
            <User className="w-4 h-4 mr-2" />
            Join now
          </Link>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-6 py-32 sm:py-48 lg:py-56">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Animated logo/text */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative"
            >
              <GraduationCap className="w-14 h-14 text-gray-100 mb-4" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </motion.div>
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-gray-100 mb-2"
            >
              UniQualifyer
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-gray-200"
            >
              Smart University Eligibility Matching
            </motion.p>
          </div>

          {/* Dynamic headline */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl md:text-5xl font-semibold text-gray-100 mb-6 max-w-4xl mx-auto leading-tight"
          >
            The{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative">
                <span
                  className="absolute -inset-1 block -skew-y-3 bg-indigo-100/50"
                  aria-hidden="true"
                ></span>
                <span className="relative text-gray-900 font-bold">future</span>
              </span>
            </span>{" "}
            of university matching starts here
          </motion.h2>

          {/* Interactive CTA */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-10"
          >
            <Link
              to="/explorer"
              className="group relative inline-flex items-center px-8 py-4 overflow-hidden text-lg font-medium text-white bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 border border-indigo-500/30"
              prefetch="intent"
            >
              <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-40"></span>
              <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Check eligibility now
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Floating stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
          >
            {[
              { value: "6,400+", label: "Programs", icon: "📚" },
              { value: "93%", label: "Match accuracy", icon: "🎯" },
              { value: "347", label: "Universities", icon: "🏫" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 backdrop-blur-sm bg-white/20 rounded-2xl border border-white/30 shadow-surface hover:shadow-lg transition-all"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-3xl font-bold text-gray-100">{stat.value}</p>
                <p className="text-sm text-gray-200 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced animated cursor follower */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{ left: "50%", top: "50%" }}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
