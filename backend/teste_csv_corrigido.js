const https = require('https');
const url = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';

console.log('🔍 Analisando CSV CORRETAMENTE...\n');

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const linhas = data.split('\n');
        
        console.log('📊 TOTAL DE LINHAS:', linhas.length);
        console.log('\n🔠 PRIMEIRA LINHA COMPLETA (cabeçalho):');
        const cabecalho = linhas[0].split(';');
        cabecalho.forEach((col, idx) => {
            console.log(`${idx}: "${col}"`);
        });
        
        console.log('\n📋 PRIMEIRA EMPRESA COMPLETA:');
        const primeiraEmpresa = linhas[1].split(';');
        primeiraEmpresa.forEach((col, idx) => {
            console.log(`${idx}: "${col}"`);
        });
        
        console.log('\n🔎 BUSCANDO PETROBRAS (percorrendo todas as linhas)...');
        let encontradas = 0;
        
        for (let i = 1; i < linhas.length && encontradas < 3; i++) {
            const cols = linhas[i].split(';');
            if (cols.length > 10) {
                const nome = cols[1] || ''; // DENOM_SOCIAL
                const cnpj = cols[0] || ''; // CNPJ_CIA
                
                if (nome.toUpperCase().includes('PETROBRAS')) {
                    console.log(`\n✅ ENCONTRADA ${encontradas + 1}:`);
                    console.log(`   Nome: ${nome}`);
                    console.log(`   CNPJ: ${cnpj}`);
                    console.log(`   Código CVM: ${cols[9]}`); // CD_CVM
                    console.log(`   Setor: ${cols[10]}`); // SETOR_ATIV
                    encontradas++;
                }
            }
        }
        
        if (encontradas === 0) {
            console.log('Nenhuma Petrobras encontrada em nenhuma linha.');
        }
    });
}).on('error', err => {
    console.error('❌ Erro:', err.message);
});