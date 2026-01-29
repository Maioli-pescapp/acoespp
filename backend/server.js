// backend/server.js
const express = require('express');
const axios = require('axios');
const db = require('./database.js');
const cors = require('cors'); // <-- 1. Importar o pacote
const app = express();
const PORT = 3000;

// 2. Configurar o CORS para permitir a origem do Live Server
app.use(cors({
    origin: 'http://127.0.0.1:5500' // URL exata do seu front-end no Live Server
}));

app.use(express.json());

// ... o resto do código (rotas /teste, /empresas, /cotacao) permanece IGUAL ...

// ROTA DE TESTE
app.get('/teste', (req, res) => {
  res.json({ mensagem: '✅ Servidor do Açõespp está funcionando!' });
});

// NOVA ROTA: Listar todas as empresas do banco
app.get('/empresas', (req, res) => {
  const sql = `SELECT * FROM empresas ORDER BY ticker`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: err.message });
      return;
    }
    res.json(rows);
  });
});

// backend/server.js - NOVA ROTA PARA COTAÇÃO REAL
app.get('/cotacao/:ticker', async (req, res) => {
  const { ticker } = req.params;
  
  try {
    // 1. Primeiro, busca dados da empresa no nosso BD local
    const sql = `SELECT * FROM empresas WHERE ticker = ?`;
    db.get(sql, [ticker], async (err, row) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro no banco de dados', detalhes: err.message });
      }

      // 2. Configura os dados base da resposta
      const respostaBase = {
        ticker: ticker,
        nome: row ? row.nome : 'Não cadastrada localmente',
        setor: row ? row.setor : null,
        origem: 'Banco de dados local + API Yahoo Finance'
      };

      // 3. Busca a cotação REAL na API do Yahoo Finance
      const urlYahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      
      try {
        const respostaApi = await axios.get(urlYahoo, {
          headers: { 'User-Agent': 'axios/1.6.7' } // Algumas APIs exigem header
        });
        
        const dadosYahoo = respostaApi.data;

        // 4. Extrai o preço mais recente do JSON da API
        if (dadosYahoo.chart?.result?.[0]?.meta?.regularMarketPrice) {
          const precoAtual = dadosYahoo.chart.result[0].meta.regularMarketPrice;
          const precoAnterior = dadosYahoo.chart.result[0].meta.previousClose;
          const variacao = precoAtual - precoAnterior;
          const variacaoPercentual = ((variacao / precoAnterior) * 100).toFixed(2);

          // 5. Retorna sucesso com dados completos
          res.json({
            ...respostaBase, // Espalha os dados base
            cotacao: {
              preco_atual: precoAtual,
              preco_anterior: precoAnterior,
              variacao_reais: variacao.toFixed(2),
              variacao_percentual: variacaoPercentual,
              moeda: dadosYahoo.chart.result[0].meta.currency,
              atualizado_em: new Date(dadosYahoo.chart.result[0].meta.regularMarketTime * 1000).toLocaleTimeString('pt-BR')
            },
            status: 'sucesso',
            mensagem: 'Cotação obtida com sucesso da API Yahoo Finance.'
          });

        } else {
          // Se a API não retornar o preço esperado
          res.json({
            ...respostaBase,
            cotacao: null,
            status: 'aviso',
            mensagem: 'API retornou dados, mas não encontrou o preço regular para este ticker.'
          });
        }

      } catch (erroApi) {
        // Se a chamada à API Yahoo falhar
        console.error('Erro na API Yahoo Finance:', erroApi.message);
        res.json({
          ...respostaBase,
          cotacao: null,
          status: 'erro_api',
          mensagem: `Falha ao buscar na API externa: ${erroApi.message}`
        });
      }
    });

  } catch (erroGeral) {
    res.status(500).json({ 
      ticker: ticker,
      status: 'erro_servidor',
      mensagem: `Erro interno no servidor: ${erroGeral.message}`
    });
  }
});

// Importa o coletor
const { coletarDadosFundamentalistas } = require('./coletorCVM.js');

// ROTA PARA TESTAR A COLETA DE DADOS FUNDAMENTALISTAS
app.get('/coletar/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        const resultado = await coletarDadosFundamentalistas(ticker);
        res.json({
            ticker: ticker,
            resultado: resultado,
            mensagem: 'Coleta de dados fundamentalistas executada. Verifique o terminal do servidor para detalhes.'
        });
    } catch (erro) {
        res.status(500).json({
            ticker: ticker,
            erro: erro.message,
            mensagem: 'Falha na coleta de dados.'
        });
    }
});

// Importa a calculadora
const { analisarEmpresa } = require('./calculadoraIndicadores.js');

// ROTA PARA ANÁLISE FUNDAMENTALISTA
app.get('/analisar/:ticker', async (req, res) => {
    const { ticker } = req.params;
    
    try {
        const resultado = await analisarEmpresa(ticker);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({
            success: false,
            ticker: ticker,
            erro: erro.message,
            mensagem: 'Erro na análise fundamentalista'
        });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});