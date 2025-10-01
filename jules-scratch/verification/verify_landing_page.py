import os
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath("index.html")

    # Navigate to the local file
    page.goto(f"file://{file_path}")

    # Wait for the page to load by checking for a known element
    expect(page.locator("h1")).to_have_text("Marxia Café y Bocaditos")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()