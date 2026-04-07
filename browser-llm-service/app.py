from fastapi import FastAPI, HTTPException
from selenium_runner import run_prompt

app = FastAPI()


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/run")
def run(data: dict):
    try:
        prompt = data["prompt"]
        llm_info = data["llm_info"]

        response = run_prompt(prompt, llm_info)

        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))