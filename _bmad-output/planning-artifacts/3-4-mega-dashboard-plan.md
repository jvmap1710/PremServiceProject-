# Implementation Plan: Story 3.4 - Mega Dashboard & Inline Editing

## 1. Objective
- Upgrade the Dashboard with high-level statistics and charts.
- Implement inline editing in the Task Detail popup for faster corrections.
- Align layout with the provided template (Stats/Charts at top, Kanban below).

## 2. Technical Components

### Component 1: StatCards
- A row of 4 cards showing:
    - Total Requests
    - Total Consumed Hours
    - In Progress Count
    - Completion Rate (%)

### Component 2: DashboardCharts (using Recharts)
- **StatusPieChart**: Distribution of TODO, IN_PROGRESS, DONE.
- **ClientWorkloadBarChart**: Comparison of total hours per client.

### Step 4: Issue Types (BUG, TASK, FEATURE)
- Update `prisma/schema.prisma` with a `type` field for `ServiceRequest`.
- Update `RequestForm` to include a Type selector with icons.
- Update `KanbanCard` to display type-specific icons and colors.
- Add "Type" to the Jira-style filter bar.

## 4. Implementation Steps
1. **Database Schema Update**: Add `type` field and run `db push`.
2. **Install Dependencies**: `npm install recharts`.
3. **Create Chart Components**: Build the Pie and Bar charts using Recharts.
4. **Refactor Dashboard (`/page.tsx`)**: 
    - Fetch aggregated data for stats.
    - Update layout to: Header -> Stats -> Charts -> KanbanBoard.
5. **Enhance Detail Popup**: Implement the inline editing UI and logic.
6. **UI Integration**: Add Type icons to Kanban Cards and Filter bar.

## 4. Success Criteria
- [ ] Charts accurately reflect the database state.
- [ ] Layout is responsive and looks premium (per template).
- [ ] Users can edit Title/Description in the popup and save successfully.
