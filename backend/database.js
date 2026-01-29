// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Definir o caminho para o arquivo do banco de dados
//    O arquivo será criado na pasta 'database' que está no mesmo nível que 'backend'
const dbPath = path.join(__dirname, '..', 'database', 'acoespp.db');

// 2. Conectar (ou criar) o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite em:', dbPath);
        criarTabelas();
    }
});

// backend/database.js - FUNÇÃO criarTabelas() ATUALIZADA
function criarTabelas() {
    // backend/database.js - COMANDO sqlEmpresas CORRIGIDO
    const sqlEmpresas = `
        CREATE TABLE IF NOT EXISTS empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT UNIQUE NOT NULL,
            nome TEXT,
            setor TEXT,
            cnpj TEXT,
            data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // 2. NOVA TABELA: demonstrativos_financeiros - Dados brutos da CVM
    const sqlDemonstrativos = `
        CREATE TABLE IF NOT EXISTS demonstrativos_financeiros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            tipo_documento TEXT CHECK(tipo_documento IN ('DFP', 'ITR')),
            ano INTEGER NOT NULL,
            trimestre INTEGER, -- NULL para anual (DFP), 1-4 para trimestral (ITR)
            dados TEXT NOT NULL, -- JSON com todos os números extraídos
            data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id),
            UNIQUE(empresa_id, tipo_documento, ano, trimestre)
        )
    `;

    // backend/database.js - COMANDO CORRIGIDO para criar a tabela de indicadores
    const sqlIndicadores = `
        CREATE TABLE IF NOT EXISTS indicadores_fundamentalistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa_id INTEGER NOT NULL,
            ano INTEGER NOT NULL,
            trimestre INTEGER,
            -- Dados de Valuation
            preco_acao REAL,
            pl REAL,
            p_vp REAL,
            ev_ebitda REAL,
            dividend_yield REAL,
            -- Dados de Rentabilidade
            roe REAL,
            roa REAL,
            margem_liquida REAL,
            margem_ebitda REAL,
            -- Dados de Endividamento
            divida_liquida REAL,
            divida_liquida_ebitda REAL,
            -- Dados de Liquidez
            liquidez_corrente REAL,
            -- Score final (MODIFICAÇÃO AQUI: removido CHECK complexo)
            score_fundamentalista INTEGER,
            data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id),
            UNIQUE(empresa_id, ano, trimestre)
        )
    `;

    // Executa todas as criações em sequência
    db.serialize(() => {
        db.run(sqlEmpresas, (err) => {
            if (err) console.error('❌ Erro tabela "empresas":', err.message);
            else console.log('✅ Tabela "empresas" OK.');
        });

        db.run(sqlDemonstrativos, (err) => {
            if (err) console.error('❌ Erro tabela "demonstrativos":', err.message);
            else console.log('✅ Tabela "demonstrativos_financeiros" OK.');
        });

        db.run(sqlIndicadores, (err) => {
            if (err) console.error('❌ Erro tabela "indicadores":', err.message);
            else console.log('✅ Tabela "indicadores_fundamentalistas" OK.');
            inserirEmpresaExemplo(); // Só inserir exemplo depois de criar tudo
            inserirSegundoExemplo(); // <-- ADICIONE ESTA LINHA
        });
    });
}

// 4. Função para inserir uma empresa de exemplo
// backend/database.js - FUNÇÃO inserirEmpresaExemplo() ATUALIZADA
function inserirEmpresaExemplo() {
    const sqlInsert = `INSERT OR IGNORE INTO empresas (ticker, nome, setor, cnpj) VALUES (?, ?, ?, ?)`;
    const exemplo = [
        'PETR4.SA',
        'Petróleo Brasileiro S.A. (Petrobras)',
        'Petróleo, Gás e Biocombustíveis',
        '33000167000101' // CNPJ da Petrobras (formato apenas números, 14 dígitos)
    ];

    db.run(sqlInsert, exemplo, function(err) {
        if (err) {
            console.error('❌ Erro ao inserir exemplo:', err.message);
        } else if (this.changes > 0) {
            console.log(`✅ Empresa exemplo "${exemplo[0]}" inserida com CNPJ.`);
        } else {
            console.log(`ℹ️ Empresa exemplo "${exemplo[0]}" já existia.`);
        }
    });
}

// backend/database.js - ADICIONE esta função após inserirEmpresaExemplo()
function inserirSegundoExemplo() {
    const sqlInsert = `INSERT OR IGNORE INTO empresas (ticker, nome, setor, cnpj) VALUES (?, ?, ?, ?)`;
    const exemploB3 = [
        'B3SA3.SA',
        'B3 S.A. - Brasil, Bolsa, Balcão',
        'Serviços Financeiros',
        '09346601000125' // CNPJ da B3 - sabemos que funciona
    ];

    db.run(sqlInsert, exemploB3, function(err) {
        if (err) {
            console.error('❌ Erro ao inserir B3:', err.message);
        } else if (this.changes > 0) {
            console.log(`✅ Empresa exemplo "${exemploB3[0]}" inserida.`);
        } else {
            console.log(`ℹ️ Empresa "${exemploB3[0]}" já existia.`);
        }
    });
}

// 5. Exportar a conexão do banco para usar em outros arquivos (como server.js)
module.exports = db;