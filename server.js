import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://davg505.github.io',
  'http://localhost:5174'
];

app.use(compression());
app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
}));

// ✅ Pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Função para verificar token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    req.user = user;
    next();
  });
};

// ✅ Login com JWT
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM public.aluno WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const aluno = result.rows[0];

      if (aluno.senha === senha) {
        const token = jwt.sign({ email, tipo: 'aluno' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ success: true, tipo: 'aluno', token });
      }
    }

    const resultProfessor = await pool.query('SELECT * FROM public.professor WHERE email = $1', [email]);

    if (resultProfessor.rows.length > 0) {
      const professor = resultProfessor.rows[0];

      if (professor.senha === senha) {
        const token = jwt.sign({ email, tipo: 'professor' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ success: true, tipo: 'professor', token });
      }
    }

    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });

  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// ✅ Rota para validar token
app.get('/api/validar-token', verificarToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ✅ Rotas protegidas
app.get('/api/alunos', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.aluno');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
});

app.get('/api/dadosfatec', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.dadosfatec');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar dados fatec:', error);
    res.status(500).json({ error: 'Erro ao buscar dados fatec' });
  }
});

app.get('/api/dadospessoalaluno', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.dadospessoalaluno');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar dados pessoais:', error);
    res.status(500).json({ error: 'Erro ao buscar dados pessoais' });
  }
});

app.get('/api/empresa', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.empresa');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

app.get('/api/empresaaluno', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.empresaaluno');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar empresaaluno:', error);
    res.status(500).json({ error: 'Erro ao buscar empresaaluno' });
  }
});

app.get('/api/estagio', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.estagio');
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar estagio:', error);
    res.status(500).json({ error: 'Erro ao buscar estagio' });
  }
});

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
