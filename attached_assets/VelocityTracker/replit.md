# Overview

This is a Velocity-Based Training (VBT) analysis application built with React and Express. The application allows users to record or upload weightlifting videos and performs real-time computer vision analysis to calculate barbell velocity metrics. It provides comprehensive movement analysis including mean velocity, peak velocity, power zones, and visual tracking overlays to help athletes and coaches optimize their training.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern single-page application using functional components and hooks
- **Vite Build System**: Fast development server with hot module replacement for optimal developer experience
- **Tailwind CSS + shadcn/ui**: Utility-first styling with a comprehensive component library for consistent UI
- **TanStack Query**: Efficient server state management with caching and synchronization
- **Wouter**: Lightweight client-side routing solution
- **Component Structure**: Modular design with specialized components for video recording, analysis display, and file management

## Backend Architecture
- **Express.js**: RESTful API server with middleware-based request processing
- **TypeScript**: Type-safe server development with ES modules
- **In-Memory Storage**: Simple storage interface with plans for database migration
- **Shared Schema**: Common TypeScript types between client and server using Drizzle ORM definitions

## Data Storage Solutions
- **Client-Side**: IndexedDB for persistent storage of analyzed videos and results
- **Server Preparation**: Configured for PostgreSQL with Drizzle ORM and Neon Database integration
- **Session Management**: Express sessions with PostgreSQL session store configuration

## Computer Vision Processing
- **OpenCV.js**: Client-side video processing using Web Workers for non-blocking computation
- **KLT Optical Flow**: Feature detection and tracking algorithm for barbell movement analysis
- **Real-time Analysis**: Frame-by-frame processing with velocity calculations and trajectory mapping

## Video Processing Pipeline
- **Multi-Input Support**: Camera recording via WebRTC MediaRecorder API and file upload capabilities
- **Calibration System**: Automatic plate detection and manual calibration options for accurate measurements
- **Analysis Engine**: Comprehensive velocity calculations including instantaneous, mean, and peak metrics
- **Visualization**: Real-time overlay rendering with tracking points, velocity graphs, and power zone indicators

## Performance Considerations
- **Web Worker Architecture**: Offloads intensive computer vision processing to prevent UI blocking
- **Progressive Enhancement**: Graceful fallbacks when advanced features are unavailable
- **Efficient Rendering**: Canvas-based overlays for smooth real-time video visualization
- **Memory Management**: Blob handling for large video files with cleanup procedures

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **drizzle-orm**: Type-safe SQL query builder with schema migrations support
- **@tanstack/react-query**: Server state management and caching solution
- **@radix-ui/react-***: Headless UI components providing accessible, customizable primitives

## Computer Vision & Media
- **OpenCV.js**: Browser-compatible computer vision library for video analysis
- **Web APIs**: MediaRecorder, getUserMedia, and Canvas APIs for video capture and processing

## Development Tools
- **Vite**: Modern build tool with fast development server and optimized production builds
- **TailwindCSS**: Utility-first CSS framework with custom design system integration
- **TypeScript**: Static type checking for both client and server code
- **ESLint/Prettier**: Code quality and formatting tools (implicitly referenced)

## UI/UX Libraries
- **class-variance-authority**: Type-safe CSS class composition for component variants
- **cmdk**: Command palette component for enhanced user interaction
- **date-fns**: Date manipulation utilities for timestamp handling
- **lucide-react**: Comprehensive icon library with consistent design

## Database & Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **IndexedDB**: Browser-native storage for client-side data persistence
- **Blob Storage**: File system integration for video and image asset management

The application is architected for scalability with clear separation between client-side analysis capabilities and server-side data management, enabling both offline functionality and cloud-based storage solutions.