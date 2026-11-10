// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { withNetworkRetry, getFriendlyError } from "../utils/friendlyErrors";
import type {
  CampusPost,
  CampusSnap,
  StudentBusiness,
  AppUser,
  SnapViewerRecord,
  HubPage,
  PageMember,
  PagePost,
  PageReport,
  PageMessage,
  AdminActionLog,
  UserRole,
  PagePostStatus,
  PageMemberStatus,
  PageStatus
} from "../types";

function isLikelyApiKey(val) {
  if (!val) return false;
  const trimmed = val.trim().replace(/^['"]+|['"]+$/g, "");
  return trimmed.startsWith("sb_publishable_") || trimmed.startsWith("sb_secret_") || trimmed.startsWith("eyJ") || trimmed.includes("_") && !trimmed.includes("/") && !trimmed.includes(".");
}
function isLikelySupabaseUrl(val) {
  if (!val) return false;
  const trimmed = val.trim().replace(/^['"]+|['"]+$/g, "").toLowerCase();
  if (isLikelyApiKey(trimmed)) return false;
  const withoutProto = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProto.split("/")[0].split("?")[0].split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") return true;
  return host.includes(".") && !host.includes("_") && !host.includes(" ") && host.length >= 5;
}
function cleanUrl(rawUrl) {
  let cleaned = rawUrl.trim().replace(/^['"]+|['"]+$/g, "").trim();
  if (cleaned.startsWith("http://")) {
    cleaned = cleaned.replace(/^http:\/\//i, "https://");
  } else if (!cleaned.startsWith("https://")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, "");
}
function cleanKey(rawKey) {
  return rawKey.trim().replace(/^['"]+|['"]+$/g, "").trim();
}
const rawEnvUrl = ((typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://fckanetsytgocigistdc.supabase.co") as string;
const rawEnvKey = ((typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZja2FuZXRzeXRnb2NpZ2lzdGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MDkxODQsImV4cCI6MjEwNzk4NTE4NH0.VTDdIwKm7KwE_BEj2vBXzsZ6cKFqQWy67Ai7jBQ5tjg") as string;
let resolvedUrl = "https://placeholder-project.supabase.co";
let resolvedKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key";
let configured = false;
if (isLikelySupabaseUrl(rawEnvKey) && isLikelyApiKey(rawEnvUrl)) {
  if (typeof window !== "undefined") {
    console.info(
      "[Supabase Auto-Config]: Detected that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were inverted. Automatically routing to the correct endpoints."
    );
  }
  resolvedUrl = cleanUrl(rawEnvKey);
  resolvedKey = cleanKey(rawEnvUrl);
  configured = true;
} else if (isLikelySupabaseUrl(rawEnvUrl)) {
  resolvedUrl = cleanUrl(rawEnvUrl);
  if (rawEnvKey.trim().length > 10) {
    resolvedKey = cleanKey(rawEnvKey);
  }
  configured = !resolvedUrl.includes("placeholder-project");
} else {
  if (isLikelyApiKey(rawEnvUrl)) {
    resolvedKey = cleanKey(rawEnvUrl);
    if (typeof window !== "undefined") {
      console.warn(
        `[Supabase Configuration Notice]: The value provided in VITE_SUPABASE_URL appears to be a Supabase Publishable Key ("${rawEnvUrl}"), not a Project URL.
A Supabase project URL format looks like: https://<project-id>.supabase.co
Running safely in local offline mode until a valid Project URL is provided.`
      );
    }
  }
  configured = false;
}
const SUPABASE_URL = resolvedUrl;
const SUPABASE_ANON_KEY = resolvedKey;
export const isSupabaseConfigured = configured;
if (typeof window !== "undefined") {
  console.info("[Supabase Runtime Status]:", {
    endpoint: SUPABASE_URL,
    isLiveConfigured: isSupabaseConfigured,
    keyFormat: SUPABASE_ANON_KEY.startsWith("sb_publishable_") ? "publishable_key" : "jwt_token"
  });
}
const customFetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  const method = (init == null ? void 0 : init.method) || "GET";
  try {
    const res = await fetch(input, init);
    if (!res.ok && res.status !== 404) {
      console.warn(`[Supabase HTTP Response] ${method} ${url} -> Status ${res.status} (${res.statusText})`);
    }
    return res;
  } catch (fetchError) {
    console.warn(`[Supabase Network Notice] ${method} ${url} could not be reached:`, (fetchError == null ? void 0 : fetchError.message) || fetchError);
    throw fetchError;
  }
};
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : void 0
  },
  global: {
    fetch: customFetch
  }
});
export function formatSupabaseErrorMessage(err, defaultMessage = "An unexpected error occurred") {
  var _a;
  if (!err) return defaultMessage;
  const rawMsg = typeof err === "string" ? err : err.message || err.error_description || (((_a = err.error) == null ? void 0 : _a.message) ?? "");
  if (!rawMsg) return defaultMessage;
  const lower = rawMsg.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network request failed") || lower.includes("load failed") || lower.includes("connection refused") || lower.includes("err_blocked_by_client")) {
    return 'Unable to reach the Supabase backend server ("Failed to fetch"). Please verify your project URL and ensure no ad-blocker or firewall is blocking requests.';
  }
  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("apikey") || lower.includes("unauthorized")) {
    return "Supabase authentication failed: Invalid API credentials. Please verify your credentials in .env.";
  }
  return rawMsg;
}
export function isTableMissingError(error2) {
  if (!error2) return false;
  return error2.code === "PGRST205" || error2.code === "42P01" || typeof error2.message === "string" && (error2.message.includes("Could not find the table") || error2.message.includes("relation") && error2.message.includes("does not exist"));
}
export function isRlsOrPermissionError(error2) {
  if (!error2) return false;
  return error2.code === "42501" || typeof error2.message === "string" && (error2.message.includes("row-level security") || error2.message.includes("permission denied") || error2.message.includes("violates row-level security"));
}
export async function ensureSupabaseAuthSession() {
  var _a;
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if ((_a = session == null ? void 0 : session.user) == null ? void 0 : _a.id) {
      return session.user.id;
    }
  } catch (err) {
    console.warn("[Supabase Auth]: Session verification exception:", err);
  }
  return null;
}
export async function uploadMedia(bucket: string, path: string, file: any, customContentType?: string): Promise<string> {
  var _a, _b;
  if (!isSupabaseConfigured) {
    const err = new Error("Supabase Storage is not configured.");
    console.error(`[Supabase Storage Upload Error (${bucket}/${path})]:`, {
      message: err.message,
      code: "STORAGE_NOT_CONFIGURED",
      details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid"
    });
    emitAppToast("Storage is not configured. Please check your Supabase credentials.", "error");
    throw err;
  }
  let targetPath = path.trim().replace(/^\/+/, "");
  if (!targetPath.includes("/")) {
    let uid = "usr_me";
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) {
        uid = sessionData.session.user.id;
      }
    } catch {
    }
    targetPath = `${uid}/${targetPath}`;
  }
  const rawMime = file.type || "";
  const cleanContentType = rawMime ? rawMime.split(";")[0].trim() : void 0;
  try {
    return await withNetworkRetry(async () => {
      const { data, error: error2 } = await supabase.storage.from(bucket).upload(targetPath, file, {
        upsert: true,
        contentType: cleanContentType
      });
      if (error2) {
        console.error(`[Supabase Storage Upload Error (${bucket}/${targetPath})]:`, error2);
        throw error2;
      }
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicData.publicUrl;
    }, 2);
  } catch (err) {
    const friendly = getFriendlyError(err, "upload");
    emitAppToast(friendly, "error");
    throw new Error(friendly);
  }
}
function getAudioExtension(mimeOrName) {
  if (!mimeOrName) return "webm";
  const lower = mimeOrName.toLowerCase();
  if (lower.includes("mp4") || lower.includes("m4a")) return "mp4";
  if (lower.includes("ogg") || lower.includes("opus")) return "ogg";
  if (lower.includes("wav")) return "wav";
  if (lower.includes("aac")) return "aac";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  return "webm";
}
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isValidUuid(val) {
  return Boolean(val && UUID_REGEX.test(val));
}
const MOCK_CONV_IDS = /* @__PURE__ */ new Set([
  "8c0d7b2f-9f5e-4c9b-ab2c-2d3e4f5a6b02",
  "9d1e8c3a-0a6f-4da0-bc3d-3e4f5a6b7c03",
  "conv_campus_bites_1",
  "conv_dami_lagos",
  "conv_tunde_tech",
  "4f1a2b3c-4d5e-4a1b-8c2d-3e4f5a6b7c01",
  "5a2b3c4d-5e6f-4b2c-9d3e-4f5a6b7c8d02"
]);
export function isMockConversation(convId) {
  if (!convId) return true;
  if (MOCK_CONV_IDS.has(convId)) return true;
  if (convId.startsWith("conv_") || convId.startsWith("mock_") || convId.startsWith("demo_") || convId.startsWith("biz_") || !isValidUuid(convId)) {
    return true;
  }
  return false;
}
export function toSafeUuid(str) {
  if (!str) return "00000000-0000-4000-8000-000000000000";
  if (UUID_REGEX.test(str)) return str;
  let h1 = 3735928559, h2 = 1103515245, h3 = 2654435769, h4 = 2246822507;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  const hex2 = [h1, h2, h3, h4].map((h) => (h >>> 0).toString(16).padStart(8, "0")).join("");
  return hex2.substring(0, 8) + "-" + hex2.substring(8, 12) + "-4" + hex2.substring(13, 16) + "-a" + hex2.substring(17, 20) + "-" + hex2.substring(20, 32);
}
export function generateVoiceUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const voiceNoteBlobCache = /* @__PURE__ */ new Map();
export function getPlayableAudioUrl(urlOrPath) {
  if (!urlOrPath) return "";
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://") || urlOrPath.startsWith("blob:") || urlOrPath.startsWith("data:")) {
    return urlOrPath;
  }
  if (voiceNoteBlobCache.has(urlOrPath)) {
    return voiceNoteBlobCache.get(urlOrPath);
  }
  try {
    const { data } = supabase.storage.from("audio").getPublicUrl(urlOrPath);
    return (data == null ? void 0 : data.publicUrl) || urlOrPath;
  } catch (err) {
    console.warn("[Supabase getPlayableAudioUrl Error]:", err);
    return urlOrPath;
  }
}
export function emitAppToast(message, type = "error") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("campus-toast", {
        detail: { message, type }
      })
    );
  }
}
export async function uploadVoiceNoteAudio(fileOrBlob, userId) {
  var _a, _b;
  const ext = getAudioExtension(fileOrBlob.type || fileOrBlob.name);
  const uuid = generateVoiceUuid();
  let activeUid = userId;
  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) {
        activeUid = sessionData.session.user.id;
      }
    } catch {
    }
  }
  if (!activeUid || activeUid === "usr_me") {
    activeUid = toSafeUuid(userId || "usr_me");
  }
  const filePath = `${activeUid}/${uuid}.${ext}`;
  if (!isSupabaseConfigured) {
    const err = new Error("Supabase Storage is not configured for voice notes.");
    console.error("[Voice Note Upload Error]:", {
      message: err.message,
      code: "STORAGE_NOT_CONFIGURED",
      details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid"
    });
    emitAppToast("Voice note storage is not configured.", "error");
    throw err;
  }
  const rawMime = fileOrBlob.type || `audio/${ext}`;
  const cleanContentType = rawMime ? rawMime.split(";")[0].trim() : `audio/${ext}`;
  try {
    return await withNetworkRetry(async () => {
      const { data, error: error2 } = await supabase.storage.from("audio").upload(filePath, fileOrBlob, {
        upsert: true,
        contentType: cleanContentType
      });
      if (error2) {
        console.error("[Voice Note Upload Error]:", error2);
        throw error2;
      }
      const { data: publicData } = supabase.storage.from("audio").getPublicUrl(data.path);
      if (!(publicData == null ? void 0 : publicData.publicUrl)) {
        throw new Error("Failed to obtain audio URL");
      }
      return publicData.publicUrl;
    }, 2);
  } catch (err) {
    const friendly = getFriendlyError(err, "voice");
    emitAppToast(friendly, "error");
    throw new Error(friendly);
  }
}
export async function uploadSnapMedia(fileOrBlob: any, userId: string): Promise<{ url: string; mediaType: "image" | "video" }> {
  var _a, _b, _c, _d;
  const isVideo = fileOrBlob.type.startsWith("video");
  let activeUid = userId;
  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) {
        activeUid = sessionData.session.user.id;
      }
    } catch {
    }
  }
  if (!activeUid || activeUid === "usr_me") {
    activeUid = toSafeUuid(userId || "usr_me");
  }
  const uuid = generateVoiceUuid();
  if (!isSupabaseConfigured) {
    const err = new Error("Supabase Storage is not configured for snaps.");
    console.error("[Snap Upload Error]:", {
      message: err.message,
      code: "STORAGE_NOT_CONFIGURED",
      details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid"
    });
    emitAppToast("Media storage is not configured.", "error");
    throw err;
  }
  if (isVideo) {
    const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
    if (fileOrBlob.size > MAX_VIDEO_BYTES) {
      const err = new Error("Video file size exceeds 25 MB limit");
      console.error("[Snap Upload Error]: Video file size exceeds 25 MB limit", {
        message: err.message,
        code: "FILE_TOO_LARGE",
        details: `File size: ${fileOrBlob.size} bytes`
      });
      emitAppToast("Video is too large. Snaps must be under 25 MB.", "error");
      throw err;
    }
    if (typeof document !== "undefined") {
      try {
        const duration = await new Promise((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          const tempUrl = URL.createObjectURL(fileOrBlob);
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(tempUrl);
            resolve(video.duration || 0);
          };
          video.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            resolve(0);
          };
          video.src = tempUrl;
        });
        if (duration > 30.5) {
          const err = new Error("Video duration exceeds 30 seconds");
          console.error("[Snap Upload Error]: Video duration exceeds 30 seconds", {
            message: err.message,
            code: "VIDEO_TOO_LONG",
            duration
          });
          emitAppToast("Video is too long. Snaps must be 30 seconds or shorter.", "error");
          throw err;
        }
      } catch (videoMetaErr) {
        console.warn("[Snap Upload]: Could not verify video duration, proceeding with upload:", videoMetaErr);
      }
    }
    const rawExt = (_d = (_c = fileOrBlob.name) == null ? void 0 : _c.split(".").pop()) == null ? void 0 : _d.toLowerCase();
    const ext = rawExt || (fileOrBlob.type.includes("webm") ? "webm" : "mp4");
    const filePath = `${activeUid}/snaps/${uuid}.${ext}`;
    const contentType = fileOrBlob.type ? fileOrBlob.type.split(";")[0].trim() : "video/mp4";
    try {
      const { error: error2 } = await supabase.storage.from("media").upload(filePath, fileOrBlob, {
        contentType,
        upsert: true
      });
      if (error2) {
        console.error("[Snap Video Upload Error]:", {
          message: error2.message,
          code: (error2 == null ? void 0 : error2.code) || (error2 == null ? void 0 : error2.statusCode),
          details: (error2 == null ? void 0 : error2.details) || error2.message,
          error: error2
        });
        emitAppToast(`Failed to upload snap: ${error2.message || "Storage error"}`, "error");
        throw error2;
      }
      const { data: publicData } = supabase.storage.from("media").getPublicUrl(filePath);
      return { url: publicData.publicUrl, mediaType: "video" };
    } catch (err) {
      console.error("[Snap Video Upload Exception]:", {
        message: (err == null ? void 0 : err.message) || err,
        code: (err == null ? void 0 : err.code) || (err == null ? void 0 : err.statusCode),
        details: (err == null ? void 0 : err.details) || (err == null ? void 0 : err.message),
        err
      });
      emitAppToast((err == null ? void 0 : err.message) ? `Failed to upload video snap: ${err.message}` : "Failed to upload video snap. Please try again.", "error");
      throw err;
    }
  } else {
    let uploadBlob = fileOrBlob;
    if (typeof document !== "undefined") {
      try {
        uploadBlob = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.onload = (e) => {
            var _a2;
            const img = new Image();
            img.onerror = () => reject(new Error("Failed to load image for compression"));
            img.onload = () => {
              let width = img.width;
              let height = img.height;
              const maxWidth = 1280;
              if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = Math.round(height * ratio);
              }
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                return resolve(fileOrBlob);
              }
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else resolve(fileOrBlob);
                },
                "image/jpeg",
                0.85
              );
            };
            img.src = (_a2 = e.target) == null ? void 0 : _a2.result;
          };
          reader.readAsDataURL(fileOrBlob);
        });
      } catch (compressErr) {
        console.warn("[Snap Upload]: Image compression failed, using original file:", compressErr);
      }
    }
    const filePath = `${activeUid}/snaps/${uuid}.jpg`;
    const contentType = "image/jpeg";
    try {
      const { error: error2 } = await supabase.storage.from("media").upload(filePath, uploadBlob, {
        contentType,
        upsert: true
      });
      if (error2) {
        console.error("[Snap Image Upload Error]:", {
          message: error2.message,
          code: (error2 == null ? void 0 : error2.code) || (error2 == null ? void 0 : error2.statusCode),
          details: (error2 == null ? void 0 : error2.details) || error2.message,
          error: error2
        });
        emitAppToast(`Failed to upload snap: ${error2.message || "Storage error"}`, "error");
        throw error2;
      }
      const { data: publicData } = supabase.storage.from("media").getPublicUrl(filePath);
      return { url: publicData.publicUrl, mediaType: "image" };
    } catch (err) {
      console.error("[Snap Image Upload Exception]:", {
        message: (err == null ? void 0 : err.message) || err,
        code: (err == null ? void 0 : err.code) || (err == null ? void 0 : err.statusCode),
        details: (err == null ? void 0 : err.details) || (err == null ? void 0 : err.message),
        err
      });
      emitAppToast((err == null ? void 0 : err.message) ? `Failed to upload image snap: ${err.message}` : "Failed to upload image snap. Please try again.", "error");
      throw err;
    }
  }
}
export async function fetchCampusPostsFromSupabase() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error: error2 } = await supabase.from("campus_posts").select("*, campus_comments(*)").order("created_at", { ascending: false });
    if (error2) {
      console.error("[Supabase fetchCampusPosts Error]:", {
        message: error2.message,
        details: error2.details,
        hint: error2.hint,
        code: error2.code
      });
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      authorName: row.author_name,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar,
      authorDept: row.author_dept,
      authorLevel: row.author_level,
      authorRole: row.author_role,
      authorBusinessId: row.author_business_id,
      content: row.content,
      category: row.category,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      locationTag: row.location_tag,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      resharesCount: row.reshares_count || 0,
      reactions: row.reactions,
      pinned: row.pinned,
      createdAt: row.created_at,
      comments: (row.campus_comments || []).map((c) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: c.author_name,
        authorAvatar: c.author_avatar,
        authorDept: c.author_dept,
        authorLevel: c.author_level,
        text: c.text,
        createdAt: c.created_at
      }))
    }));
  } catch (err) {
    console.error("[Supabase fetchCampusPosts Exception]:", (err == null ? void 0 : err.message) || err);
    return [];
  }
}
export async function createCampusPostInSupabase(post2) {
  if (!isSupabaseConfigured) {
    const err = new Error("Supabase is not configured.");
    console.error("[Supabase createCampusPost Error]:", {
      message: err.message,
      code: "NOT_CONFIGURED",
      details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing"
    });
    emitAppToast("Database is not configured. Post cannot be saved.", "error");
    throw err;
  }
  const payload = {
    author_id: post2.authorId,
    author_name: post2.authorName,
    author_username: post2.authorUsername,
    author_avatar: post2.authorAvatar,
    author_dept: post2.authorDept,
    author_level: post2.authorLevel,
    author_role: post2.authorRole,
    author_business_id: post2.authorBusinessId,
    content: post2.content || "",
    category: post2.category,
    media_url: post2.mediaUrl || null,
    media_type: post2.mediaType || (post2.mediaUrl ? "image" : null),
    location_tag: post2.locationTag,
    pinned: Boolean(post2.pinned),
    created_at: post2.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (isValidUuid(post2.id)) {
    payload.id = post2.id;
  }
  try {
    const { data, error: error2 } = await supabase.from("campus_posts").insert(payload).select("*, campus_comments(*)").single();
    if (error2) {
      console.error("[Supabase createCampusPost Error]:", {
        message: error2.message,
        code: error2.code,
        details: error2.details,
        hint: error2.hint,
        payload
      });
      emitAppToast(`Failed to publish post: ${error2.message || "Database error"}`, "error");
      throw error2;
    }
    const row = data;
    return {
      id: row.id,
      authorId: row.author_id,
      authorName: row.author_name,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar,
      authorDept: row.author_dept,
      authorLevel: row.author_level,
      authorRole: row.author_role,
      authorBusinessId: row.author_business_id,
      content: row.content,
      category: row.category,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      locationTag: row.location_tag,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      reactions: row.reactions,
      pinned: row.pinned,
      createdAt: row.created_at,
      comments: []
    };
  } catch (err) {
    console.error("[Supabase createCampusPost Exception]:", {
      message: (err == null ? void 0 : err.message) || err,
      code: err == null ? void 0 : err.code,
      details: (err == null ? void 0 : err.details) || (err == null ? void 0 : err.message),
      err
    });
    emitAppToast((err == null ? void 0 : err.message) ? `Failed to publish post: ${err.message}` : "Failed to publish post. Please try again.", "error");
    throw err;
  }
}
export async function deleteCampusPostInSupabase(postId) {
  if (!isSupabaseConfigured) return;
  try {
    const { error: error2 } = await supabase.from("campus_posts").delete().eq("id", postId);
    if (error2) {
      console.error("[Supabase deleteCampusPost Error]:", error2);
    }
  } catch (err) {
    console.error("[Supabase deleteCampusPost Exception]:", (err == null ? void 0 : err.message) || err);
  }
}
export async function deletePostsByUserInSupabase(usernameOrQuery) {
  const query = usernameOrQuery.trim().toLowerCase().replace("@", "");
  if (!query) return 0;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("campus_foundry_posts_v4");
      if (saved) {
        const posts = JSON.parse(saved);
        const filtered = posts.filter((p) => {
          const authorUser = (p.authorUsername || "").toLowerCase().replace("@", "");
          const authorName = (p.authorName || "").toLowerCase();
          const authorId = (p.authorId || "").toLowerCase();
          return !authorUser.includes(query) && !authorName.includes(query) && !authorId.includes(query);
        });
        localStorage.setItem("campus_foundry_posts_v4", JSON.stringify(filtered));
      }
    } catch {
    }
  }
  if (!isSupabaseConfigured) return 0;
  try {
    const isUuid = isValidUuid(query);
    const filterConditions = isUuid ? `author_username.ilike.%${query}%,author_name.ilike.%${query}%,author_id.eq.${query}` : `author_username.ilike.%${query}%,author_name.ilike.%${query}%`;
    const { data, error: error2 } = await supabase.from("campus_posts").delete().or(filterConditions).select("id");
    if (error2) {
      console.error("[Supabase deletePostsByUser Error]:", error2);
      return 0;
    }
    return (data == null ? void 0 : data.length) || 0;
  } catch (err) {
    console.error("[Supabase deletePostsByUser Exception]:", err);
    return 0;
  }
}
export async function toggleCampusPostLikeInSupabase(postId, reaction = "heart") {
  var _a;
  if (!isSupabaseConfigured) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = (_a = session == null ? void 0 : session.user) == null ? void 0 : _a.id;
    if (!userId) return;
    const { data: existing } = await supabase.from("post_reactions").select("id").eq("post_id", postId).eq("user_id", userId).eq("reaction", reaction).maybeSingle();
    if (existing) {
      await supabase.from("post_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: userId,
        reaction
      });
    }
  } catch (err) {
    console.error("[Supabase togglePostReaction Exception]:", (err == null ? void 0 : err.message) || err);
  }
}
export async function confirmDeliveryRPC(orderId, pin) {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error: error2 } = await supabase.rpc("confirm_delivery", {
      p_order: orderId,
      p_pin: pin
    });
    if (error2) {
      console.error("[Supabase confirmDeliveryRPC Error]:", error2);
      throw error2;
    }
    return !!data;
  } catch (err) {
    console.error("[Supabase confirmDeliveryRPC Exception]:", err);
    throw err;
  }
}
export async function addCampusCommentInSupabase(comment) {
  if (!isSupabaseConfigured) return;
  try {
    const { error: error2 } = await supabase.from("campus_comments").insert({
      post_id: comment.postId,
      author_id: comment.authorId,
      author_name: comment.authorName,
      author_avatar: comment.authorAvatar,
      author_dept: comment.authorDept,
      author_level: comment.authorLevel,
      text: comment.text,
      created_at: comment.createdAt
    });
    if (error2) {
      console.error("[Supabase addCampusComment Error]:", {
        message: error2.message,
        details: error2.details,
        hint: error2.hint,
        code: error2.code
      });
    }
  } catch (err) {
    console.error("[Supabase addCampusComment Exception]:", (err == null ? void 0 : err.message) || err);
  }
}
export const ALLOWED_PROFILES_READ_COLUMNS = "id, full_name, username, role, account_type, university, faculty, department, level, hostel_location, bio, avatar_url, is_verified, is_admin, staff_role, unilorin_domain, posts_count, followers_count, following_count, following_user_ids, created_at, updated_at";
export const ALLOWED_STUDENT_BUSINESSES_READ_COLUMNS = "id, owner_id, name, tagline, description, category, university, campus, hostel_location, owner_name, student_faculty, student_dept, student_level, whatsapp, rating, reviews_count, accepts_hostel_delivery, starting_price, services, image_url, badge, verified_student, created_at, updated_at";
export async function fetchStudentBusinessesFromSupabase() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error: error2 } = await supabase.from("student_businesses").select(ALLOWED_STUDENT_BUSINESSES_READ_COLUMNS).order("created_at", { ascending: false });
    if (error2) {
      console.error("[Supabase fetchStudentBusinesses Error]:", {
        message: error2.message,
        details: error2.details,
        hint: error2.hint,
        code: error2.code
      });
      throw error2;
    }
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      category: row.category,
      university: row.university || "",
      campus: row.campus || "Permanent Site",
      hostelLocation: row.hostel_location,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      ownerEmail: row.owner_email,
      studentFaculty: row.student_faculty,
      studentDept: row.student_dept,
      studentLevel: row.student_level,
      whatsapp: row.whatsapp,
      rating: Number(row.rating) || 5,
      reviewsCount: row.reviews_count || 0,
      acceptsHostelDelivery: Boolean(row.accepts_hostel_delivery),
      startingPrice: Number(row.starting_price) || 0,
      services: row.services || [],
      imageUrl: row.image_url,
      badge: row.badge,
      verifiedStudent: Boolean(row.verified_student)
    }));
  } catch (err) {
    console.error("[Supabase fetchStudentBusinesses Exception]:", (err == null ? void 0 : err.message) || err);
    throw err;
  }
}
export async function upsertStudentBusinessInSupabase(biz) {
  if (!isSupabaseConfigured) return;
  try {
    const { error: error2 } = await supabase.from("student_businesses").upsert({
      id: biz.id.startsWith("biz_") ? void 0 : biz.id,
      name: biz.name,
      tagline: biz.tagline,
      description: biz.description,
      category: biz.category,
      university: biz.university,
      campus: biz.campus,
      hostel_location: biz.hostelLocation,
      owner_id: biz.ownerId,
      owner_name: biz.ownerName,
      owner_email: biz.ownerEmail,
      student_faculty: biz.studentFaculty,
      student_dept: biz.studentDept,
      student_level: biz.studentLevel,
      whatsapp: biz.whatsapp,
      rating: biz.rating,
      reviews_count: biz.reviewsCount,
      accepts_hostel_delivery: biz.acceptsHostelDelivery,
      starting_price: biz.startingPrice,
      services: biz.services,
      image_url: biz.imageUrl,
      badge: biz.badge,
      verified_student: biz.verifiedStudent,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error2) {
      console.error("[Supabase upsertStudentBusiness Error]:", {
        message: error2.message,
        details: error2.details,
        hint: error2.hint,
        code: error2.code
      });
    }
  } catch (err) {
    console.error("[Supabase upsertStudentBusiness Exception]:", (err == null ? void 0 : err.message) || err);
  }
}
export async function deleteStudentBusinessInSupabase(bizId) {
  if (!isSupabaseConfigured) return;
  try {
    const { error: error2 } = await supabase.from("student_businesses").delete().eq("id", bizId);
    if (error2) {
      console.error("[Supabase deleteStudentBusiness Error]:", error2);
    }
  } catch (err) {
    console.error("[Supabase deleteStudentBusiness Exception]:", (err == null ? void 0 : err.message) || err);
  }
}
export async function fetchCampusSnapsFromSupabase() {
  var _a;
  if (!isSupabaseConfigured) return [];
  try {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    let { data, error: error2 } = await supabase.from("campus_snaps").select("*").gt("expires_at", nowIso).order("created_at", { ascending: false });
    if (error2 && (error2.code === "42P01" || ((_a = error2.message) == null ? void 0 : _a.includes("does not exist")))) {
      const fallback2 = await supabase.from("campus_snap").select("*").gt("expires_at", nowIso).order("created_at", { ascending: false });
      data = fallback2.data;
      error2 = fallback2.error;
    }
    if (error2) {
      console.error("[Supabase fetchCampusSnaps Error]:", {
        message: error2.message,
        details: error2.details,
        hint: error2.hint,
        code: error2.code
      });
      return [];
    }
    return (data || []).map((row) => {
      const realViewsCount = row.views_count || 0;
      return {
        id: row.id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorUsername: row.author_username,
        authorAvatar: row.author_avatar,
        authorDept: row.author_dept,
        authorLevel: row.author_level,
        locationTag: row.location_tag,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        caption: row.caption || "",
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        expiresInHours: row.expires_in_hours || 24,
        viewsCount: realViewsCount,
        stickers: row.stickers || []
      };
    });
  } catch (err) {
    console.error("[Supabase fetchCampusSnaps Exception]:", (err == null ? void 0 : err.message) || err);
    return [];
  }
}
export async function createCampusSnapInSupabase(snap) {
  var _a;
  if (!isSupabaseConfigured) {
    const err = new Error("Supabase is not configured.");
    console.error("[Supabase createCampusSnap Error]:", {
      message: err.message,
      code: "NOT_CONFIGURED",
      details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing"
    });
    emitAppToast("Database is not configured. Snap cannot be saved.", "error");
    throw err;
  }
  if (snap.mediaUrl && snap.mediaUrl.startsWith("blob:")) {
    const err = new Error("Invalid snap media URL: blob URL detected. Must upload to storage first.");
    console.error("[Supabase createCampusSnap Error]: Attempted to insert blob: URL into campus_snaps", {
      message: err.message,
      mediaUrl: snap.mediaUrl
    });
    emitAppToast("Failed to save snap: media upload incomplete.", "error");
    throw err;
  }
  const payload = {
    author_id: snap.authorId,
    author_name: snap.authorName,
    author_username: snap.authorUsername,
    author_avatar: snap.authorAvatar,
    author_dept: snap.authorDept,
    author_level: snap.authorLevel,
    location_tag: snap.locationTag,
    media_url: snap.mediaUrl,
    media_type: snap.mediaType || "image",
    caption: snap.caption || "",
    created_at: snap.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    expires_in_hours: snap.expiresInHours || 24,
    stickers: snap.stickers || []
  };
  if (isValidUuid(snap.id)) {
    payload.id = snap.id;
  }
  try {
    let { data, error: error2 } = await supabase.from("campus_snaps").insert(payload).select().single();
    if (error2 && (error2.code === "42P01" || ((_a = error2.message) == null ? void 0 : _a.includes("does not exist")))) {
      const fallback2 = await supabase.from("campus_snap").insert(payload).select().single();
      error2 = fallback2.error;
      data = fallback2.data;
    }
    if (error2) {
      console.error("[Supabase createCampusSnap Error]:", {
        message: error2.message,
        code: error2.code,
        details: error2.details,
        hint: error2.hint,
        payload
      });
      emitAppToast(`Failed to post snap: ${error2.message || "Database error"}`, "error");
      throw error2;
    }
    return {
      ...snap,
      id: (data == null ? void 0 : data.id) || snap.id
    };
  } catch (err) {
    console.error("[Supabase createCampusSnap Exception]:", {
      message: (err == null ? void 0 : err.message) || err,
      code: err == null ? void 0 : err.code,
      details: (err == null ? void 0 : err.details) || (err == null ? void 0 : err.message),
      err
    });
    emitAppToast((err == null ? void 0 : err.message) ? `Failed to post snap: ${err.message}` : "Failed to post snap. Please try again.", "error");
    throw err;
  }
}
export async function deleteCampusSnapInSupabase(snapId, mediaUrl) {
  var _a;
  if (!isSupabaseConfigured) return;
  try {
    if (mediaUrl && mediaUrl.includes("/storage/v1/object/public/media/")) {
      const parts = mediaUrl.split("/storage/v1/object/public/media/");
      if (parts[1]) {
        const filePath = decodeURIComponent(parts[1].split("?")[0]);
        await supabase.storage.from("media").remove([filePath]).catch((storageErr) => {
          console.warn("[Supabase Storage Delete Notice]:", storageErr);
        });
      }
    }
    let { error: error2 } = await supabase.from("campus_snaps").delete().eq("id", snapId);
    if (error2 && (error2.code === "42P01" || ((_a = error2.message) == null ? void 0 : _a.includes("does not exist")))) {
      const fallback2 = await supabase.from("campus_snap").delete().eq("id", snapId);
      error2 = fallback2.error;
    }
    if (error2) {
      console.error("[Supabase deleteCampusSnap Error]:", error2);
      throw error2;
    }
  } catch (err) {
    console.error("[Supabase deleteCampusSnap Exception]:", err);
    throw err;
  }
}
function formatSnapViewTime(iso) {
  if (!iso) return "Recently";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 6e4);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
export async function recordSnapView(snapId, viewerId, authorId) {
  if (!snapId || !viewerId) return 0;
  if (viewerId === authorId || viewerId === "usr_me" || viewerId === "guest") return 0;
  const safeSnapId = isValidUuid(snapId) ? snapId : toSafeUuid(snapId);
  const safeViewerId = isValidUuid(viewerId) ? viewerId : toSafeUuid(viewerId);
  if (!isSupabaseConfigured) {
    try {
      const storedKey = `snap_views_${safeSnapId}`;
      const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
      if (!existing.includes(safeViewerId)) {
        existing.push(safeViewerId);
        localStorage.setItem(storedKey, JSON.stringify(existing));
      }
      return existing.length;
    } catch {
      return 1;
    }
  }
  try {
    const { error: insertErr } = await supabase.from("snap_views").insert({ snap_id: safeSnapId, viewer_id: safeViewerId });
    if (insertErr && insertErr.code !== "23505") {
      console.warn("[Supabase recordSnapView Notice]:", insertErr.message);
    }
    const { count: count2 } = await supabase.from("snap_views").select("*", { count: "exact", head: true }).eq("snap_id", safeSnapId);
    const totalViews = count2 || 0;
    return totalViews;
  } catch (err) {
    console.warn("[Supabase recordSnapView Exception]:", (err == null ? void 0 : err.message) || err);
    return 0;
  }
}
export async function fetchSnapViewers(snapId) {
  if (!snapId) return { count: 0, viewers: [] };
  const safeSnapId = isValidUuid(snapId) ? snapId : toSafeUuid(snapId);
  if (!isSupabaseConfigured) {
    try {
      const storedKey = `snap_views_${safeSnapId}`;
      const existing = JSON.parse(localStorage.getItem(storedKey) || "[]");
      return {
        count: existing.length,
        viewers: existing.map((id2, idx) => ({
          id: id2,
          name: `Campus Viewer ${idx + 1}`,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          dept: "UNILORIN Student",
          viewedAt: "Recently"
        }))
      };
    } catch {
      return { count: 0, viewers: [] };
    }
  }
  try {
    const { data, count: count2, error: error2 } = await supabase.from("snap_views").select("viewed_at, viewer_id, profiles(id, full_name, username, avatar_url, department, level)", { count: "exact" }).eq("snap_id", safeSnapId).order("viewed_at", { ascending: false });
    if (error2) {
      console.warn("[Supabase fetchSnapViewers Notice]:", error2.message);
      return { count: 0, viewers: [] };
    }
    const viewers = (data || []).map((row) => {
      const p = row.profiles || {};
      const deptStr = p.department ? `${p.department}${p.level ? ` (${p.level})` : ""}` : "UNILORIN Student";
      return {
        id: p.id || row.viewer_id,
        name: p.full_name || "Campus Student",
        username: p.username ? `@${p.username}` : void 0,
        avatarUrl: p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        dept: deptStr,
        viewedAt: formatSnapViewTime(row.viewed_at)
      };
    });
    return {
      count: count2 ?? viewers.length,
      viewers
    };
  } catch (err) {
    console.warn("[Supabase fetchSnapViewers Exception]:", (err == null ? void 0 : err.message) || err);
    return { count: 0, viewers: [] };
  }
}
export async function fetchConversationsFromSupabase(userId) {
  if (!isSupabaseConfigured || !userId) return [];
  const safeUserId = toSafeUuid(userId);
  const filterQuery = isValidUuid(userId) ? `buyer_id.eq.${userId},trader_id.eq.${userId}` : `buyer_id.eq.${safeUserId},trader_id.eq.${safeUserId}`;
  const { data, error: error2 } = await supabase.from("chat_conversations").select("*").or(filterQuery).order("last_message_timestamp", { ascending: false });
  if (error2) {
    console.error("[Supabase fetchConversations Error]:", {
      message: error2.message,
      code: error2.code,
      details: error2.details,
      hint: error2.hint
    });
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    kind: "direct" as const,
    businessId: row.business_id,
    businessName: row.business_name,
    businessImageUrl: row.business_image_url,
    traderName: row.trader_name,
    traderId: row.trader_id,
    traderHostel: row.trader_hostel,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    lastMessage: row.last_message,
    lastMessageTimestamp: row.last_message_timestamp,
    unreadCount: row.unread_count || 0,
    isMessageRequest: row.is_message_request || false,
    requestStatus: row.request_status || "accepted",
    isOnline: row.is_online ?? true,
    lastSeen: row.last_seen || "Online",
    chatTheme: row.chat_theme
  }));
}
export async function ensureConversationInSupabase(conv: any, authUid?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !(conv == null ? void 0 : conv.id)) return false;
  if (isMockConversation(conv.id)) {
    return true;
  }
  const safeConvId = toSafeUuid(conv.id);
  const safeBusinessId = conv.businessId ? toSafeUuid(conv.businessId) : null;
  const isTrader = authUid === toSafeUuid(conv.traderId);
  try {
    const { data: existing, error: checkError } = await supabase.from("chat_conversations").select("id").eq("id", safeConvId).maybeSingle();
    if (checkError) {
      console.error("[Supabase checkConversation Error]:", {
        message: checkError.message,
        code: checkError.code,
        details: checkError.details,
        hint: checkError.hint,
        conversationId: safeConvId
      });
      return false;
    }
    const payload = {
      id: safeConvId,
      business_id: safeBusinessId,
      business_name: conv.businessName || "",
      business_image_url: conv.businessImageUrl || null,
      trader_name: conv.traderName || "Trader",
      trader_id: isTrader ? authUid : toSafeUuid(conv.traderId || "trader_id"),
      buyer_id: isTrader ? toSafeUuid(conv.buyerId || "buyer_id") : authUid,
      buyer_name: conv.buyerName || "Student Buyer",
      last_message: conv.lastMessage || "",
      last_message_timestamp: conv.lastMessageTimestamp || (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!existing) {
      const { error: insertError } = await supabase.from("chat_conversations").insert(payload);
      if (insertError) {
        console.error("[Supabase insertConversation Error]:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          payload
        });
        return false;
      }
    } else {
      const { error: updateError } = await supabase.from("chat_conversations").update({
        last_message: conv.lastMessage || "",
        last_message_timestamp: conv.lastMessageTimestamp || (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", safeConvId);
      if (updateError) {
        console.error("[Supabase updateConversation Error]:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("[Supabase ensureConversation Exception]:", err);
    return false;
  }
}
export async function upsertConversationInSupabase(conv: any, authUid?: string): Promise<boolean> {
  var _a;
  if (!isSupabaseConfigured) return;
  let uid = authUid;
  if (!uid) {
    const { data: { session } } = await supabase.auth.getSession();
    uid = (_a = session == null ? void 0 : session.user) == null ? void 0 : _a.id;
  }
  if (!uid) {
    console.warn("[Supabase upsertConversation Notice]: auth.uid() not available yet.");
    return;
  }
  await ensureConversationInSupabase(conv, uid);
}
export async function fetchMessagesFromSupabase(conversationId) {
  if (!isSupabaseConfigured || !conversationId) return [];
  if (isMockConversation(conversationId)) {
    return [];
  }
  const safeConvId = toSafeUuid(conversationId);
  const { data, error: error2 } = await supabase.from("chat_messages").select("id, conversation_id, sender_id, recipient_id, text, is_read, order_snippet, created_at, voice_note_url, voice_duration, voice_waveform").eq("conversation_id", safeConvId).order("created_at", { ascending: true });
  if (error2) {
    console.error("[Supabase fetchMessages Error]:", {
      message: error2.message,
      code: error2.code,
      details: error2.details,
      hint: error2.hint,
      conversationId: safeConvId
    });
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId: row.conversation_id,
    businessId: "",
    businessName: "",
    senderId: row.sender_id,
    senderName: row.sender_id,
    senderRole: "student" as UserRole,
    recipientId: row.recipient_id,
    recipientName: "Participant",
    text: row.text || "",
    timestamp: row.created_at,
    isRead: Boolean(row.is_read),
    deliveryState: (row.is_read ? "read" : "delivered") as any,
    orderSnippet: row.order_snippet || void 0,
    voiceNoteUrl: row.voice_note_url || void 0,
    voiceDuration: row.voice_duration != null ? Number(row.voice_duration) : void 0,
    voiceWaveform: row.voice_waveform || void 0
  }));
}
export async function insertChatMessageInSupabase(msg: any, authUid?: string): Promise<boolean> {
  var _a;
  if (!isSupabaseConfigured) {
    console.warn("[Supabase insertChatMessage Notice]: Supabase is not configured.");
    return;
  }
  if (!msg || isMockConversation(msg.conversationId)) {
    return;
  }
  const safeId = toSafeUuid(msg.id);
  const safeConvId = toSafeUuid(msg.conversationId);
  const safeRecipientId = toSafeUuid(msg.recipientId);
  let textContent = msg.text ? msg.text.trim() : "";
  if (!textContent) {
    if (msg.voiceNoteUrl) {
      textContent = "🎤 Voice message";
    } else {
      textContent = "Message";
    }
  }
  const payload = {
    id: safeId,
    conversation_id: safeConvId,
    sender_id: authUid,
    recipient_id: safeRecipientId,
    text: textContent,
    is_read: Boolean(msg.isRead),
    order_snippet: msg.orderSnippet ? typeof msg.orderSnippet === "string" ? msg.orderSnippet : JSON.stringify(msg.orderSnippet) : null,
    created_at: msg.timestamp || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (msg.voiceNoteUrl) {
    payload.voice_note_url = msg.voiceNoteUrl;
    payload.voice_duration = msg.voiceDuration != null ? Number(msg.voiceDuration) : null;
    payload.voice_waveform = msg.voiceWaveform || null;
  }
  const { error: error2 } = await supabase.from("chat_messages").insert(payload);
  if (error2) {
    if (error2.code === "42501" || ((_a = error2.message) == null ? void 0 : _a.includes("permission denied"))) {
      console.warn("[Supabase save notice (RLS permission 42501)]:", {
        message: error2.message,
        code: error2.code,
        details: error2.details,
        hint: error2.hint,
        payload
      });
      return;
    }
    console.error("[Supabase save error]:", {
      message: error2.message,
      code: error2.code,
      details: error2.details,
      hint: error2.hint,
      payload
    });
    emitAppToast(`Save failed: ${error2.message || "Database error"}`, "error");
    throw error2;
  }
}
export async function fetchPagesFromSupabase(type) {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    let query = supabase.from("pages").select("*").eq("status", "approved");
    if (type) query = query.eq("type", type);
    const { data, error: error2 } = await query.order("created_at", { ascending: false });
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPagesFromSupabase permission notice]: Table "pages" permission denied or missing. Execute migration 010_grant_hubs_pages_permissions.sql in Supabase SQL editor.', error2);
        return [];
      }
      console.error("[fetchPagesFromSupabase error]:", error2);
      throw new Error(error2.message || "Failed to fetch pages from Supabase");
    }
    if (!data || data.length === 0) {
      return [];
    }
    const pageIds = data.map((r) => r.id);
    let countsMap = {};
    if (pageIds.length > 0) {
      try {
        const { data: memberRows, error: memberErr } = await supabase.from("page_members").select("page_id, role, status").in("page_id", pageIds).eq("status", "active");
        if (memberErr) {
          console.error("[fetchPagesFromSupabase member count error]:", memberErr);
        } else if (memberRows) {
          memberRows.forEach((m) => {
            if (!countsMap[m.page_id]) {
              countsMap[m.page_id] = { members: 0, followers: 0 };
            }
            if (m.role === "follower") {
              countsMap[m.page_id].followers += 1;
            } else {
              countsMap[m.page_id].members += 1;
            }
          });
        }
      } catch (cntErr) {
        console.error("[fetchPagesFromSupabase member count exception]:", cntErr);
      }
    }
    return data.map((row) => {
      var _a, _b;
      return {
        id: row.id,
        type: row.type,
        name: row.name,
        slug: row.slug,
        description: row.description || "",
        logoUrl: row.logo_url || "",
        coverUrl: row.cover_url || "",
        ownerId: row.owner_id,
        isVerified: !!row.is_verified,
        joinMode: row.join_mode || "open",
        status: row.status || "approved",
        note: row.note || "",
        createdAt: row.created_at,
        membersCount: ((_a = countsMap[row.id]) == null ? void 0 : _a.members) || 0,
        followersCount: ((_b = countsMap[row.id]) == null ? void 0 : _b.followers) || 0
      };
    });
  } catch (err) {
    console.error("[fetchPagesFromSupabase exception]:", err);
    throw err;
  }
}
export async function requestPageInSupabase(payload) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not connected" };
  }
  const newPage = {
    id: payload.id || `page-${Date.now()}`,
    type: payload.type,
    name: payload.name,
    slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: payload.description || "",
    logoUrl: payload.logoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80",
    coverUrl: payload.coverUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80",
    ownerId: payload.ownerId,
    isVerified: false,
    joinMode: payload.joinMode || "open",
    status: "pending" as PageStatus,
    note: payload.note || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const { data, error: error2 } = await supabase.from("pages").insert({
      id: toSafeUuid(newPage.id),
      type: newPage.type,
      name: newPage.name,
      slug: newPage.slug,
      description: newPage.description,
      logo_url: newPage.logoUrl,
      cover_url: newPage.coverUrl,
      owner_id: toSafeUuid(newPage.ownerId),
      is_verified: false,
      join_mode: newPage.joinMode,
      status: "pending",
      note: newPage.note,
      created_at: newPage.createdAt
    }).select().single();
    if (error2) {
      console.error("[requestPageInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    if (data) {
      newPage.id = data.id;
    }
    return { success: true, page: newPage };
  } catch (e) {
    console.error("[requestPageInSupabase exception]:", e);
    return { success: false, error: (e == null ? void 0 : e.message) || "Failed to submit page request" };
  }
}
export async function joinOrFollowPageInSupabase(pageId, userId, targetRole, joinMode) {
  var _a, _b;
  const memberStatus: PageMemberStatus = joinMode === "request" && targetRole === "member" ? "pending" : "active";
  if (!isSupabaseConfigured) {
    return { success: false, status: memberStatus, role: targetRole, error: "Database not connected" };
  }
  try {
    let safeUid = toSafeUuid(userId);
    const { data: sessionData } = await supabase.auth.getSession();
    if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) safeUid = sessionData.session.user.id;
    const { error: error2 } = await supabase.from("page_members").upsert({
      page_id: toSafeUuid(pageId),
      user_id: safeUid,
      role: targetRole,
      status: memberStatus,
      is_muted: false,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error2) {
      console.error("[joinOrFollowPageInSupabase error]:", error2);
      return { success: false, status: memberStatus, role: targetRole, error: error2.message };
    }
    return { success: true, status: memberStatus, role: targetRole };
  } catch (e) {
    console.error("[joinOrFollowPageInSupabase exception]:", e);
    return { success: false, status: memberStatus, role: targetRole, error: (e == null ? void 0 : e.message) || "Membership action failed" };
  }
}
export async function leaveOrUnfollowPageInSupabase(pageId, userId) {
  var _a, _b;
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not configured" };
  }
  try {
    let safeUid = toSafeUuid(userId);
    const { data: sessionData } = await supabase.auth.getSession();
    if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) safeUid = sessionData.session.user.id;
    const { error: error2 } = await supabase.from("page_members").delete().eq("page_id", toSafeUuid(pageId)).eq("user_id", safeUid);
    if (error2) {
      console.error("[leaveOrUnfollowPageInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    return { success: true };
  } catch (e) {
    console.error("[leaveOrUnfollowPageInSupabase exception]:", e);
    return { success: false, error: (e == null ? void 0 : e.message) || "Failed to leave page" };
  }
}
export async function toggleMutePageNotificationsInSupabase(pageId, userId, isMuted) {
  var _a, _b;
  if (isSupabaseConfigured) {
    try {
      let safeUid = toSafeUuid(userId);
      const { data: sessionData } = await supabase.auth.getSession();
      if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) safeUid = sessionData.session.user.id;
      await supabase.from("page_members").update({ is_muted: isMuted }).eq("page_id", toSafeUuid(pageId)).eq("user_id", safeUid);
    } catch (e) {
      console.error("[toggleMutePageNotificationsInSupabase exception]:", e);
    }
  }
  return { success: true };
}
export async function fetchPageMembersFromSupabase(pageId) {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error: error2 } = await supabase.from("page_members").select("*").eq("page_id", toSafeUuid(pageId));
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPageMembersFromSupabase permission notice]: Table "page_members" permission denied or missing.', error2);
        return [];
      }
      console.error("[fetchPageMembersFromSupabase error]:", error2);
      throw new Error(error2.message || "Failed to fetch members");
    }
    if (!data || data.length === 0) {
      return [];
    }
    const userIds = [...new Set(data.map((row) => row.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      try {
        const { data: profs, error: profErr } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds);
        if (profErr) {
          console.error("[fetchPageMembersFromSupabase profiles join error]:", profErr);
        } else if (profs) {
          profs.forEach((p) => {
            profileMap[p.id] = {
              fullName: p.full_name,
              username: p.username,
              avatarUrl: p.avatar_url
            };
          });
        }
      } catch (profErr) {
        console.error("[fetchPageMembersFromSupabase profiles join exception]:", profErr);
      }
    }
    return data.map((row) => {
      var _a;
      const prof = profileMap[row.user_id];
      return {
        id: row.id,
        pageId: row.page_id,
        userId: row.user_id,
        role: row.role,
        status: row.status,
        isMuted: !!row.is_muted,
        createdAt: row.created_at,
        userName: (prof == null ? void 0 : prof.fullName) || (prof == null ? void 0 : prof.username) || `Student ${(_a = row.user_id) == null ? void 0 : _a.slice(0, 8)}`,
        userUsername: prof == null ? void 0 : prof.username,
        userAvatarUrl: (prof == null ? void 0 : prof.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`
      };
    });
  } catch (err) {
    console.error("[fetchPageMembersFromSupabase exception]:", err);
    throw err;
  }
}
export async function fetchPagePostsFromSupabase(pageId?: string, pageNum: number = 1, pageSize: number = 20): Promise<any[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    let query = supabase.from("page_posts").select("*").eq("status", "published");
    if (pageId) query = query.eq("page_id", toSafeUuid(pageId));
    const fromIndex = (pageNum - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    const { data, error: error2 } = await query.order("created_at", { ascending: false }).range(fromIndex, toIndex);
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPagePostsFromSupabase permission notice]: Table "page_posts" permission denied or missing. Execute migration 010_grant_hubs_pages_permissions.sql in Supabase SQL editor.', error2);
        return [];
      }
      console.error("[fetchPagePostsFromSupabase error]:", error2);
      throw new Error(error2.message || "Failed to fetch posts");
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      pageId: row.page_id,
      authorId: row.author_id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      imageUrl: row.image_url,
      eventDate: row.event_date,
      eventLocation: row.event_location,
      pollOptions: row.poll_options,
      isBreaking: !!row.is_breaking,
      status: row.status as PagePostStatus,
      createdAt: row.created_at,
      pageName: row.page_name,
      pageLogoUrl: row.page_logo_url,
      pageType: row.page_type,
      pageIsVerified: row.page_is_verified
    }));
  } catch (err) {
    console.error("[fetchPagePostsFromSupabase exception]:", err);
    throw err;
  }
}
export async function createPagePostInSupabase(payload) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not connected" };
  }
  const newPost = {
    id: payload.id || `ppost-${Date.now()}`,
    pageId: payload.pageId,
    authorId: payload.authorId,
    kind: payload.kind,
    title: payload.title || "",
    body: payload.body,
    imageUrl: payload.imageUrl || "",
    eventDate: payload.eventDate,
    eventLocation: payload.eventLocation,
    pollOptions: payload.pollOptions,
    isBreaking: !!payload.isBreaking,
    status: "published" as PagePostStatus,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    pageName: payload.pageName,
    pageLogoUrl: payload.pageLogoUrl,
    pageType: payload.pageType,
    pageIsVerified: payload.pageIsVerified
  };
  try {
    const { data, error: error2 } = await supabase.from("page_posts").insert({
      id: toSafeUuid(newPost.id),
      page_id: toSafeUuid(newPost.pageId),
      author_id: toSafeUuid(newPost.authorId),
      kind: newPost.kind,
      title: newPost.title,
      body: newPost.body,
      image_url: newPost.imageUrl,
      event_date: newPost.eventDate,
      event_location: newPost.eventLocation,
      poll_options: newPost.pollOptions,
      is_breaking: newPost.isBreaking,
      status: "published",
      created_at: newPost.createdAt
    }).select().single();
    if (error2) {
      console.error("[createPagePostInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    if (data) newPost.id = data.id;
    return { success: true, post: newPost };
  } catch (e) {
    console.error("[createPagePostInSupabase exception]:", e);
    return { success: false, error: (e == null ? void 0 : e.message) || "Failed to publish post" };
  }
}
export async function deletePagePostInSupabase(postId) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not configured" };
  }
  try {
    const { error: error2 } = await supabase.from("page_posts").delete().eq("id", toSafeUuid(postId));
    if (error2) {
      console.error("[deletePagePostInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    return { success: true };
  } catch (e) {
    console.error("[deletePagePostInSupabase exception]:", e);
    return { success: false, error: e == null ? void 0 : e.message };
  }
}
export async function submitPageReportInSupabase(payload) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not configured" };
  }
  const report = {
    id: `pr-${Date.now()}`,
    pageId: payload.pageId,
    postId: payload.postId,
    reporterId: payload.reporterId,
    reason: payload.reason,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const { error: error2 } = await supabase.from("page_reports").insert({
      id: toSafeUuid(report.id),
      page_id: payload.pageId ? toSafeUuid(payload.pageId) : null,
      post_id: payload.postId ? toSafeUuid(payload.postId) : null,
      reporter_id: toSafeUuid(payload.reporterId),
      reason: payload.reason,
      status: "pending",
      created_at: report.createdAt
    });
    if (error2) {
      console.error("[submitPageReportInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    return { success: true };
  } catch (e) {
    console.error("[submitPageReportInSupabase exception]:", e);
    return { success: false, error: e == null ? void 0 : e.message };
  }
}
export async function fetchPendingPageRequestsFromSupabase() {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error: error2 } = await supabase.from("pages").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPendingPageRequestsFromSupabase permission notice]: Table "pages" permission denied or missing.', error2);
        return [];
      }
      console.error("[fetchPendingPageRequestsFromSupabase error]:", error2);
      throw new Error(error2.message);
    }
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      logoUrl: row.logo_url || "",
      coverUrl: row.cover_url || "",
      ownerId: row.owner_id,
      isVerified: !!row.is_verified,
      joinMode: row.join_mode || "open",
      status: row.status,
      note: row.note || "",
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error("[fetchPendingPageRequestsFromSupabase exception]:", err);
    throw err;
  }
}
export async function reviewPageRequestInSupabase(pageId, newStatus, isVerified = false, staffId) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not connected" };
  }
  try {
    const { error: error2 } = await supabase.from("pages").update({ status: newStatus, is_verified: isVerified }).eq("id", toSafeUuid(pageId));
    if (error2) {
      console.error("[reviewPageRequestInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    if (staffId) {
      const act = newStatus === "approved" ? isVerified ? "verify_page" : "approve_page" : "reject_page";
      await logAdminActionInSupabase(staffId, act, pageId, { newStatus, isVerified });
    }
    return { success: true };
  } catch (e) {
    console.error("[reviewPageRequestInSupabase exception]:", e);
    return { success: false, error: e == null ? void 0 : e.message };
  }
}
export async function fetchPageReportsFromSupabase() {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error: error2 } = await supabase.from("page_reports").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPageReportsFromSupabase permission notice]: Table "page_reports" permission denied or missing.', error2);
        return [];
      }
      console.error("[fetchPageReportsFromSupabase error]:", error2);
      throw new Error(error2.message);
    }
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      pageId: row.page_id,
      postId: row.post_id,
      reporterId: row.reporter_id,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error("[fetchPageReportsFromSupabase exception]:", err);
    throw err;
  }
}
export async function reviewPageReportInSupabase(reportId, action2, postId, staffId) {
  if (action2 === "remove_post" && postId) {
    await deletePagePostInSupabase(postId);
  }
  if (isSupabaseConfigured) {
    try {
      const { error: error2 } = await supabase.from("page_reports").update({ status: action2 === "dismiss" ? "dismissed" : "reviewed" }).eq("id", toSafeUuid(reportId));
      if (error2) {
        console.error("[reviewPageReportInSupabase error]:", error2);
        return { success: false, error: error2.message };
      }
      if (staffId) {
        await logAdminActionInSupabase(staffId, action2 === "dismiss" ? "dismiss_report" : "remove_reported_post", reportId, { postId });
      }
    } catch (e) {
      console.error("[reviewPageReportInSupabase exception]:", e);
      return { success: false, error: e == null ? void 0 : e.message };
    }
  }
  return { success: true };
}
export async function fetchPageMessagesFromSupabase(pageId) {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error: error2 } = await supabase.from("page_messages").select("*").eq("page_id", toSafeUuid(pageId)).order("created_at", { ascending: true });
    if (error2) {
      if (isRlsOrPermissionError(error2) || isTableMissingError(error2)) {
        console.warn('[fetchPageMessagesFromSupabase permission notice]: Table "page_messages" permission denied or missing.', error2);
        return [];
      }
      console.error("[fetchPageMessagesFromSupabase error]:", error2);
      throw new Error(error2.message);
    }
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      pageId: row.page_id,
      senderId: row.sender_id,
      senderName: row.sender_name || "Member",
      senderAvatar: row.sender_avatar || "",
      text: row.text,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error("[fetchPageMessagesFromSupabase exception]:", err);
    throw err;
  }
}
export async function sendPageMessageInSupabase(pageId, senderId, senderName, senderAvatar, text2) {
  var _a, _b;
  const msg = {
    id: `pmg-${Date.now()}`,
    pageId,
    senderId,
    senderName,
    senderAvatar: senderAvatar || "",
    text: text2,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not connected" };
  }
  try {
    let safeUid = toSafeUuid(senderId);
    const { data: sessionData } = await supabase.auth.getSession();
    if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) safeUid = sessionData.session.user.id;
    const { data, error: error2 } = await supabase.from("page_messages").insert({
      id: toSafeUuid(msg.id),
      page_id: toSafeUuid(pageId),
      sender_id: safeUid,
      sender_name: senderName,
      sender_avatar: senderAvatar || "",
      text: text2,
      created_at: msg.createdAt
    }).select().single();
    if (error2) {
      console.error("[sendPageMessageInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    if (data) msg.id = data.id;
    return { success: true, message: msg };
  } catch (e) {
    console.error("[sendPageMessageInSupabase exception]:", e);
    return { success: false, error: e == null ? void 0 : e.message };
  }
}
export async function updatePageDetailsInSupabase(pageId, updates) {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Database not connected" };
  }
  try {
    const payload = {};
    if (updates.name) payload.name = updates.name;
    if (updates.description) payload.description = updates.description;
    if (updates.logoUrl) payload.logo_url = updates.logoUrl;
    if (updates.coverUrl) payload.cover_url = updates.coverUrl;
    if (updates.joinMode) payload.join_mode = updates.joinMode;
    const { error: error2 } = await supabase.from("pages").update(payload).eq("id", toSafeUuid(pageId));
    if (error2) {
      console.error("[updatePageDetailsInSupabase error]:", error2);
      return { success: false, error: error2.message };
    }
    return { success: true };
  } catch (e) {
    console.error("[updatePageDetailsInSupabase exception]:", e);
    return { success: false, error: e == null ? void 0 : e.message };
  }
}
let localAdminLogs = [];
export async function logAdminActionInSupabase(staffId, action2, targetId, details) {
  var _a, _b;
  const log = {
    id: `log-${Date.now()}`,
    staffId,
    action: action2,
    targetId,
    details,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  localAdminLogs.unshift(log);
  if (isSupabaseConfigured) {
    try {
      let safeUid = toSafeUuid(staffId);
      const { data: sessionData } = await supabase.auth.getSession();
      if ((_b = (_a = sessionData == null ? void 0 : sessionData.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id) safeUid = sessionData.session.user.id;
      await supabase.from("admin_actions").insert({
        staff_id: safeUid,
        action: action2,
        target_id: targetId,
        details: details ? details : null,
        created_at: log.createdAt
      });
    } catch (e) {
      console.warn("[logAdminActionInSupabase error]:", e);
    }
  }
}
export async function fetchAdminActionLogsFromSupabase() {
  if (!isSupabaseConfigured) {
    return localAdminLogs;
  }
  try {
    const { data, error: error2 } = await supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(100);
    if (error2 || !data) return localAdminLogs;
    const staffIds = Array.from(new Set(data.map((d) => d.staff_id)));
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", staffIds);
    const staffMap = /* @__PURE__ */ new Map();
    if (profiles) {
      profiles.forEach((p) => staffMap.set(p.id, p));
    }
    return data.map((row) => {
      const p = staffMap.get(row.staff_id);
      return {
        id: row.id,
        staffId: row.staff_id,
        action: row.action,
        targetId: row.target_id,
        details: row.details,
        createdAt: row.created_at,
        staffName: (p == null ? void 0 : p.full_name) || "Staff Member"
      };
    });
  } catch (err) {
    return localAdminLogs;
  }
}
export async function searchUsersForStaffManagementInSupabase(query) {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    if (!query.trim()) return [];
    const q = `%${query.trim().toLowerCase()}%`;
    const { data, error: error2 } = await supabase.from("profiles").select("id, full_name, username, role, level, department, faculty, staff_role, is_verified, is_admin, avatar_url").or(`username.ilike.${q},full_name.ilike.${q}`).limit(20);
    if (error2 || !data) return [];
    return data.map((row) => ({
      id: row.id,
      email: "",
      fullName: row.full_name || "Student",
      username: row.username || "",
      role: row.role || "student",
      level: row.level || "300L",
      department: row.department,
      faculty: row.faculty,
      isVerified: !!row.is_verified,
      isAdmin: !!row.is_admin || !!row.staff_role,
      staffRole: row.staff_role || (row.is_admin ? "super_admin" : null),
      avatarUrl: row.avatar_url
    }));
  } catch (err) {
    return [];
  }
}
export async function assignStaffRoleInSupabase(staffId, targetUserId, newStaffRole) {
  if (!isSupabaseConfigured) {
    return { success: true };
  }
  try {
    const { error: error2 } = await supabase.from("profiles").update({
      staff_role: newStaffRole,
      is_admin: newStaffRole === "super_admin" ? true : false
    }).eq("id", targetUserId);
    if (error2) {
      return { success: false, error: error2.message };
    }
    await logAdminActionInSupabase(
      staffId,
      newStaffRole ? "assign_staff_role" : "remove_staff_role",
      targetUserId,
      { assigned_role: newStaffRole }
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: (e == null ? void 0 : e.message) || "Role update failed." };
  }
}
export async function executeGlobalSearchInSupabase(query, tab, page = 1, pageSize = 15) {
  if (!isSupabaseConfigured || !query.trim()) return { items: [], hasMore: false };
  const q = `%${query.trim().toLowerCase()}%`;
  const from2 = (page - 1) * pageSize;
  const to = from2 + pageSize;
  try {
    if (tab === "people") {
      const { data, error: error2 } = await supabase.from("profiles").select("id, full_name, username, avatar_url, faculty, department, level, is_verified, bio, followers_count").or(`full_name.ilike.${q},username.ilike.${q}`).range(from2, to);
      if (error2 || !data) return { items: [], hasMore: false };
      return {
        items: data.map((d) => ({ ...d, type: "person" })),
        hasMore: data.length > pageSize
      };
    } else if (tab === "groups" || tab === "pages") {
      const pageType = tab === "groups" ? "club" : "news";
      const { data, error: error2 } = await supabase.from("pages").select("id, type, name, slug, description, logo_url, cover_url, is_verified, join_mode, status").eq("status", "approved").eq("type", pageType).or(`name.ilike.${q},description.ilike.${q}`).range(from2, to);
      if (error2 || !data) return { items: [], hasMore: false };
      return {
        items: data.map((d) => ({ ...d, type: "page" })),
        hasMore: data.length > pageSize
      };
    } else if (tab === "products") {
      const { data, error: error2 } = await supabase.from("products").select("id, title, description, price, images, category, stock_quantity, is_active").eq("is_active", true).or(`title.ilike.${q},description.ilike.${q}`).range(from2, to);
      if (error2 || !data) return { items: [], hasMore: false };
      return {
        items: data.map((d) => ({ ...d, type: "product" })),
        hasMore: data.length > pageSize
      };
    } else if (tab === "posts") {
      const { data, error: error2 } = await supabase.from("campus_posts").select("*").or(`content.ilike.${q}`).order("created_at", { ascending: false }).range(from2, to);
      if (error2 || !data) return { items: [], hasMore: false };
      return {
        items: data.map((d) => ({
          id: d.id,
          authorId: d.author_id,
          authorName: d.author_name || "Campus Scholar",
          authorAvatar: d.author_avatar,
          authorDept: d.author_dept,
          authorLevel: d.author_level || "300L",
          authorRole: d.author_role || "student",
          content: d.content,
          category: d.category || "Academics & GNS",
          mediaUrl: d.media_url,
          mediaType: d.media_type,
          likesCount: d.likes_count || 0,
          commentsCount: d.comments_count || 0,
          createdAt: d.created_at,
          type: "post"
        })),
        hasMore: data.length > pageSize
      };
    }
  } catch (e) {
    console.warn("[executeGlobalSearchInSupabase error]:", e);
  }
  return { items: [], hasMore: false };
}
export async function fetchBalancedPeopleSuggestionsFromSupabase(userId, limit = 20) {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error: error2 } = await supabase.rpc("get_balanced_people_suggestions", {
      p_user_id: userId,
      p_limit: limit
    });
    if (error2 || !data) {
      console.warn("[fetchBalancedPeopleSuggestionsFromSupabase rpc fallback]:", error2 == null ? void 0 : error2.message);
      const { data: fallbackData } = await supabase.from("profiles").select("id, full_name, username, avatar_url, faculty, department, level, hostel_location, is_verified, bio").neq("id", userId).limit(limit);
      if (!fallbackData) return [];
      return fallbackData.map((d) => {
        var _a;
        return {
          id: d.id,
          fullName: d.full_name || "Campus Student",
          username: d.username || ((_a = d.email) == null ? void 0 : _a.split("@")[0]),
          avatarUrl: d.avatar_url,
          faculty: d.faculty,
          department: d.department,
          level: d.level,
          hostelLocation: d.hostel_location,
          isVerified: !!d.is_verified,
          bio: d.bio,
          suggestionReason: "Discover"
        };
      });
    }
    return data.map((d) => ({
      id: d.id,
      fullName: d.full_name || "Campus Student",
      username: d.username || "",
      avatarUrl: d.avatar_url,
      faculty: d.faculty,
      department: d.department,
      level: d.level,
      hostelLocation: d.hostel_location,
      isVerified: !!d.is_verified,
      bio: d.bio,
      suggestionReason: d.suggestion_reason || "Discover"
    }));
  } catch (e) {
    console.warn("[fetchBalancedPeopleSuggestionsFromSupabase exception]:", e);
    return [];
  }
}
export async function deleteSnapFromSupabase(snapId, mediaUrl) {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error: dbError } = await supabase.from("campus_snaps").delete().eq("id", snapId);
    if (dbError) {
      return { success: false, error: dbError.message };
    }
    if (mediaUrl && mediaUrl.includes("supabase.co/storage")) {
      try {
        const urlObj = new URL(mediaUrl);
        const pathParts = urlObj.pathname.split("/storage/v1/object/public/");
        if (pathParts.length > 1) {
          const fullPath = pathParts[1];
          const firstSlash = fullPath.indexOf("/");
          if (firstSlash !== -1) {
            const bucketName = fullPath.substring(0, firstSlash);
            const filePath = fullPath.substring(firstSlash + 1);
            await supabase.storage.from(bucketName).remove([filePath]);
          }
        }
      } catch (storageErr) {
        console.warn("[deleteSnapFromSupabase storage cleanup notice]:", storageErr);
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err == null ? void 0 : err.message) || "Failed to delete snap." };
  }
}
export async function fetchUserProfileByIdFromSupabase(userId) {
  var _a, _b;
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const isSelf = ((_a = session == null ? void 0 : session.user) == null ? void 0 : _a.id) === userId;
    let profile = null;
    if (isSelf) {
      const { data: myProf, error: rpcErr } = await supabase.rpc("get_my_profile");
      if (!rpcErr && myProf) {
        profile = myProf;
      }
    }
    if (!profile) {
      const { data: publicProf, error: pubErr } = await supabase.from("profiles").select(ALLOWED_PROFILES_READ_COLUMNS).eq("id", userId).maybeSingle();
      if (pubErr || !publicProf) {
        if (pubErr && pubErr.code !== "PGRST116") {
          console.warn("[fetchUserProfileByIdFromSupabase error]:", pubErr.message);
        }
        return null;
      }
      profile = publicProf;
    }
    const resolvedUser = {
      id: profile.id,
      email: isSelf ? profile.email || ((_b = session == null ? void 0 : session.user) == null ? void 0 : _b.email) || "" : "",
      fullName: profile.full_name || "Campus Student",
      username: profile.username || `student_${profile.id.slice(0, 5)}`,
      matricNumber: isSelf ? profile.matric_number || "" : "",
      role: profile.role || "student",
      accountType: profile.account_type || "BUYER",
      university: profile.university || "",
      session: profile.session || "",
      faculty: profile.faculty,
      department: profile.department,
      level: profile.level || "300L",
      hostelLocation: profile.hostel_location,
      whatsapp: isSelf ? profile.whatsapp : void 0,
      isVerified: Boolean(profile.is_verified),
      isAdmin: Boolean(profile.is_admin || profile.role === "admin" || profile.staff_role),
      staffRole: profile.staff_role || (profile.role === "admin" || profile.is_admin ? "super_admin" : null),
      verifiedAt: profile.verified_at,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      postsCount: profile.posts_count || 0,
      followersCount: profile.followers_count || 0,
      followingCount: profile.following_count || 0,
      followingUserIds: profile.following_user_ids || [],
      blockedUserIds: isSelf ? profile.blocked_user_ids || [] : [],
      joinedAt: profile.created_at || (/* @__PURE__ */ new Date()).toISOString()
    };
    return resolvedUser;
  } catch (err) {
    console.warn("[fetchUserProfileByIdFromSupabase exception]:", err);
    return null;
  }
}
export async function resetDatabaseToZero() {
  const { executeProductionLaunchPurge } = await import("./adminPurge");
  return executeProductionLaunchPurge();
}
