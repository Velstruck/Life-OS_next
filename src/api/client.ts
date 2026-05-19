// Use environment variable for API URL, fallback to relative path for Next.js App Router
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // Get token from localStorage for iOS compatibility
  const token = localStorage.getItem('token');
  
  const url = `${API_BASE_URL}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};
