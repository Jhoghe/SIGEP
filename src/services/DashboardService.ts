import ApiService from './ApiService';

class DashboardService extends ApiService {
  async getStats() {
    const headers = await this.getHeaders();
    const response = await this.fetch(`${this.baseUrl}/dashboard/stats`, {
      headers,
    });
    return this.handleResponse(response);
  }
}

export const dashboardService = new DashboardService();
