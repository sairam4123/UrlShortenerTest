from pydantic import AnyHttpUrl, BaseModel, Field


class LinkCreate(BaseModel):
    long_url: AnyHttpUrl
    name: str | None = None


class LinkMetadataResponse(BaseModel):
    clicks: int
    last_ip: str | None
    custom_name: str | None = None


class LinkResponse(BaseModel):
    shortened_url: str
    long_url: AnyHttpUrl
    link_metadata: LinkMetadataResponse = Field(alias="metadata")


class ErrorResponse(BaseModel):
    error: str
    message: str
    redirect_to: str | None = None


class LinkRedirectResponse(BaseModel):
    message: str = "Redirecting to the original URL"
    redirect_to: str = Field(alias="long_url")


class LinkAliasAvailabilityResponse(BaseModel):
    alias: str
    is_available: bool


class LinkAliasSuggestionResponse(BaseModel):
    suggested_aliases: list[str]
    time_taken: float


class LinkURLExistenceResponse(BaseModel):
    long_url: AnyHttpUrl
    exists: bool


class LinkShortUrlSuggestionsResponse(BaseModel):
    suggested_names: list[str]
