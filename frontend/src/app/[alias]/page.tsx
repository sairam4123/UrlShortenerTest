"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/api/api";
import { motion } from "framer-motion";
import { Spinner } from "@/@components/Spinner";
import { SimpleIcon } from "@/@components/SimpleIcons";

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
        <p className="text-lg mt-2 text-neutral-300">Redirecting...</p>

        {longUrl && (
          <p className="text-center text-neutral-400 max-w-md">
            If you are not redirected automatically,
            <a
              href={longUrl || (error as Error)?.cause || "/"}
              className="text-blue-400 underline ml-1"
            >
              click here
            </a>
            .
          </p>
        )}
      </motion.div>

      <p className="absolute bottom-10 text-center flex items-center justify-center flex-row gap-2 font-light text-neutral-300 text-md">
        Made with ❤️ by
        <span className="font-semibold bg-gradient-to-r from-blue-500 to-blue-300 text-transparent bg-clip-text">
          Sairam Mangeshkar
        </span>
        <SimpleIcon
          name="siGithub"
          className="mx-auto h-5 w-5 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
          onClick={() =>
            window.open("https://github.com/sairam4123/UrlShortenerTest")
          }
        />
      </p>

      <p className="absolute bottom-2 text-center font-light text-neutral-400 text-xs ">
        © 2025. All rights reserved.
      </p>
    </div>
  );
}
