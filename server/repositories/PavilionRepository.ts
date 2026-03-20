import { BaseRepository } from "./BaseRepository.js";
import { Pavilion } from "../types.js";

export class PavilionRepository extends BaseRepository<Pavilion> {
  findById(id: number): Pavilion | undefined {
    return this.db.prepare("SELECT * FROM pavilions WHERE id = ?").get(id) as Pavilion | undefined;
  }

  findAll(): Pavilion[] {
    return this.db.prepare(`
      SELECT p.*, 
      (SELECT count(*) FROM cells WHERE pavilion_id = p.id) as cell_count,
      (SELECT count(*) FROM prisoners pr JOIN cells c ON pr.cell_id = c.id WHERE c.pavilion_id = p.id) as prisoner_count
      FROM pavilions p
    `).all() as Pavilion[];
  }

  create(pavilion: Pavilion): void {
    this.db.prepare("INSERT INTO pavilions (name, description) VALUES (?, ?)").run(pavilion.name, pavilion.description);
  }

  update(id: number, pavilion: Partial<Pavilion>): void {
    const fields = Object.keys(pavilion).filter(k => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (pavilion as any)[f]);
    this.db.prepare(`UPDATE pavilions SET ${setClause} WHERE id = ?`).run(...values, id);
  }

  delete(id: number): void {
    this.db.prepare("DELETE FROM pavilions WHERE id = ?").run(id);
  }
}
