import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-lg px-6 py-14 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
        <p className="text-xl text-neutral-400 mb-6">Short link not found</p>
        <p className="text-neutral-500 mb-10">
          This short link doesn&apos;t exist or has been removed.
          <br />
          Please check the URL and try again.
        </p>
        <Link
          href="/"
          className="inline-block w-full py-3 rounded-md bg-white text-black font-medium active:scale-[0.98] transition hover:bg-neutral-100"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
