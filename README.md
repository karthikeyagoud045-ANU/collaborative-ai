# ⚡ Ultimate Vibe Coder

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)
![WebContainers](https://img.shields.io/badge/WebContainers-API-blueviolet)
![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange)

**Ultimate Vibe Coder** is a next-generation, browser-based collaborative AI IDE. It combines the power of in-browser Node.js execution (WebContainers), real-time multiplayer editing (Yjs), and a fully autonomous AI agentic loop to write, test, and preview code directly in your browser.

---

## ✨ Features

- **🌐 In-Browser Execution:** Run a full Node.js environment directly in the browser using WebContainers. No Docker or remote VMs required.
- **🤝 Real-Time Collaboration:** Multiplayer editing and awareness powered by Yjs CRDTs. See your teammates' cursors, selections, and edits instantly.
- **🤖 Autonomous AI Agent:** Built-in AI assistant capable of creating files, running commands, and managing dependencies. Features a Human-in-the-Loop (HITL) approval gate for safe execution.
- **⚡ Live Preview:** Instant live preview of web applications running inside the WebContainer.
- **🎨 Glassmorphic UI:** A stunning, highly-polished, and accessible UI designed with modern CSS and fluid animations.
- **🛡️ Production Hardened:** Robust error boundaries, structured logging with API key sanitization, and rigorous memory-leak prevention.
- **💾 Cloud Persistence:** Optionally persists Yjs documents and room states to Supabase for seamless session resumption.

## 🏗️ Tech Stack

- **Frontend:** Next.js (App Router), React 19, TypeScript
- **Editor:** Monaco Editor
- **Collaboration:** Yjs, y-websocket, y-monaco
- **Execution Environment:** WebContainer API
- **AI Models:** OpenAI, Anthropic, Google Gemini
- **Backend (WebSocket):** Node.js custom WebSocket Server
- **Database:** Supabase (PostgreSQL)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or pnpm
- Supabase account (optional, for persistence)
- Provider API Keys (OpenAI, Anthropic, or Google)

### 1. Clone the repository

```bash
git clone https://github.com/karthikeyagoud045-ANU/ultimate-vibe-coder.git
cd ultimate-vibe-coder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory and add your keys:

```env
# Optional: Set up Supabase for persistence
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key # Needed for the WS server

# Collaboration Server
NEXT_PUBLIC_WS_URL=ws://localhost:1234
```

### 4. Start the WebSocket Server

In a separate terminal, start the Yjs WebSocket server:

```bash
npm run ws:start
# OR
node server/index.js
```

### 5. Start the Next.js Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - Deep dive into the system design, Agentic Loop, and CRDT synchronization.
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute to the project.

## 🚢 Deployment

### Frontend (Next.js)
The frontend is optimized for **Vercel**. 
1. Push to GitHub.
2. Import the project in Vercel.
3. Ensure you add the required Environment Variables.
4. Note: WebContainers require strict Cross-Origin Isolation headers. Ensure `next.config.ts` headers are properly applied in your deployment environment.

### WebSocket Server
The WebSocket server (`server/index.js`) can be deployed to **Fly.io**, **Render**, or **Railway**. 
A `fly.toml` and `Dockerfile` are included in the `server/` directory for immediate deployment to Fly.io.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
