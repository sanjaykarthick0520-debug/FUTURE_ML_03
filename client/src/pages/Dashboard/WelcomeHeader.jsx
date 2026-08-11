import { motion } from "framer-motion";

export default function WelcomeHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="text-5xl font-black">
        Welcome to{" "}
        <span className="text-violet-500">
          HireSense
        </span>
      </h2>

      <p className="text-zinc-400 mt-3 text-lg">
        Upload your resume and receive AI-powered ATS
        analysis, keyword suggestions, and job matching
        insights.
      </p>
    </motion.div>
  );
}