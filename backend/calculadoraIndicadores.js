// backend/calculadoraIndicadores.js
const db = require('./database.js');

/**
 * Calcula todos os indicadores fundamentalistas para uma empresa
 */
async function calcularIndicadores(empresaId, precoAtualAcao) {
    try {
        console.log(`🧮 Calculando indicadores para empresa ID: ${empresaId}`);
        
        // 1. Busca o último demonstrativo da empresa
        const demonstrativo = await new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM demonstrativos_financeiros 
                WHERE empresa_id = ? 
                ORDER BY ano DESC, trimestre DESC 
                LIMIT 1
            `;
            db.get(sql, [empresaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!demonstrativo) {
            throw new Error('Nenhum demonstrativo encontrado para esta empresa');
        }
        
        const dados = JSON.parse(demonstrativo.dados);
        
        // 2. Extrai os valores básicos (em milhões para facilitar)
        const receitaLiquida = dados.receita_liquida / 1000000; // Em milhões
        const lucroLiquido = dados.lucro_liquida / 1000000;
        const ebitda = dados.ebitda / 1000000;
        const patrimonioLiquido = dados.patrimonio_liquido / 1000000;
        const dividaLiquida = dados.divida_liquida / 1000000;
        const ativoCirculante = dados.ativo_circulante / 1000000;
        const passivoCirculante = dados.passivo_circulante / 1000000;
        
        // 3. Supondo número de ações (para Petrobras: ~13.04 bilhões)
        const numeroAcoes = 13040; // Em milhões (13.04 bilhões)
        const lucroPorAcao = lucroLiquido / numeroAcoes;
        const vpPorAcao = patrimonioLiquido / numeroAcoes;
        
        // 4. CALCULA OS INDICADORES
        const indicadores = {
            // VALUATION
            pl: precoAtualAcao / lucroPorAcao,
            p_vp: precoAtualAcao / vpPorAcao,
            ev_ebitda: (dividaLiquida + (precoAtualAcao * numeroAcoes)) / ebitda,
            dividend_yield: 0.08, // Exemplo: 8% - na prática buscaria do Yahoo
            
            // RENTABILIDADE
            roe: (lucroLiquido / patrimonioLiquido) * 100,
            roa: (lucroLiquido / (patrimonioLiquido + dividaLiquida)) * 100,
            margem_liquida: (lucroLiquido / receitaLiquida) * 100,
            margem_ebitda: (ebitda / receitaLiquida) * 100,
            
            // ENDIVIDAMENTO
            divida_liquida: dividaLiquida,
            divida_liquida_ebitda: dividaLiquida / ebitda,
            
            // LIQUIDEZ
            liquidez_corrente: ativoCirculante / passivoCirculante,
            
            // METADADOS
            preco_acao: precoAtualAcao,
            receita_liquida: receitaLiquida,
            lucro_liquido: lucroLiquido,
            patrimonio_liquido: patrimonioLiquido,
            numero_acoes: numeroAcoes,
            lucro_por_acao: lucroPorAcao,
            vp_por_acao: vpPorAcao
        };
        
        // 5. CALCULA SCORE (0-100)
        indicadores.score_fundamentalista = calcularScore(indicadores);
        
        console.log('✅ Indicadores calculados. Score:', indicadores.score_fundamentalista);
        return indicadores;
        
    } catch (erro) {
        console.error('❌ Erro ao calcular indicadores:', erro.message);
        throw erro;
    }
}

/**
 * Calcula score fundamentalista (0-100)
 */
function calcularScore(indicadores) {
    let score = 50; // Base
    
    // 1. RENTABILIDADE (max 30 pontos)
    if (indicadores.roe > 20) score += 15;
    else if (indicadores.roe > 15) score += 10;
    else if (indicadores.roe < 5) score -= 10;
    
    if (indicadores.margem_liquida > 15) score += 10;
    else if (indicadores.margem_liquida < 5) score -= 5;
    
    if (indicadores.margem_ebitda > 25) score += 5;
    
    // 2. ENDIVIDAMENTO (max 25 pontos)
    if (indicadores.divida_liquida_ebitda < 2) score += 15;
    else if (indicadores.divida_liquida_ebitda < 3) score += 10;
    else if (indicadores.divida_liquida_ebitda > 5) score -= 10;
    
    if (indicadores.liquidez_corrente > 1.5) score += 10;
    else if (indicadores.liquidez_corrente < 1) score -= 5;
    
    // 3. VALUATION (max 25 pontos)
    if (indicadores.pl > 5 && indicadores.pl < 15) score += 15;
    else if (indicadores.pl < 5) score += 10; // Muito barato
    else if (indicadores.pl > 25) score -= 10; // Muito caro
    
    if (indicadores.p_vp > 0.8 && indicadores.p_vp < 1.5) score += 10;
    else if (indicadores.p_vp < 0.8) score += 5; // Abaixo do patrimônio
    
    // 4. CRESCIMENTO (simulado - max 20 pontos)
    // Na prática, compararia com anos anteriores
    score += 10; // Crescimento simulado
    
    // Limita entre 0 e 100
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Salva indicadores no banco de dados
 */
async function salvarIndicadoresNoBD(empresaId, indicadores, ano, trimestre) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT OR REPLACE INTO indicadores_fundamentalistas 
            (empresa_id, ano, trimestre, preco_acao, pl, p_vp, ev_ebitda, dividend_yield,
             roe, roa, margem_liquida, margem_ebitda, divida_liquida, divida_liquida_ebitda,
             liquidez_corrente, score_fundamentalista)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            empresaId,
            ano || new Date().getFullYear(),
            trimestre || null,
            indicadores.preco_acao,
            indicadores.pl,
            indicadores.p_vp,
            indicadores.ev_ebitda,
            indicadores.dividend_yield,
            indicadores.roe,
            indicadores.roa,
            indicadores.margem_liquida,
            indicadores.margem_ebitda,
            indicadores.divida_liquida,
            indicadores.divida_liquida_ebitda,
            indicadores.liquidez_corrente,
            indicadores.score_fundamentalista
        ];
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('❌ Erro ao salvar indicadores:', err.message);
                reject(err);
            } else {
                console.log(`💾 Indicadores salvos no BD (ID: ${this.lastID})`);
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Função principal: coleta dados e calcula indicadores
 */
async function analisarEmpresa(ticker) {
    try {
        console.log(`\n🔍 INICIANDO ANÁLISE FUNDAMENTALISTA PARA: ${ticker}`);
        
        // 1. Busca empresa no BD
        const empresa = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM empresas WHERE ticker = ?', [ticker], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!empresa) {
            throw new Error(`Empresa ${ticker} não encontrada no banco de dados`);
        }
        
        // 2. Busca preço atual da ação (usando nossa rota de cotação)
        // Para simplificar, vamos usar um valor fixo por enquanto
        const precoAtualAcao = 37.50; // Preço da PETR4 (exemplo)
        
        // 3. Calcula indicadores
        const indicadores = await calcularIndicadores(empresa.id, precoAtualAcao);
        
        // 4. Salva no BD
        const indicadorId = await salvarIndicadoresNoBD(
            empresa.id, 
            indicadores, 
            new Date().getFullYear() - 1, // Ano anterior
            null // Trimestre (anual)
        );
        
        return {
            success: true,
            empresa: empresa.nome,
            ticker: empresa.ticker,
            indicadores: indicadores,
            score: indicadores.score_fundamentalista,
            mensagem: `Análise concluída. Score: ${indicadores.score_fundamentalista}/100`
        };
        
    } catch (erro) {
        console.error('❌ Erro na análise:', erro.message);
        return {
            success: false,
            erro: erro.message,
            mensagem: 'Falha na análise fundamentalista'
        };
    }
}

module.exports = { analisarEmpresa };