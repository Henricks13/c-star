const fs = require('fs');

// Ler arquivo
let html = fs.readFileSync('Guia_Completo_45_Dias.html', 'utf8');

// Dias que já foram atualizados
const diasAtualizados = [1, 2, 3, 4, 5];

// Processar cada dia de 6 a 45
for (let dia = 6; dia <= 45; dia++) {
    if (diasAtualizados.includes(dia)) continue;
    
    console.log(`Processando DIA ${dia}...`);
    
    // 1. Adicionar marca d'água
    const regex1 = new RegExp(
        `(<!-- ==================== DIA ${dia} ====================\\s*-->\\s*<div class="page">)\\s*(<div class="day-title")`,
        'g'
    );
    html = html.replace(regex1, `$1\n        <div class="day-watermark"><img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo"></div>\n        $2`);
    
    // 2. Encontrar seção do dia e fazer substituições nela
    const diaStart = html.indexOf(`<!-- ==================== DIA ${dia} ====================`);
    let diaEnd;
    if (dia < 45) {
        diaEnd = html.indexOf(`<!-- ==================== DIA ${dia + 1} ====================`);
    } else {
        diaEnd = html.indexOf(`<!-- ==================== SINAIS DE ALERTA ====================`);
    }
    
    if (diaStart === -1 || diaEnd === -1) {
        console.log(`  ⚠️ DIA ${dia} não encontrado`);
        continue;
    }
    
    let diaSection = html.substring(diaStart, diaEnd);
    
    // 3. Atualizar <h3> para adicionar font-size
    diaSection = diaSection.replace(/<h3>(✅|💧|📝)/g, '<h3 style="font-size: 11pt;">$1');
    
    // 4. Atualizar tabela para adicionar font-size
    diaSection = diaSection.replace(/<table class="task-table">/g, '<table class="task-table" style="font-size: 9.5pt;">');
    
    // 5. Substituir observações antigas por seção de refeições + observações expandidas
    const oldNotesPattern = /<div class="notes-box">\s*<label>📝 Observações do dia:<\/label>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"><\/div>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"><\/div>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"><\/div>\s*<\/div>/;
    
    const newSection = `<h3 style="font-size: 11pt;">🍽️ Controle de Refeições</h3>
        <div class="notes-box">
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">☕ Café da manhã: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🥤 Lanche da manhã: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🍽️ Almoço: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🥤 Lanche da tarde: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🍴 Jantar: _________________________________</div>
        </div>

        <div class="notes-box">
            <label style="font-size: 10pt;">📝 Observações do dia:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
        </div>`;
    
    diaSection = diaSection.replace(oldNotesPattern, newSection);
    
    // 6. Atualizar footer
    const oldFooter = /<div class="footer">\s*<p>C-Star \| Dia \d+ de 45 \| Protocolo de Recuperação<\/p>\s*<\/div>/;
    const newFooter = `<div class="footer" style="font-size: 8.5pt;">
            <p>⚠️ <strong>ATENÇÃO:</strong> Consulte o Guia Nutricional para orientações detalhadas sobre alimentação | Use a faixa compressiva 24h/dia</p>
            <p>C-Star | Dia ${dia} de 45 | Protocolo de Recuperação</p>
        </div>`;
    
    diaSection = diaSection.replace(oldFooter, newFooter);
    
    // Substituir a seção no HTML original
    html = html.substring(0, diaStart) + diaSection + html.substring(diaEnd);
}

// Salvar arquivo atualizado
fs.writeFileSync('Guia_Completo_45_Dias.html', html, 'utf8');

console.log('\n✅ Concluído! Todos os dias de 6 a 45 foram atualizados.');
