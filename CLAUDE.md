# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Technology Stack

This is a React-based e-commerce platform for LAB404 Electronics built with:

- **Vite** - Build tool and development server
- **React 19** + **TypeScript** - Frontend framework with type safety
- **React Router v6** - Client-side routing
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and state management
- **Zustand** - State management
- **Supabase** - Backend as a service
- **Framer Motion** - Animation library

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Preview production build
pnpm run preview
```

## Project Architecture

### Core Structure
- `src/App.tsx` - Main app component with routing and providers
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles and Tailwind directives

### Pages (`src/pages/`)
- `Index.tsx` - Homepage with hero, featured products, and sections
- `Store.tsx` - Product catalog with search, filters, and pagination
- `Admin.tsx` - Administrative interface for product management
- `ProductDetail.tsx` - Individual product pages
- `NotFound.tsx` - 404 error page

### Components (`src/components/`)
Component architecture follows a modular pattern:
- Page-specific components (e.g., `HeroSection`, `ContactFormSection`)
- Reusable business components (`ProductCard`, `SearchBar`, `WhatsAppButton`)
- `AlibabaImport.tsx` - Alibaba product import functionality
- `ui/` - shadcn/ui components (Button, Card, Dialog, etc.)

### Utilities (`src/lib/`)
- `utils.ts` - Common utility functions (cn helper for class merging)
- `types.ts` - TypeScript type definitions
- `mockData.ts` - Sample product data for development
- `searchEngine.ts` - Product search and filtering logic

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `vite.config.ts` - Vite configuration with path aliases
- `eslint.config.js` - ESLint configuration with React and TypeScript rules

## Path Aliases
The `@/` alias points to the `src/` directory:
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/pages` → `src/pages`

## Styling Conventions
- Uses CSS custom properties for theming (defined in `src/index.css`)
- Tailwind utility classes for component styling
- shadcn/ui component variants using `class-variance-authority`
- Custom color scheme with CSS variables for light/dark mode support

## Business Logic
This is an electronics e-commerce platform with:
- Product catalog with categories (Electronics, Smartphones, Laptops, Accessories)
- WhatsApp integration for purchases
- Admin panel for product management
- Alibaba product import simulation
- Search and filtering capabilities
- Mock data storage (localStorage for demo purposes)

## Key Features to Maintain
- Mobile-responsive design
- WhatsApp purchase integration
- Product search and filtering
- Admin product management
- Alibaba import functionality
- LAB404 branding consistency