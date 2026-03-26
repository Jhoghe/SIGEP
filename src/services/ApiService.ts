import { apiFetch } from '../lib/api';

class ApiService {
  protected baseUrl: string = '/api';

  protected async getHeaders(method: string = 'GET') {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // Removed extra headers that might trigger proxy security rules
    }
    
    console.log(`[ApiService] Headers for ${method}:`, headers);
    return headers;
  }

  protected async fetch(url: string, init?: RequestInit) {
    return apiFetch(url, init);
  }

  protected async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      // Don't log 401/403 as "Request failed" errors since they are handled by the auth flow
      if (response.status !== 401 && response.status !== 403) {
        console.error(`[ApiService] Request failed with status ${response.status}`);
      } else {
        console.warn(`[ApiService] Auth error ${response.status}. Session may be expired.`);
      }

      let errorMessage = `Erro na requisição (Status: ${response.status})`;
      if (isJson) {
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
      } else {
        const text = await response.text();
        // If it's an HTML error page from a proxy, try to extract a meaningful message or use statusText
        if (text.includes('<title>')) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/);
          errorMessage = titleMatch ? `Erro do Servidor: ${titleMatch[1]}` : `Erro do Servidor (${response.status})`;
        } else {
          errorMessage = text.substring(0, 100) || response.statusText || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }

    if (!isJson) {
      const text = await response.text();
      throw new Error(`Resposta inesperada do servidor (não é JSON). Status: ${response.status}. Início do corpo: ${text.substring(0, 100)}`);
    }

    return response.json();
  }
}

export default ApiService;
