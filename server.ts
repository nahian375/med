import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import db from "./server/config/db.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MedCore API is running" });
  });

  // Hospital Search API
  app.get("/api/hospitals", (req, res) => {
    const { query, type } = req.query;
    let hospitals;
    
    let sql = "SELECT * FROM hospitals WHERE 1=1";
    const params: any[] = [];

    if (query) {
      sql += " AND (name LIKE ? OR location LIKE ? OR speciality LIKE ?)";
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type && type !== 'All') {
      sql += " AND type = ?";
      params.push(type);
    }

    const stmt = db.prepare(sql);
    hospitals = stmt.all(...params);
    
    res.json(hospitals);
  });

  // Medical Stores API
  app.get("/api/medical-stores", (req, res) => {
    try {
      const stores = db.prepare("SELECT * FROM medical_stores").all();
      res.json(stores);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch medical stores" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
