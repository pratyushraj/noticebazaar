# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is handled by `ProtectedRoute` which redirects to `src/pages/ClientDashboard.tsx` for clients and `src/pages/AdminDashboard.tsx` for admins.
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

# Creator Onboarding Standards

- **Uniform Deliverables**: ALL creators MUST use the following standardized deliverables for their packages. NO EXCEPTIONS.

### 🚀 Starter Collab
- **Label**: `🚀 Starter Collab`
- **Deliverables**:
    - `1 Reel (15-30s)`
    - `Organic reach focus`
    - `1 Revision included`

### ⭐ Growth Campaign
- **Label**: `⭐ Growth Campaign`
- **Deliverables**:
    - `1 Premium Reel (30-60s)`
    - `30-day usage rights (for ads)`
    - `Script + hook optimization`
    - `2 Story shoutouts`
    - `1 Revision included`
- **Setting**: Set `isPopular: true` for this package.

### 🎁 Product Exchange
- **Label**: `🎁 Product Exchange`
- **Deliverables**:
    - `1 Reel or 2 Stories`
    - `Product review focus`
- **Setting**: Set `type: 'barter'` and `budget: 0`.

- **Storage**: Always normalize videos using FFmpeg (H.264, Main 3.1, faststart) before uploading to Supabase `creator-assets`.