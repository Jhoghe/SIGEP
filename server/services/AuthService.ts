import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { InspectorRepository } from "../repositories/InspectorRepository.js";
import { JWT_SECRET } from "../config.js";

export class AuthService {
  private inspectorRepo: InspectorRepository;

  constructor() {
    this.inspectorRepo = new InspectorRepository();
  }

  async login(username: string, password: string) {
    console.log(`[AuthService] Attempting login for user: ${username}`);
    const user = this.inspectorRepo.findByUsername(username);

    if (!user) {
      console.warn(`[AuthService] User not found: ${username}`);
      throw new Error("Usuário ou senha inválidos.");
    }

    if (!user.password) {
      console.error(`[AuthService] User ${username} has no password set.`);
      throw new Error("Usuário ou senha inválidos.");
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[AuthService] Invalid password for user: ${username}`);
      throw new Error("Usuário ou senha inválidos.");
    }

    console.log(`[AuthService] Login successful for user: ${username}`);
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    };
  }

  async createInspector(inspectorData: any, currentUserRole: string) {
    if (currentUserRole !== 'admin') {
      throw new Error("Acesso negado.");
    }

    if (!inspectorData.username || !inspectorData.password || !inspectorData.name) {
      throw new Error("Nome de usuário, senha e nome completo são obrigatórios.");
    }

    const existingUser = this.inspectorRepo.findByUsername(inspectorData.username);
    if (existingUser) {
      throw new Error("Este nome de usuário já está em uso.");
    }

    const hashedPassword = bcrypt.hashSync(inspectorData.password, 10);
    this.inspectorRepo.create({
      ...inspectorData,
      password: hashedPassword
    });
  }

  async updateProfile(id: number, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.username) {
      const existing = this.inspectorRepo.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new Error("Este nome de usuário já está em uso.");
      }
      updateData.username = data.username;
    }
    if (data.password) {
      updateData.password = bcrypt.hashSync(data.password, 10);
    }
    
    this.inspectorRepo.update(id, updateData);
    
    const updated = this.inspectorRepo.findById(id);
    return {
      id: updated?.id,
      username: updated?.username,
      name: updated?.name,
      role: updated?.role
    };
  }
}
