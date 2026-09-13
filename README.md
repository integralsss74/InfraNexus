# 🏗️ InfraNexus (MoSPI Infrastructure Risk Predictor)

**InfraNexus** is a full-stack, responsive platform built for the predictive monitoring of infrastructure projects. It helps track portfolio risk, project delays, cost overruns, and provides early-warning signals using an intelligent decision-support system. 

### 🔗 Live Demo
**👉 [https://infranexus.onrender.com](https://infranexus.onrender.com/)**

---

## ✨ Key Features

- 📊 **Interactive Monitoring Dashboard:** Track key performance indicators (KPIs), risk distributions, and project statuses across various sectors and ministries in real-time.
- 🔍 **Project Investigation:** Search and filter through infrastructure projects to see their financial schedules, delay trajectories, and automated risk contributors.
- 🤖 **AI Intelligence Assistant:** A built-in assistant that allows you to ask natural language questions about your portfolio and get instant, data-backed answers.
- 📂 **Governed Data Management:** Securely upload and map your CSV/XLSX files (up to 5 MB) to easily ingest new infrastructure data into the system.
- 🔮 **Risk Prediction & Scenario Analysis:** Calculate potential cost and time overruns based on synthetic progress data and run "what-if" simulations.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Recharts, Leaflet (Maps)
- **Backend:** Node.js, Express, tRPC (for end-to-end type safety)
- **Database:** Drizzle ORM (Supports PostgreSQL / MySQL / Local mock data)

---

## 💻 Local Setup

Want to run this project on your own machine? Follow these simple steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/integralsss74/paimana-AI.git
   cd paimana-AI
   ```

2. **Install the dependencies:**
   Make sure you have [Node.js](https://nodejs.org/) and `pnpm` installed.
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```
   *The app will automatically open at `http://localhost:3000`.*

4. *(Optional)* **Build for Production:**
   ```bash
   pnpm build
   pnpm start
   ```

---

## ⚠️ Disclaimer

*This project was created for demonstration and hackathon purposes. The platform currently uses a **Synthetic Demonstration Dataset** to showcase its features. Predictions, early-warning signals, and figures do not represent official Government of India decisions or real-world project data.*
