import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService.js";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.dashboardService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
