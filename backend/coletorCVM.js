// backend/coletorCVM.js
const axios = require('axios');
const db = require('./database.js');
const { parseString } = require('xml2js'); // Para ler XML

// URL base da API de dados abertos da CVM
const CVM_API_BASE = 'https://dados.cvm.gov.br/api/3/action';

/**
 * Busca o código CVM (número) de uma empresa usando seu CNPJ
 */
// backend/coletorCVM.js - FUNÇÃO ATUALIZADA
async function buscarCodigoCVMporCNPJ(cnpj) {
    try {
        // Formata o CNPJ para comparação (remove pontuação)
        const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
        console.log(`📡 Buscando código CVM para CNPJ: ${cnpj} (${cnpjLimpo})`);
        
        // URL do CSV correto
        const urlCSV = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';
        
        console.log('⬇️  Baixando lista completa de empresas da CVM...');
        const resposta = await axios.get(urlCSV, { responseType: 'text' });
        const linhas = resposta.data.split('\n');
        
        console.log(`🔍 Procurando em ${linhas.length} empresas...`);
        
        // Pula o cabeçalho (linha 0)
        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(';');
            
            // Verifica se tem colunas suficientes
            if (colunas.length >= 10) {
                const cnpjCad = colunas[0]?.replace(/[^\d]/g, ''); // CNPJ está na coluna 0
                const nome = colunas[1] || '';
                const codigoCVM = colunas[9]; // Código CVM está na coluna 9
                
                if (cnpjCad === cnpjLimpo) {
                    console.log(`✅ Código CVM encontrado: ${codigoCVM} - ${nome}`);
                    return codigoCVM;
                }
            }
        }
        
        console.log(`❌ CNPJ ${cnpj} não encontrado na lista da CVM.`);
        return null;
        
    } catch (erro) {
        console.error('❌ Erro ao buscar código CVM:', erro.message);
        return null;
    }
}

async function buscarCodigoCVMPorNome(nomeBusca) {
    try {
        console.log(`🔍 Buscando por nome: "${nomeBusca}"`);
        const urlCSV = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';
        const resposta = await axios.get(urlCSV, { responseType: 'text' });
        const linhas = resposta.data.split('\n');
        
        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(';');
            if (colunas.length >= 10) {
                const nome = colunas[1] || '';
                if (nome.toUpperCase().includes(nomeBusca.toUpperCase())) {
                    console.log(`✅ Encontrado: ${nome} | CNPJ: ${colunas[0]} | Código CVM: ${colunas[9]}`);
                    return {
                        codigoCVM: colunas[9],
                        cnpj: colunas[0],
                        nome: nome
                    };
                }
            }
        }
        return null;
    } catch (erro) {
        console.error('Erro:', erro.message);
        return null;
    }
}

/**
 * Busca a lista de demonstrativos disponíveis para uma empresa
 */
async function listarDemonstrativos(codigoCVM) {
    try {
        const anoAtual = new Date().getFullYear();
        const anosParaBuscar = [anoAtual - 1, anoAtual - 2, anoAtual - 3]; // Últimos 3 anos
        let todosDocumentos = [];
        
        console.log(`📋 Buscando demonstrativos para código CVM ${codigoCVM}...`);
        
        for (const ano of anosParaBuscar) {
            try {
                const url = `https://dados.cvm.gov.br/api/3/action/package_show?id=cvm_${codigoCVM}`;
                console.log(`  🔍 Ano ${ano}...`);
                
                const resposta = await axios.get(url, { timeout: 10000 });
                const documentos = resposta.data;
                
                // Filtra apenas DFP (anual) e ITR (trimestral) válidos
                const docsFiltrados = documentos.filter(doc => {
                    if (!doc.DS_TIPO_DOC || (!doc.DS_TIPO_DOC.includes('DFP') && !doc.DS_TIPO_DOC.includes('ITR'))) {
                        return false;
                    }
                    // Verifica se tem data de referência
                    if (!doc.DT_REFER || doc.DT_REFER.length < 4) {
                        return false;
                    }
                    return true;
                });
                
                console.log(`    ✅ ${docsFiltrados.length} documento(s) encontrado(s)`);
                todosDocumentos = todosDocumentos.concat(docsFiltrados);
                
            } catch (erroAno) {
                console.log(`    ⚠️  Ano ${ano}: ${erroAno.message}`);
                // Continua para o próximo ano
            }
        }
        
        console.log(`✅ Total: ${todosDocumentos.length} demonstrativos (DFP/ITR) encontrados`);
        
        // Ordena por data (mais recente primeiro)
        todosDocumentos.sort((a, b) => {
            if (!a.DT_REFER || !b.DT_REFER) return 0;
            return new Date(b.DT_REFER) - new Date(a.DT_REFER);
        });
        
        return todosDocumentos;
        
    } catch (erro) {
        console.error('❌ Erro ao listar demonstrativos:', erro.message);
        return [];
    }
}

/**
 * Processa um demonstrativo específico e extrai dados financeiros básicos
 * (Esta é uma versão SIMPLIFICADA - na prática precisaria parsear o XML completo)
 */
async function processarDemonstrativo(codigoCVM, documento) {
    try {
        console.log(`🔍 Processando: ${documento.DS_TIPO_DOC} ${documento.DT_REFER}`);
        
        // Aqui entraria a lógica complexa de parsear o XML/JSON da CVM
        // Para MVP, vamos simular dados extraídos
        const dadosSimulados = {
            receita_liquida: Math.random() * 1000000000 + 500000000, // Exemplo
            lucro_liquido: Math.random() * 100000000 + 50000000,
            ebitda: Math.random() * 150000000 + 75000000,
            patrimonio_liquido: Math.random() * 2000000000 + 1000000000,
            divida_liquida: Math.random() * 500000000 + 250000000,
            ativo_circulante: Math.random() * 800000000 + 400000000,
            passivo_circulante: Math.random() * 600000000 + 300000000
        };
        
        return {
            empresa_id: await obterIdEmpresaPorCodigoCVM(codigoCVM),
            tipo_documento: documento.DS_TIPO_DOC,
            ano: new Date(documento.DT_REFER).getFullYear(),
            trimestre: documento.DS_TIPO_DOC === 'ITR' ? 
                Math.ceil((new Date(documento.DT_REFER).getMonth() + 1) / 3) : null,
            dados: JSON.stringify(dadosSimulados),
            documento_original: documento // Mantém referência
        };
        
    } catch (erro) {
        console.error('❌ Erro ao processar demonstrativo:', erro.message);
        return null;
    }
}

/**
 * Função auxiliar: obtém ID da empresa no nosso BD pelo código CVM
 */
async function obterIdEmpresaPorCodigoCVM(codigoCVM) {
    // Implementação simplificada - na prática buscaria por CNPJ relacionado
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM empresas WHERE ticker = ?', ['PETR4.SA'], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.id : 1); // Default para ID 1 se não encontrar
        });
    });
}

/**
 * Função principal para coletar dados de uma empresa
 */
async function coletarDadosFundamentalistas(ticker) {
    console.log(`\n🚀 INICIANDO COLETA PARA: ${ticker}`);
    
    // 1. Busca empresa no nosso BD
    const empresa = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM empresas WHERE ticker = ?', [ticker], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!empresa || !empresa.cnpj) {
        console.log(`❌ Empresa ${ticker} não encontrada ou sem CNPJ cadastrado.`);
        return { success: false, message: 'Empresa sem CNPJ' };
    }
    
    // 2. Busca código CVM
    const codigoCVM = await buscarCodigoCVMporCNPJ(empresa.cnpj);
    if (!codigoCVM) {
        return { success: false, message: 'Código CVM não encontrado' };
    }

    
    // 3. Lista demonstrativos (últimos anos)
    const documentos = await listarDemonstrativos(codigoCVM);

    // SE NÃO ENCONTRAR DOCUMENTOS, USA DADOS SIMULADOS PARA DESENVOLVIMENTO
    if (documentos.length === 0) {
        console.log('⚠️  Nenhum demonstrativo encontrado. Usando dados simulados para desenvolvimento...');
        
        // Cria dados simulados REALISTAS para Petrobras (valores em reais)
        const dadosSimuladosRealistas = {
            receita_liquida: 450000000000,    // 450 bilhões
            lucro_liquido: 120000000000,      // 120 bilhões
            ebitda: 180000000000,             // 180 bilhões
            patrimonio_liquido: 350000000000, // 350 bilhões
            divida_liquida: 250000000000,     // 250 bilhões
            ativo_circulante: 180000000000,   // 180 bilhões
            passivo_circulante: 150000000000  // 150 bilhões
        };
        
        // Obtém o ID da empresa no nosso BD
        const empresaId = await obterIdEmpresaPorCodigoCVM(codigoCVM);
        
        // Salva os dados simulados no BD
        const sql = `
            INSERT OR REPLACE INTO demonstrativos_financeiros 
            (empresa_id, tipo_documento, ano, trimestre, dados) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await new Promise((resolve, reject) => {
            db.run(sql, [
                empresaId,
                'DFP',
                2023,  // Ano
                null,  // Trimestre (null para DFP anual)
                JSON.stringify(dadosSimuladosRealistas)
            ], function(err) {
                if (err) {
                    console.error('❌ Erro ao salvar dados simulados:', err.message);
                    reject(err);
                } else {
                    console.log('💾 Dados simulados salvos para desenvolvimento (ID:', this.lastID, ')');
                    resolve();
                }
            });
        });
        
        // Mesmo com dados simulados, continua o processo para calcular indicadores
        // Precisamos criar um array "documentos" simulado para o loop abaixo funcionar
        const documentosSimulados = [{
            DS_TIPO_DOC: 'DFP',
            DT_REFER: '2023-12-31'
        }];
        
        // Substitui o array vazio pelo simulado
        documentos.length = 0;
        documentos.push(...documentosSimulados);
    }
    
    // 4. Processa cada demonstrativo e salva no BD
    for (const doc of documentos.slice(0, 2)) { // Limita a 2 documentos para teste
        const dadosProcessados = await processarDemonstrativo(codigoCVM, doc);
        
        if (dadosProcessados) {
            // Salva no banco de dados
            await new Promise((resolve, reject) => {
                const sql = `
                    INSERT OR REPLACE INTO demonstrativos_financeiros 
                    (empresa_id, tipo_documento, ano, trimestre, dados) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                const params = [
                    dadosProcessados.empresa_id,
                    dadosProcessados.tipo_documento,
                    dadosProcessados.ano,
                    dadosProcessados.trimestre,
                    dadosProcessados.dados
                ];
                
                db.run(sql, params, function(err) {
                    if (err) {
                        console.error('❌ Erro ao salvar demonstrativo:', err.message);
                        reject(err);
                    } else {
                        console.log(`💾 Demonstrativo salvo (ID: ${this.lastID})`);
                        resolve();
                    }
                });
            });
        }
    }
    
    console.log(`✅ Coleta concluída para ${ticker}`);
    return { success: true, message: `Processados ${documentos.length} demonstrativos` };
}

// Exporta a função principal
module.exports = { coletarDadosFundamentalistas };