# Life OS

A unified, personal management Progressive Web App (PWA) built to keep track of daily habits, manage shared expenses, and capture life's memories.

## Features

- ⚡ **Streaks**: Track daily habits with friends and build consistency together.
- 💸 **Khata**: Split expenses fairly, track group balances, and settle debts with minimal transactions.
- 📸 **MemoryLane**: Capture memories, thoughts, and images on your personal timeline.

## Tech Stack

This project was built using a modern **Next.js Monorepo** architecture:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) & [React Query](https://tanstack.com/query/latest)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **Storage**: [Cloudinary](https://cloudinary.com/) (Serverless streaming uploads)

## Getting Started

### Prerequisites
You will need a MongoDB URI and a Cloudinary account. 

Create a `.env.local` file in the root directory and add your credentials:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.