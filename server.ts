import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseInitializer } from "./server/databaseInitializer.js";
import { AuthController } from "./server/controllers/AuthController.js";
import { PrisonerController } from "./server/controllers/PrisonerController.js";
import { DashboardController } from "./server/controllers/DashboardController.js";
import { PavilionController } from "./server/controllers/PavilionController.js";
import { CellController } from "./server/controllers/CellController.js";
import { authenticateToken, isAdmin } from "./server/middleware/auth.js";
import { JWT_SECRET } from "./server/config.js";
import DatabaseConnection from "./server/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PrisonServer {
  private app: express.Application;
  private port: number = 3000;
  private authController: AuthController;
  private prisonerController: PrisonerController;
  private dashboardController: DashboardController;
  private pavilionController: PavilionController;
  private cellController: CellController;

  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.prisonerController = new PrisonerController();
    this.dashboardController = new DashboardController();
    this.pavilionController = new PavilionController();
    this.cellController = new CellController();
  }

  public async start() {
    // Initialize Database
    new DatabaseInitializer().init();

    console.log(`[Server] JWT Secret is ${process.env.JWT_SECRET ? 'from environment' : 'using default fallback'}`);

    this.setupMiddleware();
    this.setupRoutes();
    await this.setupVite();
    
    this.app.listen(this.port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token', 'X-Prison-Token', 'Accept']
    }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    // Logging middleware for debugging - only log API requests to avoid cluttering with source file requests
    this.app.use((req, res, next) => {
      if (req.url.startsWith('/api')) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.url}`);
        // Log specific headers that might cause issues
        console.log('Auth Headers:', {
          auth: req.headers['authorization'] ? 'Present' : 'Missing',
          xAccess: req.headers['x-access-token'] ? 'Present' : 'Missing',
          xPrison: req.headers['x-prison-token'] ? 'Present' : 'Missing',
          origin: req.headers['origin'] || 'None',
          referer: req.headers['referer'] || 'None'
        });
      }
      next();
    });
  }

  private setupRoutes() {
    // Public Debug Routes
    this.app.get("/api/public/test", (req, res) => {
      res.json({ 
        message: "Public API is working", 
        timestamp: new Date().toISOString(),
        headers: req.headers
      });
    });

    this.app.get("/api/debug/token", (req, res) => {
      res.json({
        authorization: req.headers['authorization'],
        xAccessToken: req.headers['x-access-token'],
        xPrisonToken: req.headers['x-prison-token'],
      });
    });

    // Auth Routes
    this.app.get("/api/health", (req, res) => res.json({ status: "ok" }));
    this.app.post("/api/auth/login", (req, res) => this.authController.login(req, res));
    this.app.get("/api/auth/profile", authenticateToken, (req, res) => this.authController.getProfile(req, res));
    this.app.put("/api/auth/profile", authenticateToken, (req, res) => this.authController.updateProfile(req, res));
    this.app.get("/api/inspectors", authenticateToken, isAdmin, (req, res) => this.authController.getInspectors(req, res));
    this.app.post("/api/inspectors", authenticateToken, isAdmin, (req, res) => this.authController.createInspector(req, res));
    this.app.delete("/api/inspectors/:id", authenticateToken, isAdmin, (req, res) => this.authController.deleteInspector(req, res));

    // Dashboard Routes
    this.app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
      console.log('[Server] Reached /api/dashboard/stats handler');
      this.dashboardController.getStats(req, res);
    });

    // Prisoner Routes
    this.app.get("/api/prisoners", authenticateToken, (req, res) => this.prisonerController.getAll(req, res));
    this.app.post("/api/prisoners", authenticateToken, (req, res) => this.prisonerController.create(req, res));
    this.app.put("/api/prisoners/:id", authenticateToken, (req, res) => this.prisonerController.update(req, res));
    this.app.put("/api/prisoners/:id/discharge", authenticateToken, (req, res) => this.prisonerController.discharge(req, res));
    this.app.delete("/api/prisoners/:id", authenticateToken, (req, res) => this.prisonerController.delete(req, res));

    // Pavilion Routes
    this.app.get("/api/pavilions", authenticateToken, (req, res) => this.pavilionController.getAll(req, res));
    this.app.post("/api/pavilions", authenticateToken, isAdmin, (req, res) => this.pavilionController.create(req, res));
    this.app.put("/api/pavilions/:id", authenticateToken, isAdmin, (req, res) => this.pavilionController.update(req, res));
    this.app.delete("/api/pavilions/:id", authenticateToken, isAdmin, (req, res) => this.pavilionController.delete(req, res));

    // Cell Routes
    this.app.get("/api/cells", authenticateToken, (req, res) => this.cellController.getAll(req, res));
    this.app.post("/api/cells", authenticateToken, isAdmin, (req, res) => this.cellController.create(req, res));
    this.app.put("/api/cells/:id", authenticateToken, isAdmin, (req, res) => this.cellController.update(req, res));
    this.app.delete("/api/cells/:id", authenticateToken, isAdmin, (req, res) => this.cellController.delete(req, res));

    // System Routes
    this.app.delete("/api/system/reset", authenticateToken, isAdmin, this.resetSystem);

    // Legacy Routes (to be refactored later if needed)
    this.setupLegacyRoutes();

    // Catch-all for API routes
    this.app.all("/api/*", (req, res) => {
      res.status(404).json({ message: `Rota API não encontrada: ${req.method} ${req.url}` });
    });
  }

  private resetSystem = (req: express.Request, res: express.Response) => {
    const db = DatabaseConnection.getInstance();
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM lawyer_visits").run();
        db.prepare("DELETE FROM lawyer_prisoner").run();
        db.prepare("DELETE FROM transfers").run();
        db.prepare("DELETE FROM visitors").run();
        db.prepare("DELETE FROM crimes").run();
        db.prepare("DELETE FROM incidents").run();
        db.prepare("DELETE FROM prisoners").run();
        db.prepare("DELETE FROM cells").run();
        db.prepare("DELETE FROM pavilions").run();
        db.prepare("DELETE FROM lawyers").run();
      })();
      res.json({ message: "Sistema resetado com sucesso." });
    } catch (e) {
      res.status(500).json({ message: "Erro ao resetar o sistema." });
    }
  }

  private setupLegacyRoutes() {
    const db = DatabaseConnection.getInstance();
    
    // Transfers
    this.app.get("/api/transfers", authenticateToken, (req, res) => {
      const transfers = db.prepare(`
        SELECT t.*, p.name as prisoner_name, i.name as inspector_name 
        FROM transfers t 
        JOIN prisoners p ON t.prisoner_id = p.id 
        LEFT JOIN inspectors i ON t.inspector_id = i.id
        ORDER BY t.id DESC
      `).all();
      res.json(transfers);
    });

    this.app.post("/api/transfers", authenticateToken, (req, res) => {
      const { prisoner_id, origin, destination, date, reason, is_external, new_cell_id, new_status } = req.body;
      const inspector_id = (req as any).user.id;
      
      try {
        db.transaction(() => {
          db.prepare("INSERT INTO transfers (prisoner_id, origin, destination, date, reason, inspector_id, new_cell_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .run(prisoner_id, origin, destination, date, reason, inspector_id, new_cell_id || null, is_external ? 'Transferido' : 'Concluído');
          
          if (!is_external && new_cell_id) {
            db.prepare("UPDATE prisoners SET cell_id = ?, status = ? WHERE id = ?")
              .run(new_cell_id, new_status, prisoner_id);
          } else if (is_external) {
            db.prepare("UPDATE prisoners SET status = 'Transferido', cell_id = NULL WHERE id = ?")
              .run(prisoner_id);
          }
        })();
        res.status(201).json({ message: "Transferência registrada com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao registrar transferência." });
      }
    });

    this.app.delete("/api/transfers/:id", authenticateToken, (req, res) => {
      try {
        db.prepare("DELETE FROM transfers WHERE id = ?").run(req.params.id);
        res.json({ message: "Transferência excluída com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir transferência." });
      }
    });

    // Lawyers
    this.app.get("/api/lawyers", authenticateToken, (req, res) => {
      const lawyers = db.prepare(`
        SELECT l.*, 
        (SELECT count(*) FROM lawyer_prisoner WHERE lawyer_id = l.id) as prisoner_count
        FROM lawyers l
        ORDER BY l.name ASC
      `).all();

      const lawyersWithPrisoners = lawyers.map((l: any) => {
        const linkedPrisoners = db.prepare(`
          SELECT p.id, p.name, p.registration_number
          FROM prisoners p
          JOIN lawyer_prisoner lp ON p.id = lp.prisoner_id
          WHERE lp.lawyer_id = ?
        `).all(l.id);
        return { ...l, linked_prisoners: linkedPrisoners };
      });

      res.json(lawyersWithPrisoners);
    });

    this.app.post("/api/lawyers", authenticateToken, (req, res) => {
      const { name, oab, phone, email, prisoner_ids } = req.body;
      try {
        db.transaction(() => {
          const result = db.prepare("INSERT INTO lawyers (name, oab, phone, email) VALUES (?, ?, ?, ?)")
            .run(name, oab, phone, email);
          const lawyer_id = result.lastInsertRowid;
          
          if (prisoner_ids && Array.isArray(prisoner_ids)) {
            const stmt = db.prepare("INSERT INTO lawyer_prisoner (lawyer_id, prisoner_id) VALUES (?, ?)");
            prisoner_ids.forEach(pId => stmt.run(lawyer_id, pId));
          }
        })();
        res.status(201).json({ message: "Advogado cadastrado com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao cadastrar advogado." });
      }
    });

    this.app.put("/api/lawyers/:id", authenticateToken, (req, res) => {
      const { name, oab, phone, email, prisoner_ids } = req.body;
      const { id } = req.params;
      try {
        db.transaction(() => {
          db.prepare("UPDATE lawyers SET name = ?, oab = ?, phone = ?, email = ? WHERE id = ?")
            .run(name, oab, phone, email, id);
          
          db.prepare("DELETE FROM lawyer_prisoner WHERE lawyer_id = ?").run(id);
          
          if (prisoner_ids && Array.isArray(prisoner_ids)) {
            const stmt = db.prepare("INSERT INTO lawyer_prisoner (lawyer_id, prisoner_id) VALUES (?, ?)");
            prisoner_ids.forEach(pId => stmt.run(id, pId));
          }
        })();
        res.json({ message: "Advogado atualizado com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao atualizar advogado." });
      }
    });

    this.app.delete("/api/lawyers/:id", authenticateToken, (req, res) => {
      try {
        db.transaction(() => {
          db.prepare("DELETE FROM lawyer_prisoner WHERE lawyer_id = ?").run(req.params.id);
          db.prepare("DELETE FROM lawyer_visits WHERE lawyer_id = ?").run(req.params.id);
          db.prepare("DELETE FROM lawyers WHERE id = ?").run(req.params.id);
        })();
        res.json({ message: "Advogado excluído com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir advogado." });
      }
    });

    // Lawyer Visits
    this.app.get("/api/lawyer-visits", authenticateToken, (req, res) => {
      const visits = db.prepare(`
        SELECT lv.*, l.name as lawyer_name, l.oab as lawyer_oab, p.name as prisoner_name, ins.name as inspector_name
        FROM lawyer_visits lv
        JOIN lawyers l ON lv.lawyer_id = l.id
        JOIN prisoners p ON lv.prisoner_id = p.id
        LEFT JOIN inspectors ins ON lv.inspector_id = ins.id
        ORDER BY lv.visit_date DESC, lv.visit_time DESC
      `).all();
      res.json(visits);
    });

    this.app.post("/api/lawyer-visits", authenticateToken, (req, res) => {
      const { lawyer_id, prisoner_id, visit_date, visit_time, visit_type, notes } = req.body;
      const inspector_id = (req as any).user.id;
      try {
        db.prepare("INSERT INTO lawyer_visits (lawyer_id, prisoner_id, visit_date, visit_time, visit_type, notes, inspector_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(lawyer_id, prisoner_id, visit_date, visit_time, visit_type, notes, inspector_id);
        res.status(201).json({ message: "Visita jurídica registrada com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao registrar visita jurídica." });
      }
    });

    this.app.delete("/api/lawyer-visits/:id", authenticateToken, (req, res) => {
      try {
        db.prepare("DELETE FROM lawyer_visits WHERE id = ?").run(req.params.id);
        res.json({ message: "Visita jurídica excluída com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir visita jurídica." });
      }
    });

    // Visitors
    this.app.get("/api/visitors", authenticateToken, (req, res) => {
      const prisoner_id = req.query.prisoner_id;
      let sql = `
        SELECT v.*, p.name as prisoner_name, p.registration_number as prisoner_registration
        FROM visitors v 
        JOIN prisoners p ON v.prisoner_id = p.id
      `;
      let params: any[] = [];
      if (prisoner_id) {
        sql += " WHERE v.prisoner_id = ?";
        params.push(prisoner_id);
      }
      sql += " ORDER BY v.id DESC";
      
      const visitors = db.prepare(sql).all(...params);
      res.json(visitors);
    });

    this.app.post("/api/visitors", authenticateToken, (req, res) => {
      const { name, document, prisoner_id, relation, visit_date, visit_time, phone, document_type, photo, status } = req.body;
      try {
        db.prepare("INSERT INTO visitors (name, document, prisoner_id, relation, visit_date, visit_time, phone, document_type, photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(name, document, prisoner_id, relation, visit_date, visit_time, phone, document_type, photo, status || 'Agendada');
        res.status(201).json({ message: "Visitante cadastrado com sucesso." });
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Erro ao cadastrar visitante." });
      }
    });

    this.app.patch("/api/visitors/:id/status", authenticateToken, (req, res) => {
      const { status } = req.body;
      try {
        db.prepare("UPDATE visitors SET status = ? WHERE id = ?").run(status, req.params.id);
        res.json({ message: "Status da visita atualizado com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao atualizar status da visita." });
      }
    });

    this.app.put("/api/visitors/:id", authenticateToken, (req, res) => {
      const { name, document, prisoner_id, relation, visit_date, visit_time, phone, document_type, photo, status } = req.body;
      try {
        db.prepare(`
          UPDATE visitors 
          SET name = ?, document = ?, prisoner_id = ?, relation = ?, visit_date = ?, visit_time = ?, phone = ?, document_type = ?, photo = ?, status = ?
          WHERE id = ?
        `).run(name, document, prisoner_id, relation, visit_date, visit_time, phone, document_type, photo, status, req.params.id);
        res.json({ message: "Visitante atualizado com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao atualizar visitante." });
      }
    });

    this.app.delete("/api/visitors/:id", authenticateToken, (req, res) => {
      try {
        db.prepare("DELETE FROM visitors WHERE id = ?").run(req.params.id);
        res.json({ message: "Visitante excluído com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir visitante." });
      }
    });

    // Incidents
    this.app.get("/api/incidents", authenticateToken, (req, res) => {
      const incidents = db.prepare(`
        SELECT i.*, ins.name as inspector_name
        FROM incidents i
        LEFT JOIN inspectors ins ON i.inspector_id = ins.id
        ORDER BY i.id DESC
      `).all();
      res.json(incidents);
    });

    this.app.post("/api/incidents", authenticateToken, (req, res) => {
      const { title, description, severity, date } = req.body;
      const inspector_id = (req as any).user.id;
      try {
        db.prepare("INSERT INTO incidents (title, description, severity, date, inspector_id) VALUES (?, ?, ?, ?, ?)")
          .run(title, description, severity, date, inspector_id);
        res.status(201).json({ message: "Ocorrência registrada com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao registrar ocorrência." });
      }
    });

    this.app.delete("/api/incidents/:id", authenticateToken, (req, res) => {
      try {
        db.prepare("DELETE FROM incidents WHERE id = ?").run(req.params.id);
        res.json({ message: "Ocorrência excluída com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir ocorrência." });
      }
    });

    // Crimes
    this.app.get("/api/crimes", authenticateToken, (req, res) => {
      const prisoner_id = req.query.prisoner_id;
      let sql = `
        SELECT c.*, p.name as prisoner_name 
        FROM crimes c 
        JOIN prisoners p ON c.prisoner_id = p.id
      `;
      let params: any[] = [];
      if (prisoner_id) {
        sql += " WHERE c.prisoner_id = ?";
        params.push(prisoner_id);
      }
      sql += " ORDER BY c.id DESC";
      
      const crimes = db.prepare(sql).all(...params);
      res.json(crimes);
    });

    this.app.post("/api/crimes", authenticateToken, (req, res) => {
      const { prisoner_id, article, description, crime_date, sentence_years, sentence_months, type, severity } = req.body;
      try {
        db.prepare("INSERT INTO crimes (prisoner_id, article, description, crime_date, sentence_years, sentence_months, type, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(prisoner_id, article, description, crime_date, sentence_years, sentence_months, type, severity);
        res.status(201).json({ message: "Crime registrado com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao registrar crime." });
      }
    });

    this.app.delete("/api/crimes/:id", authenticateToken, (req, res) => {
      try {
        db.prepare("DELETE FROM crimes WHERE id = ?").run(req.params.id);
        res.json({ message: "Crime excluído com sucesso." });
      } catch (e) {
        res.status(500).json({ message: "Erro ao excluir crime." });
      }
    });
  }

  private async setupVite() {
    console.log(`[Server] Setting up Vite middleware (NODE_ENV=${process.env.NODE_ENV})`);
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: process.cwd()
      });
      this.app.use(vite.middlewares);
    } else {
      this.app.use(express.static(path.join(__dirname, "dist")));
      this.app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    }
  }
}

const server = new PrisonServer();
server.start();
