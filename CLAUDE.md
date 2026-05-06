# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 RAG (Retrieval-Augmented Generation) ChatBot frontend with knowledge base management, AI assistant configuration, and MCP (Model Context Protocol) integration. The application features real-time streaming chat responses, markdown rendering with syntax highlighting, and comprehensive session management.

## Development Commands

- `pnpm run dev` - Start development server with Vite
- `pnpm run build` - Build production bundle
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier
- `pnpm test` - Run Vitest tests (exits with 0 if no tests)

### Makefile Commands
- `make run` - Start development server
- `make build` - Build project
- `make clean` - Remove dist directory
- `make install` - Install dependencies

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: Element Plus with auto-import
- **State Management**: Pinia with persistence
- **Router**: Vue Router
- **HTTP Client**: Axios
- **Styling**: Sass (Dart Sass) with global theme variables
- **Markdown**: Marked + Shiki for syntax highlighting
- **Package Manager**: pnpm

## Architecture

### Directory Structure
- `src/api/` - API modules (chatAPI, sessionAPI, userAPI, assistentAPI, knowledgeAPI, oneapi, TTS)
- `src/stores/modules/` - Pinia stores (auth, session, assistant, chatConfig, knowledge, oneapiModelList)
- `src/utils/` - Utilities (request.js for main API, oneapiRequest.js for OneAPI, markdown.js)
- `src/views/` - Page components (LoginPage, chatPage, KnowledgeBase, McpPage, SettingPage)
- `src/components/` - Reusable components (dialogs, forms, displays)
- `src/router/` - Vue Router configuration with auth guards
- `src/assets/styles/` - Global styles (theme.scss, element-plus-override.css)

### Dual HTTP Architecture
The application uses two separate axios instances:

1. **Main API** (`src/utils/request.js`): Primary backend API
   - Base URL from `VITE_API_BASE_URL` environment variable
   - JWT token authentication via Authorization header
   - Auto-logout on 401 responses
   - Handles sessions, assistants, knowledge base, chat

2. **OneAPI** (`src/utils/oneapiRequest.js`): OneAPI service
   - Proxied through `/oneapi` in Vite config to `http://localhost:3000`
   - Separate token stored as `oneapi_token` in localStorage
   - Used for model management and streaming operations

### State Management Pattern
- Composition API with `defineStore()`
- Persistent state using `pinia-plugin-persistedstate`
- Stores export both state and actions from a single return object
- Cross-store communication (e.g., session store depends on auth and assistant stores)

### Streaming Implementation
Chat responses use Server-Sent Events (SSE) via `@microsoft/fetch-event-source`. The actual streaming logic is implemented in `src/views/chatPage.vue` using `fetchEventSource`, not through the axios instances.

### Routing & Auth
- Route-based authentication via `meta.requiresAuth`
- Auth store manages login state and token
- Router guard redirects unauthenticated users to login
- Auto-redirect to home if already logged in

## Styling Guidelines

### Global Theme
All Sass files auto-import `src/assets/styles/theme.scss` via Vite config. Use defined variables:
- `$primary-color`, `$text-primary`, `$text-secondary`
- `$box-shadow-outer-m`, `$box-shadow-inner-m`, `$box-shadow-inner-L`
- `$border-radius-m`, `$transition-duration`
- Mixins: `botton-hover-active-effect()`, `textarea_inner-effect()`

### Element Plus Customization
- Components auto-imported via `unplugin-vue-components`
- Override styles in `src/assets/styles/element-plus-override.css`
- For dynamic components like `ElMessageBox`, use global `:deep()` rules in component styles or the override CSS file

### Color Module
Use Dart Sass color module instead of deprecated functions:
```scss
@use 'sass:color';
color.adjust($primary-color, $lightness: 10%); // instead of lighten()
```

## Code Style Requirements

1. **Async/Await**: Always use async/await for API calls and functions containing requests. Don't return promise objects without handling.
2. **JSDoc**: Write JSDoc comments for functions and API interfaces.
3. **Composition API**: Use Vue 3 Composition API exclusively.
4. **Component APIs**: Prefer Element Plus component APIs over direct DOM manipulation.
5. **Scoped Styles**: Use `<style scoped>` with `:deep()` for penetrating component styles.
6. **Store Organization**: Keep API calls in stores, not directly in components.

## Environment Configuration

Required environment variable in `.env`:
- `VITE_API_BASE_URL` - Base URL for the main API backend

Vite proxy handles OneAPI forwarding during development.
