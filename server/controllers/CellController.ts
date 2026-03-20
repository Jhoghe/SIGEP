import { Request, Response } from "express";
import { CellRepository } from "../repositories/CellRepository.js";
import DatabaseConnection from "../database.js";

export class CellController {
  private cellRepo: CellRepository;

  constructor() {
    this.cellRepo = new CellRepository();
  }

  async getAll(req: Request, res: Response) {
    try {
      const db = DatabaseConnection.getInstance();
      const cells = db.prepare(`
        SELECT c.*, p.name as pavilion_name,
        (SELECT count(*) FROM prisoners WHERE cell_id = c.id AND status != 'Liberado') as current_occupancy,
        (SELECT GROUP_CONCAT(id || ':' || name, '|') FROM prisoners WHERE cell_id = c.id AND status != 'Liberado') as prisoners_info
        FROM cells c
        JOIN pavilions p ON c.pavilion_id = p.id
      `).all();
      res.json(cells);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { number, capacity, pavilion_id, block, type, status } = req.body;
      
      if (!number || !capacity || !pavilion_id) {
        throw new Error("Número, capacidade e pavilhão são obrigatórios.");
      }

      const parsedCapacity = parseInt(capacity.toString());
      const parsedPavilionId = parseInt(pavilion_id.toString());

      if (isNaN(parsedCapacity) || isNaN(parsedPavilionId)) {
        throw new Error("Capacidade e ID do pavilhão devem ser números válidos.");
      }

      const db = DatabaseConnection.getInstance();
      db.prepare("INSERT INTO cells (number, capacity, pavilion_id, block, type, status) VALUES (?, ?, ?, ?, ?, ?)").run(
        number, parsedCapacity, parsedPavilionId, block, type || 'Normal', status || 'Disponível'
      );
      res.status(201).json({ message: "Cela cadastrada com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { number, capacity, pavilion_id, block, type, status } = req.body;
      
      if (!number || !capacity || !pavilion_id) {
        throw new Error("Número, capacidade e pavilhão são obrigatórios.");
      }

      const parsedCapacity = parseInt(capacity.toString());
      const parsedPavilionId = parseInt(pavilion_id.toString());

      if (isNaN(parsedCapacity) || isNaN(parsedPavilionId)) {
        throw new Error("Capacidade e ID do pavilhão devem ser números válidos.");
      }

      const db = DatabaseConnection.getInstance();
      
      // Check if cell has prisoners if trying to change number
      const currentCell = db.prepare("SELECT * FROM cells WHERE id = ?").get(id) as any;
      if (currentCell.number !== number) {
        const prisoners = db.prepare("SELECT count(*) as count FROM prisoners WHERE cell_id = ? AND status != 'Liberado'").get(id) as any;
        if (prisoners.count > 0) {
          throw new Error("Não é possível alterar o número de uma cela que possui detentos ativos.");
        }
      }

      // Check capacity
      const prisoners = db.prepare("SELECT count(*) as count FROM prisoners WHERE cell_id = ? AND status != 'Liberado'").get(id) as any;
      if (parsedCapacity < prisoners.count) {
        throw new Error(`A capacidade não pode ser menor que o número atual de detentos (${prisoners.count}).`);
      }

      db.prepare("UPDATE cells SET number = ?, capacity = ?, pavilion_id = ?, block = ?, type = ?, status = ? WHERE id = ?").run(
        number, parsedCapacity, parsedPavilionId, block, type, status, id
      );
      res.json({ message: "Cela atualizada com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = DatabaseConnection.getInstance();
      const prisoners = db.prepare("SELECT count(*) as count FROM prisoners WHERE cell_id = ? AND status != 'Liberado'").get(id) as any;
      if (prisoners.count > 0) {
        return res.status(400).json({ message: "Não é possível excluir uma cela que possui detentos ativos." });
      }
      this.cellRepo.delete(parseInt(id));
      res.json({ message: "Cela excluída com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
