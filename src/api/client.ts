export class ApiError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

export function validateApiUrl(value: string | undefined, development: boolean): string {
  if (!value?.trim()) throw new ApiError("Set EXPO_PUBLIC_API_URL to the public parking API host, then reload the app.");
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new ApiError("EXPO_PUBLIC_API_URL must be a valid HTTP(S) origin."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new ApiError("EXPO_PUBLIC_API_URL must contain only the public HTTP(S) origin, without a path or credentials.");
  }
  if (!development && url.protocol !== "https:") throw new ApiError("The production parking API requires HTTPS.");
  return url.origin;
}

export function getApiUrl() {
  // Expo statically replaces this exact property access in the mobile bundle.
  return validateApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__);
}

export function cancellationError() {
  const error = new Error("Parking request cancelled.");
  error.name = "AbortError";
  return error;
}
export function isCancellation(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export async function requestParkingJson(params: URLSearchParams, signal?: AbortSignal): Promise<unknown> {
  const url = `${getApiUrl()}/api/parking-spots?${params}`;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) throw cancellationError();
  signal?.addEventListener("abort", cancel);
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new ApiError(`Parking data couldn't be loaded (HTTP ${response.status}). Please retry.`, response.status);
    let data: unknown;
    try { data = await response.json(); } catch { throw new ApiError("The parking API returned invalid JSON."); }
    if (controller.signal.aborted) throw cancellationError();
    return data;
  } catch (error) {
    if (signal?.aborted) throw cancellationError();
    if (timedOut) throw new ApiError("The parking API took too long to respond. Please retry.");
    if (error instanceof ApiError || isCancellation(error)) throw error;
    throw new ApiError("Parking data couldn't be loaded. Check your connection and API host, then retry.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
