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

async def _call_generic(prompt: str, model: str | None, api_key: str, endpoint: str | None) -> str:
    if not endpoint:
        raise HTTPException(status_code=400, detail="Generic provider requires an endpoint")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        
        payload_chat = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}]
        }

        resp = await client.post(endpoint, headers=headers, json=payload_chat)

        if resp.is_success:
            data = resp.json()
            return (
                data.get("choices", [{}])[0].get("message", {}).get("content")
                or data.get("response")
                or str(data)
            )

        payload_prompt = {
            "model": model,
            "prompt": prompt
        }

        resp = await client.post(endpoint, headers=headers, json=payload_prompt)

        if resp.is_success:
            data = resp.json()
            return data.get("text") or data.get("response") or str(data)

        raise HTTPException(
            status_code=502,
            detail=f"Generic provider failed. Last response: {resp.text}"
        )


async def run_api_llm(body):
    provider_key = body.provider.lower()
    handler = _PROVIDERS.get(provider_key, _call_generic)

    if handler == _call_generic:
        return await handler(body.prompt, body.model, body.api_key, body.endpoint)
    else:
        return await handler(body.prompt, body.model, body.api_key)


