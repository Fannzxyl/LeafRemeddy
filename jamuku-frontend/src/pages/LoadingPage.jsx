import React from "react";
import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-black text-white flex items-center justify-center text-4xl font-bold z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      Leaf Remedy...
    </motion.div>
  );
};

export default LoadingPage;
