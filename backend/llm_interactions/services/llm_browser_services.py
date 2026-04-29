from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from fastapi import HTTPException
import time
import random
from typing import Optional, List
from pydantic import BaseModel
from schemas import LLMPromptRequest, LLMPromptResponse
import os

SELENIUM_URL = os.getenv("SELENIUM_URL", "http://localhost:4444/wd/hub")

TRAILING_NOISE_MARKERS = [
    "Gemini is AI and can make mistakes",
    "Tools\n",
    "ChatGPT can make mistakes. Check important info.",
    "Claude can make mistakes",
]
LEADING_NOISE_MARKERS = [
    "ChatGPT said:\n",
    "Gemini said\n",
    "Claude said:\n",
]

def strip_trailing_noise(text: str) -> str:
    for marker in TRAILING_NOISE_MARKERS:
        idx = text.find(marker)
        if idx != -1:
            text = text[:idx].rstrip()
            break
    return text

def strip_leading_noise(text: str) -> str:
    for marker in LEADING_NOISE_MARKERS:
        if text.startswith(marker):
            text = text[len(marker):].lstrip()
    return text


def handle_login(driver, login_details):
    if not login_details:
        return

    for i, step in enumerate(login_details):
        locator = (By.CSS_SELECTOR, step.location)

        try:
            element = WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable(locator)
            )
        except TimeoutException:
            raise HTTPException(
                status_code=502,
                detail=f"Login step {i}: element not clickable within 15s for selector '{step.location}'"
            )

        # Main action
        try:
            if step.action == "input":
                element.clear()
                element.send_keys(step.credential_reference or "")

            elif step.action == "click":
                try:
                    element.click()
                except WebDriverException:
                    driver.execute_script("arguments[0].click();", element)

            elif step.action == "wait":
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located(locator)
                )

            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Login step {i}: unknown action type '{step.action}'"
                )

        except HTTPException:
            raise
        except WebDriverException as e:
            raise HTTPException(
                status_code=502,
                detail=f"Login step {i}: browser error during action '{step.action}': {e}"
            )

        # Follow-up action
        if step.follow_up:
            try:
                if step.follow_up == "enter":
                    element.send_keys(Keys.RETURN)

                elif step.follow_up == "click":
                    try:
                        element.click()
                    except WebDriverException:
                        driver.execute_script("arguments[0].click();", element)

                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Login step {i}: unknown follow_up '{step.follow_up}'"
                    )
            except HTTPException:
                raise
            except WebDriverException as e:
                raise HTTPException(
                    status_code=502,
                    detail=f"Login step {i}: browser error during follow_up '{step.follow_up}': {e}"
                )

        time.sleep(0.5)


def find_input_box(driver, identifier):
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, identifier))
        )
    except TimeoutException:
        print("=== TIMEOUT: Page source snippet ===")
        print(driver.page_source[:3000])
        print("=== Current URL ===")
        print(driver.current_url)
        raise HTTPException(
            status_code=502,
            detail=f"Input box not present within 15s for selector '{identifier}' at URL: {driver.current_url}"
        )
    except WebDriverException as e:
        raise HTTPException(status_code=502, detail=f"Browser error while waiting for input box: {e}")

    try:
        candidates = driver.find_elements(By.CSS_SELECTOR, identifier)
    except WebDriverException as e:
        raise HTTPException(status_code=502, detail=f"Failed to query input box selector '{identifier}': {e}")

    valid = []
    for c in candidates:
        try:
            if c.is_displayed() and c.is_enabled():
                valid.append((c.location['y'], c))
        except WebDriverException:
            #Element went stale mid-iteration
            continue

    if not valid:
        raise HTTPException(
            status_code=502,
            detail=f"No visible, enabled input box found for selector '{identifier}'"
        )

    valid.sort(key=lambda x: x[0], reverse=True)
    return valid[0][1]


def wait_for_response_after_prompt(driver, container_selector, prompt_text, timeout=30, quiet_period=5, poll_interval=0.5):
    end_time = time.time() + timeout
    last_text = ""
    last_change_time = None

    while time.time() < end_time:
        try:
            container = WebDriverWait(driver, poll_interval).until(
                lambda d: d.find_element(By.CSS_SELECTOR, container_selector)
            )
            current_text = container.text
        except TimeoutException:
            current_text = last_text
        except WebDriverException as e:
            raise HTTPException(status_code=502, detail=f"Browser error while waiting for response: {e}")

        #Strip prompt from the front
        idx = current_text.find(prompt_text)
        if idx != -1:
            current_text = current_text[idx + len(prompt_text):].lstrip()
        else:
            parts = current_text.split("\n\n", 1)
            if len(parts) > 1:
                current_text = parts[1].lstrip()

        current_text = strip_leading_noise(current_text)
        current_text = strip_trailing_noise(current_text)

        if current_text and current_text != last_text:
            last_text = current_text
            last_change_time = time.time()

        if last_text and last_change_time and time.time() - last_change_time >= quiet_period:
            return last_text

        time.sleep(poll_interval)

    #Distinguish between "never started" and "started but never settled"
    if not last_text:
        raise HTTPException(
            status_code=504,
            detail=f"No response generated within {timeout}s — page may not have responded."
        )
    else:
        raise HTTPException(
            status_code=504,
            detail=f"Response started but never stopped changing within {timeout}s — try increasing quiet_period or timeout."
        )


def run_prompt(request: LLMPromptRequest) -> str:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-extensions")
    options.add_argument("--lang=en-US")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")               #no GPU in containers
    options.add_argument("--disable-setuid-sandbox")    #companion to --no-sandbox
    options.add_argument("--remote-debugging-port=9222") #useful for debugging, can remove in prod
    options.add_argument("--disable-background-networking")  #reduces noise/unnecessary requests
    options.add_argument("--disable-default-apps")
    options.add_argument("--disable-sync")              #no Google account to sync with
    options.add_argument("--metrics-recording-only")
    options.add_argument("--mute-audio")

    try:
        driver = webdriver.Remote(
            command_executor=SELENIUM_URL,
            options=options
        )
    except WebDriverException as e:
        raise HTTPException(status_code=500, detail=f"Failed to start Chrome driver: {e}")

    try:
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        try:
            driver.get(request.model.access_url)
        except WebDriverException as e:
            raise HTTPException(status_code=502, detail=f"Failed to load URL '{request.model.access_url}': {e}")

        for e in driver.find_elements(By.CSS_SELECTOR, "div, p, span"):
            try:
                e.text
            except WebDriverException:
                pass

        if request.model.login_info:
            handle_login(driver, request.model.login_info)

        input_box = find_input_box(driver, request.model.browser_textbox)

        try:
            input_box.click()
            for c in request.prompt.input_text:
                input_box.send_keys(c)
                time.sleep(random.uniform(0.02, 0.04))
            time.sleep(0.5)
            input_box.send_keys(Keys.RETURN)
        except WebDriverException as e:
            raise HTTPException(status_code=502, detail=f"Failed to type prompt into input box: {e}")

        response = wait_for_response_after_prompt(driver, "main", request.prompt.input_text)
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during browser session: {e}")
    finally:
        driver.quit() 


def run_browser_test(request: LLMPromptRequest, max_attempts=3, delay=2) -> str:
    last_exception = None

    for attempt in range(1, max_attempts + 1):
        try:
            print(f"[Attempt {attempt}] Starting run...")
            result = run_prompt(request)
            print(f"[Attempt {attempt}] Success")
            return result

        except HTTPException as e:
            print(f"[Attempt {attempt}] Failed with HTTP {e.status_code}: {e.detail}")
            last_exception = e

            #Don't retry on client errors (4xx), they won't self-resolve
            if e.status_code < 500:
                raise

            if attempt < max_attempts:
                print(f"Retrying in {delay} seconds...\n")
                time.sleep(delay)

        except Exception as e:
            print(f"[Attempt {attempt}] Unexpected error: {e}")
            last_exception = HTTPException(status_code=500, detail=str(e))

            if attempt < max_attempts:
                print(f"Retrying in {delay} seconds...\n")
                time.sleep(delay)

    raise HTTPException(
        status_code=last_exception.status_code if isinstance(last_exception, HTTPException) else 500,
        detail=f"All {max_attempts} attempts failed. Last error: {last_exception.detail if isinstance(last_exception, HTTPException) else str(last_exception)}"
    )
