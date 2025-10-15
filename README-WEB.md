# Makeen Property Management System - Web Version

This is the ReactJS web branch of the Makeen Property Management System, migrated from React Native to pure React for optimal web performance.

## Branch Information

- **Branch**: `web-react`
- **Purpose**: Pure ReactJS web application (non-Expo)
- **Status**: Phase 1 Complete - Core infrastructure ready

## Technology Stack

### Core Technologies
- **React** 18.3.1 - UI library
- **TypeScript** 5.8.3 - Type safety
- **Vite** 6.0.7 - Fast build tool and dev server
- **React Router** 7.1.1 - Client-side routing

### UI Framework
- **Material-UI (MUI)** 6.3.0 - Component library
- **Tailwind CSS** 3.4.17 - Utility-first CSS
- **Lucide React** - Icon library
- **@fontsource/cairo** & **@fontsource/inter** - Custom fonts

### Backend & State
- **Supabase** 2.39.7 - Backend as a service (PostgreSQL + Auth)
- **Zustand** 4.5.7 - Lightweight state management
- **i18next** 25.2.1 - Internationalization (Arabic/English RTL support)

### Charts & Visualization
- **Chart.js** 4.4.7 + **react-chartjs-2** 5.3.0 - Data visualization

### Security & Storage
- **crypto-js** 4.2.0 - Encrypted localStorage for sensitive data
- Browser localStorage - Session and preferences storage

### PDF Generation
- **jsPDF** 2.5.2 - PDF document generation
- **html2canvas** 1.4.1 - HTML to canvas conversion

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone and checkout the web branch**:
   ```bash
   git checkout web-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your Supabase credentials**:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ENCRYPTION_KEY=your_unique_encryption_key_for_production
   ```

### Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
├── src/                      # Web application source
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root component with routing
│   ├── index.css            # Global styles & Tailwind
│   ├── pages/               # Page components
│   │   └── auth/            # Authentication pages
│   ├── layouts/             # Layout components
│   └── components/          # Shared UI components
│
├── lib/                      # Shared business logic (from RN version)
│   ├── supabase.web.ts      # Web-adapted Supabase client
│   ├── store.ts             # Zustand state management
│   ├── i18n.ts              # Internationalization setup
│   ├── types.ts             # TypeScript definitions
│   └── translations/        # i18n translation files
│
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Key Differences from React Native Version

| Feature | React Native | ReactJS Web |
|---------|--------------|-------------|
| **Routing** | Expo Router (file-based) | React Router v7 |
| **UI Library** | React Native Paper | Material-UI (MUI) |
| **Styling** | NativeWind | Tailwind CSS |
| **Storage** | expo-secure-store + AsyncStorage | crypto-js + localStorage |
| **Build Tool** | Metro | Vite |
| **Charts** | react-native-chart-kit | Chart.js + react-chartjs-2 |
| **File Upload** | expo-file-system | HTML5 File API |
| **PDF Export** | react-native-html-to-pdf | jsPDF + html2canvas |

## Preserved Features

✅ **Supabase Backend**: Same database, authentication, and RLS policies
✅ **Zustand State Management**: Core business logic unchanged
✅ **TypeScript Types**: All type definitions reused
✅ **i18next Internationalization**: Arabic/English RTL support
✅ **Role-Based Permissions**: Same permission system
✅ **Notification System**: Logic preserved

## Migration Status

### ✅ Phase 1: Core Infrastructure (Complete)
- [x] Branch setup and Vite configuration
- [x] React Router setup
- [x] Material-UI theme configuration
- [x] Tailwind CSS setup
- [x] Web-adapted Supabase client with encrypted storage
- [x] Web-adapted Zustand store
- [x] Basic authentication pages (Login/Signup)
- [x] Dashboard layout structure

### 🚧 Phase 2-3: Component Migration (In Progress)
- [ ] Migrate shared components to web
- [ ] Create MUI-based UI component library
- [ ] Implement data visualization with Chart.js

### 📋 Phase 4-6: Feature Migration (Planned)
- [ ] Dashboard screens
- [ ] Property management
- [ ] Tenant management
- [ ] Financial operations
- [ ] Maintenance requests
- [ ] Reports and analytics

### 📋 Phase 7-8: Polish & Deploy (Planned)
- [ ] RTL theme refinement
- [ ] Responsive design optimization
- [ ] E2E testing with Playwright
- [ ] Production deployment

## Scripts Reference

```bash
# Development
npm run dev              # Start Vite dev server (web)
npm run dev:native       # Start Expo dev server (native)

# Building
npm run build            # Build web production bundle
npm run build:native     # Build Expo web bundle
npm run preview          # Preview production build

# Testing
npm run test             # Run Jest unit tests
npm run test:playwright  # Run Playwright E2E tests
npm run test:qa          # Run QA test suite

# Linting
npm run lint             # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_ENCRYPTION_KEY` | Encryption key for localStorage | Yes (production) |

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Contributing

This web branch follows the same development policies as the main React Native app. See [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

Proprietary - Makeen Property Management System

---

**Note**: This is a work in progress. The React Native version in the `main` branch remains the primary mobile application.
