from fastapi import APIRouter, HTTPException
import httpx
import schemas

router = APIRouter(prefix="/llm", tags=["llm"])


async def _call_openai(prompt: str, model: str, api_key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": [{"role": "user", "content": prompt}]}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded")
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"OpenAI error: {resp.text}")
        return resp.json()["choices"][0]["message"]["content"]


async def _call_anthropic(prompt: str, model: str, api_key: str) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {"model": model, "max_tokens": 1024, "messages": [{"role": "user", "content": prompt}]}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Anthropic API key")
        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail="Anthropic rate limit exceeded")
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Anthropic error: {resp.text}")
        return resp.json()["content"][0]["text"]


async def _call_google(prompt: str, model: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, params={"key": api_key}, json=payload)
        if resp.status_code in (400, 403):
            raise HTTPException(status_code=401, detail="Invalid Google API key or bad request")
        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail="Google rate limit exceeded")
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Google error: {resp.text}")
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


_PROVIDERS = {
    "openai": _call_openai,
    "anthropic": _call_anthropic,
    "google": _call_google,
}


@router.post("/interact", response_model=schemas.LLMInteractResponse)
async def interact(body: schemas.LLMInteractRequest):
    """Send a prompt to an LLM via API key and return the raw response."""
    provider_key = body.provider.lower()
    handler = _PROVIDERS.get(provider_key)
    if not handler:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider '{body.provider}'. Supported: {list(_PROVIDERS.keys())}",
        )
    response_text = await handler(body.prompt, body.model, body.api_key)
    return schemas.LLMInteractResponse(response=response_text, provider=body.provider, model=body.model)
