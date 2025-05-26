
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
  methods: ['GET', 'POST', 'PUT'],
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


// Acesso à tabela aluno pelo login
app.get('/api/aluno', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      `SELECT 
          ea.*, 
          e.cpf AS cpf, 
          e.rg AS rg, 
          e.cep AS cep,
          e.endereco AS endereco,
          e.cidade AS cidade
        FROM public.aluno ea
        JOIN public.dadospessoalaluno e ON ea.id = e.aluno_id
        WHERE ea.id = $1`,
      [id]
    );

    res.json(result.rows[0]); // Retorna apenas um aluno
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
});


// Acesso à tabela dados estagio pelo login do aluno
app.get('/api/dados_estagio', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      'SELECT * FROM public.estagio WHERE aluno_id = $1',
      [id]
    );

    res.json(result.rows[0]); // Retorna apenas um aluno
  } catch (error) {
    console.error('Erro ao buscar estagio:', error);
    res.status(500).json({ error: 'Erro ao buscar dados estagio' });
  }
});



// Acesso à tabela dados estagio pelo login do aluno
app.get('/api/dados_empresa', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      `SELECT 
         ea.*, 
         e.nome_empresa AS nome_empresa, 
         e.endereco AS endereco, 
         e.local AS local,
         e.cnpj AS cnpj
       FROM public.empresaaluno ea
       JOIN public.empresa e ON ea.empresa_id = e.id
       WHERE ea.aluno_id = $1`,
      [id]
    );

    res.json(result.rows[0]); // Retorna os dados combinados
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
  }
});


// Acesso à tabela dados estagio info
app.get('/api/dados_estagio_info', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      'SELECT * FROM public.dados_estagio WHERE aluno_id = $1',
      [id]
    );

    res.json(result.rows[0]); // Retorna apenas um aluno
  } catch (error) {
    console.error('Erro ao buscar estagio:', error);
    res.status(500).json({ error: 'Erro ao buscar dados estagio' });
  }
});


// Acesso à tabela dados aluno em relação com fatec 
app.get('/api/dados_fatec_aluno', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // Decodificado pelo middleware

    const result = await pool.query(
      `SELECT 
         ea.*, 
         e.cidade AS cidade, 
         e.endereco AS endereco 
       FROM public.dados_fatec_aluno ea
       JOIN public.dadosfatec e ON ea.dadosfatec_id = e.id
       WHERE ea.aluno_id = $1`,
      [id]
    );

    res.json(result.rows[0]); // Retorna apenas um aluno
  } catch (error) {
    console.error('Erro ao buscar dados fatec:', error);
    res.status(500).json({ error: 'Erro ao buscar dados fatec' });
  }
});


  // Acesso à tabela dados da solicitação
  app.get('/api/estagio_solicitacao', verificarToken, async (req, res) => {
    try {
      const { id } = req.usuario; // Decodificado pelo middleware

      const result = await pool.query(
        'SELECT * FROM public.estagio_solicitacao WHERE aluno_id = $1',
        [id]
      );

      res.json(result.rows[0]); // Retorna apenas um aluno
    } catch (error) {
      console.error('Erro ao buscar estagio:', error);
      res.status(500).json({ error: 'Erro ao buscar dados estagio' });
    }
  });



// faz atualização dos dados do representante. 
app.put('/api/atualizacao_representante', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const { nome_representante, cargo_funcao, cpf_representante } = req.body;

    const result = await pool.query(
      `UPDATE public.empresaaluno
       SET nome_representante = $1,
           cargo_funcao = $2,
           cpf_representante = $3
       WHERE aluno_id = $4
       RETURNING *`,
      [nome_representante, cargo_funcao, cpf_representante, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Dados da empresa não encontrados para o aluno.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar dados do representante:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados do representante.' });
  }
});


// Faz atualização dos dados do aluno.
app.put('/api/atualizacao_dados_aluno', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const { cep, endereco, cidade, telefone } = req.body;

    // Atualiza tabela dadospessoalaluno
    const resultDados = await pool.query(
      `UPDATE public.dadospessoalaluno
       SET cep = $1,
           endereco = $2,
           cidade = $3
       WHERE aluno_id = $4
       RETURNING *`,
      [cep, endereco, cidade, id]
    );

    // Atualiza tabela aluno
    const resultAluno = await pool.query(
      `UPDATE public.aluno
       SET telefone = $1
       WHERE id = $2
       RETURNING *`,
      [telefone, id]
    );

    if (resultDados.rowCount === 0 || resultAluno.rowCount === 0) {
      return res.status(404).json({ error: 'Dados do aluno não encontrados.' });
    }

    // Retorna os dados atualizados das duas tabelas
    res.status(200).json({
      dadosPessoaisAtualizados: resultDados.rows[0],
      alunoAtualizado: resultAluno.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do aluno:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados do aluno.' });
  }
});

// solicitação estagio 
app.post('/api/solicitacao_estagio', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const { time_de_estagio, modelo, data_inicial, data_final } = req.body;

    // Inserir na tabela estagio_solicitacao
    const resultSolicitacao = await pool.query(
      `INSERT INTO public.estagio_solicitacao 
        (aluno_id, time_de_estagio, modelo, data_inicial_estagio, data_final_estagio) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, time_de_estagio, modelo, data_inicial, data_final]
    );

    // Inserir na tabela estagio
    const resultEstagio = await pool.query(
      `INSERT INTO public.estagio 
        (aluno_id, status, tipo_de_estagio, modelo, solicitacao, data_solicitacao,
         status_do_termo, prorrogacao_periodo, transicao_do_obrigatorio,
         rescisao_termo, relatorio_estagio, ficha_avaliacao)
       VALUES 
        ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        'Pendente', // status
        time_de_estagio,
        modelo,
        'Solicitado',
        'Pendente',
        'Não',
        'Não',
        'Não',
        'Não',
        'Não'
      ]
    );

    
      // Atualiza tabela aluno
      const resultAluno = await pool.query(
        `UPDATE public.aluno
        SET modalidade = $1,
            status = $2
        WHERE id = $3
        RETURNING *`,
        ['Estagio', 'Ativo', id]
      );

    res.status(201).json({
      solicitacao: resultSolicitacao.rows[0],
      estagio: resultEstagio.rows[0],
      alunoAtualizado: resultAluno.rows[0]

    });

  } catch (error) {
    console.error('Erro ao inserir solicitação de estágio:', error);
    res.status(500).json({ error: 'Erro ao inserir solicitação de estágio.' });
  }
});




app.post('/api/add_dados_empresa', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const { nome_empresa, cnpj, endereco, local, estado, nome_representante, cargo_funcao, cpf_representante } = req.body;

    // Verificar se o CNPJ já está cadastrado
    const empresaExistente = await pool.query(
      'SELECT id FROM public.empresa WHERE cnpj = $1',
      [cnpj]
    );

    let empresa_id;

    if (empresaExistente.rows.length > 0) {
      // Empresa já existe, usar o id existente
      empresa_id = empresaExistente.rows[0].id;
    } else {
      // Empresa não existe, inserir nova
      const resultAdicionarEmpresa = await pool.query(
        `INSERT INTO public.empresa
          (nome_empresa, cnpj, endereco, local, estado) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [nome_empresa, cnpj, endereco, local, estado]
      );

      empresa_id = resultAdicionarEmpresa.rows[0].id;
    }

    // Inserir na tabela representante (empresaaluno)
    const resultEstagio = await pool.query(
      `INSERT INTO public.empresaaluno
        (aluno_id, empresa_id, nome_representante, cargo_funcao, cpf_representante)
       VALUES 
        ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id, empresa_id, nome_representante, cargo_funcao, cpf_representante
      ]
    );

    res.status(201).json({
      mensagem: 'Empresa e representante cadastrados com sucesso!',
      empresa: empresa_id,
      representante: resultEstagio.rows[0]
    });

  } catch (error) {
    console.error('Erro ao inserir dados da empresa e representante:', error);
    res.status(500).json({ error: 'Erro ao inserir dados da empresa e representante.' });
  }
});



//adicionar dados do estagio 
app.post('/api/add_dados_estagio', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const {valor,  horas_semanais, horas_entrada, horas_saida, horas_refeicao } = req.body;

    // Inserir na tabela representante (empresaaluno)
    const resultDadosEstagio = await pool.query(
      `INSERT INTO public.dados_estagio
        (aluno_id, valor, horas_semanais, horas_entrada, horas_saida, horas_refeicao )
       VALUES 
        ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id, valor,  horas_semanais, horas_entrada, horas_saida, horas_refeicao
      ]
    );

    res.status(201).json({
      dados_estagio: resultDadosEstagio.rows[0]
    });

  } catch (error) {
    console.error('Erro ao inserir dados da estagio:', error);
    res.status(500).json({ error: 'Erro ao inserir dados estagio.' });
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



// I cientifica

//adiciona iC
app.post('/api/solicitacao_ic', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token
    const {
      instituicao_centro_pesquisa, tema, data_inicial, data_final,
      orientador, horario, dias_da_semana, descricao_atividade
    } = req.body;

    // Validação: campos obrigatórios
    if (!instituicao_centro_pesquisa || !tema || !data_inicial || !data_final || !orientador) {
      return res.status(400).json({ error: 'Campos obrigatórios não foram preenchidos.' });
    }

    // Atualiza tabela aluno
    const alterarModificacaoAluno = await pool.query(
      `UPDATE public.aluno
       SET modalidade = $1
       WHERE id = $2
       RETURNING *`,
      ['I. Cientifica', id]
    );

    // Inserir dados na tabela dados_i_cientifico
    const dadosIC = await pool.query(
      `INSERT INTO public.dados_i_cientifico
        (aluno_id, instituicao_centro_pesquisa, tema, data_inicial, data_final, 
         orientador, horario, dias_da_semana, descricao_atividade)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id, instituicao_centro_pesquisa, tema, data_inicial, data_final,
        orientador, horario, dias_da_semana, descricao_atividade
      ]
    );

    if (alterarModificacaoAluno.rowCount === 0 || dadosIC.rowCount === 0) {
      return res.status(404).json({ error: 'Dados do aluno não encontrados.' });
    }

    res.status(200).json({
      alterarModificacaoAluno: alterarModificacaoAluno.rows[0],
      alunoAtualizado: dadosIC.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do aluno:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados do aluno.' });
  }
});




//retira  iC
app.put('/api/cancelar_ic_aluno', verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // aluno_id extraído do token

    // Atualiza tabela aluno
    const alterarModificacaoAluno = await pool.query(
      `UPDATE public.aluno
       SET modalidade = $1
       WHERE id = $2
       RETURNING *`,
      ['Sem modalidade', id]
    );

    // Remove os dados da tabela dados_i_cientifico
    const dadosIC = await pool.query(
      `DELETE FROM public.dados_i_cientifico
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (alterarModificacaoAluno.rowCount === 0 || dadosIC.rowCount === 0) {
      return res.status(404).json({ error: 'Dados do aluno não encontrados.' });
    }

    res.status(200).json({
      alunoAtualizado: alterarModificacaoAluno.rows[0],
      dadosIcRemovidos: dadosIC.rows[0],
    });
  } catch (error) {
    console.error('Erro ao cancelar IC:', error);
    res.status(500).json({ error: 'Erro ao cancelar IC.' });
  }
});


