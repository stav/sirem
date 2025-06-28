# Sirem CRM

A modern, lightweight CRM system built with Next.js, TypeScript, and Supabase for managing contacts and reminders.

## Features

- **Contact Management**: Add, edit, and delete contacts with full contact information
- **Reminder System**: Create reminders linked to contacts with priority levels and due dates
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Data**: Powered by Supabase for instant data synchronization
- **Type Safety**: Full TypeScript support for better development experience

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sirem-crm
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your:
   - Project URL
   - Anon/public key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Database Setup

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the script to create tables and sample data

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Contacts Table
- `id` (UUID, Primary Key)
- `first_name` (Text, Required)
- `last_name` (Text, Required)
- `email` (Text, Optional)
- `phone` (Text, Optional)
- `notes` (Text, Optional)
- `created_at` (Timestamp)

### Reminders Table
- `id` (UUID, Primary Key)
- `contact_id` (UUID, Foreign Key to contacts)
- `title` (Text, Required)
- `description` (Text, Optional)
- `due_date` (Timestamp, Required)
- `priority` (Enum: 'low', 'medium', 'high')
- `completed` (Boolean, Default: false)
- `created_at` (Timestamp)

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This application can be easily deployed to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own CRM needs! 
