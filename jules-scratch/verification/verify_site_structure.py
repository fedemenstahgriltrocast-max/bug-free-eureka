from playwright.sync_api import sync_playwright, expect
import os

def run_verification(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Get the absolute path to the index.html file
    index_path = "file://" + os.path.abspath("index.html")
    page.goto(index_path)

    # 1. Verify the landing page
    expect(page.locator("h1")).to_have_text("Marxia Café y Bocaditos")
    page.screenshot(path="jules-scratch/verification/01_landing_page.png")

    # 2. Click "Order Now" and verify the order page
    order_now_button = page.locator('a[data-i18n="orderNow"]')
    order_now_button.click()

    # Wait for navigation to complete
    page.wait_for_load_state("load")

    # Get the absolute path to the order.html file
    order_path = "file://" + os.path.abspath("order.html")
    expect(page).to_have_url(order_path)

    # Verify that the order page content is visible
    expect(page.locator('button[id="order-title"]')).to_be_visible()
    page.screenshot(path="jules-scratch/verification/02_order_page.png")

    # 3. Verify language toggle
    lang_toggle = page.locator("#languageToggle")
    lang_toggle.click()
    expect(page.locator('button[id="order-title"] span[data-i18n="orderTitle"]')).to_have_text("Nuestro menú")
    page.screenshot(path="jules-scratch/verification/03_order_page_es.png")

    # 4. Verify theme toggle
    theme_toggle = page.locator("#themeToggle")
    theme_toggle.click()
    html_element = page.locator("html")
    expect(html_element).to_have_attribute("data-theme", "dark")
    page.screenshot(path="jules-scratch/verification/04_order_page_dark.png")


    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")