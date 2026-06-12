File Structure

It consists of four primary files:

index.html
: The structural layout including the sidebar dashboard widgets, top actions bar, active list grid, detail drawer, and forms.

style.css
: The dark-theme aesthetic system (deep slate/purple) with glowing states, styling definitions for MAS (pink), FAM (blue), and FO (green) badges.

data.js
: Pre-seeded database containing 12 high-quality realistic French postings representing families looking for spots.

app.js
: State controller governing events, filtering logic, local storage synchronization, template compilation, and the simulated crawl logs generato


Key Features 
1. Interactive Dashboard Stats
The top row calculates statistics in real-time based on active records, showing current counts for:

FO (Foyer Occupationnel / de Vie)
MAS (Maison d'Accueil Spécialisée)
FAM (Foyer d'Accueil Médicalisé)
Placements Sécurisés (Total spots successfully resolved, with dynamic resolution rate percentage).

2. Interactive SVG Map of France
A stylized, geometric map representing French regions.
Paths are color-coded based on density: regions containing active requests light up in transparent purple.
Hovering over a region displays a custom tooltip indicating the region name and count of active searches.
Clicking a region highlights it and filters the active listings instantly.

3. Real-Time Lead Feed & Filters
Postings are displayed as glassmorphic cards with visual signifiers based on type (color stripes) and priority (High = Red, Medium = Orange, Low = Green).
Filters bar allows multi-criteria filtering: by Region, Status (e.g., Nouveau, Contacté, Liste d'attente, Place obtenue), and Priority level.
Global Search bar matches text against names, titles, descriptions, and handicaps.

4. Details Drawer & Activation Panel
Clicking any card slides out a comprehensive details drawer containing:

Status & Urgence Manager: Modify the status or urgency level in real-time (saves instantly to LocalStorage).
Resident Profile: In-depth description of age, handicap, and specific needs.
Contact Card: Shows the family member's contact info (phone, email, original social post link) and provides direct action buttons (triggering mailto: and tel: actions).
Notes Editor: Log phone calls, interview updates, or application dates.
Activation Template Generator: An intelligent email compiler in French. Selecting a model (e.g., "Request info", "Spot available") auto-injects the resident's info and compiles a copyable/sendable template.

5. Network Search Simulator (Crawler Console)
Built-in terminal simulator displaying live logs of simulated web crawlers monitoring Facebook groups, Doctissimo forums, and regional ARS directories.
Clicking "Lancer le Scan" boots up the log cycle. After a short interval, it discovers new realistic requests and injects them directly into the feed, triggering soundless notification toasts.

6. Data Portability
Export: Download the entire current database state as a JSON file.
Import: Upload a backup JSON file to sync records or restore data.
Manual Input: Form modal to manually create or modify fiches.


This test app is copyrighted
