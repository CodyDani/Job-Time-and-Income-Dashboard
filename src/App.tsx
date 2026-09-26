import React, { useState, useMemo, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkSession {
  id: string;
  date: string; // empty string means "Previously"
  fromTime: string;
  toTime: string;
  isToday: boolean;
}

interface Payout {
  id: string;
  amount: number;
  date: string;
}

interface Account {
  id: string;
  name: string;
  ratePerHour: number;
  sessions: WorkSession[];
  payouts: Payout[];
}

type TimeFilter = "today" | "week" | "month" | "all";
type SessionFilter = "all" | "today" | "previously";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

function parseSeconds(t: string): number {
  const parts = t.split(":").map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

function sessionDuration(s: WorkSession): number {
  return Math.max(0, parseSeconds(s.toTime) - parseSeconds(s.fromTime));
}

function fmtDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtHrsLabel(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h} hrs ${m} mins`;
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(n);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "Previously";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function filterByTime(
  sessions: WorkSession[],
  filter: TimeFilter,
): WorkSession[] {
  const now = new Date();
  return sessions.filter((s) => {
    if (filter === "today") return s.isToday || s.date === TODAY;
    // sessions with no date are "previous" and shouldn't match week/month
    if (!s.date) return filter === "all";
    const d = new Date(s.date + "T12:00:00");
    if (filter === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return d >= start;
    }
    if (filter === "month") {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });
}

function accountTotalSecs(acc: Account): number {
  return acc.sessions.reduce((a, s) => a + sessionDuration(s), 0);
}

function accountTotalPaid(acc: Account): number {
  return acc.payouts.reduce((a, p) => a + p.amount, 0);
}

function accountPendingBalance(acc: Account): number {
  const earned = (accountTotalSecs(acc) / 3600) * acc.ratePerHour;
  return Math.max(0, earned - accountTotalPaid(acc));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

// Start empty so the workspace begins with no sample accounts or payouts.
const SEED_ACCOUNTS: Account[] = [];

// ─── Primitive Components ─────────────────────────────────────────────────────

function Card({
  children,
  style,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border ${className}`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 border border-b-0 sm:border-b"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border-strong)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4 sm:hidden">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--border-strong)" }}
          />
        </div>
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-base sm:text-lg font-semibold"
            style={{ fontFamily: "Outfit, sans-serif", color: "var(--text)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-opacity hover:opacity-60"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input
        {...props}
        className="w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-strong)",
          color: "var(--text)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }}
      />
    </Field>
  );
}

function BtnPrimary({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ background: "var(--primary)", color: "#fff", ...style }}
    >
      {children}
    </button>
  );
}

function BtnSecondary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-70 ${className}`}
      style={{
        borderColor: "var(--border-strong)",
        color: "var(--text-muted)",
        background: "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Pill({
  children,
  color = "primary",
}: {
  children: React.ReactNode;
  color?: "primary" | "green" | "blue" | "amber";
}) {
  const styles = {
    primary: {
      background: "var(--primary-subtle)",
      color: "var(--primary-hover)",
      border: "1px solid rgba(99,102,241,0.2)",
    },
    green: {
      background: "var(--green-subtle)",
      color: "var(--green)",
      border: "1px solid rgba(34,197,94,0.2)",
    },
    blue: {
      background: "var(--blue-subtle)",
      color: "var(--blue)",
      border: "1px solid rgba(59,130,246,0.2)",
    },
    amber: {
      background: "var(--amber-subtle)",
      color: "var(--amber)",
      border: "1px solid rgba(245,158,11,0.2)",
    },
  } as any;
  return (
    <span
      className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={styles[color]}
    >
      {children}
    </span>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function AddAccountModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, rate: number) => void;
}) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const canSubmit = name.trim() && parseFloat(rate) > 0;

  return (
    <Modal title="Create New Account" onClose={onClose}>
      <Input
        label="Account Name"
        placeholder="e.g. Outlier – Project A"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Rate Per Hour (₦)"
        placeholder="0.00"
        type="number"
        min="0"
        step="0.01"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
      />
      <div className="flex gap-3 mt-5">
        <BtnSecondary onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </BtnSecondary>
        <BtnPrimary
          onClick={() => {
            if (canSubmit) onCreate(name.trim(), parseFloat(rate));
          }}
          disabled={!canSubmit}
          style={{ flex: 1 }}
        >
          Create Account
        </BtnPrimary>
      </div>
    </Modal>
  );
}

function LogSessionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Omit<WorkSession, "id">) => void;
}) {
  // Previously should be the default. Date is optional — empty means "Previously".
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const canSubmit = from && to;

  return (
    <Modal title="Add Work Session" onClose={onClose}>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Leave date empty to mark session as "Previously" (default). Enter times
        in
        <strong> hh:mm</strong> format — hours may exceed 24 (e.g. 62:00 →
        74:00). Duration is calculated as the numeric difference (e.g.
        62:00–74:00 = 12h).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="From Time (hh:mm)"
          placeholder="e.g. 62:00"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To Time (hh:mm)"
          placeholder="e.g. 74:00"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <Input
        label="Date (optional)"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="flex gap-3 mt-5">
        <BtnSecondary onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </BtnSecondary>
        <BtnPrimary
          onClick={() => {
            if (!canSubmit) return;
            const pad = (t: string) => (t.includes(":") ? t : `${t}:00`);
            const isToday = date === TODAY;
            onSave({
              date: date || "",
              fromTime: pad(from),
              toTime: pad(to),
              isToday,
            });
          }}
          disabled={!canSubmit}
          style={{ flex: 1 }}
        >
          Save Session
        </BtnPrimary>
      </div>
    </Modal>
  );
}

function AddPayoutModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (amount: number, date: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(TODAY);
  const canSubmit = parseFloat(amount) > 0 && date;

  return (
    <Modal title="Record Payment Received" onClose={onClose}>
      <Input
        label="Amount Paid (₦)"
        placeholder="0.00"
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        label="Date Received"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="flex gap-3 mt-5">
        <BtnSecondary onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </BtnSecondary>
        <BtnPrimary
          onClick={() => {
            if (canSubmit) onSave(parseFloat(amount), date);
          }}
          disabled={!canSubmit}
          style={{ flex: 1, background: "var(--green)" }}
        >
          Record Payout
        </BtnPrimary>
      </div>
    </Modal>
  );
}

// ─── Screen 1: Overview Dashboard ────────────────────────────────────────────

function OverviewDashboard({
  accounts,
  onAddAccount,
  onViewAccount,
  onUpdateRate,
}: {
  accounts: Account[];
  onAddAccount: (name: string, rate: number) => void;
  onViewAccount: (a: Account) => void;
  onUpdateRate: (id: string, rate: number) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const totalSecs = accounts.reduce((a, acc) => a + accountTotalSecs(acc), 0);
  const totalEverything = accounts.reduce(
    (a, acc) => a + accountTotalPaid(acc) + accountPendingBalance(acc),
    0,
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3.5 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(7,8,12,0.92)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--primary)" }}
          >
            JM
          </div>
          <span
            className="font-semibold text-sm sm:text-base truncate"
            style={{ fontFamily: "Outfit, sans-serif", color: "var(--text)" }}
          >
            Job Manager
          </span>
        </div>
        <BtnPrimary
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">+ Add New Account</span>
          <span className="sm:hidden">+ Add</span>
        </BtnPrimary>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <Card className="p-4 sm:p-6">
            <p
              className="text-xs font-medium uppercase tracking-widest mb-3 sm:mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Total Payout Across Accounts
            </p>
            <p
              className="text-2xl sm:text-3xl font-semibold mb-1"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--green)",
              }}
            >
              {fmtCurrency(totalEverything)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              All received &amp; pending earnings
            </p>
          </Card>

          <Card className="p-4 sm:p-6">
            <p
              className="text-xs font-medium uppercase tracking-widest mb-3 sm:mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Total Hours Across Accounts
            </p>
            <p
              className="text-2xl sm:text-3xl font-semibold mb-1"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--text)",
              }}
            >
              {fmtHrsLabel(totalSecs)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Combined from all sessions
            </p>
          </Card>

          <Card
            className="p-4 sm:p-6 flex flex-col justify-between sm:col-span-2 md:col-span-1"
            style={{
              background: "var(--primary-subtle)",
              borderColor: "rgba(99,102,241,0.18)",
            }}
          >
            <div className="flex sm:block items-center gap-4 md:block">
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-widest mb-0.5"
                  style={{ color: "var(--primary-hover)" }}
                >
                  Active Accounts
                </p>
                <p
                  className="text-2xl sm:text-3xl font-semibold"
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    color: "var(--text)",
                  }}
                >
                  {accounts.length}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Income streams being tracked
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 sm:mt-4 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-85"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  width: "fit-content",
                }}
              >
                + New Account
              </button>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2
            className="text-lg sm:text-xl font-semibold"
            style={{ fontFamily: "Outfit, sans-serif", color: "var(--text)" }}
          >
            Your Accounts
          </h2>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {accounts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 sm:py-28 rounded-2xl border"
            style={{ borderColor: "var(--border)", borderStyle: "dashed" }}
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4"
              style={{ background: "var(--surface-2)" }}
            >
              📋
            </div>
            <h3
              className="text-base sm:text-lg font-semibold mb-2"
              style={{ fontFamily: "Outfit, sans-serif", color: "var(--text)" }}
            >
              No Account Added Yet
            </h3>
            <p
              className="text-sm mb-6 text-center max-w-xs px-4"
              style={{ color: "var(--text-muted)" }}
            >
              Create your first account to start tracking time and income across
              your projects.
            </p>
            <BtnPrimary onClick={() => setShowModal(true)}>
              + Create Your First Account
            </BtnPrimary>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {accounts.map((acc) => {
              const secs = accountTotalSecs(acc);
              const pending = accountPendingBalance(acc);
              return (
                <Card
                  key={acc.id}
                  className="p-4 sm:p-5 group cursor-pointer transition-colors"
                  onClick={() => onViewAccount(acc)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3
                        className="font-semibold text-sm mb-2 truncate"
                        style={{
                          fontFamily: "Outfit, sans-serif",
                          color: "var(--text)",
                        }}
                      >
                        {acc.name}
                      </h3>
                      <Pill color="primary">
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={acc.ratePerHour}
                            onChange={(e) =>
                              onUpdateRate(
                                acc.id,
                                parseFloat(e.target.value || "0"),
                              )
                            }
                            style={{
                              width: 84,
                              background: "transparent",
                              border: "none",
                              color: "inherit",
                              fontFamily: "JetBrains Mono, monospace",
                              fontWeight: 700,
                            }}
                          />
                          <span style={{ fontSize: 12 }}>/hr</span>
                        </div>
                      </Pill>
                    </div>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--primary)", color: "#fff" }}
                    >
                      →
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div
                      className="rounded-lg p-3"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Hours Worked
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          color: "var(--text)",
                        }}
                      >
                        {fmtDuration(secs)}
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: "var(--green-subtle)",
                        border: "1px solid rgba(34,197,94,0.12)",
                      }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Pending Payout
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          color: "var(--green)",
                        }}
                      >
                        {fmtCurrency(pending)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {acc.sessions.length} session
                      {acc.sessions.length !== 1 ? "s" : ""} ·{" "}
                      {acc.payouts.length} payout
                      {acc.payouts.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: "var(--primary-hover)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAccount(acc);
                      }}
                    >
                      View Account <span>→</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <AddAccountModal
          onClose={() => setShowModal(false)}
          onCreate={(name, rate) => {
            onAddAccount(name, rate);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Screen 2: Account Detail ─────────────────────────────────────────────────

function AccountDetail({
  account,
  onBack,
  onAddSession,
  onAddPayout,
  onUpdateRate,
}: {
  account: Account;
  onBack: () => void;
  onAddSession: (s: Omit<WorkSession, "id">) => void;
  onAddPayout: (amount: number, date: string) => void;
  onUpdateRate: (id: string, rate: number) => void;
}) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sessionFilter, setSessionFilter] =
    useState<SessionFilter>("previously");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const filteredSecs = filterByTime(account.sessions, timeFilter).reduce(
    (a, s) => a + sessionDuration(s),
    0,
  );
  const pending = accountPendingBalance(account);
  const totalPaid = accountTotalPaid(account);

  const displayedSessions = useMemo(() => {
    let list = [...account.sessions].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    if (sessionFilter === "today")
      list = list.filter((s) => s.isToday || s.date === TODAY);
    if (sessionFilter === "previously")
      list = list.filter((s) => !s.isToday && s.date !== TODAY);
    return list;
  }, [account.sessions, sessionFilter]);

  const sortedPayouts = useMemo(
    () => [...account.payouts].sort((a, b) => b.date.localeCompare(a.date)),
    [account.payouts],
  );

  const timeFilterOptions: { key: TimeFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All-Time" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-20 border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5"
        style={{
          borderColor: "var(--border)",
          background: "rgba(7,8,12,0.92)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs sm:text-sm transition-opacity hover:opacity-70 w-fit"
              style={{ color: "var(--text-muted)" }}
            >
              ←<span className="hidden sm:inline"> Back to All Accounts</span>
              <span className="sm:hidden"> Back</span>
            </button>
            <div
              className="hidden md:block w-px h-5 flex-shrink-0"
              style={{ background: "var(--border)" }}
            />
            <div className="flex items-center gap-2 min-w-0">
              <h1
                className="font-semibold text-sm sm:text-base truncate"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  color: "var(--text)",
                }}
              >
                {account.name}
              </h1>
              <Pill color="primary">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={account.ratePerHour}
                    onChange={(e) =>
                      onUpdateRate(
                        account.id,
                        parseFloat(e.target.value || "0"),
                      )
                    }
                    style={{
                      width: 96,
                      background: "transparent",
                      border: "none",
                      color: "inherit",
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ fontSize: 12 }}>/hr</span>
                </div>
              </Pill>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:block">
              <BtnSecondary>📥 Download CSV Statement</BtnSecondary>
            </div>
            <BtnPrimary
              onClick={() => setShowLogModal(true)}
              className="text-xs sm:text-sm flex-1 md:flex-none"
            >
              <span className="hidden sm:inline">+ Log Work Session</span>
              <span className="sm:hidden">+ Log Session</span>
            </BtnPrimary>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p
                className="text-xs font-medium uppercase tracking-widest leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                Total Hours Worked
              </p>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="text-xs rounded-md px-2 py-1 border outline-none flex-shrink-0"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {timeFilterOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <p
              className="text-xl sm:text-2xl font-semibold"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--text)",
              }}
            >
              {fmtDuration(filteredSecs)}
            </p>
          </Card>

          <Card
            className="p-4 sm:p-5"
            style={{
              background: "var(--amber-subtle)",
              borderColor: "rgba(245,158,11,0.2)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2.5"
              style={{ color: "var(--amber)" }}
            >
              Expected Payout
            </p>
            <p
              className="text-xl sm:text-2xl font-semibold"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--amber)",
              }}
            >
              {fmtCurrency(pending)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Since last payout
            </p>
          </Card>

          <Card
            className="p-4 sm:p-5"
            style={{
              background: "var(--green-subtle)",
              borderColor: "rgba(34,197,94,0.2)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-widest mb-2.5"
              style={{ color: "var(--green)" }}
            >
              Total Payout Received
            </p>
            <p
              className="text-xl sm:text-2xl font-semibold"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--green)",
              }}
            >
              {fmtCurrency(totalPaid)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Cumulative total
            </p>
          </Card>

          <Card
            className="p-4 sm:p-5 flex flex-col justify-between"
            style={{ borderStyle: "dashed" }}
          >
            <div>
              <p
                className="text-xs font-medium uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Record Payment
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Mark a payment you've received.
              </p>
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="mt-3 sm:mt-4 px-4 py-2.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85"
              style={{
                background: "var(--green)",
                color: "#fff",
                width: "fit-content",
              }}
            >
              + Add New Payout
            </button>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 sm:gap-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2
                className="text-sm sm:text-base font-semibold"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  color: "var(--text)",
                }}
              >
                Work Sessions History
              </h2>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {(["all", "today", "previously"] as SessionFilter[]).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setSessionFilter(f)}
                      className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex-shrink-0"
                      style={{
                        background:
                          sessionFilter === f
                            ? "var(--primary)"
                            : "var(--surface-2)",
                        color:
                          sessionFilter === f ? "#fff" : "var(--text-muted)",
                        border: `1px solid ${sessionFilter === f ? "transparent" : "var(--border)"}`,
                      }}
                    >
                      {f === "all"
                        ? "All"
                        : f === "today"
                          ? "Today"
                          : "Previously"}
                    </button>
                  ),
                )}
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <div style={{ minWidth: "480px" }}>
                  <div
                    className="grid grid-cols-3 px-4 sm:px-5 py-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {["Date", "Time Frame", "Duration"].map((h) => (
                      <span
                        key={h}
                        className="text-xs font-medium uppercase tracking-widest"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {displayedSessions.length === 0 ? (
                    <div
                      className="py-12 flex flex-col items-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="text-2xl mb-3">⏱</span>
                      <p className="text-sm">No sessions found</p>
                    </div>
                  ) : (
                    displayedSessions.map((session) => {
                      const dur = sessionDuration(session);
                      return (
                        <div
                          key={session.id}
                          className="grid grid-cols-3 px-4 sm:px-5 py-3.5 items-center border-b transition-colors hover:bg-[var(--surface-2)]"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <span
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "11px",
                              color: "var(--text)",
                            }}
                          >
                            {session.date ? (
                              fmtDate(session.date)
                            ) : (
                              <Pill color="blue">Previously</Pill>
                            )}
                          </span>
                          <span
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {session.fromTime} → {session.toTime}
                          </span>
                          <span
                            className="font-medium"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "13px",
                              color: "var(--text)",
                            }}
                          >
                            {fmtDuration(dur)}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {displayedSessions.length > 0 && (
                    <div
                      className="grid grid-cols-3 px-4 sm:px-5 py-3.5 items-center"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <span
                        className="text-xs font-medium col-span-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Total ({displayedSessions.length} session
                        {displayedSessions.length !== 1 ? "s" : ""})
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "13px",
                          color: "var(--primary-hover)",
                        }}
                      >
                        {fmtDuration(
                          displayedSessions.reduce(
                            (a, s) => a + sessionDuration(s),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm sm:text-base font-semibold"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  color: "var(--text)",
                }}
              >
                Payout History
              </h2>
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {sortedPayouts.length} payment
                {sortedPayouts.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Card>
              {sortedPayouts.length === 0 ? (
                <div
                  className="py-12 flex flex-col items-center text-center px-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="text-2xl mb-3">💳</span>
                  <p className="text-sm mb-1">No payouts recorded yet</p>
                  <p
                    className="text-xs mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Mark payments as received to track your earnings.
                  </p>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--primary-hover)" }}
                  >
                    Record first payout →
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  {sortedPayouts.map((payout, i) => (
                    <div
                      key={payout.id}
                      className="flex items-stretch gap-3 px-4 sm:px-5 py-3 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <div className="flex flex-col items-center pt-1 flex-shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: "var(--green)",
                            boxShadow: "0 0 8px rgba(34,197,94,0.5)",
                          }}
                        />
                        {i < sortedPayouts.length - 1 && (
                          <div
                            className="w-px mt-1 flex-1"
                            style={{
                              background: "var(--border)",
                              minHeight: "24px",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className="font-semibold"
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "14px",
                              color: "var(--green)",
                            }}
                          >
                            +{fmtCurrency(payout.amount)}
                          </span>
                          <Pill color="green">Received</Pill>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fmtDate(payout.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between px-4 sm:px-5 py-3 mt-1 border-t"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Total Received
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "var(--green)",
                      }}
                    >
                      {fmtCurrency(totalPaid)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {showLogModal && (
        <LogSessionModal
          onClose={() => setShowLogModal(false)}
          onSave={(session) => {
            onAddSession(session);
            setShowLogModal(false);
          }}
        />
      )}
      {showPayoutModal && (
        <AddPayoutModal
          onClose={() => setShowPayoutModal(false)}
          onSave={(amount, date) => {
            onAddPayout(amount, date);
            setShowPayoutModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "job-time-income-dashboard:v1";

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.accounts)) return parsed.accounts as Account[];
      }
    } catch (e) {
      // ignore parse errors and fall back to seed
    }
    return SEED_ACCOUNTS;
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.selectedId ?? null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      const payload = JSON.stringify({ accounts, selectedId });
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (e) {
      // storage might be full or unavailable — ignore to avoid crashing
    }
  }, [accounts, selectedId]);

  const currentAccount = selectedId
    ? (accounts.find((a) => a.id === selectedId) ?? null)
    : null;

  function addAccount(name: string, ratePerHour: number) {
    setAccounts((prev) => [
      ...prev,
      { id: `${Date.now()}`, name, ratePerHour, sessions: [], payouts: [] },
    ]);
  }

  function addSession(session: Omit<WorkSession, "id">) {
    if (!selectedId) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedId
          ? {
              ...a,
              sessions: [...a.sessions, { ...session, id: `${Date.now()}` }],
            }
          : a,
      ),
    );
  }

  function addPayout(amount: number, date: string) {
    if (!selectedId) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedId
          ? {
              ...a,
              payouts: [...a.payouts, { id: `${Date.now()}`, amount, date }],
            }
          : a,
      ),
    );
  }

  function updateAccountRate(id: string, rate: number) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ratePerHour: rate } : a)),
    );
  }

  if (currentAccount) {
    return (
      <AccountDetail
        account={currentAccount}
        onBack={() => setSelectedId(null)}
        onAddSession={addSession}
        onAddPayout={addPayout}
        onUpdateRate={updateAccountRate}
      />
    );
  }

  return (
    <OverviewDashboard
      accounts={accounts}
      onAddAccount={addAccount}
      onViewAccount={(a) => setSelectedId(a.id)}
      onUpdateRate={updateAccountRate}
    />
  );
}
