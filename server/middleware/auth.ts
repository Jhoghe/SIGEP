import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const xAccessToken = req.headers['x-access-token'];
  const xPrisonToken = req.headers['x-prison-token'];
  const token = (authHeader && authHeader.split(' ')[1]) || (xAccessToken as string) || (xPrisonToken as string);

  if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // Use console.log instead of console.error for expired tokens to reduce noise
      // as it is a common occurrence and handled by the client.
      console.log(`[AuthMiddleware] Auth failed: ${err.message}.`);
      return res.status(401).json({ 
        message: "Sessão expirada ou token inválido. Por favor, faça login novamente.",
        code: "TOKEN_EXPIRED"
      });
    }
    req.user = user;
    next();
  });
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Acesso negado. Requer privilégios de administrador." });
  }
};
