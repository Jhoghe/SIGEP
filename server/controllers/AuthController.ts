import { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";
import { InspectorRepository } from "../repositories/InspectorRepository.js";

export class AuthController {
  private authService: AuthService;
  private inspectorRepo: InspectorRepository;

  constructor() {
    this.authService = new AuthService();
    this.inspectorRepo = new InspectorRepository();
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      console.log(`[AuthController] Login attempt for user: ${username}`);
      if (!username || !password) {
        console.warn('[AuthController] Missing username or password');
        return res.status(400).json({ message: "Usuário e senha são obrigatórios." });
      }
      const result = await this.authService.login(username, password);
      console.log(`[AuthController] Login successful for user: ${username}`);
      res.json(result);
    } catch (error: any) {
      console.error(`[AuthController] Login failed for user: ${req.body.username}. Error: ${error.message}`);
      res.status(401).json({ message: error.message });
    }
  }

  async getInspectors(req: any, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado." });
      }
      const inspectors = this.inspectorRepo.findAll();
      res.json(inspectors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async createInspector(req: any, res: Response) {
    try {
      await this.authService.createInspector(req.body, req.user.role);
      res.status(201).json({ message: "Usuário criado com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteInspector(req: any, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado." });
      }
      const { id } = req.params;
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: "Você não pode excluir seu próprio usuário." });
      }
      this.inspectorRepo.delete(parseInt(id));
      res.json({ message: "Usuário excluído com sucesso." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getProfile(req: any, res: Response) {
    try {
      const user = this.inspectorRepo.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateProfile(req: any, res: Response) {
    try {
      const updatedUser = await this.authService.updateProfile(req.user.id, req.body);
      res.json({ message: "Perfil atualizado com sucesso.", user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
