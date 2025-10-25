# MY interview AI - Windows Setup Guide

## ✅ Windows Compatibility Confirmed

This project is fully compatible with Windows 10/11. All scripts have been updated to work on Windows.

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Yarn Package Manager**
   - Install globally: `npm install -g yarn`
   - Verify installation: `yarn --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/download/win

---

## 🚀 Quick Start (Windows)

### Step 1: Install Dependencies

Open Command Prompt or PowerShell in the project directory:

```bash
cd app
yarn install
```

### Step 2: Configure Environment Variables

The `.env` file is already configured with MongoDB Atlas. No changes needed!

Located at: `app/.env`

### Step 3: Run Development Server

**Option A: Standard (recommended)**
```bash
yarn dev
```

**Option B: Windows-specific (if Option A doesn't work)**
```bash
yarn dev:windows
```

Your app will be available at: **http://localhost:3000**

---

## 📝 Available Scripts (Windows Compatible)

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server (all platforms) |
| `yarn dev:windows` | Start development server (Windows-specific) |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn start:windows` | Start production server (Windows-specific) |

---

## 🔧 Environment Configuration

The `.env` file is pre-configured with:

```env
# MongoDB Atlas (Cloud Database)
MONGODB_URI=mongodb+srv://...

# NextAuth (Authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=192014009251-...
GOOGLE_CLIENT_SECRET=GOCSPX-...

# AI Services
EMERGENT_LLM_KEY=sk-emergent-...
GEMINI_API_KEY=AIzaSyD...
ELEVENLABS_API_KEY=sk_9f3bb...

# Email Service
RESEND_API_KEY=re_6du5...
```

**✅ All integrations ready to use on Windows!**

---

## 🌐 Testing the Application

1. **Landing Page**: http://localhost:3000
2. **Register**: http://localhost:3000/register
3. **Login**: http://localhost:3000/login
4. **Forgot Password**: http://localhost:3000/forgot-password

---

## 🛠️ Troubleshooting (Windows)

### Issue: Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: Yarn Not Recognized

**Error**: `'yarn' is not recognized as an internal or external command`

**Solution**:
```bash
# Install yarn globally
npm install -g yarn

# Or use npm instead
npm run dev
```

### Issue: MongoDB Connection Error

**Error**: `MongoServerError: Authentication failed`

**Solution**: The MongoDB Atlas credentials are already configured. If you see this error:
1. Check your internet connection
2. Verify the MongoDB Atlas cluster is active
3. Check if your IP is whitelisted in MongoDB Atlas

### Issue: Node Memory Error

**Error**: `JavaScript heap out of memory`

**Solution**: We've already configured `cross-env` to handle this. If you still see the error:
```bash
yarn dev:windows
```

---

## 📦 Dependencies Explained

### Core Framework
- **Next.js 14**: React framework with built-in routing
- **React 18**: UI library
- **MongoDB**: Database driver

### Authentication
- **NextAuth**: Complete authentication solution
- **bcryptjs**: Password hashing
- **uuid**: Unique ID generation

### AI Integrations
- **OpenAI**: GPT for interview questions
- **@google/generative-ai**: Gemini for resume analysis
- **ElevenLabs**: Text-to-speech for AI interviewer

### UI Components
- **@radix-ui/\***: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **lucide-react**: Icon library

### Email Service
- **Resend**: Email delivery for password resets

### Development Tools
- **cross-env**: Cross-platform environment variables (Windows compatible!)

---

## 🎯 Project Structure (Windows Paths)

```
app\
├── app\
│   ├── api\
│   │   ├── [[...path]]\
│   │   │   └── route.js          # Backend API endpoints
│   │   └── auth\
│   │       └── [...nextauth]\
│   │           └── route.js      # NextAuth configuration
│   ├── login\
│   │   └── page.js               # Login page
│   ├── register\
│   │   └── page.js               # Register page
│   ├── forgot-password\
│   │   └── page.js               # Forgot password page
│   ├── reset-password\
│   │   └── page.js               # Reset password page
│   ├── page.js                   # Landing page
│   ├── layout.js                 # Root layout
│   └── globals.css               # Global styles
├── components\
│   └── ui\                       # Reusable UI components
├── lib\
│   ├── mongodb.js                # MongoDB connection
│   ├── openai-client.js          # OpenAI configuration
│   ├── gemini-client.js          # Gemini configuration
│   └── utils.js                  # Utility functions
├── .env                          # Environment variables
├── package.json                  # Dependencies & scripts
├── tailwind.config.js            # Tailwind configuration
└── README.md                     # Project documentation
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** to version control
2. Change `NEXTAUTH_SECRET` in production
3. Keep API keys secure
4. Use environment variables for all sensitive data

---

## 🚢 Building for Production (Windows)

```bash
# Build the application
yarn build

# Start production server
yarn start:windows
```

---

## 📱 Features Overview

### ✅ Implemented
- Landing page with feature showcase
- User registration with email/password
- User login (credentials + Google OAuth)
- Forgot password (email via Resend)
- Reset password with token validation
- MongoDB Atlas integration
- AI integrations (OpenAI, Gemini, ElevenLabs)

### 🚧 Coming Soon
- Dashboard page
- Resume upload and analysis
- AI interview session with animated avatar
- Voice recording and transcription
- Real-time feedback and scoring
- Interview history and reports

---

## 💡 Tips for Windows Development

1. **Use PowerShell or Windows Terminal** for better experience
2. **VS Code** is recommended as IDE
3. **Enable Developer Mode** in Windows Settings for better Node.js performance
4. **Disable antivirus scanning** for `node_modules` folder (improves speed)
5. **Use Git Bash** if you prefer Unix-like commands

---

## 🆘 Need Help?

1. Check this README first
2. Review error messages carefully
3. Ensure all prerequisites are installed
4. Verify `.env` file exists and is configured
5. Try deleting `node_modules` and running `yarn install` again

---

## 📄 License

© 2025 MY interview AI. All rights reserved.

---

## 🎉 You're All Set!

Start your development server and begin building:

```bash
yarn dev
```

Visit: **http://localhost:3000**

Happy coding! 🚀
