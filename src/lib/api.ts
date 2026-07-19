const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function request(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };
  
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getHomeData: () => request('/home'),
  getServices: () => request('/services'),
  getService: (id: string) => request(`/services/${id}`),
  // Add other endpoints as needed
};
