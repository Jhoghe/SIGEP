import { PrisonerRepository } from "../repositories/PrisonerRepository.js";
import { CellRepository } from "../repositories/CellRepository.js";
import DatabaseConnection from "../database.js";

export class DashboardService {
  private prisonerRepo: PrisonerRepository;
  private cellRepo: CellRepository;
  private db: any;

  constructor() {
    this.prisonerRepo = new PrisonerRepository();
    this.cellRepo = new CellRepository();
    this.db = DatabaseConnection.getInstance();
  }

  async getStats() {
    const totalPrisoners = this.db.prepare("SELECT count(*) as count FROM prisoners").get().count;
    const totalCells = this.cellRepo.countTotal();
    const occupiedCells = this.cellRepo.countOccupied();
    const isolatedPrisoners = this.prisonerRepo.countIsolated();
    const totalVisitors = this.db.prepare("SELECT count(*) as count FROM visitors").get().count;
    const totalLawyerVisits = this.db.prepare("SELECT count(*) as count FROM lawyer_visits").get().count;
    
    const recentTransfers = this.db.prepare(`
      SELECT t.*, p.name as prisoner_name 
      FROM transfers t 
      JOIN prisoners p ON t.prisoner_id = p.id 
      ORDER BY t.id DESC LIMIT 5
    `).all();
    
    const recentLawyerVisits = this.db.prepare(`
      SELECT lv.*, l.name as lawyer_name, p.name as prisoner_name 
      FROM lawyer_visits lv
      JOIN lawyers l ON lv.lawyer_id = l.id
      JOIN prisoners p ON lv.prisoner_id = p.id
      ORDER BY lv.id DESC LIMIT 5
    `).all();

    const recentIncidents = this.db.prepare("SELECT * FROM incidents ORDER BY id DESC LIMIT 5").all();

    return {
      prisoners: totalPrisoners,
      cells: totalCells,
      occupiedCells: occupiedCells,
      availableCells: totalCells - occupiedCells,
      isolated: isolatedPrisoners,
      visitors: totalVisitors,
      lawyerVisits: totalLawyerVisits,
      recentTransfers,
      recentLawyerVisits,
      recentIncidents
    };
  }
}
