"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/api/api";
import { motion } from "framer-motion";
import { Spinner } from "@/@components/Spinner";

export default function RedirectPage() {
  const router = useRouter();
  const params = useParams();
  const alias = params?.alias as string;

  const { data: longUrl, error } = api.redirect_link.useQuery(alias);

  useEffect(() => {
    if (error) {
      console.log("Redirection error:", error);
      const redirectTo = (error as Error).cause as string | undefined;
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
    if (longUrl) {
      console.log("Redirecting to:", longUrl);
      window.location.href = longUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longUrl, error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-blue-900 text-white flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Spinner size="lg" color="blue" />
        <p className="text-lg text-neutral-300">Redirecting...</p>
      </motion.div>
    </div>
  );
}
