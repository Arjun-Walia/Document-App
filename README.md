# Chat with Your Documents: A MERN + Ollama Application

## Overview

This is a full-stack web application designed to allow users to upload various document types and chat with their content. Leveraging the **MERN (MongoDB, Express, React, Node.js)** stack and **Ollama's local LLM**, the app ensures user data remains private and secure by processing all information locally. Users can get quick answers, summaries, and source-referenced highlights from their documents.

-----

## Key Features

### Core

  * **User Authentication**: Secure account creation and login.
  * **File Upload**: Supports PDF, TXT, DOCX, and common code file formats.
  * **Text Extraction & Chunking**: Parses and segments documents to optimize LLM interaction.
  * **Chat Interface**: A conversational UI for asking natural language questions about uploaded files.
  * **Ollama Integration**: The backend uses Ollama for local LLM inference, providing answers to user queries.
  * **Source Highlighting**: Answers are linked to their source locations within the document, with optional highlighting.
  * **Document Summarization**: Generate concise summaries and outlines of document content.
  * **Multi-file Support**: Interact with multiple documents simultaneously.
  * **Privacy-Focused**: All core processing is done locally, ensuring no sensitive data is sent to external cloud providers.

### Nice-to-Haves

  # Chat with Your Documents: A MERN + Ollama Application

  This repository now contains a minimal but working implementation matching the original plan: a MERN stack app with local Ollama integration to chat over uploaded documents.

  ## Quick start (Windows PowerShell)

  1) Prereqs
  - Node.js and npm installed
  - MongoDB running (local or Docker)
  - Ollama running and a model pulled (e.g., llama3)

  2) Environment
  - Copy `.env.example` and create:
    - `backend/.env` (edit JWT_SECRET as a long random string):
      MONGODB_URI=mongodb://localhost:27017/document_app
      JWT_SECRET=change_me_to_a_long_random_string
      OLLAMA_BASE_URL=http://localhost:11434
      OLLAMA_MODEL=llama3
      UPLOAD_DIR=uploads
      PORT=5000
    - `frontend/.env`:
      VITE_API_BASE_URL=http://localhost:5000

  3) Install deps
  - Backend: `cd backend; npm install`
  - Frontend: `cd ../frontend; npm install`

  4) Run (two terminals)
  - Backend: `cd backend; npm start`
  - Frontend: `cd frontend; npm start`

  5) Open http://localhost:3000

  ## Scripts
  - Backend
    - `npm start` -> node server.js
    - `npm run dev` -> nodemon server.js
  - Frontend
    - `npm start` or `npm run dev` -> Vite dev server
    - `npm run build` -> production build (frontend/dist)

  ## Notes
  - Minimal auth (JWT) and file parsing (pdf/docx/txt) are included.
  - Chat endpoint summarizes/answers using Ollama (model configurable via env).
  - Treat as a starter; harden validation, error handling, and add tests for production.