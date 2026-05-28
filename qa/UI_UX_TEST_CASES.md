<!-- markdownlint-disable MD060 -->

# UI/UX Test Cases

| UI Test ID | Area | Scenario | Steps | Expected Result | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| UI-001 | Login page UX | Login page loads clearly | Open app without session | Branded title, login form, and clear support context appear | High | Keep first screen usable, not marketing-only |
| UI-002 | Login page UX | Demo credentials hidden by default | Open production-like app | Demo Login Details is hidden when env flag is false | High | Keep `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` in production |
| UI-003 | Login page UX | Demo credentials collapsible | Enable demo flag and open login | Section expands/collapses and shows placeholder password guidance | Medium | Use only in controlled demos |
| UI-004 | Login page UX | Invalid login error | Submit wrong password | Friendly error appears near form, no technical stack | High | Keep messages short and actionable |
| UI-005 | Staff experience | Issue form simple path | Staff opens Report ERP Issue | Required fields are obvious and submit button visible | High | Keep staff language simple |
| UI-006 | Staff experience | Optional details not overwhelming | Open issue form | Optional fields are behind expandable control | Medium | Keep advanced fields collapsed by default |
| UI-007 | Staff experience | Success confirmation | Submit valid issue | Issue ID and copy action are visible | High | Keep generated ID prominent |
| UI-008 | Staff experience | Validation feedback | Submit missing required fields | Required fields clearly indicated | High | Browser validation plus server fallback |
| UI-009 | Dashboard UX | Manager sees business value quickly | Manager opens dashboard | Cards show total issues, open issues, critical, vendor, SLA, average resolution, top department/module | High | Keep business labels, not technical-only wording |
| UI-010 | Dashboard UX | Charts render without warnings | Open dashboard with data | Charts visible, labels readable, no Recharts sizing warning | Medium | Keep positive-size chart guard |
| UI-011 | Dashboard UX | Empty chart state | Use empty dataset | Empty state text appears instead of blank chart | Medium | Keep empty-state wording business-friendly |
| UI-012 | Dashboard UX | API failure state | Simulate dashboard API failure | Friendly error appears and shell remains usable | High | Avoid endless loading |
| UI-013 | Tables and filters | Issue list scanning | Open issue table | Issue ID, title, department, module, priority, status, owner, SLA visible | Medium | Preserve dense but readable table |
| UI-014 | Tables and filters | Filters are usable | Apply search/filter values | Results update without layout shift | Medium | Add server-side filter tests in future |
| UI-015 | Mobile responsiveness | Login at 360px | Set viewport 360px, open login | Form fits; no horizontal scroll | High | Test oldest common Android widths |
| UI-016 | Mobile responsiveness | Login at 390px | Set viewport 390px, open login | Inputs and buttons accessible | High | Keep tap targets large enough |
| UI-017 | Mobile responsiveness | Tablet at 768px | Set viewport 768px, open dashboard | Cards wrap cleanly; nav usable | Medium | Verify no chart overlap |
| UI-018 | Mobile responsiveness | Desktop at 1366px | Set viewport 1366px, open dashboard | Sidebar/header/content fit cleanly | Medium | Use as demo baseline |
| UI-019 | Mobile responsiveness | Issue form mobile | Staff submits issue at 360px | All required controls and submit visible | High | Avoid hidden buttons in bottom viewport |
| UI-020 | Mobile responsiveness | Dashboard mobile | Open dashboard at 390px | Cards/charts stack and text does not overlap | High | Check long labels like department names |
| UI-021 | Accessibility | Keyboard login | Use Tab/Enter on login | Email, password, submit reachable | High | Maintain native form controls |
| UI-022 | Accessibility | Keyboard modal controls | Open issue detail and tab controls | Close, comment, workflow controls reachable | Medium | Add focus trap in future if needed |
| UI-023 | Accessibility | Color contrast | Review badges/cards/buttons | Text readable on light background | High | Keep contrast above WCAG AA where possible |
| UI-024 | Accessibility | Screen reader labels | Inspect form labels | Inputs have visible labels | High | Avoid icon-only unlabeled controls |
| UI-025 | Error messages | Backend unavailable | Simulate 502/503 | Message says backend unavailable and retry/refresh path exists | High | Keep friendly non-technical wording |
| UI-026 | Error messages | Session expired | Expire cookie and request data | Message tells user to login again | High | Avoid confusing 401 console-only failures |
| UI-027 | Success messages | Issue created | Submit issue | Success message uses issue ID and plain language | Medium | Avoid jargon for staff |
| UI-028 | Loading states | Initial boot loading | Slow `/api/auth/me` | Branded loading screen appears | High | 10-second timeout fallback required |
| UI-029 | Loading states | Dashboard loading | Slow dashboard API | Skeleton/placeholder appears | Medium | Avoid jumping layouts |
| UI-030 | Empty states | Vendor follow-up empty | No vendor records visible | Empty or zero-state is understandable | Low | Add explicit empty state if needed |
| UI-031 | Language clarity | Sinhala/English-friendly wording | Review labels with business users | Wording is simple and direct | Medium | Avoid technical-only labels |
| UI-032 | Business clarity | Management demo narrative | Run UAT demo flow | Audience understands issue visibility, vendor pending, SLA, repeated issues, and reporting | High | Use demo guide as script |
