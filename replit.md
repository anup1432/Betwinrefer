# Overview

This is a Telegram bot admin dashboard application built for managing referral campaigns and user rewards. The system consists of a React frontend dashboard that provides administrators with comprehensive tools to monitor bot users, process withdrawals, track referral activity, and manage bot settings. The backend handles Telegram bot interactions, user management, referral tracking, and unique code generation for users who complete referral milestones.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built with React using Vite as the build tool and TypeScript for type safety. The application follows a modern React architecture with:

- **Component Structure**: Uses shadcn/ui components with Radix UI primitives for consistent, accessible UI components
- **State Management**: Leverages TanStack Query (React Query) for server state management, providing caching, synchronization, and optimistic updates
- **Routing**: Implements client-side routing using Wouter for lightweight navigation
- **Styling**: Uses Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: Integrates React Hook Form with Zod for form validation

The dashboard provides pages for:
- Dashboard overview with statistics and recent activity
- User management with search and filtering capabilities
- Withdrawal processing and approval workflows
- Bot settings configuration

## Backend Architecture

The backend is an Express.js server with TypeScript that serves both as an API server and hosts the React application. Key architectural decisions include:

- **API Design**: RESTful API endpoints for managing users, referrals, withdrawals, and bot settings
- **Telegram Integration**: Uses the node-telegram-bot-api library to handle bot commands and user interactions
- **Image Generation**: Implements Canvas API for generating unique reward images when users complete referral milestones
- **Session Management**: Uses express-session with PostgreSQL session store for admin authentication
- **File Uploads**: Handles image uploads and serves static files for generated unique codes

The server architecture separates concerns with:
- Route handlers for API endpoints
- Storage layer for database operations
- Telegram bot service for handling bot interactions
- Image generation utilities for reward graphics

## Data Storage

The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **Database Schema**: Comprehensive schema with tables for users, referrals, withdrawals, unique codes, bot settings, and activity logs
- **Connection Management**: Uses Neon Database with connection pooling for scalable database access
- **Migrations**: Drizzle Kit handles database schema migrations and changes
- **Type Safety**: Zod schemas provide runtime validation and TypeScript types for database entities

The storage layer implements a repository pattern with interfaces for:
- User management and balance tracking
- Referral creation and completion tracking
- Withdrawal request processing
- Unique code generation and management
- Bot configuration and activity logging

## Authentication & Authorization

The system implements a simple admin-based authentication approach:

- **Admin Access**: Single admin access for the dashboard interface
- **Session Management**: Express sessions stored in PostgreSQL for admin authentication
- **Bot Security**: Telegram bot token and channel ID configured via environment variables
- **API Protection**: Admin routes protected by session-based middleware

## External Dependencies

The application integrates with several external services and APIs:

- **Telegram Bot API**: Primary integration for bot functionality using official Telegram Bot API
- **Neon Database**: PostgreSQL database hosting service for data persistence
- **Canvas API**: Node.js Canvas library for server-side image generation and manipulation
- **Radix UI**: Component library providing accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library built on top of Radix UI with consistent styling
- **TanStack Query**: Advanced data fetching and state management for React applications

The bot requires configuration of:
- `BOT_TOKEN`: Telegram bot authentication token
- `CHANNEL_ID`: Telegram channel for bot operations
- `DATABASE_URL`: PostgreSQL connection string
- `WEBSITE_URL`: Base URL for the web application
- `SUPPORT_USERNAME`: Telegram username for user support

The system is designed to handle high-volume bot interactions while providing administrators with real-time insights into user activity, referral performance, and financial transactions through an intuitive web interface.