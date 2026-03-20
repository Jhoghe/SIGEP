import { Database } from "better-sqlite3";
import DatabaseConnection from "../database.js";

export abstract class BaseRepository<T> {
  protected db: Database;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  abstract findById(id: number): T | undefined;
  abstract findAll(): T[];
  abstract delete(id: number): void;
}
