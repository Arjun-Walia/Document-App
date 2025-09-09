# 📚 DocumentAI - Intelligent Document Chat Assistant

<div align="center">

![DocumentAI Banner](https://img.shields.io/badge/DocumentAI-Intelligent%20Assistant-blue?style=for-the-badge&logo=robot&logoColor=white)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Ollama](https://img.shields.io/badge/Ollama-AI%20Engine-FF6B6B?style=flat-square&logo=ai&logoColor=white)](https://ollama.ai/)

*Transform your documents into intelligent conversations with AI-powered analysis and insights.*

[✨ Live Demo](#-live-demo) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🛠️ API Reference](#-api-reference)

</div>

---

## 🌟 Overview

**DocumentAI** is a cutting-edge document analysis platform that leverages local AI processing to provide intelligent insights from your documents. Upload any document and engage in natural conversations to extract knowledge, summaries, and answers instantly.

### 🎯 Key Features

- **🤖 AI-Powered Chat** - Natural language conversations with your documents
- **📄 Multi-Format Support** - PDF, DOC, DOCX, TXT file processing
- **🔒 Privacy First** - 100% local processing with Ollama
- **🌙 Dark Mode** - Beautiful light/dark theme switching
- **✨ Modern UI** - Glassmorphism design with smooth animations
- **📱 Responsive** - Works perfectly on all devices
- **⚡ Fast Processing** - Efficient document chunking and indexing
- **🎨 Enhanced UX** - GSAP animations and Framer Motion interactions

---

## 🏗️ Architecture

```mermaid
graph TB
    A[Frontend - React/Vite] --> B[API Gateway - Express.js]
    B --> C[Authentication - JWT]
    B --> D[File Upload - Multer]
    B --> E[Document Processing - PDF.js]
    E --> F[Text Chunking Service]
    F --> G[MongoDB - Document Storage]
    B --> H[AI Chat - Ollama Integration]
    H --> I[Local AI Models]
    
    style A fill:#61DAFB,stroke:#333,stroke-width:2px
    style B fill:#339933,stroke:#333,stroke-width:2px
    style G fill:#47A248,stroke:#333,stroke-width:2px
    style I fill:#FF6B6B,stroke:#333,stroke-width:2px
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (local or cloud instance)
- **Ollama** (for local AI processing)

### 1. Clone the Repository

```bash
git clone https://github.com/Arjun-Walia/Document-App.git
cd Document-App
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create `.env` files in both directories:

**Backend `.env`:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/document-app

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_EXTENSIONS=pdf,doc,docx,txt
```

**Frontend `.env`:**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_MOCK_API=false

# App Configuration
VITE_APP_NAME=DocumentAI
VITE_APP_VERSION=1.0.0
```

### 4. Setup Ollama

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai for Windows

# Pull a model
ollama pull llama2
```

### 5. Start the Application

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start backend server
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application in action! 🎉

---

## 📂 Project Structure

```
Document-App/
├── 📁 backend/                 # Node.js Express Server
│   ├── 📁 config/             # Database & app configuration
│   │   └── db.js              # MongoDB connection
│   ├── 📁 controllers/        # Business logic
│   │   ├── authController.js  # Authentication handling
│   │   ├── chatController.js  # AI chat functionality
│   │   └── fileController.js  # File upload & processing
│   ├── 📁 middleware/         # Express middlewares
│   │   └── auth.js           # JWT authentication
│   ├── 📁 models/            # MongoDB schemas
│   │   ├── Document.js       # Document model
│   │   └── User.js           # User model
│   ├── 📁 routes/            # API endpoints
│   │   ├── auth.js           # Authentication routes
│   │   ├── chat.js           # Chat routes
│   │   └── files.js          # File handling routes
│   ├── 📁 services/          # External service integrations
│   │   ├── ollama.js         # Ollama AI service
│   │   └── pdf.js            # PDF processing
│   ├── 📁 uploads/           # File storage directory
│   ├── package.json          # Backend dependencies
│   └── server.js             # Server entry point
├── 📁 frontend/               # React Application
│   ├── 📁 src/               # Source code
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # React entry point
│   │   ├── apiClient.js      # API communication
│   │   └── styles.css        # Global styles & animations
│   ├── 📁 public/            # Static assets
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # TailwindCSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── vite.config.js        # Vite build configuration
---

## 🎨 UI/UX Features

### Modern Design System
- **Glassmorphism** cards with backdrop blur effects
- **Gradient animations** and color schemes
- **GSAP-powered** entrance animations
- **Framer Motion** micro-interactions
- **Responsive typography** with modern font stacks

### Interactive Elements
- **Drag & drop** file upload with visual feedback
- **Hover animations** with depth and elevation
- **Loading states** with animated spinners
- **Form validation** with smooth error animations
- **Theme switching** with transition effects

### Animation Library
- **Entry animations** with staggered reveals
- **Floating background orbs** with physics simulation
- **Button interactions** with lift and glow effects
- **Card transformations** on hover and focus
- **Smooth page transitions** between states

---

## 🔧 API Reference

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### File Management

#### POST `/api/files/upload`
Upload and process a document file.

**Headers:** `Authorization: Bearer <token>`
**Body:** `multipart/form-data` with file

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "document_id",
    "filename": "document.pdf",
    "originalName": "My Document.pdf",
    "chunks": 15,
    "processedAt": "2025-09-09T04:35:31.083Z"
  }
}
```

#### GET `/api/files`
Retrieve all uploaded documents for authenticated user.

**Headers:** `Authorization: Bearer <token>`

### AI Chat

#### POST `/api/chat`
Send a question about uploaded documents to AI.

**Headers:** `Authorization: Bearer <token>`

```json
{
  "question": "What are the main points in the document?",
  "documentIds": ["doc_id_1", "doc_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Based on the documents, the main points are...",
    "sourceDocuments": ["doc_id_1"],
    "processingTime": 1250
  }
}
```

---

## 🛠️ Development

### Tech Stack

**Frontend:**
- **React 18** - Modern component-based UI
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **GSAP** - High-performance animations
- **Lucide React** - Beautiful icon system

**Backend:**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction

**AI Integration:**
- **Ollama** - Local AI model serving
- **LLaMA 2** - Large language model

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend:**
```bash
npm start            # Start production server
npm run dev          # Start development server with nodemon
npm run test         # Run test suite
```

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

2. **Testing**
   ```bash
   # Run frontend tests
   cd frontend && npm test
   
   # Run backend tests
   cd backend && npm test
   ```

3. **Building**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # The built files will be in frontend/dist/
   ```

---

## 📊 Performance Optimization

### Frontend Optimizations
- **Code splitting** with React.lazy()
- **Image optimization** with modern formats
- **Font loading** optimization
- **Bundle analysis** with Vite rollup
- **Caching strategies** for API calls

### Backend Optimizations
- **Document chunking** for efficient processing
- **Database indexing** on frequently queried fields
- **File compression** and optimization
- **Response caching** for repeated queries
- **Connection pooling** for MongoDB

---

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **File validation** and sanitization
- **CORS protection** for cross-origin requests
- **Rate limiting** on API endpoints
- **Input sanitization** against injection attacks
- **Secure file storage** with access controls

---

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm install --production
```

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/document-app
JWT_SECRET=your_production_jwt_secret_very_long_and_secure
OLLAMA_BASE_URL=https://your-ollama-instance.com
```

### Deployment Options

- **Vercel/Netlify** - Frontend deployment
- **Heroku/Railway** - Full-stack deployment
- **Docker** - Containerized deployment
- **AWS/GCP/Azure** - Cloud deployment

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Use conventional commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for inspiring AI-powered document analysis
- **Ollama** for providing local AI model serving
- **React** and **Node.js** communities for excellent tools
- **TailwindCSS** for the utility-first CSS approach
- **MongoDB** for flexible document storage

---

## 📞 Support

- 📧 **Email:** arjun.walia.dev@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/Arjun-Walia/Document-App/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Arjun-Walia/Document-App/discussions)

---

<div align="center">

**Made with ❤️ by [Arjun Walia](https://github.com/Arjun-Walia)**

⭐ Star this repository if you found it helpful!

</div>