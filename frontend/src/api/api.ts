import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ErrorResponse,
  LinkAliasAvailabilityResponse,
  LinkAliasSuggestionResponse,
  LinkCreate,
  LinkRedirectResponse,
  LinkResponse,
} from "./models";

const apiUrl = "http://localhost:8000/api";

function useSuggestAliases() {
  async function suggestAliases(url: string, count: number): Promise<string[]> {
    const response = await fetch(
      `${apiUrl}/alias/suggest?long_url=${encodeURIComponent(
        url
      )}&count=${count}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch suggested aliases");
    }
    const data: LinkAliasSuggestionResponse = await response.json();
    return data.suggested_aliases || [];
  }

  const mutation = useMutation({
    mutationFn: ({ url, count }: { url: string; count: number }) =>
      suggestAliases(url, count),
  });
  return mutation;
}

function useShortenUrl() {
  async function shortenUrl(url: string, alias?: string) {
    const body: LinkCreate = { long_url: url };
    if (alias) {
      body.name = alias;
    }
    const response = await fetch(`${apiUrl}/url/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Failed to shorten URL");
    }
    const data: LinkResponse | ErrorResponse = await response.json();
    if ("error" in data) {
      throw new Error(data.message);
    }
    return data;
  }

  const mutation = useMutation({
    mutationFn: ({ url, alias }: { url: string; alias?: string }) =>
      shortenUrl(url, alias),
  });
  return mutation;
}

function useGetShortenedUrlMetadata(url: string) {
  async function getShortenedUrlMetadata(
    url: string
  ): Promise<LinkResponse | ErrorResponse> {
    const response = await fetch(
      `${apiUrl}/url/${encodeURIComponent(url)}/metadata`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch URL metadata");
    }
    const data: LinkResponse | ErrorResponse = await response.json();
    if ("error" in data) {
      throw new Error(data.message);
    }
    return data;
  }
  const query = useQuery({
    queryKey: ["shortenedUrlMetadata", url],
    queryFn: () => getShortenedUrlMetadata(url),
    enabled: !!url,
  });
  return query;
}

function useCheckAliasAvailability(alias: string) {
  async function checkAliasAvailability(alias: string): Promise<boolean> {
    const response = await fetch(
      `${apiUrl}/alias/check?alias=${encodeURIComponent(alias)}`
    );
    if (!response.ok) {
      throw new Error("Failed to check alias availability");
    }
    const data: LinkAliasAvailabilityResponse | ErrorResponse =
      await response.json();
    if ("error" in data) {
      throw new Error(data.message);
    }
    return data.is_available;
  }

  const query = useQuery({
    queryKey: ["aliasAvailability", alias],
    queryFn: () => checkAliasAvailability(alias),
    enabled: !!alias,
  });
  return query;
}

function useRedirectLink(alias: string) {
  async function redirectLink(alias: string): Promise<string> {
    const response = await fetch(
      `${apiUrl}/url/${encodeURIComponent(alias)}/redirect`
    );
    if (!response.ok) {
      throw new Error("Failed to redirect link");
    }
    const data: LinkRedirectResponse | ErrorResponse = await response.json();
    if ("error" in data) {
      throw new Error(data.message, { cause: data.redirect_to });
    }
    return data.long_url;
  }
  const query = useQuery({
    queryKey: ["redirectLink", alias],
    queryFn: () => redirectLink(alias),
  });
  return query;
}

export const api = {
  suggested_aliases: {
    useMutation: useSuggestAliases,
  },
  shorten_url: {
    useMutation: useShortenUrl,
  },
  shortened_url_metadata: {
    useQuery: useGetShortenedUrlMetadata,
  },
  alias_availability: {
    useQuery: useCheckAliasAvailability,
  },
  redirect_link: {
    useQuery: useRedirectLink,
  },
};
