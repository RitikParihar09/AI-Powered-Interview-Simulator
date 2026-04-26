# AI-Powered Interview Simulator 🤖


An advanced, AI-driven interview platform designed to help candidates master their interview skills through realistic simulations, real-time feedback, and personalized coaching.

---

## 🚀 Overview

**Interview-Buddy** leverages state-of-the-art Large Language Models (LLMs) and interactive 3D visuals to provide a lifelike interview experience. Whether you're preparing for a technical role at a FAANG company or a behavioral round for a startup, our AI adapts to your needs.

### Key Features

-   **🧠 Resume-Centric Intelligence**: Upload your resume (PDF) and the AI will tailor questions specifically to your experience and skills.
-   **🎙️ Natural Voice Interaction**: Talk to the AI naturally. Our integration with STT/TTS technology allows for a seamless conversational flow.
-   **🔮 Interactive 3D AI Persona**: Engage with a dynamic 3D "AI Orb" (powered by Three.js) that responds to your voice and tone.
-   **📊 Real-time Evaluation**: Get instant feedback on your communication style, technical accuracy, and confidence.
-   **📑 Detailed Post-Interview Reports**: Receive a comprehensive breakdown of your performance with actionable insights for improvement.
-   **🏠 Personal Dashboard**: Track your progress over time and revisit past interview sessions.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)

### AI & Logic
- **LLM**: [Google Gemini 1.5/2.0](https://ai.google.dev/)
- **State Management**: React Context API
- **PDF Parsing**: [PDF.js](https://mozilla.github.io/pdf.js/)

### Backend & Infrastructure
- **Database/Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Deployment**: Vite-ready for Vercel/Netlify

---

## 📂 Project Structure

```text
src/
├── components/        # Reusable UI components (AIOrb, Dashboard, etc.)
├── context/           # Auth and Theme state management
├── services/          # LLM and API integrations
├── firebase.js        # Firebase configuration
├── App.jsx            # Main application logic & routing
└── main.jsx           # Entry point
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RitikParihar09/AI-Powered-Interview-Simulator.git
   cd Interview-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## 🚧 Roadmap

- [ ] Multi-lingual interview support.
- [ ] Integration with LinkedIn for automatic profile fetching.
- [ ] Video-based emotion analysis.
- [ ] Mock coding environment integration.

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<p align="center">Made with ❤️ for better career opportunities.</p>
