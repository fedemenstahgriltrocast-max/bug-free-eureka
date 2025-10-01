from playwright.sync_api import sync_playwright

def run(playwright):
    chromium = playwright.chromium
    device = playwright.devices['iPhone 11']
    browser = chromium.launch(headless=True)
    context = browser.new_context(**device)
    page = context.new_page()

    # Get the absolute path to the order.html file
    import os
    file_path = os.path.abspath('order.html')

    page.goto(f'file://{file_path}')

    # Wait for the page to load completely
    page.wait_for_load_state('networkidle')

    # Scroll to the product carousel
    carousel_selector = ".product-carousel"
    page.locator(carousel_selector).scroll_into_view_if_needed()

    # Add a small delay to ensure rendering is complete
    page.wait_for_timeout(1000)

    # Take a screenshot
    page.screenshot(path='jules-scratch/verification/verification.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)