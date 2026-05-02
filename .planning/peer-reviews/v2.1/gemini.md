Warning: Windows 10 detected. Some UI features like smooth scrolling may be degraded. Windows 11 is recommended for the best experience.
Warning: True color (24-bit) support not detected. Using a terminal with true color enabled will result in a better visual experience.
YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
Here are 7 A+ suggestions to elevate the Curry Family Hub from a functional archive to a premier digital heirloom.

1. **JSON Schema Validation with Zod (MUST)**
   Since the "database" is manually edited JSON, the project is one missing comma away from a production crash. Implement a build-time validation step using **Zod** that parses all files in `/content/` against strict TypeScript interfaces. This ensures the archive remains structurally sound for decades, even as future generations (or LLMs) edit the files.

2. **URL-Synced State for Tree & Lightbox (SHOULD)**
   Currently, selecting a person in the tree or opening a photo likely lives in transient React state. Sync these to the URL using query parameters (e.g., `/tree?person=jm-curry` or `/photographs/wedding?photo=img_04`). This allows family members to share a direct link to a specific "moment" or "ancestor," making the archive a collaborative communication tool rather than a solo browser.

3. **View Transitions API for "Hero" Navigation (SHOULD)**
   Use the native **View Transitions API** (integrated with Next.js) to animate the transition between the Family Tree and Person Pages. When a user clicks a node in the tree, the person's headshot should appear to "fly" from the tree canvas into its position on the detail page. This removes the "app-like" feel and makes the archive feel like a singular, physical space.

4. **"Oral History" Audio Field (COULD)**
   Add an optional `audio_url` field to `family.json` and `photos.json`. Seeing a photo is powerful; hearing a grandfather's 30-second explanation of that photo is life-changing. A simple, gold-accented "Listen to the Story" button in the Lightbox would add a sensory layer that makes the archive feel "alive."

5. **Heirloom Print Styles (COULD)**
   Apply a dedicated `@media print` stylesheet to the `/person/[id]` route. When a family member hits `Cmd+P`, the navigation and UI should disappear, replaced by a beautifully typeset "Family Record" sheet using Cormorant Garamond, suitable for physical scrapbooking or framing. This bridges the gap between digital convenience and physical legacy.

6. **Next/Image Blur-up Placeholders (MUST)**
   For a "treasured" feel, visual "pop-in" is the enemy. Since you are using a fixed set of photos, pre-generate low-res base64 blur strings (using a tool like `plaiceholder`) and store them in `photos.json`. This ensures that even on slow mobile connections, the archive loads with soft, warm color-blobs that "glow" into high-res scans, providing a premium, intentional loading experience.

7. **The "Archive Manifest" Export (SHOULD)**
   Add a hidden or footer-level feature to download a `manifest.zip` containing all JSON files and a simple `index.html`. This is "Digital Preservation 101." It ensures that even if the Next.js site goes offline in 15 years, the family has a self-contained, human-readable copy of their history that doesn't require a Node.js environment to view.

### Highest Leverage Change
**JSON Schema Validation (with Zod).** 
While deep linking or transitions are sexier, the project's long-term value depends entirely on the **integrity of the JSON data**. Without automated validation, a single accidental deletion of a required field during a manual update could render the entire archive unbuildable. Securing the data format is the highest-leverage move for ensuring this heirloom survives the next 50 years of maintenance.
