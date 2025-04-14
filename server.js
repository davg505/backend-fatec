
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

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
  'http://localhost:5174',
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


function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Espera: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }

    req.usuario = usuario; // usuário = { id, email, tipo }
    next();
  });
}

  export default verificarToken;



// acesso ao login 
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Verifica se é aluno
    const result = await pool.query('SELECT * FROM public.aluno WHERE email = $1', [email]);
    if (result.rows.length > 0 && result.rows[0].senha === senha) {
      const aluno = result.rows[0];
      const token = jwt.sign(
        { id: aluno.id, email: aluno.email, tipo: 'aluno' },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      await pool.query(
        'UPDATE public.aluno SET token = $1 WHERE id = $2',
        [token, aluno.id]
      );

      return res.json({ success: true, tipo: 'aluno', token });
    }

    // Verifica se é professor
    const resultProfessor = await pool.query('SELECT * FROM public.professor WHERE email = $1', [email]);
    if (resultProfessor.rows.length > 0 && resultProfessor.rows[0].senha === senha) {
      const professor = resultProfessor.rows[0];
      const token = jwt.sign(
        { id: professor.id, email: professor.email, tipo: 'professor' },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      await pool.query(
        'UPDATE public.professor SET token = $1 WHERE id = $2',
        [token, professor.id]
      );

      return res.json({ success: true, tipo: 'professor', token });
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

// Acesso à tabela aluno pelo login
app.get('/api/aluno', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      'SELECT * FROM public.aluno WHERE id = $1',
      [id]
    );

    res.json(result.rows[0]); // Retorna apenas um aluno
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar aluno' });
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
