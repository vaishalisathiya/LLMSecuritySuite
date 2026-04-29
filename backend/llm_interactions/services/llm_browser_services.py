from selenium import webdriver 
from selenium.webdriver.common.by import By 
from selenium.webdriver.common.keys import Keys 
from selenium.webdriver.chrome.options import Options 
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.common.exceptions import TimeoutException
from LLMSecuritySuite.backend.schemas import LLMPromptRequest, LLMPromptResponse
import time 


def handle_login(driver, login_details):
    for step in login_details:
        try:
            element = driver.find_element(By.CSS_SELECTOR, step.location)
            element.click()
            element.send_keys(step.input)
            time.sleep(1)
        except Exception:
            pass

def find_input_box(driver, identifier): 
    candidates = driver.find_elements(By.CSS_SELECTOR, identifier) 
    valid = [] 
    for c in candidates: 
        if c.is_displayed() and c.is_enabled(): 
            location = c.location['y'] 
            valid.append((location, c)) 
            
    if not valid: 
        raise Exception("No valid input box found.") 
    valid.sort(key=lambda x: x[0], reverse=True) 
    return valid[0][1] 

def wait_until_text_stops_changing(driver, container_selector, timeout=180, quiet_period=5, poll_interval=0.5):
    end_time = time.time() + timeout
    last_text = ""
    last_change_time = time.time()

    while time.time() < end_time:
        try:
            container = WebDriverWait(driver, poll_interval).until(
                lambda d: d.find_element(By.CSS_SELECTOR, container_selector)
            )
            current_text = container.text
        except TimeoutException:
            current_text = last_text 

        if current_text != last_text:
            last_text = current_text
            last_change_time = time.time()

        if time.time() - last_change_time >= quiet_period:
            return current_text

        time.sleep(poll_interval)

    return last_text

def run_prompt(request: LLMPromptRequest) -> str:
    options = Options() 
    #options.add_argument("--headless=new")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled") 
    options.add_experimental_option("excludeSwitches", ["enable-automation"]) 
    options.add_experimental_option("useAutomationExtension", False) 
    driver = webdriver.Chrome(options=options) 
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})") 
    driver.get(request.model.access_url) 

    old_texts = set() 
    for e in driver.find_elements(By.CSS_SELECTOR, "div, p, span"): 
        try: 
            old_texts.add(e.text)     
        except: 
            pass 

    #if request.model.login_info:
    #    handle_login(driver, request.model.login_info)

    input_box = find_input_box(driver, request.model.browser_textbox) 
    input_box.click() 

    for c in request.prompt.input_text: 
        input_box.send_keys(c) 
        time.sleep(0.03) 
    time.sleep(1)
    input_box.send_keys(Keys.RETURN) 
    response = wait_until_text_stops_changing(driver, "main") 
    return response

def run_browser_llm(request: LLMPromptRequest) -> LLMPromptResponse:
    response = run_prompt(request)
    return LLMPromptResponse(
        response=response,
        provider=request.model.provider,
        model=request.model.model_identifier,
    )