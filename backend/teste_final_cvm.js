// teste_final_cvm.js
const axios = require('axios');

async function teste() {
    const cnpj = '33.000.167/0001-01';
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    const urlCSV = 'https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';
    const resposta = await axios.get(urlCSV, { responseType: 'text' });
    const linhas = resposta.data.split('\n');
    
    console.log(`Procurando CNPJ: ${cnpjLimpo}`);
    
    for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(';');
        if (cols.length >= 10) {
            const cnpjCad = cols[0]?.replace(/[^\d]/g, '');
            if (cnpjCad === cnpjLimpo) {
                console.log('✅ ENCONTRADO!');
                console.log('Nome:', cols[1]);
                console.log('CNPJ:', cols[0]);
                console.log('Código CVM:', cols[9]);
                console.log('Setor:', cols[10]);
                return;
            }
        }
    }
    console.log('❌ Não encontrado');
}

teste();