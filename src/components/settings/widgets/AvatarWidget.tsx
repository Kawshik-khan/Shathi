"use client";

/**
 * AvatarWidget — upload, preview, and remove the user's avatar image.
 *
 * Pairs with `POST /api/v1/users/me/avatar` and `DELETE
 * /api/v1/users/me/avatar` on the backend. The uploaded file is sent as
 * multipart/form-data; the backend stores it on disk under
 * `AVATAR_STORAGE_DIR` and returns the new `avatar_url` on the user
 * payload.
 */

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { useAuthStore } from "@/lib/store";
import { deleteAvatar, uploadAvatar } from "@/lib/api";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMime = (typeof ACCEPTED)[number];

type Status =
  | { kind: "idle" }
  | { kind: "info"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export default function AvatarWidget() {
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const currentAvatarUrl = authUser?.avatar_url ?? null;

  // Revoke any object URL we created when the preview goes away.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPendingFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setStatus({
        kind: "error",
        message: "Image must be 2 MB or smaller.",
      });
      event.target.value = "";
      return;
    }

    const mime = file.type as AcceptedMime;
    if (!ACCEPTED.includes(mime)) {
      setStatus({
        kind: "error",
        message: "Use a JPEG, PNG, or WEBP image.",
      });
      event.target.value = "";
      return;
    }

    // Front-end MIME check is a hint; the backend re-validates against
    // magic bytes before writing anything to disk.
    const url = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setPendingFile(file);
    setStatus({ kind: "idle" });
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setIsWorking(true);
    setStatus({ kind: "info", message: "Uploading avatar..." });
    try {
      const updated = await uploadAvatar(pendingFile);
      const newUrl =
        typeof updated.avatar_url === "string" ? updated.avatar_url : null;
      if (authUser && newUrl) {
        setAuthUser({ ...authUser, avatar_url: newUrl });
      }
      setStatus({ kind: "success", message: "Avatar updated." });
      setPendingFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to upload the image.",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleRemove = async () => {
    setIsWorking(true);
    setStatus({ kind: "info", message: "Removing avatar..." });
    try {
      await deleteAvatar();
      if (authUser) {
        const { avatar_url: _unused, ...rest } = authUser;
        void _unused;
        setAuthUser({ ...rest });
      }
      setStatus({ kind: "success", message: "Avatar removed." });
      setPendingFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to remove the avatar.",
      });
    } finally {
      setIsWorking(false);
    }
  };

  const previewSource = previewUrl ?? currentAvatarUrl;
  const initials = (authUser?.name || authUser?.email || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <GlassCard delay={0.5} className="h-full">
      <div className="space-y-5">
        <header>
          <h3 className="font-medium text-lg">Profile photo</h3>
          <p className="text-sm text-slate-500">
            Upload a JPEG, PNG, or WEBP image up to 2&nbsp;MB. Used on your
            profile and in shared family views.
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

        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#A8D0D9]/60 bg-[#F1F5F7] text-2xl font-medium text-[#4A90A4]"
          >
            {previewSource ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSource}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#4A90A4] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3F7E90]">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Choose image
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload avatar image"
              />
            </label>

            {pendingFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={isWorking}
                className="inline-flex self-start items-center gap-2 rounded-full border border-[#A8D0D9] bg-white px-3 py-2 text-sm font-medium text-[#4A90A4] transition-colors hover:bg-[#F1F5F7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isWorking ? "Saving..." : "Save new photo"}
              </button>
            )}

            {currentAvatarUrl && !pendingFile && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isWorking}
                className="inline-flex self-start items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove photo
              </button>
            )}

            <p className="text-xs text-slate-500">
              {pendingFile
                ? `Selected: ${pendingFile.name} (${Math.round(pendingFile.size / 1024)} KB)`
                : "Tip: square images crop best."}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}