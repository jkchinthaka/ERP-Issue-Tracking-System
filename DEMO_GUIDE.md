# Nelna ERP Support Demo Guide

This guide is for a management demo using seeded test data. Do not use real production passwords during the presentation.

## Demo Flow

1. Login as Staff

   Use `stores.staff@nelna.local` and the password configured in `DEMO_USER_PASSWORD`.

2. Submit ERP Issue

   Open **Report ERP Issue**, select a request type, department, ERP module, business impact, title, and short description. Submit the issue and note the generated issue ID.

3. Login as IT

   Logout and login as `pathum@nelna.local` using the password configured in `DEMO_USER_PASSWORD`.

4. Assign Issue

   Open **All Issues**, select the new issue, and assign it to an IT owner.

5. Change Status to In Progress

   In the issue workflow controls, set status to **In Progress** and save.

6. Mark as Pending Vendor

   Enable **Vendor required**, select the Bileeta vendor, and save. The issue becomes visible in vendor follow-up reporting.

7. Add Vendor Follow-Up

   Open **Vendor Follow-up**, update vendor status or response, and save the follow-up.

8. Login as Manager

   Logout and login as `manager@nelna.local` using the password configured in `DEMO_USER_PASSWORD`.

9. View Dashboard

   Open **Dashboard** and review total issues, open issues, critical issues, pending vendor items, SLA breaches, average resolution time, top affected department, and top ERP module.

10. Export Report

   Open **Reports** and export the Excel or PDF report for management review.

## Business Value to Highlight

- Department issue visibility: management can see which departments are most affected.
- Vendor pending visibility: Bileeta/vendor delays are separated from internal IT work.
- Repeated issue tracking: recurring ERP problems are visible for root-cause analysis.
- SLA visibility: breached and pending items are easy to identify.
- Monthly reporting: dashboard and exports support management review meetings.

## Demo Safety Checklist

- Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` only for demo/testing environments.
- Use placeholder/demo passwords from environment variables, not real production passwords.
- Disable demo credential display before production use.
- Avoid entering real company-sensitive issue descriptions during the demo.
