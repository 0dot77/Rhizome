# Project Context: Rhizome (MVP)

## Project Goal
Build a generative whiteboard tool where ideas expand organically using AI.
- **Core Philosophy:** "Prompt-less Interaction" & "Progressive Disclosure".
- **UX Flow:** Double-click to create a note -> Hover to reveal AI tools -> Click to expand.
- **Business Model:** Initially BYOK (Bring Your Own Key) for free usage, scalable to SaaS.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **Canvas:** React Flow (XYFlow)
- **State Management:** Zustand
- **Icons:** Lucide React
- **AI Integration:** Anthropic SDK (Text), Stability AI API (Image)

## Coding Standards
1.  **Architecture:**
    - Use Next.js API Routes (`app/api/...`) for all AI requests. Do not call LLMs directly from the client.
    - For the MVP, store User API Keys in the browser's LocalStorage/SessionStorage and pass them to the API via headers (`x-anthropic-key`, `x-stability-key`).
2.  **UI/UX:**
    - **Minimalism:** No persistent toolbars. The canvas should be empty initially.
    - **Context-Sensitive:** Tools only appear when interacting with a node (hover/select).
    - **Optimistic UI:** Show "skeleton nodes" or loading states immediately after triggering an action.
3.  **Components:**
    - Use Functional Components with Hooks.
    - Keep `page.tsx` clean; move logic to components or stores.
4.  **Git Workflow:**
    - Commit small, functional chunks.
    - Write descriptive commit messages.

## Key Features (MVP)
1.  **Settings Modal:** Input fields for Anthropic & Stability API Keys.
2.  **The Canvas:** Infinite whiteboard using React Flow.
3.  **Create Note:** Double-click canvas to add a text node.
4.  **Text Expansion:** Hover node -> Click "Expand" -> Generate 4 child nodes (Scenarios, Tech, Visuals, Counter-arguments).
5.  **Image Expansion:** Upload image -> Hover -> Click "Outpaint" (Future implementation).

## Tech Stack & Design System
- **Framework:** Next.js 15 (App Router)
- **UI System:** Shadcn UI (based on Radix UI)
  - Use `npx shadcn@latest add [component]` to add components.
  - **Key Components:** Button, Dialog (Modal), Input, Label, Card, Popover, Toast.
- **Styling:** Tailwind CSS (configured via Shadcn)
- **Font:** Geist Sans (Next.js default) or Inter
- **Icons:** Lucide React

## UI Guidelines
- **Modals:** Use Shadcn `Dialog` for the API Key settings.
- **Node Styling:** Use Tailwind classes to mimic the clean aesthetic of Shadcn cards (border-border, bg-card, shadow-sm).
- **Interactions:** Use `sonner` (Shadcn Toast) for feedback like "Generating..." or errors.