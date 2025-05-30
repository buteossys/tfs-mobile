# TFS Mobile - AI-Powered Custom Product Design App

![TFS Mobile Banner](./assets/images/tfs-banner.png)

## Overview

TFS Mobile is a cutting-edge mobile application that empowers users to create custom products using AI-generated designs. Built with React Native and Expo, this app provides a seamless experience for designing, customizing, and ordering personalized products.

## Features

### 🎨 AI-Powered Design Generation
- Create unique designs using advanced AI technology
- Generate custom images from text prompts
- Upload and edit your own images

### 👕 Custom Product Creation
- Apply your designs to a variety of high-quality products
- Preview your designs on different product types
- Customize colors, sizes, and other product attributes

### 🛒 Seamless Shopping Experience
- Browse and select from various product options
- Add items to cart and manage your selections
- Secure checkout with Stripe payment integration

### 👤 User Profiles
- Save your generated designs for future use
- Track your order history
- Manage your personal information

## Technology Stack

- **Frontend Framework**: React Native with Expo
- **Navigation**: Expo Router with file-based routing
- **UI Components**: Custom themed components with dynamic color schemes
- **Image Processing**: AI-powered image generation and editing
- **Payment Processing**: Stripe integration
- **State Management**: React Context API
- **Storage**: Expo FileSystem and SecureStore
- **API Communication**: Axios for RESTful API calls

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/tfs-mobile.git
   cd tfs-mobile
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

4. Run on your preferred platform
   - Press `i` to run on iOS simulator
   - Press `a` to run on Android emulator
   - Scan the QR code with Expo Go app on your physical device

## App Structure

```
tfs-mobile/
├── app/                  # Main application code with file-based routing
│   ├── (tabs)/           # Tab-based navigation screens
│   ├── contexts/         # React Context providers
│   └── ...               # Other app screens and configurations
├── assets/               # Images, fonts, and other static resources
├── components/           # Reusable UI components
├── constants/            # App constants including colors
├── hooks/                # Custom React hooks
├── services/             # API and business logic services
├── types/                # TypeScript type definitions
└── utils/                # Utility functions and helpers
```

## Development Workflow

### Running in Development Mode

```bash
npm start
```

### Building for Production

```bash
eas build --platform ios
eas build --platform android
```

## API Integration

The app integrates with a custom backend service that provides:
- AI image generation
- Background removal
- Image composition
- Product mockup creation
- Order processing
- Payment handling

## Screenshots

[Include screenshots of key app screens here]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Expo team for the amazing cross-platform development framework
- React Native community for their continuous support and contributions
- All contributors who have helped shape this project

---

Built with ❤️ using React Native and Expo