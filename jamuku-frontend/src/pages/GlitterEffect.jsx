import React from "react";
import { motion } from "framer-motion";

export default function GlitterEffect({ className }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{ y: [0, -20, 0], opacity: [0.8, 0.4, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-6 h-6 bg-yellow-300 rounded-full blur-sm" />
    </motion.div>
  );
}
