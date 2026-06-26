"use client";

/**
 * AccountWidget — data export and account deletion controls.
 *
 * Both endpoints already exist on the backend (`GET /users/me/export` and
 * `DELETE /users/me`); this widget wires them to the UI and handles the
 * confirm-delete flow required by the backend (typing "DELETE" plus the
 * current password when the account was created with one).
 *
 * Deletion is soft-delete on the backend — `is_active` flips to false and
 * tokens stop working — so we also wipe local auth state before redirecting
 * to the landing page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { useAuthStore } from "@/lib/store";
import { deleteAccount, exportUserData } from "@/lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "info"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

const REQUIRED_CONFIRMATION = "DELETE";

export default function AccountWidget() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const hasPassword =
    Boolean(authUser) &&
    // OAuth-only users have no password to confirm with. We allow them to
    // delete by typing "DELETE" alone (backend treats empty password as
    // "skip verification" when hashed_password is null).
    true;

  const handleExport = async () => {
    setStatus({ kind: "info", message: "Preparing your data export..." });
    setIsExporting(true);
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `shathi-data-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a tick to start the download before we revoke.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ kind: "success", message: "Download started." });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to export your data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation !== REQUIRED_CONFIRMATION) {
      setStatus({
        kind: "error",
        message: `Type ${REQUIRED_CONFIRMATION} exactly to confirm.`,
      });
      return;
    }

    setIsDeleting(true);
    setStatus({ kind: "info", message: "Deactivating your account..." });
    try {
      await deleteAccount(confirmation, password.trim() || undefined);
      // Soft-delete means the next refresh will fail — clear local state now.
      logout();
      router.push("/?deleted=1");
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete your account. Please try again.",
      });
      setIsDeleting(false);
    }
  };

  return (
    <GlassCard delay={0.45} className="h-full">
      <div className="space-y-5">
        <header>
          <h3 className="font-medium text-lg">Account</h3>
          <p className="text-sm text-slate-500">
            Download a copy of your data or permanently delete your Shathi
            account.
          </p>
        </header>

        {status.kind !== "idle" && (
          <p
            role={status.kind === "error" ? "alert" : "status"}
            className={
              "rounded-2xl px-3 py-2 text-sm " +
              (status.kind === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : status.kind === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-[#A8D0D9]/60 bg-[#F1F5F7] text-[#4A90A4]")
            }
          >
            {status.message}
          </p>
        )}

        <section className="rounded-2xl bg-white/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Download my data</p>
              <p className="text-sm text-slate-500">
                Get a JSON file with your profile, mood logs, journal entries,
                habits, and chat history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#4A90A4] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3F7E90] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Preparing..." : "Export"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-red-700">Delete account</p>
              <p className="text-sm text-red-700/80">
                This signs you out and deactivates your account. Your data is
                removed from active systems within 30 days.
              </p>
            </div>
            {!showDeleteForm && (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteForm(true);
                  setStatus({ kind: "idle" });
                }}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            )}
          </div>

          {showDeleteForm && (
            <form onSubmit={handleDelete} className="mt-4 space-y-3">
              <p className="text-sm text-red-700">
                To confirm, type <strong>{REQUIRED_CONFIRMATION}</strong> below.
                {hasPassword && " If your account has a password, enter it too."}
              </p>

              <input
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={REQUIRED_CONFIRMATION}
                aria-label="Type DELETE to confirm account deletion"
                autoComplete="off"
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300"
              />

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Current password (optional for social logins)"
                aria-label="Current password (optional for social logins)"
                autoComplete="current-password"
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={
                    isDeleting || confirmation !== REQUIRED_CONFIRMATION
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {isDeleting ? "Deleting..." : "Permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setConfirmation("");
                    setPassword("");
                    setStatus({ kind: "idle" });
                  }}
                  disabled={isDeleting}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </GlassCard>
  );
}