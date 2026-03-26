/**
 * Custom fetch wrapper to handle global API concerns like 401 Unauthorized
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token');
  const isLoginPage = window.location.pathname.includes('/login');
  const isLoginRequest = typeof input === 'string' && input.includes('/api/auth/login');

  // Client-side check for token expiration before sending the request
  if (token && !isLoginPage && !isLoginRequest) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expirationTime) {
        console.warn('[ApiFetch] Token expired (client-side check). Redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.search.includes('expired=true')) {
          window.location.href = '/login?expired=true';
        }
        
        // Return a dummy 401 response to stop the calling code
        return new Response(JSON.stringify({ message: 'Sessão expirada.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      console.error('[ApiFetch] Error decoding token:', e);
    }
  }

  const response = await fetch(input, init);
  
  if (response.status === 401) {
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
