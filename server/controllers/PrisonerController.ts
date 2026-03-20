import { Request, Response } from "express";
import { PrisonerService } from "../services/PrisonerService.js";

export class PrisonerController {
  private prisonerService: PrisonerService;

  constructor() {
    this.prisonerService = new PrisonerService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      
      const result = await this.prisonerService.getPrisoners(page, limit, search);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      await this.prisonerService.createPrisoner(req.body);
      res.status(201).json({ message: "Detento cadastrado com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido." });
      }
      await this.prisonerService.updatePrisoner(id, req.body);
      res.json({ message: "Dados do detento atualizados com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async discharge(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido." });
      }
      await this.prisonerService.dischargePrisoner(id);
      res.json({ message: "Baixa realizada com sucesso. O detento foi liberado da cela." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido." });
      }
      await this.prisonerService.deletePrisoner(id);
      res.json({ message: "Detento e todo seu histórico foram excluídos com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
