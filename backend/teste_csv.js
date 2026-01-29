const https = require('https');
const url = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';

console.log('🔍 Analisando CSV da CVM...\n');

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const linhas = data.split('\n').slice(0, 15); // Primeiras 15 linhas
        
        console.log('📄 CABEÇALHO DO CSV:');
        console.log(linhas[0]);
        console.log('\n📋 PRIMEIRAS 5 EMPRESAS:');
        
        for (let i = 1; i < 6 && i < linhas.length; i++) {
            const cols = linhas[i].split(';');
            if (cols.length >= 6) {
                console.log(`${i}. Código: ${cols[0]} | CNPJ: ${cols[4]} | Nome: ${cols[5]}`);
            }
        }
        
        console.log('\n🔎 PROCURANDO PETROBRAS...');
        let petrobrasEncontradas = 0;
        for (let i = 1; i < linhas.length && petrobrasEncontradas < 5; i++) {
            const cols = linhas[i].split(';');
            if (cols.length >= 6) {
                const nome = cols[5] || '';
                if (nome.toUpperCase().includes('PETROBRAS')) {
                    console.log(`✅ ${nome} - CNPJ: ${cols[4]}`);
                    petrobrasEncontradas++;
                }
            }
        }
        
        if (petrobrasEncontradas === 0) {
            console.log('Nenhuma Petrobras encontrada nas primeiras linhas.');
        }
    });
}).on('error', err => {
    console.error('❌ Erro ao baixar CSV:', err.message);
});