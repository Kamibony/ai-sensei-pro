import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture console messages
        messages = []
        page.on("console", lambda msg: messages.append(msg.text))

        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(2000)  # Wait for scripts to execute

        await browser.close()

        error_found = False
        for msg in messages:
            if "ReferenceError" in msg and "feature is not defined" in msg:
                print("Error successfully reproduced in production build.")
                error_found = True
                break

        if not error_found:
            print("Error not found in console logs of production build.")

if __name__ == "__main__":
    asyncio.run(main())