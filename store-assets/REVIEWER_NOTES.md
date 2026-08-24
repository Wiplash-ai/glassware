# Glassware Image Editor reviewer notes

Glassware has a complete account-free review path.

1. Install the extension.
2. Click the Glassware toolbar icon and confirm it opens `app/app.html` directly without a popup.
3. Open an ordinary HTTPS page, right-click the page, and choose **Capture page with Glassware**.
4. Glassware focuses the editor, consumes the pending screenshot once, and saves the resulting project locally.
5. In **Photo**, adjust exposure or contrast, choose a crop preset, and open the precision crop editor.
6. Add or select text in **Text**, then change its size or spacing in Type Studio.
7. Open **Layers** and confirm image, text, and shape layers remain independently editable.
8. Use **Export** to download a PNG.

The extension does not load remotely hosted executable code. Openverse
responses, user-selected images, and selected Google Font files are data
resources processed by executable code bundled with the extension.

**Sign in** and **Ask AI** are optional native surfaces in the packaged editor.
Sign-in requests access to `auth.wiplash.ai` only after a user action, uses the
browser-owned identity window with S256 PKCE, and stores one revocable opaque
Glassware session token—never a Google, GitHub, GitLab, Keycloak, OpenAI, or
ChatGPT credential. Firefox additionally presents its built-in optional data
consent for account, financial/payment, cloud, and AI content. No reviewer account or provider
credential is required to verify capture, local persistence, Photo Lab, Type
Studio, layer editing, and export.

Paid subscriptions are optional. A signed-in Creator who selects **Upgrade** is
sent to Stripe Checkout in a separate browser tab while the packaged editor
stays open. Stripe collects payment credentials. A signature-verified webhook
updates the account entitlement, and the extension refreshes the plan without
storing a card number or CVC. The same entitlement is returned to the signed-in
web app because both clients use the user's Wiplash.ai account identifier.

All five listing screenshots use the original, rights-safe source image and
provenance recorded in `store-assets/source/PROVENANCE.md`.
