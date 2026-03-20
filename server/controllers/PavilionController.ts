import { Request, Response } from "express";
import { PavilionRepository } from "../repositories/PavilionRepository.js";

export class PavilionController {
  private pavilionRepo: PavilionRepository;

  constructor() {
    this.pavilionRepo = new PavilionRepository();
  }

  async getAll(req: Request, res: Response) {
    try {
      const pavilions = this.pavilionRepo.findAll();
      res.json(pavilions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      if (!req.body.name) {
        throw new Error("O nome do pavilhão é obrigatório.");
      }
      this.pavilionRepo.create(req.body);
      res.status(201).json({ message: "Pavilhão cadastrado com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (req.body.name === "") {
        throw new Error("O nome do pavilhão não pode ser vazio.");
      }
      this.pavilionRepo.update(parseInt(id), req.body);
      res.json({ message: "Pavilhão atualizado com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Check for cells before deleting
      const pavilions = this.pavilionRepo.findAll();
      const pavilion = pavilions.find(p => p.id === parseInt(id));
      if (pavilion && (pavilion.cell_count || 0) > 0) {
        return res.status(400).json({ message: "Não é possível excluir um pavilhão que possui celas cadastradas." });
      }
      this.pavilionRepo.delete(parseInt(id));
      res.json({ message: "Pavilhão excluído com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
