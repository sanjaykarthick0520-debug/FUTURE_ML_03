import { motion } from "framer-motion";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] flex items-center justify-center px-6">

      {/* Background Blur */}
      <div className="absolute h-96 w-96 rounded-full bg-purple-700/30 blur-[140px] top-0 left-0" />

      <div className="absolute h-96 w-96 rounded-full bg-cyan-500/30 blur-[140px] bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .6 }}
        className="relative w-full max-w-md rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-3xl
        p-10
        shadow-[0_0_60px_rgba(139,92,246,.25)]"
      >

        <h1 className="text-5xl font-black text-white">
          Hire<span className="text-violet-400">Sense</span>
        </h1>

        <p className="mt-2 text-gray-400">
          {subtitle}
        </p>

        <div className="mt-10">
          {children}
        </div>

      </motion.div>
    </div>
  );
}

export default AuthLayout;