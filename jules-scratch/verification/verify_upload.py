import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the auth page
            await page.goto("http://localhost:5173/")
            await page.wait_for_selector("text=Přihlášení", timeout=10000)

            # Register as a professor
            await page.click("text=Zaregistrujte se")
            await page.wait_for_selector("text=Registrace")

            await page.fill("input[type=email]", "test.professor@example.com")
            await page.fill("input[type=password]", "password123")
            await page.click("text=Jsem Profesor")
            await page.click("button[type=submit]")

            # Wait for login to complete and dashboard to load
            await page.wait_for_selector("text=Vytvořit novou lekci", timeout=10000)

            # Upload a file in the GlobalFilesManager, which is on the professor dashboard
            # The file input is hidden, so we need to use set_input_files on the input element itself.
            # There are two file inputs on the page, one for global files and one for lesson-specific files.
            # We need to find the one for global files.
            # The button for global files has the text 'Nahrát globální soubor(y)'
            # Let's find the button and then find the input associated with it.
            # A simpler way is to just find all file inputs and use the first one, as the global one appears first.

            file_inputs = await page.query_selector_all('input[type="file"]')
            # The global file manager is the first one on the page.
            global_file_input = file_inputs[0]

            await global_file_input.set_input_files('jules-scratch/verification/dummy.txt')

            # Wait for the upload to complete
            await expect(page.get_by_text("dummy.txt")).to_be_visible(timeout=15000)

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/upload_verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
