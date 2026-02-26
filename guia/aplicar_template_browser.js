/**
 * Script para adicionar automaticamente o template melhorado em todos os dias
 * Execute este código no console do navegador após abrir o HTML
 */

// Template da marca d'água
const watermarkHTML = '<div class="day-watermark"><img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo"></div>';

// Template de refeições
const refeicoesHTML = `
        <h3 style="font-size: 11pt;">🍽️ Controle de Refeições</h3>
        <div class="notes-box">
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">☕ Café da manhã: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🥤 Lanche da manhã: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🍽️ Almoço: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🥤 Lanche da tarde: _________________________________</div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0; padding-left: 5px;">🍴 Jantar: _________________________________</div>
        </div>
`;

// Novo template de observações (5 linhas)
const observacoesHTML = `
        <div class="notes-box">
            <label style="font-size: 10pt;">📝 Observações do dia:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 6px 0;"></div>
        </div>
`;

// Novo footer
const footerTemplate = (dia) => `
        <div class="footer" style="font-size: 8.5pt;">
            <p>⚠️ <strong>ATENÇÃO:</strong> Consulte o Guia Nutricional para orientações detalhadas sobre alimentação | Use a faixa compressiva 24h/dia</p>
            <p>C-Star | Dia ${dia} de 45 | Protocolo de Recuperação</p>
        </div>
`;

function atualizarDias() {
    // Pegar todas as páginas
    const pages = document.querySelectorAll('.page');
    let diasAtualizados = 0;
    
    pages.forEach((page) => {
        const dayTitle = page.querySelector('.day-title');
        if (!dayTitle) return;
        
        const titleText = dayTitle.textContent.trim();
        const match = titleText.match(/DIA (\d+)/);
        if (!match) return;
        
        const diaNum = parseInt(match[1]);
        
        // Verificar se já tem marca d'água
        if (page.querySelector('.day-watermark')) {
            console.log(`DIA ${diaNum}: já tem marca d'água, pulando`);
            return;
        }
        
        console.log(`Processando DIA ${diaNum}...`);
        
        // 1. Adicionar marca d'água
        page.insertAdjacentHTML('afterbegin', watermarkHTML);
        
        // 2. Atualizar font-size dos h3
        page.querySelectorAll('h3').forEach(h3 => {
            if (!h3.style.fontSize) {
                h3.style.fontSize = '11pt';
            }
        });
        
        // 3. Atualizar font-size da tabela
        const table = page.querySelector('.task-table');
        if (table && !table.style.fontSize) {
            table.style.fontSize = '9.5pt';
        }
        
        // 4. Adicionar refeições (antes das observações)
        const notesBox = page.querySelector('.notes-box');
        if (notesBox) {
            // Verificar se já tem seção de refeições
            const jaTemRefeicoes = page.innerHTML.includes('Controle de Refeições');
            if (!jaTemRefeicoes) {
                notesBox.insertAdjacentHTML('beforebegin', refeicoesHTML);
            }
            
            // Atualizar observações (apenas se ainda tiver 3 linhas)
            const linhas = notesBox.querySelectorAll('div[style*="border-bottom"]');
            if (linhas.length === 3) {
                notesBox.outerHTML = observacoesHTML;
            }
        }
        
        // 5. Atualizar footer
        const footer = page.querySelector('.footer');
        if (footer) {
            const footerText = footer.textContent;
            if (!footerText.includes('ATENÇÃO')) {
                footer.outerHTML = footerTemplate(diaNum);
            }
        }
        
        diasAtualizados++;
    });
    
    console.log(`✅ Concluído! ${diasAtualizados} dias foram atualizados.`);
    console.log('Agora copie todo o HTML da página (Ctrl+A, Ctrl+C) e salve no arquivo.');
}

// Executar
atualizarDias();
