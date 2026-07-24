# AccessAble - Inclusive Communication Platform

A comprehensive accessibility application designed to bridge communication gaps for hearing-impaired and visually-impaired users through advanced AI-powered tools.

## ✨ Features

### 🔐 Authentication System
- Secure login with email and password validation
- User session management
- Personalized welcome experience

### 🤟 Sign Language Translator
- Real-time sign language recognition using MediaPipe AI
- Camera-based gesture detection
- Text-to-sign conversion
- Voice command integration
- Dataset-powered recognition for accurate identification

### 👁️ Accessibility Assistant
- Live speech-to-text captions
- OCR (Optical Character Recognition) for text extraction
- Voice-guided form filling
- Emergency assistance features

### 🎨 Modern UI/UX
- Gradient backgrounds and glass morphism effects
- Responsive design for all devices
- Accessibility-first design principles
- Smooth animations and transitions
- Dark mode support for impaired users

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd accessable
```

2. Install front-end dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Configure backend environment
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your MongoDB connection string and JWT secret.

5. Start the backend server
```bash
cd backend
npm run dev
```

6. Start the front-end development server
```bash
cd ..
npm start
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

### Components Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js          # Authentication form
│   │   └── SignIn.js         # Mode selection
│   ├── impaired/             # Accessibility tools
│   │   ├── AssistantMode.js
│   │   ├── LiveCaptions.js
│   │   ├── OCRScanner.js
│   │   └── VoiceForm.js
│   ├── regular/              # Sign language tools
│   │   ├── SignCamera.js
│   │   ├── TextToSign.js
│   │   └── TranslatorMode.js
│   └── layout/
│       └── Header.js
├── hooks/
│   ├── useAssistant.js       # Voice assistant hook
│   ├── useOCR.js            # OCR functionality
│   └── useSpeech.js         # Speech recognition
├── utils/
│   ├── gestureLibrary.js    # Sign recognition logic
│   ├── formProcessor.js     # Form handling
│   └── fraudScanner.js      # Security features
└── App.js                   # Main application
```

### Key Technologies
- **React 19** - Modern React with hooks
- **MediaPipe** - AI-powered computer vision
- **TensorFlow.js** - Machine learning in the browser
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Web Speech API** - Voice recognition

## 🎯 User Flow

1. **Login** - User authenticates with email/password
2. **Mode Selection** - Choose between Assistant or Translator mode
3. **Main Interface** - Access specialized tools based on selection

### Assistant Mode (Sensory-Impaired)
- Live captions for spoken content
- OCR scanning for printed text
- Voice-guided interactions
- Emergency assistance

### Translator Mode (Regular Users)
- Sign language recognition
- Text-to-sign conversion
- Real-time gesture detection
- Voice commands

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MediaPipe for computer vision capabilities
- TensorFlow.js for machine learning
- The accessibility community for inspiration
- Open source contributors

---

**AccessAble** - Making communication accessible for everyone, everywhere.

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
