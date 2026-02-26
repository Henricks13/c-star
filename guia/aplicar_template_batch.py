#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para aplicar o template melhorado em todos os dias do guia (DIA 4 a DIA 45)
"""

import re

# Ler o arquivo
with open('Guia_Completo_45_Dias.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Dias que já foram atualizados (DIA 1, 2, 3)
dias_atualizados = [1, 2, 3]

# Processar DIA 4 a DIA 45
for dia in range(4, 46):
    if dia in dias_atualizados:
        continue
    
    print(f"Processando DIA {dia}...")
    
    # Padrão 1: Adicionar marca d'água após <div class="page">
    pattern1 = rf'(<!-- ==================== DIA {dia} ====================\s*-->\s*<div class="page">)'
    replacement1 = rf'\1\n        <div class="day-watermark"><img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo"></div>'
    content = re.sub(pattern1, replacement1, content, count=1)
    
    # Padrão 2: Atualizar font-size do h3
    pattern2 = rf'(<h3>)(✅|💧|📝) (.*?)(</h3>)'
    
    def replace_h3(match):
        full_match = match.group(0)
        # Verificar se está entre DIA {dia} e DIA {dia+1}
        dia_section = re.search(rf'<!-- ==================== DIA {dia} ====================.*?<!-- ==================== DIA {dia+1} ====================', content, re.DOTALL)
        if dia_section and full_match in dia_section.group(0):
            return f'{match.group(1)} style="font-size: 11pt;">{match.group(2)} {match.group(3)}{match.group(4)}'
        return full_match
    
    # Padrão 3: Atualizar font-size da tabela
    pattern3 = rf'(<table class="task-table">)'
    
    def replace_table(match):
        # Verificar se está na seção do DIA atual
        before_match = content[:content.find(match.group(0))]
        last_dia_marker = before_match.rfind(f'<!-- ==================== DIA {dia} ====================')
        if last_dia_marker != -1:
            next_dia_marker = content.find(f'<!-- ==================== DIA {dia+1} ====================', last_dia_marker)
            match_pos = content.find(match.group(0), last_dia_marker)
            if next_dia_marker == -1 or match_pos < next_dia_marker:
                return '<table class="task-table" style="font-size: 9.5pt;">'
        return match.group(0)
    
    content = re.sub(pattern3, replace_table, content)
    
    # Padrão 4: Adicionar seção de Refeições e expandir observações
    # Este é mais complexo, vou fazer por seção específica do dia
    
    # Encontrar a seção do dia
    dia_start = content.find(f'<!-- ==================== DIA {dia} ====================')
    if dia < 45:
        dia_end = content.find(f'<!-- ==================== DIA {dia+1} ====================')
    else:
        dia_end = content.find('<!-- ==================== SINAIS DE ALERTA ====================')
    
    if dia_start != -1 and dia_end != -1:
        dia_section = content[dia_start:dia_end]
        
        # Procurar pelo padrão de observações antigo
        old_notes_pattern = r'(<div class="notes-box">\s*<label>📝 Observações do dia:</label>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"></div>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"></div>\s*<div style="border-bottom: 1px dotted var\(--dourado-claro\); margin: 5px 0;"></div>\s*</div>)'
        
        # Novo template de refeições + observações
        new_section = '''<h3 style="font-size: 11pt;">🍽️ Controle de Refeições</h3>
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
        </div>'''
        
        dia_section_updated = re.sub(old_notes_pattern, new_section, dia_section, count=1)
        
        # Atualizar footer
        old_footer = r'<div class="footer">\s*<p>C-Star \| Dia \d+ de 45 \| Protocolo de Recuperação</p>\s*</div>'
        new_footer = f'''<div class="footer" style="font-size: 8.5pt;">
            <p>⚠️ <strong>ATENÇÃO:</strong> Consulte o Guia Nutricional para orientações detalhadas sobre alimentação | Use a faixa compressiva 24h/dia</p>
            <p>C-Star | Dia {dia} de 45 | Protocolo de Recuperação</p>
        </div>'''
        
        dia_section_updated = re.sub(old_footer, new_footer, dia_section_updated)
        
        # Substituir a seção no conteúdo
        content = content[:dia_start] + dia_section_updated + content[dia_end:]

print("\nSalvando arquivo atualizado...")
with open('Guia_Completo_45_Dias.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Concluído! Todos os dias de 4 a 45 foram atualizados com o novo template.")
