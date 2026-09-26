Design a clean, modern, and intuitive desktop & web dashboard UI for a Job Time & Income Accountability Application. Use a sleek dark-mode aesthetic with high contrast, crisp typography, subtle card borders, and clear metric visual hierarchy.

The design must feature two primary screens:

---

SCREEN 1: OVERVIEW DASHBOARD

1. HEADER & TOP BAR:

- App title "Time & Income Tracker" on the top left.
- Top-right action button: Primary "+ Add New Account" button.

2. TOP STATS BANNER (3 Summary Metric Cards Side-by-Side):

- Card 1: "Total Payout Across Accounts" (Displays large currency text e.g., "$2,450.00").
- Card 2: "Total Hours Across Accounts" (Displays large numerical time text e.g., "142 hrs 30 mins").
- Card 3: Quick Action/Status card.

3. MAIN CONTENT AREA - ACCOUNTS GRID:

- Section Heading: "Your Accounts".
- Grid layout displaying interactive Account Cards.
- Each Account Card includes: Account Name, Hourly Rate badge (e.g., "$15/hr"), Total Hours worked, Current Balance/Pending Payout, and a "View Account" arrow button.
- Empty State Graphic/Placeholder (Alternative view): Clean graphic with text "No Account Added Yet" and a central "+ Create Your First Account" button.

4. MODAL OVERLAY (Triggered by "+ Add New Account"):

- Popup card overlay titled "Create New Account".
- Input field 1: "Account Name" (e.g., "Outlier - Project A").
- Input field 2: "Rate Per Hour ($)".
- Buttons: "Cancel" (Secondary outline) and "Create Account" (Primary filled).

---

SCREEN 2: INDIVIDUAL ACCOUNT DETAIL DASHBOARD

1. TOP NAVIGATION & ACCOUNT HEADER:

- Back button labeled "← Back to All Accounts".
- Large Account Title (e.g., "Account A - Data Annotation") with a pill badge showing the hourly rate (e.g., "$20.00/hr").
- Top-right actions: Secondary button "📥 Download CSV Statement" and Primary button "+ Log Work Session".

2. METRICS ROW (4 Stat Cards):

- Card 1: "Total Hours Worked" with a timeframe Dropdown selector (Options: "Today", "This Week", "This Month", "All-Time").
- Card 2: "Expected Payout Since Last Payout" (Highlighted pending balance card e.g., "$340.00").
- Card 3: "Total Payout Received" (Cumulative payout total e.g., "$1,200.00").
- Card 4: Quick Action button "+ Add New Payout".

3. MAIN CONTENT BODY (2-Column Layout):

- LEFT COLUMN (Work Sessions Log):
  - Section Header: "Work Sessions History".
  - Filter tabs or tags: "All", "Today", "Previously".
  - A structured table or list of session cards.
  - Rows display: Date, Category Badge ("Today" in green pill badge, "Previously" in blue pill badge), Time Frame ("From 09:00:00 To 11:30:00"), and Calculated Duration ("2h 30m").

- RIGHT COLUMN (Payouts & Financial Log):
  - Section Header: "Payout History".
  - A clean vertical timeline/list displaying past payouts.
  - Rows display: Date, Payment Amount (e.g., "+$500.00" in green), and status indicator.

4. MODAL OVERLAY 1: "LOG WORK SESSION"

- Title: "Add Work Session".
- Category Radio/Toggle Selection: Choice between "Today" and "Previously".
- Input Field 1: "From Time" (Placeholder: "00:00:00").
- Input Field 2: "To Time" (Placeholder: "00:00:00").
- Input Field 3 (Optional): "Date".
- Action Buttons: "Cancel" and "Save Session".

5. MODAL OVERLAY 2: "ADD NEW PAYOUT"

- Title: "Record Payment Received".
- Input Field 1: "Amount Paid ($)".
- Input Field 2: "Date Received".
- Action Buttons: "Cancel" and "Record Payout".
