from playwright.sync_api import sync_playwright
import time


def test_full():
    BASE_URL = "https://rendiciones-flotas.vercel.app"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        results = []

        def check(name, url, expected_text=None):
            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                time.sleep(1)
                if expected_text:
                    found = expected_text.lower() in page.content().lower()
                    results.append((name, "PASS" if found else "FAIL"))
                else:
                    results.append((name, "PASS"))
            except Exception as e:
                results.append((name, f"FAIL: {str(e)[:50]}"))

        print("=== TESTING RENDICIONES APP ===\n")

        check("1. Login page", f"{BASE_URL}/auth/login", "Rendiciones")
        check("2. Admin dashboard", f"{BASE_URL}/admin", "Admin")
        check("3. Conductor dashboard", f"{BASE_URL}/conductor/dashboard", "conductor")
        check("4. Jefatura dashboard", f"{BASE_URL}/jefatura", "jefatura")
        check("5. Admin rendiciones", f"{BASE_URL}/admin/rendiciones", "rendiciones")
        check("6. Admin reportes", f"{BASE_URL}/admin/reportes", "exportar")

        browser.close()

        print("RESULTS:")
        print("-" * 40)
        for name, status in results:
            print(f"{'[PASS]' if status == 'PASS' else '[FAIL]'} {name}: {status}")

        passed = sum(1 for _, s in results if s == "PASS")
        print(f"\nTotal: {passed}/{len(results)} passed")


if __name__ == "__main__":
    test_full()
