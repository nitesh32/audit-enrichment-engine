const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const UPDATE_PATH_HEADER = 'X-Update-Path';

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}/api/audit-entries${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const { code, message, details } = data.error;
    throw new ApiError(response.status, code, message, details);
  }
  return { data, updatePath: response.headers.get(UPDATE_PATH_HEADER) };
}

export const auditApi = {
  list: async () => (await request('')).data,
  get: async (id) => (await request(`/${id}`)).data,
  create: async (entry) => (await request('', { method: 'POST', body: entry })).data,
  update: (id, patch) => request(`/${id}`, { method: 'PUT', body: patch }),
  findSimilar: async (id) => (await request(`/${id}/similar`, { method: 'POST' })).data,
};
