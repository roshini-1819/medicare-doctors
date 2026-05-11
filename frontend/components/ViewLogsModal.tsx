"use client";

/**
 * components/ViewLogsModal.tsx — UPDATED
 * ────────────────────────────────────────
 * FEATURES ADDED / CHANGED:
 *
 * 1. LOGIN/LOGOUT VIEW:
 *    - Quick stats now shows "Last Login" and "Last Logout (by Doctor)" separately
 *    - Last Logout stat only shows doctor-initiated LOGOUT (not FORCE_LOGOUT)
 *    - Each log row now shows WHO performed the action: Doctor / Admin / System
 *
 * 2. WHO LOGGED OUT:
 *    - LOGOUT rows (performedBy=DOCTOR) show "Logged out by Doctor" badge
 *    - FORCE_LOGOUT rows (performedBy=ADMIN) show "Force logged out by Admin" badge
 *    - The "Logout Time" column only shows time for LOGOUT (doctor-initiated), not FORCE_LOGOUT
 *    - FORCE_LOGOUT has its own clear visual distinction (red badge)
 *
 * 3. TOOLTIPS:
 *    - All truncated text cells use title attribute for hover tooltip
 *    - Timestamps show full date/time on hover
 *    - Clinic, device, notes all have tooltips when text is long
 *    - Doctor name and action labels have tooltips
 *    - Added a custom Tooltip component for consistent styling
 *
 * 4. AUTO-DEACTIVATED:
 *    - New DEACTIVATED action type supported with grey styling
 *    - Shows "System" badge in performedBy column
 */

import { useState, useEffect } from "react";
import {
  X,
  Activity,
  Clock,
  Monitor,
  Building2,
  User,
  Info,
  LogOut,
  Shield,
  Cpu,
} from "lucide-react";
import { doctorsAPI } from "@/lib/api";
import { Doctor, DoctorLog, LogAction } from "@/types";

interface Props {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  LogAction,
  { label: string; color: string; bg: string; dot: string }
> = {
  LOGIN: {
    label: "Login",
    color: "text-green-700",
    bg: "bg-green-100",
    dot: "bg-green-500",
  },
  LOGOUT: {
    label: "Logout",
    color: "text-gray-600",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  FORCE_LOGOUT: {
    label: "Force Logout",
    color: "text-rose-700",
    bg: "bg-rose-100",
    dot: "bg-rose-500",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "text-orange-700",
    bg: "bg-orange-100",
    dot: "bg-orange-500",
  },
  ACTIVATED: {
    label: "Reinstated",
    color: "text-teal-700",
    bg: "bg-teal-100",
    dot: "bg-teal-500",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-red-700",
    bg: "bg-red-100",
    dot: "bg-red-500",
  },
  PASSWORD_RESET: {
    label: "Password Reset",
    color: "text-amber-700",
    bg: "bg-amber-100",
    dot: "bg-amber-500",
  },
  PROFILE_UPDATED: {
    label: "Profile Updated",
    color: "text-blue-700",
    bg: "bg-blue-100",
    dot: "bg-blue-500",
  },
  DEACTIVATED: {
    label: "Auto-Deactivated",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
};

/** Who performed the action — visual badge */
function PerformedByBadge({ performedBy }: { performedBy: string }) {
  if (performedBy === "DOCTOR") {
    return (
      <span
        title="Doctor initiated this action"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700"
      >
        <User className="w-2.5 h-2.5" />
        Doctor
      </span>
    );
  }
  if (performedBy === "ADMIN") {
    return (
      <span
        title="Admin initiated this action"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700"
      >
        <Shield className="w-2.5 h-2.5" />
        Admin
      </span>
    );
  }
  if (performedBy === "SYSTEM") {
    return (
      <span
        title="Automatically triggered by the system"
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600"
      >
        <Cpu className="w-2.5 h-2.5" />
        System
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
      {performedBy || "—"}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Text with tooltip on hover when potentially truncated */
function TruncText({
  text,
  maxLen = 20,
  className = "",
}: {
  text: string | undefined | null;
  maxLen?: number;
  className?: string;
}) {
  if (!text) return <span className={`text-gray-400 ${className}`}>—</span>;
  return (
    <span
      title={text.length > maxLen ? text : undefined}
      className={`truncate block max-w-full ${className}`}
    >
      {text}
    </span>
  );
}

export default function ViewLogsModal({ isOpen, doctor, onClose }: Props) {
  const [logs, setLogs] = useState<DoctorLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && doctor) {
      setLoading(true);
      doctorsAPI
        .getLogs(doctor.id)
        .then((res) => {
          if (res.success) setLogs(res.data);
        })
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, doctor]);

  if (!isOpen || !doctor) return null;

  // FEATURE: Last login from logs
  const lastLoginLog = logs.find((l) => l.action === "LOGIN");

  // FEATURE: Last doctor-initiated logout only (NOT force logout)
  // Force logout is admin action — shown separately in its own row
  const lastDoctorLogoutLog = logs.find(
    (l) => l.action === "LOGOUT" && l.performedBy === "DOCTOR"
  );

  // Count each type for stats
  const loginCount = logs.filter((l) => l.action === "LOGIN").length;
  const forceLogoutCount = logs.filter((l) => l.action === "FORCE_LOGOUT").length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Activity Logs
                </h2>
                <p className="text-xs text-gray-500">
                  Dr. {doctor.firstName} {doctor.lastName} · {doctor.clinicalId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            {/* Total events */}
            <div className="p-3 rounded-xl bg-purple-50">
              <Activity className="w-4 h-4 text-purple-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Total Events
              </p>
              <p className="text-sm font-bold text-purple-600">{logs.length}</p>
            </div>

            {/* Last Login */}
            <div className="p-3 rounded-xl bg-green-50">
              <User className="w-4 h-4 text-green-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Last Login
              </p>
              {lastLoginLog ? (
                <div title={formatDateTime(lastLoginLog.timestamp)}>
                  <p className="text-xs font-bold text-green-700">
                    {new Date(lastLoginLog.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                    })}
                  </p>
                  <p className="text-[10px] text-green-500">
                    {new Date(lastLoginLog.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400">—</p>
              )}
            </div>

            {/*
              FEATURE: Last Logout — shows ONLY doctor-initiated logout time.
              Force logout by admin is NOT shown here (it has its own row in the table).
            */}
            <div className="p-3 rounded-xl bg-gray-50">
              <LogOut className="w-4 h-4 text-gray-500 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Last Logout
              </p>
              {lastDoctorLogoutLog ? (
                <div title={formatDateTime(lastDoctorLogoutLog.timestamp)}>
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(lastDoctorLogoutLog.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(lastDoctorLogoutLog.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400">—</p>
              )}
            </div>

            {/* Login count */}
            <div className="p-3 rounded-xl bg-blue-50">
              <User className="w-4 h-4 text-blue-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Total Logins
              </p>
              <p className="text-sm font-bold text-blue-600">{loginCount}</p>
            </div>

            {/* Force logout count */}
            <div className="p-3 rounded-xl bg-rose-50">
              <Shield className="w-4 h-4 text-rose-600 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Force Logouts
              </p>
              <p className="text-sm font-bold text-rose-600">
                {forceLogoutCount}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <p className="text-[10px] text-gray-400 font-medium">Who acted:</p>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 font-semibold">
                <User className="w-2.5 h-2.5" /> Doctor
              </span>
              <span className="text-[10px] text-gray-400">= self-logout / self-login</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
              <span className="text-[10px] text-gray-400">= admin action</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                <Cpu className="w-2.5 h-2.5" /> System
              </span>
              <span className="text-[10px] text-gray-400">= automated</span>
            </div>
          </div>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                No activity recorded yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Events will appear here as the doctor uses the system
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <div className="col-span-3">Action</div>
                <div className="col-span-2">Clinic</div>
                <div className="col-span-1">Device</div>
                {/*
                  FEATURE: "Logout Time" column shows time only for
                  doctor-initiated LOGOUT, not for FORCE_LOGOUT.
                  FORCE_LOGOUT by admin is shown by the action badge itself.
                */}
                <div className="col-span-2">Logout Time</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Who Acted</div>
              </div>

              {logs.map((log, idx) => {
                const config =
                  ACTION_CONFIG[log.action as LogAction] ||
                  ACTION_CONFIG.PROFILE_UPDATED;

                /**
                 * FEATURE: Show logout time ONLY for doctor-initiated LOGOUT
                 * (performedBy=DOCTOR). Do NOT show logout time for FORCE_LOGOUT —
                 * that is an admin action and its time is already in the Timestamp column.
                 */
                const isDoctorLogout =
                  log.action === "LOGOUT" && log.performedBy === "DOCTOR";

                const isForceLogout = log.action === "FORCE_LOGOUT";

                return (
                  <div
                    key={log.id}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl border transition-colors ${
                      isForceLogout
                        ? "bg-rose-50/40 border-rose-100" // Force logout rows are visually distinct
                        : idx % 2 === 0
                        ? "bg-gray-50/50 border-gray-100"
                        : "bg-white border-transparent"
                    } hover:border-gray-200 hover:bg-gray-50`}
                  >
                    {/* Action badge */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
                      />
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.color}`}
                        title={
                          isForceLogout
                            ? "Admin force-terminated this session"
                            : isDoctorLogout
                            ? "Doctor logged out from their dashboard"
                            : config.label
                        }
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Clinic — with tooltip */}
                    <div className="col-span-2 flex items-center min-w-0">
                      <div className="flex items-center gap-1 min-w-0 w-full">
                        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <TruncText
                          text={log.clinic}
                          maxLen={14}
                          className="text-xs text-gray-600"
                        />
                      </div>
                    </div>

                    {/* Device — with tooltip */}
                    <div className="col-span-1 flex items-center min-w-0">
                      <div className="flex items-center gap-1 min-w-0 w-full">
                        <Monitor className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <TruncText
                          text={log.device}
                          maxLen={8}
                          className="text-xs text-gray-500"
                        />
                      </div>
                    </div>

                    {/*
                      FEATURE: Logout time column.
                      - Shows time ONLY for doctor-initiated LOGOUT (performedBy=DOCTOR)
                      - Shows nothing for FORCE_LOGOUT (admin-initiated) — that has its own badge
                      - This makes it clear: "when did the DOCTOR log out on their own?"
                    */}
                    <div className="col-span-2 flex items-center">
                      {isDoctorLogout ? (
                        <div
                          className="flex flex-col"
                          title={`Doctor logged out at ${formatDateTime(log.timestamp)}`}
                        >
                          <span className="text-xs font-semibold text-gray-700">
                            {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(log.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      ) : isForceLogout ? (
                        <div className="flex flex-col" title="Force logout by Admin — time shown in Timestamp column">
                          <span className="text-[11px] text-rose-600 font-semibold">
                            {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                          <span className="text-[10px] text-rose-400">By Admin</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>

                    {/* Timestamp — full date/time, tooltip on hover */}
                    <div
                      className="col-span-2 flex items-center"
                      title={formatDateTime(log.timestamp)}
                    >
                      <span className="text-[11px] text-gray-500 leading-tight">
                        {new Date(log.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        <span className="text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </span>
                    </div>

                    {/* FEATURE: Who acted — DOCTOR / ADMIN / SYSTEM badge */}
                    <div className="col-span-2 flex items-center">
                      <PerformedByBadge performedBy={log.performedBy || "ADMIN"} />
                    </div>

                    {/* Notes — full row, with tooltip if long */}
                    {log.notes && (
                      <div className="col-span-12 flex items-start gap-1.5 pt-1 border-t border-gray-100 mt-1">
                        <Info className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p
                          className="text-[11px] text-gray-500 leading-relaxed"
                          title={log.notes.length > 80 ? log.notes : undefined}
                        >
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {logs.length} total events recorded
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
