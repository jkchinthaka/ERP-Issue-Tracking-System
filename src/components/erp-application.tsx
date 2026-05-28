"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Database,
  FileDown,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MailCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Truck,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Permission =
  | "create_issue"
  | "view_own_issue"
  | "view_department_issue"
  | "view_all_issues"
  | "assign_issue"
  | "update_status"
  | "add_comment"
  | "add_internal_note"
  | "add_vendor_note"
  | "manage_vendor_followup"
  | "manage_users"
  | "manage_departments"
  | "manage_erp_modules"
  | "manage_settings"
  | "view_dashboard"
  | "view_management_dashboard"
  | "export_reports"
  | "approve_change_request"
  | "manage_sla"
  | "view_audit_log"
  | "soft_delete_issue";

type UserSession = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  departmentId: string;
  departmentName: string;
  vendorId: string;
  permissions: Permission[];
};

type EntityRef = {
  _id: string;
  id?: string;
  name?: string;
  moduleName?: string;
  vendorName?: string;
  roleName?: string;
  email?: string;
  contactPerson?: string;
  departmentId?: string;
};

type Issue = {
  _id: string;
  issueId: string;
  requestType: string;
  title: string;
  description: string;
  departmentId: EntityRef | string;
  erpModuleId: EntityRef | string;
  issueType?: string;
  businessImpact: string;
  priority: string;
  status: string;
  reportedBy: EntityRef | string;
  assignedTo?: EntityRef | string;
  vendorRequired?: boolean;
  vendorId?: EntityRef | string;
  ackDueAt?: string;
  slaDueAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  reopenedAt?: string;
  erpScreen?: string;
  documentNumber?: string;
  neededBeforeDate?: string;
  contactNumber?: string;
  rootCause?: string;
  preventiveAction?: string;
  solutionNote?: string;
  isRepeated?: boolean;
  managementRemark?: string;
  satisfactionScore?: number;
  createdAt: string;
  updatedAt: string;
};

type ReferenceData = {
  departments: EntityRef[];
  erpModules: EntityRef[];
  vendors: EntityRef[];
  users: EntityRef[];
  roles: EntityRef[];
  slaRules: Array<{ _id: string; priority: string; acknowledgeMinutes: number; resolveHours: number; escalationRule: string }>;
  knowledgeBase: Array<{ _id: string; title: string; erpModuleId: EntityRef | string; issueType: string; problem: string; solution: string; visibility: string }>;
  constants: {
    requestTypes: string[];
    statuses: string[];
    priorities: string[];
    businessImpactOptions: string[];
    rootCauseCategories: string[];
    preventiveActions: string[];
    vendorStatuses: string[];
    improvementActionStatuses: string[];
    permissions: string[];
  };
};

type DashboardData = {
  cards: Record<string, number | string>;
  charts: Record<string, Array<{ name: string; value: number }>>;
};

type DetailData = {
  issue: Issue;
  comments: Array<{ _id: string; comment: string; commentType: string; isInternal: boolean; createdAt: string; createdBy?: EntityRef }>;
  attachments: Array<{ _id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; uploadedAt: string }>;
  followups: VendorFollowup[];
};

type VendorFollowup = {
  _id: string;
  issueId: Issue | string;
  vendorId: EntityRef | string;
  vendorStatus: string;
  sentDate?: string;
  lastFollowupDate?: string;
  nextFollowupDate?: string;
  vendorResponse?: string;
  pendingDays?: number;
  internalNote?: string;
  updatedAt?: string;
};

type ImprovementAction = {
  _id: string;
  actionId: string;
  sourceIssueId?: Issue | EntityRef | string;
  title: string;
  description?: string;
  ownerId?: EntityRef | string;
  departmentId?: EntityRef | string;
  dueDate?: string;
  status: string;
  priority: string;
  expectedBenefit?: string;
  actualResult?: string;
  managementRemark?: string;
};

const chartColors = ["#0f766e", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#16a34a", "#ea580c"];

const emptyReference: ReferenceData = {
  departments: [],
  erpModules: [],
  vendors: [],
  users: [],
  roles: [],
  slaRules: [],
  knowledgeBase: [],
  constants: {
    requestTypes: [],
    statuses: [],
    priorities: [],
    businessImpactOptions: [],
    rootCauseCategories: [],
    preventiveActions: [],
    vendorStatuses: [],
    improvementActionStatuses: [],
    permissions: [],
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiErrorMessage(status: number, payload: Record<string, unknown> | null) {
  if (status === 401) return "Session expired. Please login again.";
  if ([502, 503, 504].includes(status)) return "Backend unavailable. Please wait a moment and retry.";
  if (status >= 500) return "Database/API error. Please refresh the page or contact IT.";
  return typeof payload?.message === "string" ? payload.message : "Something went wrong. Please try again.";
}

function friendlyErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Network error. Please check your connection and try again.";
}

async function api<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const attempts = method === "GET" ? 2 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(path, { ...init, signal: init?.signal ?? controller.signal });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() as Record<string, unknown> : null;
      if (response.ok) {
        return payload as T;
      }

      if ([502, 503, 504].includes(response.status) && attempt < attempts) {
        await delay(750);
        continue;
      }

      throw new Error(apiErrorMessage(response.status, payload));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Backend unavailable. Please wait a moment and retry.");
      }

      if (error instanceof TypeError) {
        throw new Error("Network error. Please check your connection and try again.");
      }

      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw new Error("Something went wrong. Please try again.");
}

function getEntityId(value?: EntityRef | string) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || value.id || "";
}

function entityLabel(value?: EntityRef | string, fallback = "Not set") {
  if (!value) return fallback;
  if (typeof value === "string") return fallback;
  return value.name || value.moduleName || value.vendorName || value.roleName || value.email || fallback;
}

function dateLabel(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function shortDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function minutesLabel(minutes: number | string | undefined) {
  const value = Number(minutes || 0);
  if (value < 60) return `${value} min`;
  return `${Math.round(value / 60)} hr`;
}

function priorityClass(priority: string) {
  if (priority === "Critical") return "bg-red-100 text-red-700 ring-red-200";
  if (priority === "High") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (priority === "Medium") return "bg-blue-100 text-blue-700 ring-blue-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

function statusClass(status: string) {
  if (["Resolved", "Closed"].includes(status)) return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (["Pending Vendor", "Pending User", "Waiting for Approval"].includes(status)) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (["Reopened", "SLA Breached"].includes(status)) return "bg-red-100 text-red-700 ring-red-200";
  if (["In Progress", "Testing", "Fix Provided"].includes(status)) return "bg-blue-100 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", className)}>{children}</span>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, icon: Icon, tone = "teal", testId }: { label: string; value: React.ReactNode; icon: React.ElementType; tone?: "teal" | "blue" | "amber" | "red" | "slate"; testId?: string }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const longValue = typeof value === "string" && value.length > 12;
  return (
    <div data-testid={testId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={clsx("mt-2 wrap-break-word font-semibold text-slate-950", longValue ? "text-base leading-snug" : "text-2xl")}>{value}</p>
        </div>
        <span className={clsx("rounded-lg p-2 ring-1", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
    </div>
  );
}

function EmptyState({ icon: Icon = Database, title, message }: { icon?: React.ElementType; title: string; message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
      <Icon className="h-6 w-6 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
    </div>
  );
}

function ChartPanel({ title, data, type = "bar" }: { title: string; data?: Array<{ name: string; value: number }>; type?: "bar" | "pie" | "line" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartData = data?.filter((item) => Number(item.value) > 0) ?? [];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setChartSize({ width: Math.max(0, Math.floor(rect.width)), height: Math.max(0, Math.floor(rect.height)) });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const chartIsReady = chartSize.width > 0 && chartSize.height > 0;

  return (
    <Panel title={title}>
      {!chartData.length ? (
        <EmptyState title="No chart data yet" message="New issue activity will appear here after users submit and update ERP support records." />
      ) : null}
      {chartData.length > 0 && (
        <div ref={containerRef} className="h-72 min-w-0 w-full overflow-hidden">
          {chartIsReady && (
            <ResponsiveContainer width={chartSize.width} height={chartSize.height} minWidth={0}>
            {type === "pie" ? (
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={3}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : type === "line" ? (
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 12, right: 16, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#0f766e" />
              </BarChart>
            )}
            </ResponsiveContainer>
          )}
        </div>
      )}
    </Panel>
  );
}

function LoadingScreen({ timedOut, onRetry }: { timedOut: boolean; onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Gauge className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-teal-700">Nelna ERP Support</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Loading support workspace</h1>
        <div className="mx-auto mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-teal-600" />
        </div>
        {timedOut ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Unable to load the ERP support workspace. Please refresh the page or contact IT.</p>
            <button onClick={onRetry} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Checking session and backend availability...</p>
        )}
      </section>
    </main>
  );
}

function LoadFailureScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-red-700">Workspace unavailable</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Unable to load the ERP support workspace</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <button onClick={onRetry} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    </main>
  );
}

export default function ERPApplication() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [reference, setReference] = useState<ReferenceData>(emptyReference);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [followups, setFollowups] = useState<VendorFollowup[]>([]);
  const [actions, setActions] = useState<ImprovementAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [emailLogs, setEmailLogs] = useState<Array<Record<string, unknown>>>([]);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [bootError, setBootError] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);

  const has = (permission: Permission) => Boolean(user?.permissions.includes(permission));

  async function loadWorkspace(activeUser = user) {
    if (!activeUser) return;
    setError("");
    setWorkspaceLoading(true);
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const [referenceData, issueData, followupData, actionData] = await Promise.all([
        api<ReferenceData>("/api/reference"),
        api<{ issues: Issue[] }>("/api/issues"),
        api<{ followups: VendorFollowup[] }>("/api/vendor-followups"),
        api<{ actions: ImprovementAction[] }>("/api/improvement-actions"),
      ]);
      setReference(referenceData);
      setIssues(issueData.issues);
      setFollowups(followupData.followups);
      setActions(actionData.actions);

      try {
        const dashboardData = await api<{ dashboard: DashboardData }>("/api/dashboard");
        setDashboard(dashboardData.dashboard);
      } catch (err) {
        setDashboard(null);
        setDashboardError(friendlyErrorMessage(err));
      } finally {
        setDashboardLoading(false);
      }

      if (activeUser.permissions.includes("view_audit_log")) {
        const [auditData, emailData] = await Promise.all([
          api<{ logs: Array<Record<string, unknown>> }>("/api/audit-logs"),
          api<{ logs: Array<Record<string, unknown>> }>("/api/email-logs"),
        ]);
        setAuditLogs(auditData.logs);
        setEmailLogs(emailData.logs);
      }
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setDashboardLoading(false);
      setWorkspaceLoading(false);
    }
  }

  async function boot() {
    setLoading(true);
    setBootError("");
    setBootTimedOut(false);
    const timeout = window.setTimeout(() => setBootTimedOut(true), 10000);

    try {
      const session = await api<{ user: UserSession | null }>("/api/auth/me", undefined, 10000);
      if (session.user) {
        setUser(session.user);
        await loadWorkspace(session.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      setBootError("Unable to load the ERP support workspace. Please refresh the page or contact IT.");
      setError(friendlyErrorMessage(err));
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(() => {
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("dashboard");
  }

  async function openIssue(issue: Issue) {
    setSelectedIssue(issue);
    setDetail(null);
    const data = await api<DetailData>(`/api/issues/${issue._id}`);
    setDetail(data);
  }

  if (loading) {
    return <LoadingScreen timedOut={bootTimedOut} onRetry={() => void boot()} />;
  }

  if (bootError) {
    return <LoadFailureScreen message={bootError} onRetry={() => void boot()} />;
  }

  if (!user) {
    return <LoginScreen onLogin={async (activeUser) => { setUser(activeUser); await loadWorkspace(activeUser); }} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, show: has("view_dashboard") },
    { id: "new", label: "Report ERP Issue", icon: Plus, show: has("create_issue") },
    { id: "issues", label: has("view_all_issues") ? "All Issues" : "My Issues", icon: ClipboardList, show: has("view_all_issues") || has("view_department_issue") || has("view_own_issue") },
    { id: "vendor", label: "Vendor Follow-up", icon: Truck, show: has("manage_vendor_followup") || user.roleName === "Vendor" || has("view_management_dashboard") },
    { id: "reports", label: "Reports", icon: FileDown, show: has("export_reports") },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen, show: true },
    { id: "improvements", label: "Improvement Actions", icon: Wrench, show: has("view_dashboard") },
    { id: "admin", label: "Admin Setup", icon: Settings, show: has("manage_users") || has("manage_departments") || has("manage_erp_modules") || has("manage_settings") },
    { id: "audit", label: "Audit & Email Logs", icon: ShieldCheck, show: has("view_audit_log") },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white p-4 lg:block">
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-teal-50 p-3 text-teal-900 ring-1 ring-teal-100">
          <Gauge className="h-7 w-7" />
          <div>
            <p className="text-sm font-semibold">Nelna Farm</p>
            <p className="text-xs text-teal-700">ERP Support & Improvement</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition", view === item.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Nelna ERP Support & Improvement System</p>
              <h1 className="text-xl font-semibold text-slate-950">{navItems.find((item) => item.id === view)?.label ?? "Dashboard"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-950">{user.name}</span>
                <span className="ml-2 text-slate-500">{user.roleName}</span>
              </div>
              <button onClick={() => loadWorkspace(user)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button data-testid="logout-button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setView(item.id)} className={clsx("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold", view === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 md:p-6">
          {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          {workspaceLoading && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">Refreshing workspace data...</div>}
          {view === "dashboard" && <DashboardView user={user} dashboard={dashboard} isLoading={dashboardLoading} error={dashboardError} setView={setView} />}
          {view === "new" && <IssueForm reference={reference} onCreated={async (message) => { setNotice(message); await loadWorkspace(user); setView("issues"); }} onError={setError} />}
          {view === "issues" && <IssuesView issues={issues} reference={reference} user={user} onOpen={openIssue} />}
          {view === "vendor" && <VendorView followups={followups} user={user} reference={reference} onUpdated={() => loadWorkspace(user)} onError={setError} />}
          {view === "reports" && <ReportsView issues={issues} dashboard={dashboard} />}
          {view === "knowledge" && <KnowledgeView reference={reference} user={user} onSaved={() => loadWorkspace(user)} onError={setError} />}
          {view === "improvements" && <ImprovementView actions={actions} issues={issues} reference={reference} user={user} onSaved={() => loadWorkspace(user)} onError={setError} />}
          {view === "admin" && <AdminView reference={reference} user={user} onSaved={() => loadWorkspace(user)} onError={setError} />}
          {view === "audit" && <AuditView auditLogs={auditLogs} emailLogs={emailLogs} />}
        </div>
      </main>

      {selectedIssue && (
        <IssueDetailModal
          key={selectedIssue._id}
          detail={detail}
          issue={selectedIssue}
          reference={reference}
          user={user}
          onClose={() => {
            setSelectedIssue(null);
            setDetail(null);
          }}
          onChanged={async () => {
            await loadWorkspace(user);
            if (selectedIssue) await openIssue(selectedIssue);
          }}
          onError={setError}
          onNotice={setNotice}
        />
      )}
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: UserSession) => Promise<void> }) {
  const [email, setEmail] = useState("admin@nelna.local");
  const [password, setPassword] = useState("");
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const showDemoCredentials = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";
  const demoUsers = [
    { role: "Admin", email: "admin@nelna.local", password: "Use the password configured in environment variables." },
    { role: "IT Support", email: "pathum@nelna.local", password: "Use the password configured in environment variables." },
    { role: "Manager", email: "manager@nelna.local", password: "Use the password configured in environment variables." },
    { role: "Department Staff", email: "stores.staff@nelna.local", password: "Use the password configured in environment variables." },
    { role: "Vendor", email: "bileeta.support@bileeta.local", password: "Use the password configured in environment variables." },
  ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const session = await api<{ user: UserSession | null }>("/api/auth/me");
      if (!session.user) throw new Error("Session expired. Please login again.");
      await onLogin(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session expired. Please login again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex items-center gap-3 text-teal-800">
            <Gauge className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">Nelna Farm</p>
              <h1 className="text-3xl font-semibold text-slate-950">ERP Support & Improvement System</h1>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Central ERP issue desk" value="100%" icon={ClipboardList} tone="teal" />
            <StatCard label="Vendor follow-up visibility" value="Bileeta" icon={Truck} tone="blue" />
            <StatCard label="SLA monitoring" value="Live" icon={Clock} tone="amber" />
            <StatCard label="Monthly ERP health" value="Ready" icon={BarChart3} tone="slate" />
          </div>
        </section>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Use a seeded test user after running `npm run seed`.</p>
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <label className="mt-5 block text-sm font-semibold text-slate-700">Email</label>
          <input data-testid="login-email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          <label className="mt-4 block text-sm font-semibold text-slate-700">Password</label>
          <input data-testid="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          <button data-testid="login-submit" disabled={busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" /> {busy ? "Signing in..." : "Sign in"}
          </button>
          {showDemoCredentials && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50">
              <button type="button" onClick={() => setShowDemoDetails(!showDemoDetails)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-slate-800">
                <span>Demo Login Details</span>
                <ChevronDown className={clsx("h-4 w-4 transition", showDemoDetails && "rotate-180")} />
              </button>
              {showDemoDetails && (
                <div className="border-t border-slate-200 px-3 py-3">
                  <div className="space-y-2">
                    {demoUsers.map((demoUser) => (
                      <button key={demoUser.role} type="button" onClick={() => setEmail(demoUser.email)} className="w-full rounded-lg bg-white p-3 text-left text-sm ring-1 ring-slate-200 hover:bg-teal-50 hover:ring-teal-200">
                        <span className="block font-semibold text-slate-950">{demoUser.role}</span>
                        <span className="block text-slate-600">{demoUser.email}</span>
                        <span className="mt-1 block text-xs text-slate-500">{demoUser.password}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-medium text-amber-700">For production use, demo credentials should be disabled.</p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function DashboardView({ user, dashboard, isLoading, error, setView }: { user: UserSession; dashboard: DashboardData | null; isLoading: boolean; error: string; setView: (view: string) => void }) {
  const cards = dashboard?.cards ?? {};
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{user.roleName === "Department Staff" ? "My ERP support status" : user.roleName === "Manager" ? "Management ERP health overview" : "ERP support command center"}</h2>
          <p className="mt-1 text-sm text-slate-500">Track impact, ownership, vendor pending work, SLA risk, repeated issues, and improvement actions in one place.</p>
        </div>
        {user.permissions.includes("create_issue") && (
          <button data-testid="report-issue-button" onClick={() => setView("new")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            <Plus className="h-4 w-4" /> Report ERP Issue
          </button>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Dashboard data could not be loaded.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? Array.from({ length: 8 }, (_, index) => <StatCardSkeleton key={index} />) : (
          <>
            <StatCard testId="dashboard-card-total-issues" label="Total Issues This Month" value={cards.totalThisMonth ?? 0} icon={ClipboardList} tone="teal" />
            <StatCard label="Open Issues" value={cards.openIssues ?? 0} icon={Clock} tone="blue" />
            <StatCard label="Critical Issues" value={cards.criticalIssues ?? 0} icon={AlertTriangle} tone="red" />
            <StatCard testId="dashboard-card-pending-vendor" label="Pending Vendor" value={cards.pendingVendor ?? 0} icon={Truck} tone="amber" />
            <StatCard label="SLA Breached" value={cards.slaBreached ?? 0} icon={AlertTriangle} tone="red" />
            <StatCard label="Average Resolution Time" value={minutesLabel(cards.averageResolutionMinutes)} icon={CheckCircle2} tone="teal" />
            <StatCard label="Top Affected Department" value={cards.topAffectedDepartment ?? "No issues"} icon={Building2} tone="slate" />
            <StatCard label="Top ERP Module" value={cards.topErpModule ?? "No issues"} icon={BarChart3} tone="blue" />
          </>
        )}
      </div>
      {isLoading ? (
        <Panel title="Dashboard charts"><EmptyState title="Loading dashboard" message="The business summary charts are being prepared." /></Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="Department Issue Visibility" data={dashboard?.charts.byDepartment} />
          <ChartPanel title="Top ERP Module Pressure" data={dashboard?.charts.byModule} />
          <ChartPanel title="Issue Status Mix" data={dashboard?.charts.byStatus} type="pie" />
          <ChartPanel title="Business Priority Mix" data={dashboard?.charts.byPriority} type="pie" />
          <ChartPanel title="Vendor Pending Ageing" data={dashboard?.charts.vendorAgeing} />
          <ChartPanel title="Monthly Issue Trend" data={dashboard?.charts.monthlyTrend} type="line" />
          <ChartPanel title="Root Cause Breakdown" data={dashboard?.charts.rootCause} />
          <ChartPanel title="Department Business Impact Score" data={dashboard?.charts.departmentImpact} />
        </div>
      )}
    </div>
  );
}

function IssueForm({ reference, onCreated, onError }: { reference: ReferenceData; onCreated: (message: string) => Promise<void>; onError: (message: string) => void }) {
  const [form, setForm] = useState({ requestType: "", departmentId: "", erpModuleId: "", title: "", description: "", businessImpact: "", erpScreen: "", documentNumber: "", neededBeforeDate: "", contactNumber: "" });
  const [advanced, setAdvanced] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ issueId: string; message: string } | null>(null);

  const suggestions = useMemo(() => reference.knowledgeBase.filter((item) => (!form.requestType || item.issueType === form.requestType) && (!form.erpModuleId || getEntityId(item.erpModuleId) === form.erpModuleId)).slice(0, 3), [form.requestType, form.erpModuleId, reference.knowledgeBase]);
  const impactPriority = form.businessImpact.includes("blocked") ? "Critical" : form.businessImpact.includes("cannot") || form.businessImpact.includes("affected") ? "High" : form.businessImpact.includes("delayed") ? "Medium" : form.businessImpact ? "Low" : "Auto";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (file) data.append("attachment", file);
      const result = await api<{ issue: Issue; message: string; attachmentError?: string }>("/api/issues", { method: "POST", body: data });
      setSuccess({ issueId: result.issue.issueId, message: result.attachmentError ? `${result.message} ${result.attachmentError}` : result.message });
      setForm({ requestType: "", departmentId: "", erpModuleId: "", title: "", description: "", businessImpact: "", erpScreen: "", documentNumber: "", neededBeforeDate: "", contactNumber: "" });
      setFile(null);
      await onCreated(result.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {success && (
        <div data-testid="issue-success-message" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold">Issue submitted</p>
              <p data-testid="issue-id" className="mt-1 text-lg font-semibold">{success.issueId}</p>
              <p className="text-sm">{success.message}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(success.issueId)} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <Copy className="h-4 w-4" /> Copy Issue ID
            </button>
          </div>
        </div>
      )}
      <Panel title="Report ERP Issue">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Select testId="issue-request-type-select" label="Request Type" value={form.requestType} required options={reference.constants.requestTypes} onChange={(value) => setForm({ ...form, requestType: value })} />
          <Select testId="issue-department-select" label="Department" value={form.departmentId} required options={reference.departments.map((department) => ({ value: department._id, label: department.name ?? "Department" }))} onChange={(value) => setForm({ ...form, departmentId: value })} />
          <Select testId="issue-module-select" label="ERP Module" value={form.erpModuleId} required options={reference.erpModules.map((module) => ({ value: module._id, label: module.moduleName ?? "ERP Module" }))} onChange={(value) => setForm({ ...form, erpModuleId: value })} />
          <Select testId="issue-impact-select" label="How much is this affecting your work?" value={form.businessImpact} required options={reference.constants.businessImpactOptions} onChange={(value) => setForm({ ...form, businessImpact: value })} helper={`Priority suggestion: ${impactPriority}`} />
          <TextInput testId="issue-title-input" label="Issue Title" value={form.title} required placeholder="Example: GRN cannot be saved" onChange={(value) => setForm({ ...form, title: value })} />
          <div className="md:col-span-2">
            <TextArea testId="issue-description-input" label="Short Description" value={form.description} required placeholder="Please briefly explain what happened. Example: When I try to save the GRN, an error message appears." onChange={(value) => setForm({ ...form, description: value })} />
          </div>
          {suggestions.length > 0 && (
            <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Before submitting, try this solution</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {suggestions.map((item) => (
                  <div key={item._id} className="rounded-lg bg-white p-3 text-sm ring-1 ring-amber-100">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 line-clamp-3 text-slate-600">{item.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="md:col-span-2">
            <button type="button" onClick={() => setAdvanced(!advanced)} className="text-sm font-semibold text-teal-700 hover:text-teal-900">{advanced ? "Hide more details" : "Add more details if available"}</button>
          </div>
          {advanced && (
            <>
              <TextInput label="ERP Screen/Menu" value={form.erpScreen} placeholder="Example: Inventory > GRN" onChange={(value) => setForm({ ...form, erpScreen: value })} />
              <TextInput label="Transaction / Document Number" value={form.documentNumber} placeholder="Example: GRN-000245" onChange={(value) => setForm({ ...form, documentNumber: value })} />
              <TextInput label="Needed Before Date" type="date" value={form.neededBeforeDate} onChange={(value) => setForm({ ...form, neededBeforeDate: value })} />
              <TextInput label="Contact Number" value={form.contactNumber} placeholder="Optional" onChange={(value) => setForm({ ...form, contactNumber: value })} />
              <label className="md:col-span-2 block text-sm font-semibold text-slate-700">
                Screenshot / Attachment
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  <Upload className="h-4 w-4" /> {file?.name ?? "jpg, png, pdf, docx, xlsx up to 5 MB"}
                  <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                </span>
              </label>
            </>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button data-testid="issue-submit-button" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
              <Send className="h-4 w-4" /> {busy ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function IssuesView({ issues, reference, user, onOpen }: { issues: Issue[]; reference: ReferenceData; user: UserSession; onOpen: (issue: Issue) => void }) {
  const [filters, setFilters] = useState({ q: "", departmentId: "", erpModuleId: "", priority: "", status: "", requestType: "", vendorRequired: "" });
  const filtered = issues.filter((issue) => {
    const q = filters.q.toLowerCase();
    if (q && !`${issue.issueId} ${issue.title} ${issue.description}`.toLowerCase().includes(q)) return false;
    if (filters.departmentId && getEntityId(issue.departmentId) !== filters.departmentId) return false;
    if (filters.erpModuleId && getEntityId(issue.erpModuleId) !== filters.erpModuleId) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.requestType && issue.requestType !== filters.requestType) return false;
    if (filters.vendorRequired && String(Boolean(issue.vendorRequired)) !== filters.vendorRequired) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Panel title={user.roleName === "Department Staff" ? "My Issues" : "Issue Workflow"} action={<Badge className="bg-slate-100 text-slate-700 ring-slate-200">{filtered.length} records</Badge>}>
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search issue ID, title, description" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600" />
          </div>
          <Select compact label="Department" value={filters.departmentId} options={reference.departments.map((item) => ({ value: item._id, label: item.name ?? "Department" }))} onChange={(value) => setFilters({ ...filters, departmentId: value })} />
          <Select compact label="ERP Module" value={filters.erpModuleId} options={reference.erpModules.map((item) => ({ value: item._id, label: item.moduleName ?? "Module" }))} onChange={(value) => setFilters({ ...filters, erpModuleId: value })} />
          <Select compact label="Priority" value={filters.priority} options={reference.constants.priorities} onChange={(value) => setFilters({ ...filters, priority: value })} />
          <Select compact label="Status" value={filters.status} options={reference.constants.statuses} onChange={(value) => setFilters({ ...filters, status: value })} />
          <Select compact label="Request Type" value={filters.requestType} options={reference.constants.requestTypes} onChange={(value) => setFilters({ ...filters, requestType: value })} />
          <Select compact label="Vendor Required" value={filters.vendorRequired} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} onChange={(value) => setFilters({ ...filters, vendorRequired: value })} />
        </div>
      </Panel>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">SLA Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((issue) => (
                <tr key={issue._id} onClick={() => onOpen(issue)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{issue.issueId}</p>
                    <p className="max-w-sm truncate text-slate-600">{issue.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{entityLabel(issue.departmentId)}</td>
                  <td className="px-4 py-3 text-slate-600">{entityLabel(issue.erpModuleId)}</td>
                  <td className="px-4 py-3"><Badge className={priorityClass(issue.priority)}>{issue.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge className={statusClass(issue.status)}>{issue.status}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{entityLabel(issue.assignedTo, "Unassigned")}</td>
                  <td className="px-4 py-3 text-slate-600">{shortDate(issue.slaDueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function VendorView({ followups, user, reference, onUpdated, onError }: { followups: VendorFollowup[]; user: UserSession; reference: ReferenceData; onUpdated: () => Promise<void>; onError: (message: string) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const canUpdateFollowup = user.permissions.includes("manage_vendor_followup") || user.permissions.includes("add_vendor_note");
  async function updateFollowup(followup: VendorFollowup) {
    try {
      await api("/api/vendor-followups", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followupId: followup._id, vendorStatus: draft[`status-${followup._id}`] || followup.vendorStatus, vendorResponse: draft[`response-${followup._id}`] || followup.vendorResponse }) });
      await onUpdated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <StatCard label="Pending vendor issues" value={followups.filter((item) => !["Completed"].includes(item.vendorStatus)).length} icon={Truck} tone="amber" />
      <StatCard label="Pending over 3 days" value={followups.filter((item) => Number(item.pendingDays ?? 0) > 3).length} icon={Clock} tone="red" />
      <StatCard label="Fix provided" value={followups.filter((item) => item.vendorStatus === "Fix Provided").length} icon={CheckCircle2} tone="teal" />
      <div className="xl:col-span-3 space-y-3">
        {followups.map((followup) => {
          const issue = typeof followup.issueId === "string" ? undefined : followup.issueId;
          return (
            <Panel key={followup._id} title={`${entityLabel(followup.vendorId, "Vendor")} - ${issue?.issueId ?? "Issue"}`}>
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div>
                  <h3 className="font-semibold text-slate-950">{issue?.title ?? "Vendor assigned issue"}</h3>
                  <p className="mt-1 text-sm text-slate-600">{issue?.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={statusClass(followup.vendorStatus)}>{followup.vendorStatus}</Badge>
                    <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{followup.pendingDays ?? 0} pending days</Badge>
                    {issue?.priority && <Badge className={priorityClass(issue.priority)}>{issue.priority}</Badge>}
                  </div>
                </div>
                <div className="space-y-2">
                  {canUpdateFollowup ? (
                    <>
                      <Select compact label="Vendor Status" value={draft[`status-${followup._id}`] || followup.vendorStatus} options={reference.constants.vendorStatuses} onChange={(value) => setDraft({ ...draft, [`status-${followup._id}`]: value })} />
                      <textarea value={draft[`response-${followup._id}`] ?? followup.vendorResponse ?? ""} onChange={(event) => setDraft({ ...draft, [`response-${followup._id}`]: event.target.value })} className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600" placeholder="Vendor response" />
                      <button onClick={() => updateFollowup(followup)} className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">{user.roleName === "Vendor" ? "Update Vendor Progress" : "Save Follow-up"}</button>
                    </>
                  ) : (
                    <EmptyState icon={ShieldCheck} title="Read-only vendor view" message="Management can monitor pending vendor work without changing vendor follow-up records." />
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function ReportsView({ issues, dashboard }: { issues: Issue[]; dashboard: DashboardData | null }) {
  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Nelna ERP Monthly Issue Summary", 14, 16);
    doc.setFontSize(10);
    doc.text(`ERP Health Score: ${dashboard?.cards.erpHealthScore ?? 100} - ${dashboard?.cards.erpHealthLabel ?? "Healthy"}`, 14, 24);
    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      startY: 32,
      head: [["Issue ID", "Title", "Department", "Priority", "Status"]],
      body: issues.slice(0, 60).map((issue) => [issue.issueId, issue.title, entityLabel(issue.departmentId), issue.priority, issue.status]),
    });
    doc.save(`nelna-erp-monthly-summary-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Monthly ERP Issue Summary", "Department-wise Issue Report", "Vendor Pending Report", "SLA Breach Report", "Repeated Issue Report", "Root Cause Report", "Training Needs Report", "ERP Health Score Report"].map((name) => (
          <div key={name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <FileText className="h-5 w-5 text-teal-700" />
            <p className="mt-3 font-semibold text-slate-950">{name}</p>
            <p className="mt-1 text-sm text-slate-500">Ready for export and monthly review.</p>
          </div>
        ))}
      </div>
      <Panel title="Exports">
        <div className="flex flex-wrap gap-3">
          <a href="/api/reports/issues" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"><FileDown className="h-4 w-4" /> Export Excel</a>
          <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileText className="h-4 w-4" /> Export PDF</button>
        </div>
      </Panel>
    </div>
  );
}

function KnowledgeView({ reference, user, onSaved, onError }: { reference: ReferenceData; user: UserSession; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [form, setForm] = useState({ title: "", erpModuleId: "", issueType: "", problem: "", solution: "", visibility: "Staff" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ title: "", erpModuleId: "", issueType: "", problem: "", solution: "", visibility: "Staff" });
      await onSaved();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel title="Knowledge Base Articles">
        <div className="grid gap-3 md:grid-cols-2">
          {reference.knowledgeBase.map((item) => (
            <article key={item._id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.issueType} - {entityLabel(item.erpModuleId, "ERP Module")}</p>
              <p className="mt-3 text-sm text-slate-600">{item.solution}</p>
            </article>
          ))}
        </div>
      </Panel>
      {user.permissions.includes("update_status") && (
        <Panel title="Create Article">
          <form onSubmit={submit} className="space-y-3">
            <TextInput label="Title" value={form.title} required onChange={(value) => setForm({ ...form, title: value })} />
            <Select label="ERP Module" value={form.erpModuleId} required options={reference.erpModules.map((item) => ({ value: item._id, label: item.moduleName ?? "Module" }))} onChange={(value) => setForm({ ...form, erpModuleId: value })} />
            <Select label="Issue Type" value={form.issueType} required options={reference.constants.requestTypes} onChange={(value) => setForm({ ...form, issueType: value })} />
            <TextArea label="Problem" value={form.problem} required onChange={(value) => setForm({ ...form, problem: value })} />
            <TextArea label="Solution Steps" value={form.solution} required onChange={(value) => setForm({ ...form, solution: value })} />
            <button className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Save Article</button>
          </form>
        </Panel>
      )}
    </div>
  );
}

function ImprovementView({ actions, issues, reference, user, onSaved, onError }: { actions: ImprovementAction[]; issues: Issue[]; reference: ReferenceData; user: UserSession; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [form, setForm] = useState({ title: "", description: "", sourceIssueId: "", ownerId: "", departmentId: "", dueDate: "", status: "Proposed", priority: "Medium", expectedBenefit: "", managementRemark: "" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/improvement-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ title: "", description: "", sourceIssueId: "", ownerId: "", departmentId: "", dueDate: "", status: "Proposed", priority: "Medium", expectedBenefit: "", managementRemark: "" });
      await onSaved();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel title="Improvement Action Board">
        <div className="grid gap-3">
          {actions.map((action) => (
            <article key={action._id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold text-teal-700">{action.actionId}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                </div>
                <div className="flex gap-2"><Badge className={statusClass(action.status)}>{action.status}</Badge><Badge className={priorityClass(action.priority)}>{action.priority}</Badge></div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Benefit: {action.expectedBenefit || "Not defined"}</p>
            </article>
          ))}
        </div>
      </Panel>
      {(user.permissions.includes("update_status") || user.permissions.includes("manage_settings")) && (
        <Panel title="New Improvement Action">
          <form onSubmit={submit} className="space-y-3">
            <TextInput label="Improvement Title" value={form.title} required onChange={(value) => setForm({ ...form, title: value })} />
            <Select label="Source Issue" value={form.sourceIssueId} options={issues.map((issue) => ({ value: issue._id, label: `${issue.issueId} - ${issue.title}` }))} onChange={(value) => setForm({ ...form, sourceIssueId: value })} />
            <Select label="Owner" value={form.ownerId} options={reference.users.map((item) => ({ value: item._id, label: item.name ?? item.email ?? "User" }))} onChange={(value) => setForm({ ...form, ownerId: value })} />
            <Select label="Department" value={form.departmentId} options={reference.departments.map((item) => ({ value: item._id, label: item.name ?? "Department" }))} onChange={(value) => setForm({ ...form, departmentId: value })} />
            <TextInput label="Due Date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
            <TextArea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <TextArea label="Expected Benefit" value={form.expectedBenefit} onChange={(value) => setForm({ ...form, expectedBenefit: value })} />
            <button className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Create Action</button>
          </form>
        </Panel>
      )}
    </div>
  );
}

function AdminView({ reference, user, onSaved, onError }: { reference: ReferenceData; user: UserSession; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {user.permissions.includes("manage_departments") && <SetupCard title="Department Setup" type="department" fields={[{ name: "name", label: "Department Name" }]} onSaved={onSaved} onError={onError} />}
      {user.permissions.includes("manage_erp_modules") && <SetupCard title="ERP Module Setup" type="erpModule" fields={[{ name: "moduleName", label: "Module Name" }, { name: "description", label: "Description" }]} onSaved={onSaved} onError={onError} />}
      {user.permissions.includes("manage_settings") && <SetupCard title="Vendor Setup" type="vendor" fields={[{ name: "vendorName", label: "Vendor Name" }, { name: "contactPerson", label: "Contact Person" }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }]} onSaved={onSaved} onError={onError} />}
      {user.permissions.includes("manage_users") && (
        <UserSetupCard reference={reference} onSaved={onSaved} onError={onError} />
      )}
      {user.permissions.includes("manage_settings") && <SmtpTestCard user={user} />}
      <Panel title="Current Setup">
        <div className="grid gap-3 md:grid-cols-3">
          <SetupCount label="Users" value={reference.users.length} icon={Users} />
          <SetupCount label="Departments" value={reference.departments.length} icon={Building2} />
          <SetupCount label="ERP Modules" value={reference.erpModules.length} icon={ClipboardList} />
        </div>
      </Panel>
    </div>
  );
}

function SmtpTestCard({ user }: { user: UserSession }) {
  const [to, setTo] = useState(user.email);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function sendTest(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult("");
    try {
      const response = await api<{ result: { ok: boolean; message: string } }>("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: "Nelna ERP Support SMTP test",
          body: "This is a test email from the Nelna ERP Support & Improvement System.",
        }),
      });
      setResult(response.result.ok ? "Test email sent successfully." : response.result.message);
    } catch (err) {
      setResult(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="SMTP Email Test">
      <form onSubmit={sendTest} className="space-y-3">
        <TextInput label="Recipient Email" value={to} required onChange={setTo} />
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          <MailCheck className="h-4 w-4" /> {busy ? "Sending..." : "Send test email"}
        </button>
        {result && <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{result}</p>}
      </form>
    </Panel>
  );
}

function AuditView({ auditLogs, emailLogs }: { auditLogs: Array<Record<string, unknown>>; emailLogs: Array<Record<string, unknown>> }) {
  const [filters, setFilters] = useState({ action: "", user: "", issue: "", date: "" });
  const actionOptions = useMemo(() => Array.from(new Set(auditLogs.map((log) => String(log.action ?? "")).filter(Boolean))).sort(), [auditLogs]);
  const userOptions = useMemo(() => Array.from(new Set(auditLogs.map((log) => entityLabel(log.performedBy as EntityRef | string | undefined, "System")).filter(Boolean))).sort(), [auditLogs]);
  const filteredAuditLogs = auditLogs.filter((log) => {
    const action = String(log.action ?? "");
    const entityId = String(log.entityId ?? "");
    const userName = entityLabel(log.performedBy as EntityRef | string | undefined, "System");
    const performedDate = String(log.performedAt ?? "").slice(0, 10);
    if (filters.action && action !== filters.action) return false;
    if (filters.user && userName !== filters.user) return false;
    if (filters.issue && !entityId.toLowerCase().includes(filters.issue.toLowerCase())) return false;
    if (filters.date && performedDate !== filters.date) return false;
    return true;
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Audit Trail">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Select compact label="Action" value={filters.action} options={actionOptions} onChange={(value) => setFilters({ ...filters, action: value })} />
          <Select compact label="User" value={filters.user} options={userOptions} onChange={(value) => setFilters({ ...filters, user: value })} />
          <TextInput label="Issue or Entity" value={filters.issue} onChange={(value) => setFilters({ ...filters, issue: value })} />
          <TextInput label="Date" type="date" value={filters.date} onChange={(value) => setFilters({ ...filters, date: value })} />
        </div>
        <div className="max-h-170 space-y-2 overflow-auto">
          {filteredAuditLogs.map((log) => (
            <div key={String(log._id)} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-950">{String(log.action)}</p>
              <p className="text-slate-500">{String(log.entityType)} - {String(log.entityId)} - {entityLabel(log.performedBy as EntityRef | string | undefined, "System")} - {dateLabel(String(log.performedAt))}</p>
            </div>
          ))}
          {!filteredAuditLogs.length && <EmptyState icon={ShieldCheck} title="No audit logs match" message="Adjust the filters to review system activity." />}
        </div>
      </Panel>
      <Panel title="Email Logs">
        <div className="max-h-170 space-y-2 overflow-auto">
          {emailLogs.map((log) => (
            <div key={String(log._id)} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-950">{String(log.subject)}</p><Badge className={String(log.status) === "Sent" ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-red-100 text-red-700 ring-red-200"}>{String(log.status)}</Badge></div>
              <p className="mt-1 text-slate-500">To: {Array.isArray(log.to) ? log.to.join(", ") : "-"}</p>
              {log.errorMessage ? <p className="mt-1 text-red-600">{String(log.errorMessage)}</p> : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function IssueDetailModal({ detail, issue, reference, user, onClose, onChanged, onError, onNotice }: { detail: DetailData | null; issue: Issue; reference: ReferenceData; user: UserSession; onClose: () => void; onChanged: () => Promise<void>; onError: (message: string) => void; onNotice: (message: string) => void }) {
  const activeIssue = detail?.issue ?? issue;
  const [draft, setDraft] = useState<Record<string, string | boolean | number>>(() => ({ status: activeIssue.status, priority: activeIssue.priority, assignedTo: getEntityId(activeIssue.assignedTo), vendorRequired: Boolean(activeIssue.vendorRequired), vendorId: getEntityId(activeIssue.vendorId), rootCause: activeIssue.rootCause ?? "", preventiveAction: activeIssue.preventiveAction ?? "", solutionNote: activeIssue.solutionNote ?? "", isRepeated: Boolean(activeIssue.isRepeated), managementRemark: activeIssue.managementRemark ?? "" }));
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);

  async function saveChanges() {
    try {
      await api(`/api/issues/${activeIssue._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      onNotice("Issue updated successfully.");
      await onChanged();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }

  async function addComment() {
    try {
      await api(`/api/issues/${activeIssue._id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment, isInternal: internal }) });
      setComment("");
      setInternal(false);
      await onChanged();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }

  const canUpdate = user.permissions.includes("update_status") || user.permissions.includes("assign_issue") || getEntityId(activeIssue.reportedBy) === user.id;
  const canComment = user.permissions.includes("add_comment");

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-slate-200 md:max-h-[calc(100vh-3rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-slate-950">{activeIssue.issueId}</h2><Badge className={priorityClass(activeIssue.priority)}>{activeIssue.priority}</Badge><Badge className={statusClass(activeIssue.status)}>{activeIssue.status}</Badge></div>
            <p className="mt-1 text-sm text-slate-600">{activeIssue.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {!detail ? (
          <div className="p-8 text-center text-slate-500">Loading issue details...</div>
        ) : (
          <div className="grid gap-0 overflow-auto lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 p-4">
              <Panel title="Issue Information">
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <Info label="Department" value={entityLabel(activeIssue.departmentId)} />
                  <Info label="ERP Module" value={entityLabel(activeIssue.erpModuleId)} />
                  <Info label="Request Type" value={activeIssue.requestType} />
                  <Info label="Business Impact" value={activeIssue.businessImpact} />
                  <Info label="Reported By" value={entityLabel(activeIssue.reportedBy)} />
                  <Info label="Assigned To" value={entityLabel(activeIssue.assignedTo, "Unassigned")} />
                  <Info label="SLA Due" value={dateLabel(activeIssue.slaDueAt)} />
                  <Info label="Created" value={dateLabel(activeIssue.createdAt)} />
                  <div className="md:col-span-2"><Info label="Description" value={activeIssue.description} /></div>
                </div>
              </Panel>
              <Panel title="Comments">
                <div className="space-y-3">
                  {detail.comments.map((item) => (
                    <div key={item._id} className={clsx("rounded-lg border p-3 text-sm", item.isInternal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                      <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-950">{entityLabel(item.createdBy, "User")}</p><span className="text-xs text-slate-500">{dateLabel(item.createdAt)}</span></div>
                      <p className="mt-2 text-slate-700">{item.comment}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{item.commentType}</p>
                    </div>
                  ))}
                  {canComment ? (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600" placeholder="Add a comment or support update" />
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        {user.permissions.includes("add_internal_note") && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} /> Internal note</label>}
                        <button onClick={addComment} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"><MessageSquare className="h-4 w-4" /> Add Comment</button>
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={ShieldCheck} title="Read-only access" message="This role can review the issue history but cannot add comments or change issue details." />
                  )}
                </div>
              </Panel>
              <Panel title="Attachments and Vendor Follow-up">
                <div className="grid gap-3 md:grid-cols-2">
                  {detail.attachments.map((attachment) => <a key={attachment._id} href={attachment.fileUrl} target="_blank" className="rounded-lg border border-slate-200 p-3 text-sm font-semibold text-teal-700" rel="noreferrer">{attachment.fileName}</a>)}
                  {detail.followups.map((followup) => <div key={followup._id} className="rounded-lg border border-slate-200 p-3 text-sm"><p className="font-semibold text-slate-950">{entityLabel(followup.vendorId)}</p><p className="mt-1 text-slate-600">{followup.vendorStatus} - {followup.vendorResponse}</p></div>)}
                </div>
              </Panel>
            </div>
            <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
              <h3 className="font-semibold text-slate-950">Workflow Controls</h3>
              <div className="mt-4 space-y-3">
                {user.permissions.includes("update_status") && <Select label="Status" value={String(draft.status ?? "")} options={reference.constants.statuses} onChange={(value) => setDraft({ ...draft, status: value })} />}
                {user.permissions.includes("update_status") && <Select label="Priority" value={String(draft.priority ?? "")} options={reference.constants.priorities} onChange={(value) => setDraft({ ...draft, priority: value })} />}
                {user.permissions.includes("assign_issue") && <Select label="Assign To" value={String(draft.assignedTo ?? "")} options={reference.users.map((item) => ({ value: item._id, label: item.name ?? item.email ?? "User" }))} onChange={(value) => setDraft({ ...draft, assignedTo: value })} />}
                {(user.permissions.includes("manage_vendor_followup") || user.permissions.includes("update_status")) && (
                  <>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(draft.vendorRequired)} onChange={(event) => setDraft({ ...draft, vendorRequired: event.target.checked })} /> Vendor required</label>
                    <Select label="Vendor" value={String(draft.vendorId ?? "")} options={reference.vendors.map((item) => ({ value: item._id, label: item.vendorName ?? "Vendor" }))} onChange={(value) => setDraft({ ...draft, vendorId: value })} />
                  </>
                )}
                {user.permissions.includes("update_status") && <Select label="Root Cause" value={String(draft.rootCause ?? "")} options={reference.constants.rootCauseCategories} onChange={(value) => setDraft({ ...draft, rootCause: value })} />}
                {user.permissions.includes("update_status") && <Select label="Preventive Action" value={String(draft.preventiveAction ?? "")} options={reference.constants.preventiveActions} onChange={(value) => setDraft({ ...draft, preventiveAction: value })} />}
                {user.permissions.includes("update_status") && <TextArea label="Solution Note" value={String(draft.solutionNote ?? "")} onChange={(value) => setDraft({ ...draft, solutionNote: value })} />}
                {user.permissions.includes("update_status") && <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(draft.isRepeated)} onChange={(event) => setDraft({ ...draft, isRepeated: event.target.checked })} /> Mark repeated issue</label>}
                {user.permissions.includes("view_management_dashboard") && <TextArea label="Management Remark" value={String(draft.managementRemark ?? "")} onChange={(value) => setDraft({ ...draft, managementRemark: value })} />}
                {getEntityId(activeIssue.reportedBy) === user.id && activeIssue.status === "Resolved" && <button onClick={() => setDraft({ ...draft, status: "Closed" })} className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Confirm and close</button>}
                {canUpdate && <button onClick={saveChanges} className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Save Changes</button>}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, required, helper, compact, testId }: { label: string; value: string; options: Array<string | { value: string; label: string }>; onChange: (value: string) => void; required?: boolean; helper?: string; compact?: boolean; testId?: string }) {
  return (
    <label className={clsx("block text-sm font-semibold text-slate-700", compact && "text-xs")}>{label}
      <select data-testid={testId} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
        <option value="">All / Select</option>
        {options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {helper && <span className="mt-1 block text-xs font-medium text-teal-700">{helper}</span>}
    </label>
  );
}

function TextInput({ label, value, onChange, required, placeholder, type = "text", testId }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string; testId?: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input data-testid={testId} type={type} required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>;
}

function TextArea({ label, value, onChange, required, placeholder, testId }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; testId?: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<textarea data-testid={testId} required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-800">{value}</p></div>;
}

function SetupCount({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return <div className="rounded-lg border border-slate-200 p-4"><Icon className="h-5 w-5 text-teal-700" /><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p><p className="text-sm text-slate-500">{label}</p></div>;
}

function SetupCard({ title, type, fields, onSaved, onError }: { title: string; type: string; fields: Array<{ name: string; label: string }>; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [payload, setPayload] = useState<Record<string, string>>({});
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, payload }) });
      setPayload({});
      await onSaved();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }
  return <Panel title={title}><form onSubmit={submit} className="space-y-3">{fields.map((field) => <TextInput key={field.name} label={field.label} value={payload[field.name] ?? ""} required={field.name !== "description" && field.name !== "phone"} onChange={(value) => setPayload({ ...payload, [field.name]: value })} />)}<button className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Save</button></form></Panel>;
}

function UserSetupCard({ reference, onSaved, onError }: { reference: ReferenceData; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [payload, setPayload] = useState<Record<string, string>>({});
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "user", payload }) });
      setPayload({});
      await onSaved();
    } catch (err) { onError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
  }
  return (
    <Panel title="User Management">
      <form onSubmit={submit} className="space-y-3">
        <TextInput label="Name" value={payload.name ?? ""} required onChange={(value) => setPayload({ ...payload, name: value })} />
        <TextInput label="Email" value={payload.email ?? ""} required onChange={(value) => setPayload({ ...payload, email: value })} />
        <TextInput label="Password" value={payload.password ?? ""} required onChange={(value) => setPayload({ ...payload, password: value })} />
        <Select label="Role" value={payload.roleId ?? ""} required options={reference.roles.map((role) => ({ value: role._id, label: role.roleName ?? "Role" }))} onChange={(value) => setPayload({ ...payload, roleId: value })} />
        <Select label="Department" value={payload.departmentId ?? ""} options={reference.departments.map((department) => ({ value: department._id, label: department.name ?? "Department" }))} onChange={(value) => setPayload({ ...payload, departmentId: value })} />
        <Select label="Vendor" value={payload.vendorId ?? ""} options={reference.vendors.map((vendor) => ({ value: vendor._id, label: vendor.vendorName ?? "Vendor" }))} onChange={(value) => setPayload({ ...payload, vendorId: value })} />
        <button className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Create User</button>
      </form>
    </Panel>
  );
}
