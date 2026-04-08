from selenium import webdriver 
from selenium.webdriver.common.by import By 
from selenium.webdriver.common.keys import Keys 
from selenium.webdriver.chrome.service import Service 
from selenium.webdriver.chrome.options import Options 
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC 
from selenium.webdriver.common.by import By 
from selenium.common.exceptions import TimeoutException
from models import PROMPT, LLM_INFO
import time 


def handle_login(driver, login_details):
    """
    login_details format (from your models):
    [
        { "location": "<css selector>", "input": "value" }
    ]
    """
    for step in login_details:
        try:
            element = driver.find_element(By.CSS_SELECTOR, step["location"])
            element.click()
            element.send_keys(step["input"])
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
            # Wait up to poll_interval for element to exist
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
def run_prompt(prompt: PROMPT, llm_info: LLM_INFO):
    options = Options() 
    #options.add_argument("--headless=new")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled") 
    options.add_experimental_option("excludeSwitches", ["enable-automation"]) 
    options.add_experimental_option("useAutomationExtension", False) 
    driver = webdriver.Chrome(options=options) 
    driver.execute_script( "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})" ) 
    driver.get(llm_info["connection_point"]) 

    wait = WebDriverWait(driver, 30) 
    response_wait = WebDriverWait(driver, 120) 

    old_texts = set() 

    for e in driver.find_elements(By.CSS_SELECTOR, "div, p, span"): 
        try: 
            old_texts.add(e.text)     
        except: 
            pass 

    input_box = find_input_box(driver, llm_info["input_box"]) 
    input_box.click() 

    for c in prompt["prompt"]: 
        input_box.send_keys(c) 
        time.sleep(0.03) 
    #buffer such that the enter for sure gets detected
    time.sleep(1)
    input_box.send_keys(Keys.RETURN) 
    response = wait_until_text_stops_changing(driver, "main") 
    return response

def run_browser_llm(prompt: str, llm_info: dict):
    return run_prompt(prompt, llm_info)