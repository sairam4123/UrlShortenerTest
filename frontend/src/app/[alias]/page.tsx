"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/api/api";

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
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-gray-600">Redirecting...</p>
    </div>
  );
}
