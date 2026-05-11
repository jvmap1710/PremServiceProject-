# Implementation Plan: Story 3.2 - Kanban Board

## 1. Requirement Overview
- **Objective**: Provide a visual board for managing Service Requests through their lifecycle.
- **Columns**: TODO, IN_PROGRESS, DONE.
- **Functionality**: Drag and drop cards between columns to update status in real-time.

## 2. Technical Stack
- **DND Library**: `@dnd-kit/core`, `@dnd-kit/sortable` (Modern, accessible, and works well with React 19/Next.js 15).
- **Data Fetching**: Server Components for initial load, Client Components for interactivity.
- **Server Actions**: `updateServiceRequestStatus` for lightweight updates.

## 3. UI/UX Design (Premium Style)
- **Columns**: Glassmorphism effect, subtle borders, status indicators.
- **Cards**:
    - **Header**: Ticket Code + Client Name.
    - **Body**: Subject/Title.
    - **Footer**: SRO Tags (badges) + Total Estimated Hours.
    - **Interaction**: Hover lift effect, smooth drag transitions.
- **Filters**: Client dropdown, Search bar.

## 4. Implementation Steps

### Step 1: Dependencies
- Install `@dnd-kit` packages.

### Step 2: Database & Actions
- Ensure `ServiceRequest` status values match `TODO`, `IN_PROGRESS`, `DONE`.
- Create/Optimize server action for quick status updates.

### Step 3: Components
- `KanbanBoard`: Main container and DND context.
- `KanbanColumn`: Column container and droppable area.
- `KanbanCard`: Draggable request representation.

### Step 4: Page Integration
- Create `/requests/kanban` route or integrated view.
- Connect data fetching.

### Step 5: Refinement
- Add loading states (Skeleton).
- Handle error feedback if DB update fails.
- Mobile responsiveness (stacking columns).

## 5. Success Criteria
- [ ] Users can drag a ticket from TODO to IN_PROGRESS.
- [ ] Database reflects the new status immediately.
- [ ] UI provides visual feedback during and after the move.
