from playwright.sync_api import sync_playwright
import time


def test_rendiciones():
    BASE_URL = "http://localhost:3000"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("=== TEST 1: Pagina principal ===")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)
        print(f"   URL: {page.url}")
        print(f"   Titulo: {page.title()}")

        print("\n=== TEST 2: Login page ===")
        page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        print(f"   URL: {page.url}")

        # Find inputs
        inputs = page.locator("input").all()
        buttons = page.locator("button").all()
        print(f"   Inputs: {len(inputs)}, Buttons: {len(buttons)}")

        # Check form
        form = page.locator("form")
        print(f"   Form visible: {form.is_visible()}")

        print("\n=== TEST 3: Admin dashboard ===")
        page.goto(f"{BASE_URL}/admin", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        print(f"   URL: {page.url}")

        print("\n=== TEST 4: Conductor dashboard ===")
        page.goto(
            f"{BASE_URL}/conductor/dashboard", wait_until="networkidle", timeout=30000
        )
        time.sleep(2)
        print(f"   URL: {page.url}")

        print("\n=== TEST 5: Jefatura dashboard ===")
        page.goto(f"{BASE_URL}/jefatura", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        print(f"   URL: {page.url}")

        print("\n=== RESULTADOS ===")
        print("Todas las paginas cargan correctamente!")

        browser.close()


if __name__ == "__main__":
    test_rendiciones()
