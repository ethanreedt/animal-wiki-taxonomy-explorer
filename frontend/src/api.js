const BASE_URL = "/api";

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const error = new Error(`API error: ${res.status}`);
    error.status = res.status;
    try {
      error.data = await res.json();
    } catch {
      // no json body
    }
    throw error;
  }
  return res.json();
}
