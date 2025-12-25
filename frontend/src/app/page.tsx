"use client";
import { useEffect, useState } from "react";
import AliasChips from "@/@components/AliasChips";
import { api } from "@/api/api";
import { useDebounce } from "use-debounce";
import Input from "@/@components/Input";
import { Check, X } from "lucide-react";
import { Button } from "@/@components/Button";

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <main className="w-full max-w-lg px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight mb-10 text-center">
          Sairam&apos;s <span className="text-neutral-400">URL Shortener</span>
        </h1>

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
        <div
          className={
            "mb-6 bg-neutral-800 p-4 rounded-md" + (!link ? " hidden" : "")
          }
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
            hidden={!link}
            rightIcon={
              checkValidityQuery.isLoading ? null : alias ? (
                checkValidityQuery.data ? (
                  <Check className="text-green-500" />
                ) : (
                  <X className="text-red-500" />
                )
              ) : null
            }
          />

          {link && (
            <div className="mt-3">
              <p className="text-sm text-neutral-400 -mb-2">Suggested</p>
              <AliasChips
                aliases={
                  suggestAliasesMutation.isPending ? [] : suggestedAliases || []
                }
                onAliasSelected={setAlias}
                length={3}
              />
            </div>
          )}
        </div>

        {/* Shorten Button */}
        <Button
          onPress={() => shortenUrl.mutate({ url: link, alias })}
          disabled={
            shortenUrl.isPending || (!!alias && !checkValidityQuery.data)
          }
          className="w-full"
          text={shortenUrl.isPending ? "Processing..." : "Shorten"}
        />

        {/* Output */}
        {shortenedUrl && (
          <div className="mt-6">
            <a
              href={shortenedUrl}
              className="underline text-white text-lg hover:text-neutral-300 transition"
            >
              {shortenedUrl}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
