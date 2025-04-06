import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

import express from 'express';
import cors from 'cors'; // ✅ importa o CORS
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Configura o CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://benurioutlet.github.io'
];

app.use(compression());

app.use(cors({
  origin: allowedOrigins,
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.produto');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
