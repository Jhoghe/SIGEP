import { BaseRepository } from "./BaseRepository.js";
import { Prisoner } from "../types.js";

export class PrisonerRepository extends BaseRepository<Prisoner> {
  findById(id: number): Prisoner | undefined {
    return this.db.prepare(`
      SELECT p.*, c.number as cell_number 
      FROM prisoners p 
      LEFT JOIN cells c ON p.cell_id = c.id
      WHERE p.id = ?
    `).get(id) as Prisoner | undefined;
  }

  findAll(): Prisoner[] {
    return this.db.prepare(`
      SELECT p.*, c.number as cell_number 
      FROM prisoners p 
      LEFT JOIN cells c ON p.cell_id = c.id
      ORDER BY p.id DESC
    `).all() as Prisoner[];
  }

  findPaginated(limit: number, offset: number, search: string = ""): { data: Prisoner[], total: number } {
    let query = `
      SELECT p.*, c.number as cell_number 
      FROM prisoners p 
      LEFT JOIN cells c ON p.cell_id = c.id
    `;
    let countQuery = `SELECT count(*) as count FROM prisoners p`;
    const params: any[] = [];

    if (search) {
      const searchFilter = ` WHERE p.name LIKE ? OR p.registration_number LIKE ? OR p.id = ?`;
      query += searchFilter;
      countQuery += searchFilter;
      params.push(`%${search}%`, `%${search}%`, search);
    }

    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    
    const data = this.db.prepare(query).all(...params, limit, offset) as Prisoner[];
    const total = (this.db.prepare(countQuery).get(...params) as any).count;

    return { data, total };
  }

  create(prisoner: Prisoner): number {
    const { 
      name, registration_number, cell_id, entry_date, crime, 
      age, parents, marital_status, photo, is_recidivist, status, is_isolated,
      birth_date, father_name, mother_name, observations
    } = prisoner;

    const info = this.db.prepare(`
      INSERT INTO prisoners (
        name, registration_number, cell_id, entry_date, crime, 
        age, parents, marital_status, photo, is_recidivist, status, is_isolated,
        birth_date, father_name, mother_name, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, registration_number, cell_id, entry_date, crime, 
      age || null, parents || null, marital_status || null, photo || null, 
      is_recidivist, status, is_isolated,
      birth_date || null, father_name || null, mother_name || null, observations || null
    );

    return info.lastInsertRowid as number;
  }

  update(id: number, prisoner: Partial<Prisoner>): void {
    const allowedFields = [
      'name', 'registration_number', 'cell_id', 'entry_date', 'crime', 
      'age', 'parents', 'marital_status', 'photo', 'is_recidivist', 
      'status', 'is_isolated', 'birth_date', 'father_name', 'mother_name', 'observations'
    ];
    
    const fields = Object.keys(prisoner).filter(k => allowedFields.includes(k));
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (prisoner as any)[f]);

    this.db.prepare(`UPDATE prisoners SET ${setClause} WHERE id = ?`).run(...values, id);
  }

  delete(id: number): void {
    const deleteTransaction = this.db.transaction((prisonerId) => {
      this.db.prepare("DELETE FROM crimes WHERE prisoner_id = ?").run(prisonerId);
      this.db.prepare("DELETE FROM transfers WHERE prisoner_id = ?").run(prisonerId);
      this.db.prepare("DELETE FROM visitors WHERE prisoner_id = ?").run(prisonerId);
      this.db.prepare("DELETE FROM lawyer_prisoner WHERE prisoner_id = ?").run(prisonerId);
      this.db.prepare("DELETE FROM lawyer_visits WHERE prisoner_id = ?").run(prisonerId);
      this.db.prepare("DELETE FROM prisoners WHERE id = ?").run(prisonerId);
    });

    deleteTransaction(id);
  }

  countByStatus(status: string): number {
    return (this.db.prepare("SELECT count(*) as count FROM prisoners WHERE status = ?").get(status) as any).count;
  }

  countIsolated(): number {
    return (this.db.prepare("SELECT count(*) as count FROM prisoners WHERE is_isolated = 1").get() as any).count;
  }
}
