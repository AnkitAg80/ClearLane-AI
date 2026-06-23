const BASE_URL = '/api';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = 'API request failed';
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export const client = {
  get: <T>(endpoint: string, params?: object) => {
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          search.append(key, String(value));
        }
      });
      const query = search.toString();
      if (query) endpoint += `?${query}`;
    }
    return request<T>(endpoint);
  },
  
  post: <T>(endpoint: string, body: unknown) => 
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
