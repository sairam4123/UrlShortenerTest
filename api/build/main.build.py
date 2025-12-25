from sqlmodel import SQLModel

class LinkMetadata(SQLModel):
    link_id: str
    name: str
    long_url: str
    clicks: int
    last_ip: str | None


import fastapi
import ujson
import time
import pathlib
import hashlib
import random
from fastapi import status
from fastapi.responses import RedirectResponse


app = fastapi.FastAPI()

def get_db() -> dict:
    try:
        with open("db.json") as f:
            return ujson.loads(f.read())
    except FileNotFoundError:
        file = pathlib.Path("db.json")
        file.touch()
        file.write_text("{}") # Write empty JSON
        return {}

def store_db(data: dict):
    with open("db.json", "w") as f:
        f.write(ujson.dumps(data, indent=4))
        return True
    return False # writing failed...

def get_hash(str: str):
    return hashlib.md5(str.encode()).hexdigest()

def random_phrase(n_chars):
    phrase = ""
    string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
    for _ in range(n_chars):
        phrase += random.choice(string) # Pick a random letter
    return phrase

@app.get("/url/create")
async def create_url(long_url: str, custom_name: str | None = None):
    hashed_long_url = get_hash(str(time.time()) + long_url + random_phrase(20))
    hashed_string = hashed_long_url[:8]

    db = get_db()

    if not db.get("links"):
        db["links"] = {}
    
    if not db.get("metadata"):
        db["metadata"] = {}
    
    
    if custom_name and custom_name in db["links"]:
        return {
            "error": "BAD_REQUEST",
            "reason": "Name already occupied, try a different name"
        }
    elif hashed_string in db["links"]: # this is quite rare, but still can happen.. so instead of generating a new hash, we just extend the hash.
        hashed_string = hashed_long_url[:random.randint(9, 12)]

    url_id = custom_name if custom_name else hashed_string

    db["links"][url_id] = long_url
    db["metadata"][url_id] = {
        "id": url_id,
        "name": custom_name if custom_name else hashed_string,
        "long_url": long_url,
        "clicks": 0,
    }


    store_db(db)
    return {
        "url": f"/{url_id}"
    }



@app.get("/url/{url}")
async def get_shortened_url(url: str):
    db = get_db()
    if not db.get("metadata"):
        raise AttributeError("metadata does not exist")
    
    return db["metadata"][url]


@app.get("/{url}") # I don't quite remember the specifics
async def redirect_url(url: str, req: fastapi.Request):

    req_client = req.client
    ipaddr = None
    if req_client:
        ipaddr = req_client.host

    
    
    db = get_db()
    if not db.get("links"):
        raise AttributeError("links does not exist")

    links: dict = db["links"]
    if not links.get(url):
        return RedirectResponse("/404")
    
    
    try:
        if db["metadata"]:
            db["metadata"][url]["clicks"] += 1
            db["metadata"][url]["last_ip"] = ipaddr
    except (KeyError, TypeError) as e:
        print(e)
        pass # ignore
    
    store_db(db)

    return RedirectResponse(links[url])



