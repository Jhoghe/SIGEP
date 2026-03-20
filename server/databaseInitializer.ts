import DatabaseConnection from "./database.js";
import bcrypt from "bcryptjs";

export class DatabaseInitializer {
  private db: any;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public init() {
    console.log('[DatabaseInitializer] Starting database initialization...');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inspectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'inspector'
      );

      CREATE TABLE IF NOT EXISTS pavilions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS cells (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE,
        capacity INTEGER,
        pavilion_id INTEGER,
        block TEXT,
        type TEXT DEFAULT 'Normal',
        status TEXT DEFAULT 'Disponível',
        FOREIGN KEY (pavilion_id) REFERENCES pavilions(id)
      );

      CREATE TABLE IF NOT EXISTS prisoners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        registration_number TEXT UNIQUE,
        cell_id INTEGER,
        entry_date TEXT,
        crime TEXT,
        status TEXT DEFAULT 'Ativo',
        is_isolated INTEGER DEFAULT 0,
        age INTEGER,
        parents TEXT,
        marital_status TEXT,
        photo TEXT,
        is_recidivist INTEGER DEFAULT 0,
        FOREIGN KEY (cell_id) REFERENCES cells(id)
      );

      CREATE TABLE IF NOT EXISTS crimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prisoner_id INTEGER,
        article TEXT,
        description TEXT,
        crime_date TEXT,
        sentence_years INTEGER,
        sentence_months INTEGER,
        type TEXT,
        severity TEXT,
        FOREIGN KEY (prisoner_id) REFERENCES prisoners(id)
      );

      CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        document TEXT,
        document_type TEXT,
        phone TEXT,
        photo TEXT,
        prisoner_id INTEGER,
        relation TEXT,
        visit_date TEXT,
        visit_time TEXT,
        status TEXT DEFAULT 'Agendada',
        FOREIGN KEY (prisoner_id) REFERENCES prisoners(id)
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prisoner_id INTEGER,
        origin TEXT,
        destination TEXT,
        date TEXT,
        reason TEXT,
        status TEXT DEFAULT 'completed',
        inspector_id INTEGER,
        new_cell_id INTEGER,
        FOREIGN KEY (prisoner_id) REFERENCES prisoners(id),
        FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
      );

      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        oab TEXT UNIQUE,
        phone TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS lawyer_prisoner (
        lawyer_id INTEGER,
        prisoner_id INTEGER,
        PRIMARY KEY (lawyer_id, prisoner_id),
        FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
        FOREIGN KEY (prisoner_id) REFERENCES prisoners(id)
      );

      CREATE TABLE IF NOT EXISTS lawyer_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER,
        prisoner_id INTEGER,
        visit_date TEXT,
        notes TEXT,
        FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
        FOREIGN KEY (prisoner_id) REFERENCES prisoners(id)
      );

      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        date TEXT,
        inspector_id INTEGER,
        FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        date TEXT,
        severity TEXT,
        inspector_id INTEGER,
        FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
      );

      CREATE TABLE IF NOT EXISTS general_information (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        category TEXT,
        created_at TEXT,
        updated_at TEXT,
        inspector_id INTEGER,
        FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
      );
    `);

    console.log('[DatabaseInitializer] Tables created. Running migrations...');
    this.runMigrations();
    console.log('[DatabaseInitializer] Migrations complete. Seeding data...');
    this.seed();
    console.log('[DatabaseInitializer] Database initialization complete.');
  }

  private runMigrations() {
    // Prisoners migrations
    const tableInfo = this.db.prepare("PRAGMA table_info(prisoners)").all() as any[];
    const columns = tableInfo.map((c: any) => c.name);

    const migrations = [
      { name: 'is_isolated', type: 'INTEGER DEFAULT 0' },
      { name: 'age', type: 'INTEGER' },
      { name: 'parents', type: 'TEXT' },
      { name: 'marital_status', type: 'TEXT' },
      { name: 'photo', type: 'TEXT' },
      { name: 'is_recidivist', type: 'INTEGER DEFAULT 0' },
      { name: 'birth_date', type: 'TEXT' },
      { name: 'father_name', type: 'TEXT' },
      { name: 'mother_name', type: 'TEXT' },
      { name: 'observations', type: 'TEXT' }
    ];

    migrations.forEach(m => {
      if (!columns.includes(m.name)) {
        try {
          this.db.exec(`ALTER TABLE prisoners ADD COLUMN ${m.name} ${m.type}`);
        } catch (e) {}
      }
    });

    // Cells migrations
    const cellTableInfo = this.db.prepare("PRAGMA table_info(cells)").all() as any[];
    const cellColumns = cellTableInfo.map((c: any) => c.name);
    if (!cellColumns.includes('pavilion_id')) {
      try { this.db.exec(`ALTER TABLE cells ADD COLUMN pavilion_id INTEGER REFERENCES pavilions(id)`); } catch (e) {}
    }
    if (!cellColumns.includes('type')) {
      try { this.db.exec(`ALTER TABLE cells ADD COLUMN type TEXT DEFAULT 'Normal'`); } catch (e) {}
    }
    if (!cellColumns.includes('status')) {
      try { this.db.exec(`ALTER TABLE cells ADD COLUMN status TEXT DEFAULT 'Disponível'`); } catch (e) {}
    }

    // Crimes migrations
    const crimeTableInfo = this.db.prepare("PRAGMA table_info(crimes)").all() as any[];
    const crimeColumns = crimeTableInfo.map((c: any) => c.name);
    if (!crimeColumns.includes('type')) {
      try { this.db.exec(`ALTER TABLE crimes ADD COLUMN type TEXT`); } catch (e) {}
    }

    // Transfers migrations
    const transferTableInfo = this.db.prepare("PRAGMA table_info(transfers)").all() as any[];
    const transferColumns = transferTableInfo.map((c: any) => c.name);
    if (!transferColumns.includes('inspector_id')) {
      try { this.db.exec(`ALTER TABLE transfers ADD COLUMN inspector_id INTEGER REFERENCES inspectors(id)`); } catch (e) {}
    }
    if (!transferColumns.includes('new_cell_id')) {
      try { this.db.exec(`ALTER TABLE transfers ADD COLUMN new_cell_id INTEGER`); } catch (e) {}
    }

    // Visitors migrations
    const visitorTableInfo = this.db.prepare("PRAGMA table_info(visitors)").all() as any[];
    const visitorColumns = visitorTableInfo.map((c: any) => c.name);
    
    const visitorMigrations = [
      { name: 'visit_time', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'document_type', type: 'TEXT' },
      { name: 'photo', type: 'TEXT' },
      { name: 'status', type: "TEXT DEFAULT 'Agendada'" }
    ];

    visitorMigrations.forEach(m => {
      if (!visitorColumns.includes(m.name)) {
        try {
          this.db.exec(`ALTER TABLE visitors ADD COLUMN ${m.name} ${m.type}`);
        } catch (e) {}
      }
    });

    // Lawyer Visits migrations
    const lawyerVisitTableInfo = this.db.prepare("PRAGMA table_info(lawyer_visits)").all() as any[];
    const lawyerVisitColumns = lawyerVisitTableInfo.map((c: any) => c.name);
    
    const lawyerVisitMigrations = [
      { name: 'visit_time', type: 'TEXT' },
      { name: 'visit_type', type: 'TEXT' },
      { name: 'inspector_id', type: 'INTEGER REFERENCES inspectors(id)' },
      { name: 'created_at', type: "TEXT DEFAULT CURRENT_TIMESTAMP" }
    ];

    lawyerVisitMigrations.forEach(m => {
      if (!lawyerVisitColumns.includes(m.name)) {
        try {
          this.db.exec(`ALTER TABLE lawyer_visits ADD COLUMN ${m.name} ${m.type}`);
        } catch (e) {}
      }
    });
  }

  private seed() {
    const inspectorCount = this.db.prepare("SELECT count(*) as count FROM inspectors").get().count;
    console.log(`[DatabaseInitializer] Current inspector count: ${inspectorCount}`);
    if (inspectorCount === 0) {
      console.log('[DatabaseInitializer] Seeding default admin user...');
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      this.db.prepare("INSERT INTO inspectors (username, password, name, role) VALUES (?, ?, ?, ?)").run(
        "admin",
        hashedPassword,
        "Administrador Geral",
        "admin"
      );
      console.log('[DatabaseInitializer] Default admin user seeded.');
      
      // Seed some pavilions
      const pavCount = this.db.prepare("SELECT count(*) as count FROM pavilions").get().count;
      console.log(`[DatabaseInitializer] Current pavilion count: ${pavCount}`);
      if (pavCount === 0) {
        console.log('[DatabaseInitializer] Seeding default pavilions and cells...');
        this.db.prepare("INSERT INTO pavilions (name, description) VALUES (?, ?)").run("Pavilhão A", "Segurança Máxima");
        this.db.prepare("INSERT INTO pavilions (name, description) VALUES (?, ?)").run("Pavilhão B", "Regime Semi-aberto");
        this.db.prepare("INSERT INTO pavilions (name, description) VALUES (?, ?)").run("Pavilhão C", "Triagem e Observação");
        
        // Seed some cells
        this.db.prepare("INSERT INTO cells (number, capacity, pavilion_id, block, type) VALUES (?, ?, ?, ?, ?)").run("A-101", 4, 1, "A", "Normal");
        this.db.prepare("INSERT INTO cells (number, capacity, pavilion_id, block, type) VALUES (?, ?, ?, ?, ?)").run("A-102", 1, 1, "A", "Isolamento");
        this.db.prepare("INSERT INTO cells (number, capacity, pavilion_id, block, type) VALUES (?, ?, ?, ?, ?)").run("B-201", 2, 2, "B", "Normal");
        this.db.prepare("INSERT INTO cells (number, capacity, pavilion_id, block, type) VALUES (?, ?, ?, ?, ?)").run("C-301", 1, 3, "C", "Solitária");
        console.log('[DatabaseInitializer] Default pavilions and cells seeded.');
      }

      // Seed some prisoners
      console.log('[DatabaseInitializer] Seeding default prisoners...');
      this.db.prepare("INSERT INTO prisoners (name, registration_number, cell_id, entry_date, crime, is_isolated) VALUES (?, ?, ?, ?, ?, ?)").run(
        "João Silva", "2024001", 1, "2024-01-15", "Art. 157 - Roubo", 0
      );
      this.db.prepare("INSERT INTO prisoners (name, registration_number, cell_id, entry_date, crime, is_isolated) VALUES (?, ?, ?, ?, ?, ?)").run(
        "Ricardo Santos", "2024002", 1, "2024-02-10", "Art. 121 - Homicídio", 1
      );
      console.log('[DatabaseInitializer] Default prisoners seeded.');
    }
  }
}
