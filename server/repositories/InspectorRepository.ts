import { BaseRepository } from "./BaseRepository.js";
import { Inspector } from "../types.js";

export class InspectorRepository extends BaseRepository<Inspector> {
  findById(id: number): Inspector | undefined {
    return this.db.prepare("SELECT id, username, name, role FROM inspectors WHERE id = ?").get(id) as Inspector | undefined;
  }

  findByUsername(username: string): Inspector | undefined {
    return this.db.prepare("SELECT * FROM inspectors WHERE username = ? COLLATE NOCASE").get(username) as Inspector | undefined;
  }

  findAll(): Inspector[] {
    return this.db.prepare("SELECT id, username, name, role FROM inspectors ORDER BY name ASC").all() as Inspector[];
  }

  create(inspector: Inspector): void {
    const { username, password, name, role } = inspector;
    this.db.prepare("INSERT INTO inspectors (username, password, name, role) VALUES (?, ?, ?, ?)").run(
      username, password, name, role || 'inspector'
    );
  }

  update(id: number, data: Partial<Inspector>): void {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    this.db.prepare(`UPDATE inspectors SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  delete(id: number): void {
    this.db.prepare("DELETE FROM inspectors WHERE id = ?").run(id);
  }

  countTotal(): number {
    return (this.db.prepare("SELECT count(*) as count FROM inspectors").get() as any).count;
  }
}
