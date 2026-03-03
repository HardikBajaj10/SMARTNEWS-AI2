# SmartNews-AI

This repository contains a simple client-side news application built with HTML, TailwindCSS, and vanilla JavaScript along with a minimal Express/MongoDB backend skeleton.

## Getting Started

1. **Install dependencies**
   ```bash
   cd SmartNews-AI
   npm install
   ```

2. **Start the backend**
   - Development with live reload:
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm start
     ```

   The server listens on `http://localhost:5000` and will serve the static files from the `client/` directory.

3. **Open the client**
   Navigate to `http://localhost:5000/index.html` in your browser.

## Features

- Login page with role-based redirect (admin or user).
- Onboarding flow to select interests.
- Dashboard with today's articles and personalized recommendations.
- Admin panel to add articles (stored in `localStorage`).
- Analytics page with charts using Chart.js.
- Profile page displaying user engagement and level badge.
- Basic Express backend serving static files and sample API.

## Notes

- All persistent data is currently stored in `localStorage`; the backend is a stub for future expansion.
- Placeholder `controllers`, `models`, and `routes` files exist for when you integrate MongoDB logic.

---

Feel free to extend the project by connecting to a real database, improving authentication, or enhancing the recommendation engine.