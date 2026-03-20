import ApiService from './ApiService';

class PrisonerService extends ApiService {
  async getPrisoners(page: number = 1, limit: number = 10, search: string = '') {
    const headers = await this.getHeaders();
    const response = await this.fetch(`${this.baseUrl}/prisoners?page=${page}&limit=${limit}&search=${search}`, {
      headers,
    });
    return this.handleResponse(response);
  }

  async createPrisoner(prisonerData: any) {
    const headers = await this.getHeaders('POST');
    const response = await this.fetch(`${this.baseUrl}/prisoners`, {
      method: 'POST',
      headers,
      body: JSON.stringify(prisonerData),
    });
    return this.handleResponse(response);
  }

  async updatePrisoner(id: number, prisonerData: any) {
    const headers = await this.getHeaders('PUT');
    const response = await this.fetch(`${this.baseUrl}/prisoners/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(prisonerData),
    });
    return this.handleResponse(response);
  }

  async deletePrisoner(id: number) {
    const headers = await this.getHeaders();
    const response = await this.fetch(`${this.baseUrl}/prisoners/${id}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  }

  async dischargePrisoner(id: number) {
    const headers = await this.getHeaders('PUT');
    const response = await this.fetch(`${this.baseUrl}/prisoners/${id}/discharge`, {
      method: 'PUT',
      headers,
    });
    return this.handleResponse(response);
  }

  async getCrimesByPrisoner(prisonerId: number) {
    const headers = await this.getHeaders();
    const response = await this.fetch(`${this.baseUrl}/crimes?prisoner_id=${prisonerId}`, {
      headers,
    });
    return this.handleResponse(response);
  }
}

export const prisonerService = new PrisonerService();
