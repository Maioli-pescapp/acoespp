// frontend/js/app.js

// URL base do nosso servidor back-end (ajuste se necessário)
// ============================================
// CONFIGURAÇÃO PARA PWA (GITHUB PAGES)
// ============================================

// URLs PÚBLICAS - Funciona no celular
const API_BASE_URL = window.location.hostname.includes('github.io') 
    ? ''  // Modo PWA offline no GitHub Pages
    : 'http://localhost:3000';  // Modo desenvolvimento local

// Dados MOCKADOS para desenvolvimento PWA
async function buscarDadosMockados(ticker) {
    console.log('📊 Modo PWA: usando dados mockados');
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dados REALISTAS da Petrobras
    return {
        success: true,
        empresa: "Petróleo Brasileiro S.A. - Petrobras",
        ticker: ticker || "PETR4.SA",
        score: 78,
        indicadores: {
            pl: 5.42,
            p_vp: 1.40,
            ev_ebitda: 4.11,
            dividend_yield: 8.5,
            roe: 22.5,
            roa: 8.7,
            margem_liquida: 15.2,
            margem_ebitda: 40.0,
            divida_liquida_ebitda: 1.39,
            liquidez_corrente: 1.20,
            divida_liquida: 250000000000,
            receita_liquida: 450000000000,
            patrimonio_liquido: 350000000000,
            numero_acoes: 13040000000,
            lucro_por_acao: 2.85,
            vp_por_acao: 26.84
        },
        mensagem: "✅ Análise PWA - Dados para demonstração"
    };
}

async function testarConexao() {
    const resultadoElemento = document.getElementById('resultado-teste');
    resultadoElemento.textContent = "Testando modo PWA...";
    resultadoElemento.style.color = '#666';

    try {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Verifica se é PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone ||
                     document.referrer.includes('android-app://');
        
        resultadoElemento.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #4CAF50, #2E5AAC);
                color: white;
                padding: 20px;
                border-radius: 12px;
                margin-top: 10px;
                text-align: center;
            ">
                <div style="font-size: 2em; margin-bottom: 10px;">✅</div>
                <div style="font-weight: 600; margin-bottom: 5px;">MODO PWA ATIVO</div>
                <div style="font-size: 0.9em; opacity: 0.9;">
                    ${isPWA ? '📱 Aplicativo instalado' : '🌐 Navegador web'}
                </div>
                <div style="font-size: 0.85em; margin-top: 10px;">
                    Funcionando offline com dados demonstrativos
                </div>
            </div>
        `;
        
    } catch (erro) {
        resultadoElemento.innerHTML = `
            <div style="
                background: #ffebee;
                color: #c62828;
                padding: 15px;
                border-radius: 10px;
                margin-top: 10px;
                text-align: center;
            ">
                <div style="font-size: 1.5em;">⚠️</div>
                <div style="font-weight: 600;">MODO OFFLINE</div>
                <div style="font-size: 0.9em;">
                    Usando dados demonstrativos
                </div>
            </div>
        `;
    }
}

// frontend/js/app.js - NOVA FUNÇÃO buscarCotacao()
async function buscarCotacao() {
    const ticker = document.getElementById('inputTicker').value.trim();
    const resultadoElemento = document.getElementById('resultado-cotacao');

    if (!ticker) {
        resultadoElemento.innerHTML = `<p style="color: orange;">Por favor, insira um código de ação.</p>`;
        return;
    }

    resultadoElemento.innerHTML = `<p>Buscando ${ticker}...</p>`;

    try {
        // NO GitHub Pages não temos backend, então usa dados mockados
        if (window.location.hostname.includes('github.io') || !API_BASE_URL) {
            // Modo PWA - dados mockados
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const dadosMockados = {
                ticker: ticker,
                nome: ticker === "PETR4.SA" ? "Petrobras" : 
                      ticker === "VALE3.SA" ? "Vale S.A." : 
                      ticker === "ITUB4.SA" ? "Itaú Unibanco" : "Empresa",
                cotacao: {
                    preco_atual: 37.50 + (Math.random() * 5 - 2.5),
                    preco_anterior: 36.80,
                    variacao_reais: (Math.random() * 2 - 1).toFixed(2),
                    variacao_percentual: (Math.random() * 3 - 1.5).toFixed(2),
                    moeda: "BRL",
                    atualizado_em: new Date().toLocaleTimeString('pt-BR')
                },
                status: 'sucesso',
                mensagem: 'Dados demonstrativos (modo PWA)'
            };
            
            // Exibe os dados
            exibirCotacao(dadosMockados);
            return;
        }
        
        // Modo desenvolvimento com backend local
        const resposta = await fetch(`${API_BASE_URL}/cotacao/${ticker}`);
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
        
        const dados = await resposta.json();
        exibirCotacao(dados);
        
    } catch (erro) {
        console.error("Erro na busca:", erro);
        resultadoElemento.innerHTML = `
            <div style="background: #ffebee; padding: 20px; border-radius: 10px; color: #c62828;">
                <p><strong>⚠️ Modo PWA Offline</strong></p>
                <p>Para cotações em tempo real, execute o backend localmente:</p>
                <ol style="text-align: left; margin-left: 20px;">
                    <li>Abra terminal na pasta "backend"</li>
                    <li>Execute: <code>node server.js</code></li>
                    <li>No PC, acesse: <code>http://localhost:3000</code></li>
                </ol>
                <p><em>Enquanto isso, usando dados demonstrativos...</em></p>
                <button onclick="buscarCotacaoMock()" style="margin-top: 10px; padding: 10px 20px; background: #2E5AAC; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Usar Dados Demonstrativos
                </button>
            </div>
        `;
    }
}

// Função auxiliar para exibir cotação
function exibirCotacao(dados) {
    const resultadoElemento = document.getElementById('resultado-cotacao');
    
    if (dados.cotacao && dados.cotacao.preco_atual) {
        const corVariacao = parseFloat(dados.cotacao.variacao_percentual) >= 0 ? '#4CAF50' : '#F44336';
        const simboloVariacao = parseFloat(dados.cotacao.variacao_percentual) >= 0 ? '▲' : '▼';
        
        resultadoElemento.innerHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid #2E5AAC;">
                <h3 style="margin-top: 0; color: #2E5AAC;">${dados.nome} (${dados.ticker})</h3>
                <p><strong>Status:</strong> ${dados.mensagem}</p>
                <hr>
                <div style="font-size: 1.8em; font-weight: bold;">
                    R$ ${dados.cotacao.preco_atual.toFixed(2)}
                    <span style="font-size: 0.7em; color: ${corVariacao}; margin-left: 10px;">
                        ${simboloVariacao} ${Math.abs(parseFloat(dados.cotacao.variacao_percentual)).toFixed(2)}%
                    </span>
                </div>
                <p><small>Variação: R$ ${dados.cotacao.variacao_reais} (${dados.cotacao.variacao_percentual}%)</small></p>
                <p><small><em>Atualizado: ${dados.cotacao.atualizado_em}</em></small></p>
            </div>
        `;
    }
}

// Função para dados mockados
async function buscarCotacaoMock() {
    const ticker = document.getElementById('inputTicker').value.trim() || "PETR4.SA";
    
    // Dados realistas para empresas comuns
    const empresas = {
        "PETR4.SA": { nome: "Petrobras", base: 37.50 },
        "VALE3.SA": { nome: "Vale S.A.", base: 68.90 },
        "ITUB4.SA": { nome: "Itaú Unibanco", base: 32.15 },
        "BBDC4.SA": { nome: "Bradesco", base: 14.80 },
        "WEGE3.SA": { nome: "WEG S.A.", base: 36.20 }
    };
    
    const empresa = empresas[ticker] || { nome: "Empresa Genérica", base: 50.00 };
    
    const dadosMockados = {
        ticker: ticker,
        nome: empresa.nome,
        cotacao: {
            preco_atual: empresa.base + (Math.random() * 5 - 2.5),
            preco_anterior: empresa.base,
            variacao_reais: (Math.random() * 2 - 1).toFixed(2),
            variacao_percentual: (Math.random() * 3 - 1.5).toFixed(2),
            moeda: "BRL",
            atualizado_em: new Date().toLocaleTimeString('pt-BR')
        },
        status: 'sucesso',
        mensagem: '📱 Dados demonstrativos (modo PWA)'
    };
    
    exibirCotacao(dadosMockados);
}

async function analisarAcao(event) {
    // 1. PREVINE COMPORTAMENTOS PADRÃO (PWA)
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('📱 analisarAcao() - MODO PWA INICIADO');
    
    const resultadoElemento = document.getElementById('resultado-cotacao');
    const ticker = document.getElementById('inputTicker').value.trim() || 'PETR4.SA';
    
    // 2. LOADING PARA PWA
    resultadoElemento.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #2E5AAC, #4CAF50);
            color: white;
            padding: 30px 25px;
            border-radius: 20px;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 8px 25px rgba(46, 90, 172, 0.3);
        ">
            <div style="font-size: 2.8em; margin-bottom: 15px;">🔍</div>
            <div style="font-size: 1.3em; font-weight: 700; margin-bottom: 10px;">
                Analisando ${ticker}
            </div>
            <div style="color: rgba(255,255,255,0.9);">
                Modo PWA - Calculando indicadores...
            </div>
        </div>
    `;
    
    // Rola para o card (mobile friendly)
    resultadoElemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
        // 3. USA DADOS MOCKADOS (PWA)
        console.log('🔄 PWA: Buscando dados mockados...');
        const dados = await buscarDadosMockados(ticker);
        
        if (!dados.success) {
            throw new Error(dados.mensagem || 'Erro na análise PWA');
        }
        
        console.log('✅ PWA: Dados mockados carregados, score:', dados.score);
        
        // 4. CORES DO SCORE (PWA)
        let corScore, statusScore, emojiScore;
        if (dados.score >= 70) {
            corScore = '#00C853'; statusScore = 'EXCELENTE'; emojiScore = '💎';
        } else if (dados.score >= 40) {
            corScore = '#FF9800'; statusScore = 'MODERADO'; emojiScore = '⚠️';
        } else {
            corScore = '#F44336'; statusScore = 'FRACO'; emojiScore = '🔻';
        }
        
        // 5. FUNÇÃO PARA FORMATAR (PWA)
        function formatarValorPWA(valor, sufixo = '', casas = 2) {
            if (valor === null || valor === undefined) return '─';
            if (typeof valor === 'number') {
                // Formata números grandes para PWA
                if (Math.abs(valor) >= 1000000000) {
                    return (valor / 1000000000).toFixed(1) + ' Bi' + sufixo;
                }
                if (Math.abs(valor) >= 1000000) {
                    return (valor / 1000000).toFixed(1) + ' Mi' + sufixo;
                }
                return valor.toFixed(casas) + sufixo;
            }
            return valor;
        }
        
        // 6. CARD PWA COMPLETO (MOBILE FIRST)
        resultadoElemento.innerHTML = `
            <div id="card-pwa" style="
                background: white;
                border-radius: 24px;
                margin: 25px 0;
                box-shadow: 0 10px 35px rgba(0,0,0,0.12);
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <!-- CABEÇALHO PWA -->
                <div style="
                    background: linear-gradient(135deg, #2E5AAC, ${corScore});
                    color: white;
                    padding: 30px 25px;
                    position: relative;
                ">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex: 1;">
                            <div style="font-size: 1.1em; opacity: 0.9; margin-bottom: 5px;">
                                ${dados.ticker}
                            </div>
                            <div style="font-size: 1.5em; font-weight: 800;">
                                ${dados.empresa.length > 25 ? dados.empresa.substring(0, 25) + '...' : dados.empresa}
                            </div>
                        </div>
                        <div style="
                            background: rgba(255,255,255,0.2);
                            padding: 15px;
                            border-radius: 16px;
                            min-width: 90px;
                            text-align: center;
                            backdrop-filter: blur(10px);
                            border: 2px solid rgba(255,255,255,0.3);
                        ">
                            <div style="font-size: 2.5em; font-weight: 900;">${dados.score}</div>
                            <div style="font-size: 0.85em; opacity: 0.9;">/100</div>
                        </div>
                    </div>
                    
                    <!-- STATUS PWA -->
                    <div style="
                        margin-top: 20px;
                        padding: 12px 18px;
                        background: rgba(255,255,255,0.15);
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        font-size: 1em;
                    ">
                        <span style="font-size: 1.3em;">${emojiScore}</span>
                        <span style="font-weight: 700;">${statusScore}</span>
                        <span style="opacity: 0.9; font-size: 0.95em;">• PWA</span>
                    </div>
                </div>
                
                <!-- INDICADORES PWA (GRID 2x2) -->
                <div style="padding: 25px;">
                    ${[
                        { titulo: '💰 VALUATION', cor: '#2E5AAC', icon: '💰', indicadores: [
                            { nome: 'P/L', valor: dados.indicadores.pl },
                            { nome: 'P/VP', valor: dados.indicadores.p_vp },
                            { nome: 'EV/EBITDA', valor: dados.indicadores.ev_ebitda },
                            { nome: 'DIV YIELD', valor: dados.indicadores.dividend_yield, sufixo: '%' }
                        ]},
                        { titulo: '📈 RENTABILIDADE', cor: '#4CAF50', icon: '📈', indicadores: [
                            { nome: 'ROE', valor: dados.indicadores.roe, sufixo: '%' },
                            { nome: 'MARGEM LÍQ', valor: dados.indicadores.margem_liquida, sufixo: '%' },
                            { nome: 'MARGEM EBITDA', valor: dados.indicadores.margem_ebitda, sufixo: '%' },
                            { nome: 'ROA', valor: dados.indicadores.roa, sufixo: '%' }
                        ]},
                        { titulo: '🏛️ ENDIVIDAMENTO', cor: '#FF9800', icon: '🏛️', indicadores: [
                            { nome: 'DÍV/EBITDA', valor: dados.indicadores.divida_liquida_ebitda },
                            { nome: 'LIQ. CORRENTE', valor: dados.indicadores.liquidez_corrente },
                            { nome: 'DÍVIDA LÍQ', valor: dados.indicadores.divida_liquida },
                            { nome: 'PATRIMÔNIO', valor: dados.indicadores.patrimonio_liquido }
                        ]}
                    ].map(grupo => `
                        <div style="margin-bottom: 25px;">
                            <div style="
                                color: ${grupo.cor};
                                font-weight: 800;
                                font-size: 1.1em;
                                margin-bottom: 18px;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <span>${grupo.icon}</span>
                                <span>${grupo.titulo}</span>
                            </div>
                            
                            <div style="
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 15px;
                            ">
                                ${grupo.indicadores.map(ind => `
                                    <div style="
                                        background: #f8f9fa;
                                        padding: 18px 15px;
                                        border-radius: 14px;
                                        text-align: center;
                                        border-left: 4px solid ${grupo.cor};
                                    ">
                                        <div style="
                                            font-size: 0.85em;
                                            color: #666;
                                            margin-bottom: 8px;
                                        ">
                                            ${ind.nome}
                                        </div>
                                        <div style="
                                            font-size: 1.6em;
                                            font-weight: 800;
                                            color: #333;
                                        ">
                                            ${formatarValorPWA(ind.valor, ind.sufixo || '')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- BOTÕES PWA (TOUCH FRIENDLY) -->
                <div style="
                    padding: 25px;
                    background: #f8f9fa;
                    border-top: 1px solid #eaeaea;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                ">
                    <button onclick="analisarAcao(event)" style="
                        padding: 18px;
                        background: #2E5AAC;
                        color: white;
                        border: none;
                        border-radius: 14px;
                        font-weight: 700;
                        font-size: 1em;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        🔄 Nova Análise
                    </button>
                    
                    <div style="
                        padding: 18px;
                        background: #4CAF50;
                        color: white;
                        border-radius: 14px;
                        font-weight: 700;
                        font-size: 1em;
                        text-align: center;
                        cursor: pointer;
                    " onclick="alert('📱 Modo PWA - Em desenvolvimento')">
                        💾 Salvar
                    </div>
                </div>
                
                <!-- RODAPÉ PWA -->
                <div style="
                    padding: 20px;
                    background: #f0f2f5;
                    color: #666;
                    font-size: 0.85em;
                    text-align: center;
                    border-top: 1px solid #eaeaea;
                ">
                    <div style="margin-bottom: 5px; font-weight: 600;">
                        📱 Açõespp PWA
                    </div>
                    <div style="opacity: 0.8;">
                        ${new Date().toLocaleString('pt-BR')} • Dados demonstrativos
                    </div>
                </div>
            </div>
            
            <!-- ESPAÇO PARA O DEDO NO MOBILE -->
            <div style="height: 50px;"></div>
        `;
        
        // 7. FEEDBACK TÁTIL (PWA)
        setTimeout(() => {
            resultadoElemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Touch feedback
            const card = document.getElementById('card-pwa');
            if (card) {
                card.style.transition = 'transform 0.2s';
                card.addEventListener('touchstart', () => {
                    card.style.transform = 'scale(0.995)';
                });
                card.addEventListener('touchend', () => {
                    card.style.transform = 'scale(1)';
                });
            }
        }, 100);
        
        console.log('🎉 PWA: Card renderizado com sucesso!');
        
    } catch (erro) {
        console.error('❌ Erro PWA:', erro);
        
        resultadoElemento.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #FF5252, #F44336);
                color: white;
                padding: 30px 25px;
                border-radius: 20px;
                margin: 25px 0;
                text-align: center;
            ">
                <div style="font-size: 2.5em; margin-bottom: 15px;">⚠️</div>
                <div style="font-size: 1.3em; font-weight: 700; margin-bottom: 10px;">
                    Modo Offline PWA
                </div>
                <div style="margin-bottom: 20px; opacity: 0.9;">
                    Conecte-se à internet para dados em tempo real
                </div>
                <button onclick="analisarAcao(event)" style="
                    padding: 15px 30px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1em;
                    cursor: pointer;
                ">
                    🔄 Usar Dados Demonstrativos
                </button>
            </div>
        `;
    }
    
    return false;
}

// ============================================
// SISTEMA DE RECOMENDAÇÕES (MOCK)
// ============================================

async function gerarRecomendacoes() {
    console.log('🎯 Gerando recomendações...');
    
    // Empresas mockadas para demonstração
    const empresasMock = [
        {
            ticker: "PETR4.SA",
            nome: "Petrobras",
            score: 78,
            indicadores: { pl: 5.4, p_vp: 1.4, roe: 22.5, margem_liquida: 15.2 },
            recomendacao: "COMPRAR",
            motivo: "Valuation atrativo, setor em alta"
        },
        {
            ticker: "VALE3.SA", 
            nome: "Vale S.A.",
            score: 72,
            indicadores: { pl: 6.2, p_vp: 1.8, roe: 25.1, margem_liquida: 28.4 },
            recomendacao: "COMPRAR",
            motivo: "Alta margem, commodity valorizada"
        },
        {
            ticker: "ITUB4.SA",
            nome: "Itaú Unibanco",
            score: 68,
            indicadores: { pl: 9.1, p_vp: 1.2, roe: 18.7, margem_liquida: 22.3 },
            recomendacao: "COMPRAR",
            motivo: "Setor financeiro estável"
        },
        {
            ticker: "BBDC4.SA",
            nome: "Bradesco",
            score: 42,
            indicadores: { pl: 12.5, p_vp: 0.9, roe: 8.4, margem_liquida: 10.1 },
            recomendacao: "VENDER",
            motivo: "ROE em queda, margens comprimidas"
        },
        {
            ticker: "WEGE3.SA",
            nome: "WEG S.A.",
            score: 85,
            indicadores: { pl: 35.2, p_vp: 8.7, roe: 28.9, margem_liquida: 18.7 },
            recomendacao: "MANTER",
            motivo: "Excelente empresa, mas valuation alto"
        },
        {
            ticker: "MGLU3.SA",
            nome: "Magazine Luiza",
            score: 35,
            indicadores: { pl: -4.2, p_vp: 2.1, roe: -5.8, margem_liquida: -2.4 },
            recomendacao: "VENDER",
            motivo: "Prejuízo, endividamento alto"
        }
    ];
    
    // Separar recomendações
    const comprar = empresasMock.filter(e => e.recomendacao === "COMPRAR").slice(0, 3);
    const vender = empresasMock.filter(e => e.recomendacao === "VENDER").slice(0, 3);
    
    return { comprar, vender };
}

// Função para exibir recomendações
async function mostrarRecomendacoes() {
    const resultadoElemento = document.getElementById('resultado-cotacao');
    
    resultadoElemento.innerHTML = `
        <div style="
            background: #f8f9fa;
            padding: 25px 20px;
            border-radius: 20px;
            margin: 25px 0;
            text-align: center;
        ">
            <div style="font-size: 2em; color: #2E5AAC; margin-bottom: 15px;">🎯</div>
            <div style="font-size: 1.3em; font-weight: 700; color: #2E5AAC; margin-bottom: 10px;">
                Gerando Recomendações...
            </div>
            <div style="color: #666;">
                Analisando todas as ações da B3
            </div>
        </div>
    `;
    
    const { comprar, vender } = await gerarRecomendacoes();
    
    resultadoElemento.innerHTML = `
        <div id="recomendacoes-pwa" style="margin: 25px 0;">
            <!-- TÍTULO -->
            <div style="
                background: linear-gradient(135deg, #2E5AAC, #4CAF50);
                color: white;
                padding: 25px 20px;
                border-radius: 20px 20px 0 0;
                text-align: center;
            ">
                <div style="font-size: 2em; margin-bottom: 10px;">🎯</div>
                <div style="font-size: 1.4em; font-weight: 800;">RECOMENDAÇÕES DO DIA</div>
                <div style="opacity: 0.9; margin-top: 5px;">
                    ${new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>
            
            <!-- PARA COMPRAR -->
            <div style="padding: 25px 20px; background: white; border-bottom: 1px solid #eee;">
                <div style="
                    color: #4CAF50;
                    font-weight: 800;
                    font-size: 1.2em;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span>🟢</span>
                    <span>TOP 3 PARA COMPRAR</span>
                </div>
                
                ${comprar.map((empresa, index) => `
                    <div style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 16px;
                        margin-bottom: 15px;
                        border-left: 5px solid #4CAF50;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="font-size: 1.1em; font-weight: 700; color: #333;">
                                    ${empresa.ticker}
                                </div>
                                <div style="color: #666; font-size: 0.95em; margin-top: 5px;">
                                    ${empresa.nome}
                                </div>
                            </div>
                            <div style="
                                background: #4CAF50;
                                color: white;
                                padding: 10px 15px;
                                border-radius: 12px;
                                font-weight: 800;
                                font-size: 1.1em;
                            ">
                                ${empresa.score}
                            </div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            margin-top: 15px;
                        ">
                            <div style="text-align: center;">
                                <div style="font-size: 0.85em; color: #666;">P/L</div>
                                <div style="font-size: 1.2em; font-weight: 700;">${empresa.indicadores.pl}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.85em; color: #666;">ROE</div>
                                <div style="font-size: 1.2em; font-weight: 700;">${empresa.indicadores.roe}%</div>
                            </div>
                        </div>
                        
                        <div style="
                            margin-top: 15px;
                            padding: 12px;
                            background: #e8f5e9;
                            border-radius: 10px;
                            font-size: 0.9em;
                            color: #2e7d32;
                        ">
                            📌 ${empresa.motivo}
                        </div>
                        
                        <button onclick="analisarAcaoMock('${empresa.ticker}')" style="
                            width: 100%;
                            padding: 14px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-weight: 700;
                            margin-top: 15px;
                            cursor: pointer;
                        ">
                            🔍 Analisar ${empresa.ticker}
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <!-- PARA VENDER -->
            <div style="padding: 25px 20px; background: white; border-radius: 0 0 20px 20px;">
                <div style="
                    color: #F44336;
                    font-weight: 800;
                    font-size: 1.2em;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span>🔴</span>
                    <span>TOP 3 PARA VENDER</span>
                </div>
                
                ${vender.map((empresa, index) => `
                    <div style="
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 16px;
                        margin-bottom: 15px;
                        border-left: 5px solid #F44336;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="font-size: 1.1em; font-weight: 700; color: #333;">
                                    ${empresa.ticker}
                                </div>
                                <div style="color: #666; font-size: 0.95em; margin-top: 5px;">
                                    ${empresa.nome}
                                </div>
                            </div>
                            <div style="
                                background: #F44336;
                                color: white;
                                padding: 10px 15px;
                                border-radius: 12px;
                                font-weight: 800;
                                font-size: 1.1em;
                            ">
                                ${empresa.score}
                            </div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            margin-top: 15px;
                        ">
                            <div style="text-align: center;">
                                <div style="font-size: 0.85em; color: #666;">P/L</div>
                                <div style="font-size: 1.2em; font-weight: 700;">${empresa.indicadores.pl}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.85em; color: #666;">ROE</div>
                                <div style="font-size: 1.2em; font-weight: 700;">${empresa.indicadores.roe}%</div>
                            </div>
                        </div>
                        
                        <div style="
                            margin-top: 15px;
                            padding: 12px;
                            background: #ffebee;
                            border-radius: 10px;
                            font-size: 0.9em;
                            color: #c62828;
                        ">
                            ⚠️ ${empresa.motivo}
                        </div>
                        
                        <button onclick="analisarAcaoMock('${empresa.ticker}')" style="
                            width: 100%;
                            padding: 14px;
                            background: #F44336;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-weight: 700;
                            margin-top: 15px;
                            cursor: pointer;
                        ">
                            🔍 Analisar ${empresa.ticker}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Função auxiliar para analisar ticker das recomendações
function analisarAcaoMock(ticker) {
    document.getElementById('inputTicker').value = ticker;
    analisarAcao({ preventDefault: () => {}, stopPropagation: () => {} });
}

// ============================================
// SISTEMA DE INSTALAÇÃO PWA
// ============================================

let deferredPrompt;
const installContainer = document.getElementById('installButtonContainer');
const iosInstructions = document.getElementById('iosInstructions');

// Detecta quando pode instalar
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 PWA: beforeinstallprompt disparado');
    
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostra botão para Android
    if (installContainer) {
        installContainer.style.display = 'block';
        
        // Esconde instruções iOS se for Android
        if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            iosInstructions.style.display = 'none';
        }
    }
});

// Função de instalação
function instalarPWA() {
    if (deferredPrompt) {
        // Android - prompt nativo
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                mostrarToast('🎉 Açõespp instalado!');
                if (installContainer) installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        });
    } else {
        // iOS ou outro - mostra instruções
        mostrarToast('📱 Use o menu do navegador para instalar');
        if (iosInstructions) iosInstructions.style.display = 'block';
    }
}

// Detecta se já está instalado
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone) {
    console.log('✅ Já rodando como PWA instalado');
    if (installContainer) installContainer.style.display = 'none';
}

// Detecta iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && installContainer) {
    // iOS não tem beforeinstallprompt, mostra manualmente
    setTimeout(() => {
        installContainer.style.display = 'block';
        if (iosInstructions) iosInstructions.style.display = 'block';
    }, 2000);
}

// Função auxiliar
function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #4CAF50, #2E5AAC);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Verifica ao carregar se pode mostrar botão
setTimeout(() => {
    if (installContainer && installContainer.style.display === 'none') {
        // Se ainda não mostrou, verifica se é iOS
        if (isIOS) {
            installContainer.style.display = 'block';
            if (iosInstructions) iosInstructions.style.display = 'block';
        }
    }
}, 3000);

// (Opcional) Pode testar a conexão automaticamente ao carregar a página
// window.onload = testarConexao;