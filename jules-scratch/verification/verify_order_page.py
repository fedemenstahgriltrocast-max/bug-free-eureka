from playwright.sync_api import sync_playwright, expect
import os

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # The script is run from the root directory.
        file_path = os.path.abspath("order.html")
        page.goto(f"file://{file_path}")

        # Wait for an element to ensure the page is loaded.
        expect(page.locator(".product-carousel")).to_be_visible()

        # Take a screenshot of the entire page.
        page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    main()