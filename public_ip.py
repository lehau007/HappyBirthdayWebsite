from pyngrok import ngrok
import time

# Optional: set auth token programmatically
ngrok.set_auth_token("32e7yYcWadQlQHXJpXintOdA174_2DotXiTaPP3QshmK8mrVi")

public_url = ngrok.connect(8000, domain="unfatalistically-sporting-keaton.ngrok-free.dev")

print("Public URL:", public_url)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Stopping ngrok...")
    ngrok.kill()
