export type LinkCreate = {
  name?: string;
  long_url: string;
};

export type LinkMetadataResponse = {
  clicks: number;
  last_ip?: string | null;
  custom_name?: string | null;
};

export type LinkResponse = {
  shortened_url: string;
  long_url: string;
  metadata: LinkMetadataResponse;
};

export type ErrorResponse = {
  error: string;
  message: string;
  redirect_to?: string | null;
};

export type LinkRedirectResponse = {
  message: string;
  long_url: string;
};

export type LinkAliasAvailabilityResponse = {
  alias: string;
  is_available: boolean;
};

export type LinkAliasSuggestionResponse = {
  suggested_aliases: string[];
};
