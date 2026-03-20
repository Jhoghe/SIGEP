import { BaseRepository } from "./BaseRepository.js";
import { Cell } from "../types.js";

export class CellRepository extends BaseRepository<Cell> {
  findById(id: number): Cell | undefined {
    return this.db.prepare("SELECT * FROM cells WHERE id = ?").get(id) as Cell | undefined;
  }

  findAll(): Cell[] {
    return this.db.prepare("SELECT * FROM cells ORDER BY number ASC").all() as Cell[];
  }

  findByPavilion(pavilionId: number): Cell[] {
    return this.db.prepare("SELECT * FROM cells WHERE pavilion_id = ? ORDER BY number ASC").all(pavilionId) as Cell[];
  }

  getOccupancy(cellId: number): { capacity: number, current_occupancy: number } {
    return this.db.prepare(`
      SELECT capacity, 
      (SELECT count(*) FROM prisoners WHERE cell_id = cells.id AND status != 'Liberado' AND status != 'Transferido') as current_occupancy 
      FROM cells WHERE id = ?
    `).get(cellId) as any;
  }

  delete(id: number): void {
    this.db.prepare("DELETE FROM cells WHERE id = ?").run(id);
  }

  countTotal(): number {
    return (this.db.prepare("SELECT count(*) as count FROM cells").get() as any).count;
  }

  countOccupied(): number {
    return (this.db.prepare("SELECT count(DISTINCT cell_id) as count FROM prisoners WHERE cell_id IS NOT NULL").get() as any).count;
  }
}
