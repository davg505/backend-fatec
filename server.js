
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
  'https://davg505.github.io'
];

app.use(compression());

app.use(express.json());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// acesso ao login 
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Buscar o usuário pelo email fornecido
    const result = await pool.query('SELECT * FROM public.aluno WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const aluno = result.rows[0];

      // Verificar se a senha bate
      if (aluno.senha === senha) {
        return res.json({
          success: true,
          tipo: 'aluno' // Informando que o usuário é aluno
        });
      }
    }

    // Caso não seja aluno, tenta buscar como professor
    const resultProfessor = await pool.query('SELECT * FROM public.professor WHERE email = $1', [email]);

    if (resultProfessor.rows.length > 0) {
      const professor = resultProfessor.rows[0];

      // Verificar se a senha bate
      if (professor.senha === senha) {
        return res.json({
          success: true,
          tipo: 'professor' // Informando que o usuário é professor
        });
      }
    }

    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });

  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});


// acesso a tabela aluno 
app.get('/api/alunos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.aluno');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/dadosfatec', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.dadosfatec');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/dadospessoalaluno', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.dadospessoalaluno');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/empresa', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.empresa');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/empresaaluno', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.empresaaluno');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/estagio', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.estagio');
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
