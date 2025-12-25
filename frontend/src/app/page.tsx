"use client";
import { useEffect, useState } from "react";
import AliasChips from "@/@components/AliasChips";
import { api } from "@/api/api";
import { useDebounce } from "use-debounce";
import Input from "@/@components/Input";
import { Check, X } from "lucide-react";
import { Button } from "@/@components/Button";
import { motion } from "framer-motion";

export default function Home() {
  const [link, setLink] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [debouncedLink] = useDebounce(link, 500);
  const [debouncedAlias] = useDebounce(alias, 500);
  const [suggestedAliases, setSuggestedAliases] = useState<string[]>([]);

  const shortenUrl = api.shorten_url.useMutation();
  const suggestAliasesMutation = api.suggested_aliases.useMutation();

  const checkValidityQuery = api.alias_availability.useQuery(debouncedAlias);

  useEffect(() => {
    if (debouncedLink) {
      suggestAliasesMutation.mutate({ url: debouncedLink, count: 3 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLink]);

  useEffect(() => {
    if (suggestAliasesMutation.isSuccess && suggestAliasesMutation.data) {
      setSuggestedAliases(suggestAliasesMutation.data);
    }
  }, [suggestAliasesMutation.data, suggestAliasesMutation.isSuccess]);

  useEffect(() => {
    if (shortenUrl.isSuccess && shortenUrl.data?.shortened_url) {
      setShortenedUrl(shortenUrl.data.shortened_url);
    }
  }, [shortenUrl.data?.shortened_url, shortenUrl.isSuccess]);

  console.log(
    "Alias availability:",
    checkValidityQuery.data,
    checkValidityQuery.isLoading
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-blue-900 text-white flex items-center justify-center">
      <main className="w-full max-w-lg px-6 py-14 bg-black/30 backdrop-blur-md rounded-2xl shadow-xl shadow-blue-900/20 border border-blue-500/10">
        <motion.h1
          className="text-4xl font-bold tracking-tight mb-2 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.span
            className="bg-gradient-to-r from-blue-500 to-blue-300 text-transparent bg-clip-text inline-block"
            initial={{ backgroundPosition: "0%" }}
            animate={{ backgroundPosition: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{ backgroundSize: "200%" }}
          >
            LnkUp
          </motion.span>
          .<span className="text-neutral-400">One</span>
        </motion.h1>

        <motion.p
          className="text-center mb-10 text-neutral-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Every long link deserves a{" "}
          <span className="text-blue-400">short legend.</span>
        </motion.p>

        {/* URL Input */}
        <div className="mb-6">
          <Input
            label="Long URL"
            placeholder="https://example.com/really-long-url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={shortenUrl.isPending}
          />
        </div>

        {/* Alias */}

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: link ? 1 : 0,
            height: link ? "auto" : 0,
            marginBottom: link ? "1.5rem" : "0rem", // prevents jank gap
          }}
          transition={{
            duration: 0.35,
            ease: "easeInOut",
          }}
          className="bg-neutral-900/50 rounded-lg border border-blue-500/20 shadow-lg shadow-blue-700/10 overflow-hidden p-4"
        >
          <Input
            label="Custom Alias (optional)"
            placeholder="your-custom-alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            errorText={
              alias && !checkValidityQuery.isLoading && !checkValidityQuery.data
                ? "Alias is already taken"
                : undefined
            }
            disabled={shortenUrl.isPending}
            loadingText={
              checkValidityQuery.isLoading ? "Checking availability..." : ""
            }
            isLoading={checkValidityQuery.isLoading}
            successText={
              alias && !checkValidityQuery.isLoading && checkValidityQuery.data
                ? "Alias is available"
                : undefined
            }
            state={
              alias
                ? checkValidityQuery.isLoading
                  ? "loading"
                  : checkValidityQuery.data
                  ? "success"
                  : "error"
                : undefined
            }
            rightIcon={
              alias && !checkValidityQuery.isLoading ? (
                <motion.div
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {checkValidityQuery.data ? (
                    <Check className="text-blue-400" />
                  ) : (
                    <X className="text-red-500" />
                  )}
                </motion.div>
              ) : null
            }
          />

          {link && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-3"
            >
              <p className="text-sm text-neutral-400 -mb-2">Suggested</p>
              <AliasChips
                aliases={
                  suggestAliasesMutation.isPending ? [] : suggestedAliases || []
                }
                onAliasSelected={setAlias}
                length={3}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Shorten Button */}
        <Button
          onPress={() => shortenUrl.mutate({ url: link, alias })}
          disabled={
            shortenUrl.isPending || (!!alias && !checkValidityQuery.data)
          }
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-black font-semibold"
          text={shortenUrl.isPending ? "Processing..." : "Shorten"}
        />

        {shortenedUrl && (
          <motion.div
            className="mt-6 px-4 py-3 bg-neutral-900/70 rounded-lg border border-blue-500/30 shadow shadow-blue-800/40"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <a
              href={shortenedUrl}
              className="underline text-blue-300 text-lg hover:text-blue-200 transition"
            >
              {window.location.origin}/{shortenedUrl}
            </a>
          </motion.div>
        )}
      </main>
    </div>
  );
}
