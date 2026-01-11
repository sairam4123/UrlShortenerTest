import os
from google.genai import Client as GenAIClient


async def get_genai_client() -> GenAIClient:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError("GOOGLE_API_KEY not found in environment variables")
    return GenAIClient(api_key=api_key)


PROMPT = """
You are a helpful assistant that generates concise and relevant names for URLs based on their content. Given a URL, provide a short, descriptive name that captures the essence of the webpage.
For example, for the URL "https://www.example.com/articles/how-to-learn-python", a suitable name could be "learn-python", "learn-python-tutorial", or "python-basics". Include the reference from the webpage to ensure relevance.
Provide {needed} suggestive names for the following URL: {url}
Ensure that the names are unique, easy to remember, and do not contain special characters or spaces.
Keep the text length of each name under 15 characters.
The names must be URL-friendly (only alphanumeric characters and hyphens).

The contents of the page linked by the URL is provided below for your reference.
{text}
"""
