# 🌿 Plusnote – Your AI Health Journal Companion

Plusnote is a smart, emotionally intelligent health journaling app that helps users naturally track their daily health experiences, identify recurring patterns, and generate insightful summaries to assist during doctor visits. It's not a clinical tool — it's your AI-powered health memory companion.

---

## 🚀 Core Objective

**Plusnote empowers users to track their day-to-day health experiences (like journaling), and uses AI to detect recurring patterns between food, sleep, symptoms, and mood.**

At the click of a button, users can generate a clean, medical-style summary of their health logs to share with a healthcare professional.

---

## 🧠 Core Features

### 1. AI Journal Companion (Chatbot Agent)
- A warm, context-aware AI assistant that:
  - Prompts users daily (e.g., “What did you eat today?”, “How are you feeling?”)
  - References previous logs to provide contextual insights.
  - Answers smart health questions such as:
    - “Why do I get headaches after eating late?”
    - “Did I log bloating last week too?”

### 2. Daily Health Logging Feed
- Instagram-style daily cards that show:
  - Timestamp
  - Free-text entries (e.g., “Ate pizza, felt uneasy later”)
  - Optional symptom/mood/emotion tags
  - Sleep quality slider or emoji rating

### 3. AI Pattern Extraction + Report Generator
- Tap “Generate Report” to get a structured summary:
  - Recurring symptoms and lifestyle triggers
  - Chronological issue log
  - Doctor-ready talking points
  - Downloadable as a PDF

### 4. Authentication & Secure Storage
- Email/password authentication via **Firebase Auth** or **Supabase Auth**
- Journals are securely stored per user in **Supabase (PostgreSQL)**
- Multi-device sync support

### 5. 🔁 Weekly Mood Tracker (Advanced)
- Tracks dominant mood of last 7 days:
  - Happy, Calm, Neutral, Anxious, Angry, Low, Sick, Excited
- Displays horizontal emoji bar
- Shifts with every new entry

### 6. 🧠 Overall Health Score
- AI reads the emotional and physical tone across the last 7 entries
- Calculates a health score (0–100):
  - 🔴 Poor (0–30)
  - 🟠 Fair (31–60)
  - 🟡 Good (61–80)
  - 🟢 Excellent (81–100)
- Auto-updated and shown as a colored bar with a short summary

---



## 💻 Tech Stack

| Layer           | Tech                             |
|----------------|----------------------------------|
| Frontend        | React.js + TailwindCSS (or Flutter) |
| Backend         | Node.js + Express **or** Python + FastAPI |
| Authentication  | Supabase Auth / Firebase Auth     |
| Database        | Supabase (PostgreSQL)             |
| AI Engine       | Gemini API (Google Multimodal LLM) |
| PDF Generation  | React-to-PDF / ReportLab (Python) |
| Hosting         | Vercel (frontend), Render/Firebase (backend) |

---


---

## 🧩 UX Design Requirements

- Clean, modern UI with soft health-themed palette (greens/blues)
- Floating chatbot icon (bottom-right on every screen)
- Center-aligned “Generate Report” button
- Minimalistic daily cards with date, entry text, and tags
- Mobile-first, fully responsive

---

## 📊 AI Engine Responsibilities

- Parse natural language journal entries
- Extract structured data: symptoms, moods, foods, times
- Detect correlations: e.g., "late-night meal → headache"
- Summarize logs into doctor-ready reports
- Provide emotionally warm and reflective journaling interaction

---

## ✅ Setup & Usage Guide


```
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

Report Output Example :

🧾 Plusnote Health Summary

🗓 Date Range: July 30 – August 6

📌 Recurring Symptoms:
- Bloating (4 times)
- Headache (2 times after late meals)

🍔 Lifestyle Triggers:
- Heavy food at night → uneasiness
- Poor sleep → low energy next day

🗣️ Doctor Talking Points:
- Explore digestive issues related to dinner timing
- Sleep routine adjustment may improve energy

📊 Mood Trend:
🟩 Calm 🟨 Sick 🟥 Low 🟨 Sick 🟩 Calm 🟩 Calm 🟩 Neutral

🏥 Health Score: 74 – Good
Summary: "You’ve been mostly calm and recovering this week. Keep up the routine improvements."





🧠 Future Enhancements :

📑 Doctor View Mode with annotations
🔔 Smart Reminders for journal entries
📱 Mobile app version (Flutter)



❤️ Philosophy
Plusnote is not a medical app.
It’s a health memory tool — built to help you reflect on your body, track patterns, and prepare better for doctor visits.
It’s private, AI-enhanced, and deeply human.


🙌 Built with care by the Plusnote Team

Would you like a downloadable version of this as a `README.md` file or want help generating a matching landing page?


