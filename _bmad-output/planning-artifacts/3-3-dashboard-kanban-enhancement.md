# Implementation Plan: Story 3.3 - Dashboard Kanban & Jira Enhancements

## 1. Objective
- Move the Kanban board to the main Dashboard (`/`) for maximum visibility.
- Add Jira-style filtering (Client, Package).
- Add "Quick Add" functionality in the TODO column.

## 2. Technical Changes

### Step 1: Component Enhancement (`KanbanBoard.tsx`)
- Add `clients` and `packages` as props.
- Implement state for `selectedClientId` and `selectedPackageId`.
- Filter the `requests` array based on these selections using `useMemo`.
- Add a filter bar UI above the board.

### Step 2: Quick Add Functionality
- Modify `KanbanColumn.tsx` to accept an optional `onAddClick` prop.
- In the `TODO` column, render a `+` button in the header.
- Integrate the existing `RequestForm` (as a modal trigger) into the Kanban view.

### Step 3: Dashboard Integration (`src/app/page.tsx`)
- Move data fetching logic from `/requests/kanban/page.tsx` to `src/app/page.tsx`.
- Update the layout to accommodate the full-screen board.

### Step 4: UI/UX Refinement
- Ensure the filter bar looks "Jira-like" with clean dropdowns.
- Maintain the premium aesthetics (Glassmorphism, animations).

### Step 5: Task Detail Modal (Jira-style)
- Refactor `RequestDetailView` to be usable within a Modal.
- Add `selectedRequestId` state to `KanbanBoard`.
- When a card is clicked (instead of navigating), open the Modal with the request details.
- Ensure sub-tasks and edit functionality work within the modal.

## 3. Success Criteria
- [ ] Users see the Kanban board immediately upon logging in.
- [ ] Filters correctly update the visible cards without page reload.
- [ ] Clicking `+` in the TODO column opens the Request creation form.
- [ ] Navigation remains consistent.
