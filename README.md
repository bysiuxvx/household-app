# Household Management Application

A modern, full-stack application for managing household tasks.

## 🚀 Features

- **User Authentication** - Secure user authentication powered by Clerk
- **Real-time Updates** - Interactive UI with real-time data synchronization
- **Modern UI** - Clean, responsive interface built with Radix UI components
- **State Management** - Efficient state management with Jotai and React Query
- **Form Handling** - Robust form validation with React Hook Form and Zod

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS with class-variance-authority
- **State Management**: Jotai & React Query
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Prisma ORM
- **Validation**: Zod
- **Authentication**: Clerk
- **Date Handling**: date-fns
- **Database**: PostgreSQL

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript
- **Monorepo**: pnpm workspaces

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- pnpm v8.15.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/household-app.git
   cd household-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `apps/frontend` and `apps/backend`
   - Update the environment variables with your configuration

4. Generate Prisma client:
   ```bash
   cd apps/backend
   pnpm prisma generate
   pnpm prisma db push
   ```

### Running the Application

1. Start the development servers:
   ```bash
   # From the project root
   pnpm dev:all
   ```

2. Open your browser and navigate to:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## 📦 Project Structure

```
household-app/
├── apps/
│   ├── frontend/         # Frontend application
│   └── backend/          # Backend API server
├── packages/
│   ├── shared/           # Shared code between frontend and backend
│   └── eslint-config/    # Shared ESLint configuration
├── .editorconfig         # Editor configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── package.json          # Root package.json
└── tsconfig.base.json    # Base TypeScript configuration
```

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
