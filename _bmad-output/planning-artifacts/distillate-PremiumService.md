# PremiumService Product Distillate

## Intent
Build an internal all-in-one Professional Services Automation (PSA) tool for managing "Premium Service" requests. The primary business driver is tracking "Over-request" scenarios to justify price increases and demonstrate service profitability to leadership.

## Key Actors
- **TAS (Technical Account Specialist):** Creates requests, sets initial classification, inputs estimated time/release date, configures client-specific rules.
- **DEV (Developer):** Manages tasks via an internal Kanban, audits TAS classification, logs actual time, attaches evidence of completion.
- **Leadership/S Boss:** Consumes executive dashboards for business decision-making.

## Core Workflow
1. **Config:** TAS defines "Standard Request Rules" and Monthly Quotas for each Client (KH).
2. **Raise:** TAS enters a request (Name, Tech Desc, Est Time, Release Date). Raise Date is key.
3. **Execution:** Request appears on the internal Kanban. DEV works and logs Actual Time.
4. **Audit:** DEV verifies/refines the classification against the Standard Request Rules before closing.
5. **Report:** System calculates Monthly Trends, Quota Utilization, and Profitability (Internal use only).

## Technical Constraints & Decisions
- **Jira:** Decision made to NOT integrate with Jira for now to maintain data integrity and internal privacy.
- **Infrastructure:** Internal web app (No public access required).
- **Source of Truth:** The PremiumService Web App.
- **Data Persistence:** Relational DB (to track historical trends by Q/M/Y).

## Business Logic
- **Reporting Cycle:** Based on Raise Date + "In Progress/Done" status.
- **Over-request:** Triggered when actual request count or time exceeds the Client Quota defined in Config.
- **Evidence:** Mandatory/Optional attachments for audit defense.
