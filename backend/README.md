# AutomataVerse Express Backend

This directory houses the secure, modular Node.js + Express backend service for **AutomataVerse**. It integrates with the Google Gen AI SDK to provide tutoring explanations, automated state machine generation, and student diagram validations.

---

## Folder Architecture

```
backend/
├── package.json         # Project dependencies and script declarations
├── server.js            # Express app server entry point
├── .env.example         # Environment template file
├── routes/
│   └── api.js           # API route mapping
├── controllers/
│   └── geminiController.js  # Controller endpoints parsing inputs
├── services/
│   └── geminiService.js     # Handles Google Gemini SDK client calls
├── middleware/
│   └── errorHandler.js      # Centralized error mapping middleware
└── README.md            # Installation and setup instructions
```

---

## Requirements

- **Node.js** (v16 or higher)
- **NPM** (v8 or higher)
- A **Google Gemini API Key**

---

## Installation & Setup

1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Initialize the environment configuration:
   - Create a copy of `.env.example` named `.env`:
     ```powershell
     copy .env.example .env
     ```
   - Open the newly created `.env` file and insert your Gemini API key:
     ```env
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     PORT=5000
     ```

---

## How to Run

### Development Mode (Hot Reloading)
```powershell
npm run dev
```

### Production Mode
```powershell
npm start
```

Once running, the API will be available at:
- Base endpoint: `http://localhost:5000/api`
- Health check: `GET http://localhost:5000/api/health`

---

## API Documentation

### 1. Concept Explanations
- **Endpoint**: `POST /api/explain`
- **Request Body**:
  ```json
  {
    "question": "What is the difference between a DFA and an NFA?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "..."
  }
  ```

---

## Connecting the Frontend

The React frontend utilizes a centralized API utility helper defined in `src/services/api.ts` to contact this server. If the server is offline or the Gemini API key is missing, the frontend falls back automatically to offline educational scripts so learning is never blocked.
