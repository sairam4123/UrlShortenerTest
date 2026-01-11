from datetime import datetime
import fastapi
from pydantic import AnyHttpUrl
from sqlalchemy import select, update
import time
import hashlib
import random
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup

from src.schemas import (
    ErrorResponse,
    LinkAliasAvailabilityResponse,
    LinkAliasSuggestionResponse,
    LinkCreate,
    LinkMetadataResponse,
    LinkResponse,
    LinkRedirectResponse,
    LinkShortUrlSuggestionsResponse,
    LinkURLExistenceResponse,
)
from src.db import get_async_session, AsyncSession
from src.models import Link, LinkClickLog, LinkMetadata

from src.utils import PROMPT, get_genai_client

app = fastapi.FastAPI(root_path="/api")

# Handle CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_hash(str: str):
    return hashlib.md5(str.encode()).hexdigest()


def random_phrase(n_chars):
    phrase = ""
    string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
    for _ in range(n_chars):
        phrase += random.choice(string)  # Pick a random letter
    return phrase


@app.post("/url/create", response_model=LinkResponse | ErrorResponse)
async def create_url(
    link: LinkCreate,
    sql_db: AsyncSession = fastapi.Depends(get_async_session),
):
    long_url = link.long_url
    custom_name = link.name.strip() if link.name else None

    hashed_long_url = get_hash(
        str(time.time()) + long_url.encoded_string() + random_phrase(20)
    )
    hashed_string = hashed_long_url[:8]

    sql_db_link = await sql_db.execute(
        select(Link).where(Link.id == (custom_name if custom_name else hashed_string))
    )
    existing_link = sql_db_link.scalars().one_or_none()

    if custom_name and existing_link:
        return {
            "error": "BAD_REQUEST",
            "reason": "Name already occupied, try a different name",
        }
    elif existing_link:  # this is quite rare, but still can happen.. so instead of generating a new hash, we just extend the hash.
        hashed_string = hashed_long_url[: random.randint(9, 12)]

    url_id = custom_name if custom_name else hashed_string

    new_link = Link(id=url_id, long_url=str(long_url))

    new_metadata = LinkMetadata(
        link_id=url_id,
        name=custom_name if custom_name else "",
        long_url=str(long_url),
        clicks=0,
        last_ip=None,
    )

    sql_db.add(new_link)
    sql_db.add(new_metadata)
    await sql_db.commit()
    await sql_db.refresh(new_link)
    await sql_db.refresh(new_metadata)

    # return the Link
    return LinkResponse(
        shortened_url=new_link.id,
        long_url=AnyHttpUrl(new_link.long_url),
        metadata=LinkMetadataResponse(
            custom_name=new_metadata.name if new_metadata.name != "" else None,
            clicks=new_metadata.clicks,
            last_ip=new_metadata.last_ip,
        ),
    )


@app.get("/url/{short_url_id}/metadata", response_model=LinkResponse)
async def get_shortened_url_metadata(
    short_url_id: str, sql_db: AsyncSession = fastapi.Depends(get_async_session)
):
    link = (
        (await sql_db.execute(select(Link).where(Link.id == short_url_id)))
        .scalars()
        .one_or_none()
    )

    if not link:
        return {"error": "NOT_FOUND", "message": "The requested URL was not found"}

    metadata = (
        (
            await sql_db.execute(
                select(LinkMetadata).where(LinkMetadata.link_id == short_url_id)
            )
        )
        .scalars()
        .one_or_none()
    )

    if not metadata:
        raise AttributeError("Metadata entry not found for the given link ID")

    return LinkResponse(
        shortened_url=link.id,
        long_url=AnyHttpUrl(link.long_url),
        metadata=LinkMetadataResponse(
            custom_name=metadata.name if metadata.name != "" else None,
            clicks=metadata.clicks,
            last_ip=metadata.last_ip,
        ),
    )


@app.get("/url/{url}/redirect", response_model=LinkRedirectResponse | ErrorResponse)
async def redirect_url(
    url: str,
    req: fastapi.Request,
    sql_db: AsyncSession = fastapi.Depends(get_async_session),
):
    req_client = req.client
    ipaddr = None
    if req_client:
        ipaddr = req_client.host

    link = (
        (await sql_db.execute(select(Link).where(Link.id == url)))
        .scalars()
        .one_or_none()
    )

    if not link:
        return {
            "error": "NOT_FOUND",
            "message": "The requested URL was not found",
            "redirect_to": "/404",
        }

    # update click log
    new_log = LinkClickLog(
        link_id=url,
        click_ip=ipaddr,
        timestamp=datetime.now(),
        user_agent=req.headers.get("user-agent", "unknown"),
    )

    # update the metadata clicks count
    metadata = await sql_db.execute(
        update(LinkMetadata)
        .values(clicks=LinkMetadata.clicks + 1, last_ip=ipaddr)
        .where(LinkMetadata.link_id == url)
    )
    if not metadata:
        raise AttributeError("Metadata entry not found for the given link ID")

    sql_db.add(new_log)
    await sql_db.commit()
    await sql_db.refresh(new_log)

    return {"message": "Redirecting...", "long_url": link.long_url}


@app.post("/alias/suggest", response_model=LinkAliasSuggestionResponse | ErrorResponse)
async def suggest_alias(
    long_url: str,
    count: int = 3,
    sql_db: AsyncSession = fastapi.Depends(get_async_session),
):
    if count > 10:
        return {
            "error": "BAD_REQUEST",
            "reason": "Count must be less than or equal to 10",
        }

    # fetch metadata from the URL (title, description, etc.)
    import httpx

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"
    }

    try:
        resp = httpx.get(long_url, timeout=5.0, follow_redirects=True, headers=headers)
        if resp.status_code >= 400:
            return {
                "error": "NOT_FOUND",
                "message": "The provided URL does not exist." + resp.text,
            }
    except httpx.RequestError as e:
        return {
            "error": "NOT_FOUND",
            "message": "The provided URL does not exist or is unreachable. " + str(e),
        }
    
    

    client = await get_genai_client()
    parsed_text = BeautifulSoup(resp.text, "html.parser").get_text(strip=True)
    print(parsed_text[:500], "Parsed text preview")

    time_taken = time.time()
    # TODO: Integrate with AI as soon as possible
    aliases = set()

    while len(aliases) < count:
        need = count - len(aliases)
        print("parsed_text length:", len(parsed_text), parsed_text[:100])
        ai_resp = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                PROMPT.format(
                    url=long_url, text=parsed_text[:5000], needed=int(need * 2)
                )  # take first 5000 chars only from the page, double the needed count to avoid duplicates
            ],
            config={
                "response_mime_type": "application/json",
                "response_schema": LinkShortUrlSuggestionsResponse,
            },
        )

        parsed = LinkShortUrlSuggestionsResponse.model_validate(ai_resp.parsed)
        if not parsed.suggested_names:
            return {
                "error": "AI_ERROR",
                "message": "Failed to generate alias suggestions from AI",
            }
        batch = set(parsed.suggested_names)

        existing = (
            await sql_db.execute(select(Link.id).where(Link.id.in_(batch)))
        ).scalars()
        batch -= set(existing)  # remove conflicts already in DB
        aliases.update(batch)

    time_taken = time.time() - time_taken

    return {
        "suggested_aliases": list(aliases)[:count],  # return only the requested count
        "time_taken": time_taken,
    }


@app.get("/alias/check", response_model=LinkAliasAvailabilityResponse | ErrorResponse)
async def check_alias_availability(
    alias: str, sql_db: AsyncSession = fastapi.Depends(get_async_session)
):
    if len(alias) < 5 or len(alias) > 32:
        return {
            "error": "BAD_REQUEST",
            "reason": "Alias length must be between 3 and 32 characters",
            "is_available": False,
            "alias": alias,
        }
    existing = (
        (await sql_db.execute(select(Link.id).where(Link.id == alias)))
        .scalars()
        .one_or_none()
    )

    if existing:
        return {
            "is_available": False,
            "alias": alias,
            "message": "Alias is already taken",
        }
    else:
        return {
            "is_available": True,
            "alias": alias,
            "message": "Alias is available",
        }


@app.get("/url/check", response_model=LinkURLExistenceResponse | ErrorResponse)
async def check_url_existence(
    url: str,
):
    # do a HEAD request to see if the URL exists
    import httpx

    try:
        resp = httpx.head(url, timeout=5.0)
        if resp.status_code >= 400:
            return {
                "error": "NOT_FOUND",
                "message": "The provided URL does not exist or is unreachable",
            }
        else:
            return {
                "exists": True,
                "long_url": url,
                "message": "The provided URL exists and is reachable",
            }
    except httpx.RequestError:
        return {
            "error": "NOT_FOUND",
            "message": "The provided URL does not exist or is unreachable",
        }


@app.get("/404", response_model=ErrorResponse)
async def not_found():
    return {"error": "NOT_FOUND", "message": "The requested URL was not found"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "The server is running fine"}
