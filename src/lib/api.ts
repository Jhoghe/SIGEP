/**
 * Custom fetch wrapper to handle global API concerns like 401 Unauthorized
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  
  if (response.status === 401) {
    const isLoginPage = window.location.pathname.includes('/login');
    const isLoginRequest = typeof input === 'string' && input.includes('/api/auth/login');
    
    if (!isLoginPage && !isLoginRequest) {
      console.warn('[ApiFetch] 401 Unauthorized detected. Redirecting to login.');
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.search.includes('expired=true')) {
        window.location.href = '/login?expired=true';
      }
    }
  }
  
  return response;
}
