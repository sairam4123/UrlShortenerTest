"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-blue-900 text-white flex items-center justify-center">
      <motion.div
        className="w-full max-w-lg px-6 py-14 bg-black/30 backdrop-blur-md rounded-2xl shadow-xl shadow-blue-900/20 border border-blue-500/10 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1
          className="text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-500 to-blue-300 text-transparent bg-clip-text"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          404
        </motion.h1>
        <motion.p
          className="text-xl text-neutral-300 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Short link not found
        </motion.p>
        <motion.p
          className="text-neutral-400 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          This short link doesn&apos;t exist or has been removed.
          <br />
          Please check the URL and try again.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-md bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold hover:from-blue-500 hover:to-blue-300 transition-all active:scale-[0.98] shadow-md shadow-blue-900/40"
          >
            Go back home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
