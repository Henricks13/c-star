const fs = require('fs');

// Dados dos dias com suas medicações específicas
const diasProtocolo = {};

// Dias 1-4: Apenas Vitamina K1
for (let i = 1; i <= 4; i++) {
    diasProtocolo[i] = {
        medicacoes: [
            ["Vitamina K1 (5mg)", "1 comprimido com refeição", "💊"]
        ]
    };
}

// Dia 5: Adiciona Prednisolona 40mg
diasProtocolo[5] = {
    medicacoes: [
        ["Vitamina K1 (5mg)", "1 comprimido com refeição", "💊"],
        ["⭐ Prednisolona (40mg)", "INÍCIO - 1 comprimido (anotar horário!)", "💊"]
    ]
};

// Dia 6
diasProtocolo[6] = {
    medicacoes: [
        ["Vitamina K1 (5mg)", "1 comprimido com refeição", "💊"],
        ["Prednisolona (40mg)", "1 comprimido (mesmo horário do Dia 5)", "💊"]
    ]
};

// Dia 7: DIA DA CIRURGIA
diasProtocolo[7] = {
    medicacoes: [
        ["Vitamina K1 (5mg)", "Antes da cirurgia - com refeição", "💊"],
        ["Prednisolona (40mg)", "Antes da cirurgia - último comprimido", "💊"],
        ["⭐ Cefadroxila", "12H APÓS - INÍCIO Antibiótico", "💊"],
        ["⭐ Prednisolona 20mg", "12H APÓS - INÍCIO Anti-inflamatório", "💊"],
        ["⭐ Dipirona/Paracetamol", "12H APÓS - INÍCIO Analgésico (8/8h)", "💊"]
    ],
    compressas_gelo: true,
    cirurgia: true
};

// Dias 8-9
diasProtocolo[8] = {
    medicacoes: [
        ["Vitamina K1 (5mg)", "1 comprimido com refeição", "💊"],
        ["Cefadroxila", "Antibiótico", "💊"],
        ["Prednisolona 20mg", "Anti-inflamatório", "💊"],
        ["Dipirona/Paracetamol (Dose 1)", "Analgésico - 8/8h", "💊"],
        ["Dipirona/Paracetamol (Dose 2)", "8h após dose 1", "💊"],
        ["Dipirona/Paracetamol (Dose 3)", "8h após dose 2", "💊"],
        ["⭐ Furosemida", "INÍCIO - Diurético (pela manhã)", "💊"]
    ],
    compressas_gelo: true,
    camara_hiper: true
};

diasProtocolo[9] = {
    medicacoes: [
        ["Vitamina K1 (5mg)", "ÚLTIMO DIA - com refeição", "💊"],
        ["Cefadroxila", "Antibiótico", "💊"],
        ["Prednisolona 20mg", "ÚLTIMO DIA - Anti-inflamatório", "💊"],
        ["Dipirona/Paracetamol (Dose 1)", "Analgésico - 8/8h", "💊"],
        ["Dipirona/Paracetamol (Dose 2)", "8h após dose 1", "💊"],
        ["Dipirona/Paracetamol (Dose 3)", "ÚLTIMO DIA - 8h após dose 2", "💊"],
        ["Furosemida", "Diurético (pela manhã)", "💊"]
    ],
    compressas_gelo: true,
    camara_hiper: true
};

// Dia 10
diasProtocolo[10] = {
    medicacoes: [
        ["Cefadroxila", "Antibiótico", "💊"],
        ["Furosemida", "Diurético (pela manhã)", "💊"]
    ],
    compressas_gelo: true,
    drenagem: "1ª Drenagem Linfática"
};

// Dias 11-12
for (let i = 11; i <= 12; i++) {
    diasProtocolo[i] = {
        medicacoes: [
            ["Cefadroxila", "Antibiótico", "💊"],
            ["Furosemida", "Diurético (pela manhã)", "💊"]
        ],
        compressas_mornas: true
    };
}

// Dia 13
diasProtocolo[13] = {
    medicacoes: [
        ["Cefadroxila", "ÚLTIMO DIA - Antibiótico", "💊"],
        ["Furosemida", "ÚLTIMO DIA - Diurético", "💊"]
    ],
    compressas_mornas: true,
    drenagem: "2ª Drenagem (possível)"
};

// Dia 14: RETORNO MÉDICO
diasProtocolo[14] = {
    medicacoes: [],
    compressas_mornas: true,
    retorno: true,
    retirada_pontos: true
};

// Dias 15-20
for (let i = 15; i <= 20; i++) {
    diasProtocolo[i] = {
        medicacoes: [],
        compressas_mornas: true,
        atividade_leve: true
    };
}

// Dia 21: 2º RETORNO
diasProtocolo[21] = {
    medicacoes: [],
    compressas_mornas: true,
    retorno: true,
    drenagem: "3ª Drenagem (possível)"
};

// Dias 22-45: Apenas compressas mornas e hidratação
for (let i = 22; i <= 45; i++) {
    diasProtocolo[i] = {
        medicacoes: [],
        compressas_mornas: true
    };
}

console.log("Gerando HTML completo com todos os 45 dias...");

// Gerar HTML
let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guia de Recuperação Premium - C-Star | Dra. Carolina</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --dourado: #C8A675;
            --dourado-escuro: #B8941E;
            --dourado-claro: #F4E5B5;
            --azul-navy: #1B3B5F;
            --azul-escuro: #2C4A6B;
            --cinza-claro: #9B9B9B;
            --cinza-medio: #666666;
            --cinza-escuro: #333333;
            --preto: #1a1a1a;
            --branco: #ffffff;
        }
        
        body {
            font-family: 'Montserrat', sans-serif;
            color: var(--cinza-escuro);
            background: var(--branco);
            font-size: 10.5pt;
            line-height: 1.55;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 18mm;
            margin: 0 auto 20px;
            background: white;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            page-break-after: always;
            position: relative;
        }
        
        .page::before {
            content: '';
            position: absolute;
            top: 13mm;
            left: 13mm;
            right: 13mm;
            bottom: 13mm;
            border: 2px solid var(--dourado);
            pointer-events: none;
        }
        
        .page::after {
            content: '';
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            border: 0.5px solid var(--dourado-claro);
            pointer-events: none;
        }
        
        .cover-page::before, .cover-page::after { border: none; }
        
        .cover-page {
            background: 
                linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,246,243,0.92) 100%),
                repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(200,166,117,0.08) 30px, rgba(200,166,117,0.08) 60px),
                repeating-linear-gradient(-45deg, transparent, transparent 30px, rgba(155,155,155,0.05) 30px, rgba(155,155,155,0.05) 60px),
                linear-gradient(135deg, #f5f3f0 0%, #ffffff 50%, #f5f3f0 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            border: 3px solid var(--dourado);
        }
        
        .cover-ornament {
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--dourado), transparent);
            margin: 20px 0;
        }
        
        .doctor-section {
            margin: 30px 0;
            text-align: center;
        }
        
        .doctor-photo {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            border: 5px solid var(--dourado);
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
            object-fit: cover;
            margin: 0 auto 15px;
            display: block;
        }
        
        .doctor-name {
            font-family: 'Playfair Display', serif;
            font-size: 20pt;
            color: var(--dourado-escuro);
            font-weight: 600;
            margin-top: 10px;
        }
        
        .doctor-title {
            font-size: 11pt;
            color: var(--cinza-medio);
            font-weight: 300;
            margin-top: 5px;
        }
        
        .logo-container {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .logo-container img {
            max-width: 200px;
            height: auto;
        }
        
        h1 {
            font-family: 'Playfair Display', serif;
            color: var(--azul-navy);
            text-align: center;
            font-size: 36pt;
            margin-bottom: 10px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        
        h2 {
            font-family: 'Playfair Display', serif;
            color: var(--dourado);
            text-align: center;
            font-size: 18pt;
            margin-bottom: 25px;
            font-weight: 400;
            font-style: normal;
        }
        
        h3 {
            font-family: 'Playfair Display', serif;
            color: var(--preto);
            font-size: 14pt !important;
            margin-top: 18px;
            margin-bottom: 10px;
            font-weight: 600;
            border-bottom: 2px solid var(--dourado);
            padding-bottom: 5px;
        }
        
        .day-title {
            background: linear-gradient(135deg, var(--dourado) 0%, var(--dourado-escuro) 100%);
            color: white;
            padding: 11px 18px;
            border-radius: 8px;
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 20pt;
            font-weight: 700;
            margin-bottom: 12px;
            box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
        
        .day-subtitle {
            text-align: center;
            color: var(--cinza-medio);
            font-size: 11pt;
            margin-bottom: 12px;
            font-style: italic;
        }
        
        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--dourado), transparent);
            margin: 15px 0;
        }
        
        .task-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            background: white;
            border: 1px solid var(--dourado-claro);
            font-size: 9.5pt !important;
        }
        
        .task-table th {
            background: linear-gradient(135deg, var(--dourado-claro) 0%, #e8d7a0 100%);
            color: var(--cinza-escuro);
            padding: 8px 6px;
            text-align: left;
            font-weight: 600;
            font-size: 10pt !important;
            border-bottom: 2px solid var(--dourado);
        }
        
        .task-table td {
            padding: 8px 6px;
            border-bottom: 1px solid var(--dourado-claro);
            font-size: 9.5pt !important;
        }
        
        .task-table tr:hover {
            background: #fffef8;
        }
        
        .checkbox-large {
            display: inline-block;
            width: 15px;
            height: 15px;
            border: 2px solid var(--dourado);
            border-radius: 3px;
            margin-right: 5px;
            vertical-align: middle;
        }
        
        .hydration-track {
            display: flex;
            gap: 7px;
            margin: 10px 0;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .water-cup {
            width: 32px;
            height: 42px;
            border: 2px solid var(--dourado);
            border-radius: 4px;
            position: relative;
            background: white;
            display: inline-block;
        }
        
        .water-cup::after {
            content: '💧';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 16px;
            opacity: 0.3;
        }
        
        .notes-box {
            border: 1px solid var(--dourado-claro);
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            background: #fffef8;
            min-height: 60px;
        }
        
        .notes-box label {
            color: var(--dourado-escuro);
            font-weight: 600;
            font-size: 9.5pt;
            display: block;
            margin-bottom: 5px;
        }
        
        .alert-box {
            background: #fff9e6;
            border-left: 4px solid var(--dourado);
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 9pt;
        }
        
        .alert-box strong {
            color: var(--dourado-escuro);
        }
        
        .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid var(--dourado-claro);
            font-size: 8.5pt;
            color: var(--cinza-medio);
        }
        
        .icon {
            color: var(--dourado);
            margin-right: 5px;
            font-size: 10pt;
        }
        
        @media print {
            body { background: white; }
            .page {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
            }
            @page { size: A4; margin: 0; }
        }
        
        .intro-text {
            text-align: center;
            font-size: 10.5pt;
            color: var(--cinza-medio);
            line-height: 1.7;
            margin: 15px 0;
            padding: 0 35px;
        }
        
        .welcome-box {
            background: linear-gradient(135deg, #fffef8 0%, #fff 100%);
            border: 2px solid var(--dourado);
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 4px 10px rgba(212, 175, 55, 0.15);
        }
        
        .welcome-box h3 {
            border: none;
            color: var(--dourado-escuro);
            margin-top: 0;
            font-size: 12.5pt;
        }
        
        ul {
            list-style: none;
            padding-left: 0;
        }
        
        ul li {
            padding: 5px 0;
            padding-left: 22px;
            position: relative;
            font-size: 9.5pt;
        }
        
        ul li::before {
            content: '✦';
            color: var(--dourado);
            position: absolute;
            left: 0;
            font-size: 11.5pt;
        }

        .index-list {
            list-style: none;
            padding-left: 0;
            margin: 6px 0 0;
        }

        .index-item {
            display: grid;
            grid-template-columns: 16px 70px 1fr 40px;
            gap: 8px;
            align-items: baseline;
            font-size: 9.5pt;
            padding: 2px 0;
        }

        .index-item .idx-star {
            text-align: center;
        }

        .index-item .idx-day {
            white-space: nowrap;
        }

        .index-item .idx-text {
            padding-right: 6px;
        }

        .index-item .idx-num {
            justify-self: end;
            white-space: nowrap;
        }

        .index-item-simple {
            display: grid;
            grid-template-columns: 1fr 40px;
            gap: 8px;
            align-items: baseline;
            font-size: 10pt;
            padding: 2px 0;
        }

        .index-item-simple .idx-num {
            justify-self: end;
            white-space: nowrap;
        }

        .index-page h1 {
            font-size: 18pt;
            margin-bottom: 4px;
        }

        .index-page h2 {
            font-size: 9pt;
            margin-bottom: 8px;
        }

        .index-page h3 {
            font-size: 9pt;
            margin-top: 8px;
            margin-bottom: 3px;
        }

        .index-page .welcome-box {
            padding: 8px;
            margin: 8px 0;
        }

        .index-page .divider {
            margin: 8px 0;
        }

        .index-page .index-item {
            font-size: 8.7pt;
            padding: 0;
            line-height: 1.25;
        }

        .index-page .index-item-simple {
            font-size: 9pt;
            padding: 0;
            line-height: 1.25;
        }
        
        .food-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 15px 0;
        }
        
        .food-card {
            border: 1px solid var(--dourado-claro);
            border-radius: 8px;
            padding: 12px;
            background: #fffef8;
        }
        
        .food-list li {
            padding: 2px 0;
            padding-left: 0;
            position: relative;
        }

        .food-list li::before {
            content: none;
        }

        .avoid-list li::before {
            content: none;
        }
            list-style: none;
            padding-left: 0;
        }
        
        .food-list li {
            padding: 2px 0;
            padding-left: 18px;
            position: relative;
        }
        
        .food-list li::before {
            content: '✓';
            color: var(--dourado);
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        
        .avoid-list li::before {
            content: '✗';
            color: #c0392b;
        }
    </style>
</head>
<body>

    <!-- ==================== CAPA ==================== -->
    <div class="page cover-page">
        <!-- Logo e Subtítulo -->
        <div style="margin-top: 45px; margin-bottom: 50px;">
            <div class="logo-container" style="margin-bottom: 8px;">
                <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 380px; filter: drop-shadow(0 2px 8px rgba(200,166,117,0.3));">
            </div>
            <p style="text-align: center; font-size: 11pt; color: var(--cinza-claro); font-weight: 400; margin: 0; letter-spacing: 0.8px; font-family: 'Montserrat', sans-serif;">
                Clínica de Saúde & Bem-Estar
            </p>
        </div>
        
        <div class="cover-ornament"></div>
        
        <!-- Título Principal -->
        <div style="margin-bottom: 12px;">
            <h1 style="font-size: 42pt; margin-bottom: 8px; letter-spacing: 5px; line-height: 1.05; font-weight: 700;">GUIA DE<br>RECUPERAÇÃO</h1>
        </div>
        
        <!-- Subtítulo Protocolo -->
        <h2 style="font-size: 16pt; margin-bottom: 75px; font-weight: 400; letter-spacing: 0.5px;">Protocolo Premium 45 Dias</h2>
        
        <div class="cover-ornament"></div>
        
        <div class="doctor-section" style="position: absolute; bottom: 120px; right: 60px; text-align: center;">
            <img src="dra-carolina-real.jpg" alt="Dra. Carol Pinheiro" class="doctor-photo" style="width: 140px; height: 140px;">
            <div class="doctor-name" style="font-size: 14pt; margin-top: 12px;">por Dra. Carol Pinheiro</div>
        </div>
        
        <div class="intro-text" style="position: absolute; bottom: 35px; left: 0; right: 0; text-align: center;">
            <p style="font-size: 11pt; font-weight: 400; color: var(--dourado-escuro); margin-bottom: 0;">
                Seu roteiro completo para recuperação perfeita,<br>
                <strong>parabéns por investir em você!</strong>
            </p>
        </div>
    </div>

    <!-- ==================== ÍNDICE ==================== -->
    <div class="page index-page">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
            <h1 style="font-size: 22pt; margin: 0;">ÍNDICE</h1>
        </div>
        <h2 style="font-size: 11pt; color: var(--dourado); font-family: 'Montserrat', sans-serif; margin-top: 0;">Guia de Recuperação 45 Dias</h2>

        <div class="divider"></div>

        <div class="welcome-box" style="padding: 12px;">
            <div class="index-list">
                <div class="index-item-simple"><strong>Apresentação</strong><span class="idx-num">1</span></div>
                <div class="index-item-simple"><strong>Capa</strong><span class="idx-num">1</span></div>
                <div class="index-item-simple"><strong>Como usar este guia / Estrutura</strong><span class="idx-num">3</span></div>
                <div class="index-item-simple"><strong>Recomendações Pós-Operatório – Parte 1</strong><span class="idx-num">4</span></div>
                <div class="index-item-simple"><strong>Guia Nutricional</strong><span class="idx-num">5</span></div>
                <div class="index-item-simple"><strong>Alimentos a evitar</strong><span class="idx-num">6</span></div>
                <div class="index-item-simple"><strong>Recomendações Pós-Operatório – Parte 2</strong><span class="idx-num">7</span></div>
                <div class="index-item-simple"><strong>Sinais de Alerta / Protocolo de Segurança</strong><span class="idx-num">8</span></div>
            </div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">🔹 FASE PRÉ-CIRÚRGICA</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 1</strong></span><span class="idx-text">– Início Vitamina K1</span><span class="idx-num">9</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 2</strong></span><span class="idx-text">– Preparação</span><span class="idx-num">10</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 3</strong></span><span class="idx-text">– Preparação</span><span class="idx-num">11</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 4</strong></span><span class="idx-text">– Preparação</span><span class="idx-num">12</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 5</strong></span><span class="idx-text">– Início Prednisolona</span><span class="idx-num">13</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 6</strong></span><span class="idx-text">– Véspera da cirurgia</span><span class="idx-num">14</span></div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">⭐ DIA DA CIRURGIA</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 7</strong></span><span class="idx-text">– DIA DA CIRURGIA</span><span class="idx-num">15</span></div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">🔴 PÓS-OPERATÓRIO IMEDIATO (FASE CRÍTICA)</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 8</strong></span><span class="idx-text">– Início Furosemida</span><span class="idx-num">16</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 9</strong></span><span class="idx-text">– Último dia Vitamina K1 / Prednisolona / Analgésico</span><span class="idx-num">17</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 10</strong></span><span class="idx-text">– Mantém antibiótico + gelo</span><span class="idx-num">18</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 11</strong></span><span class="idx-text">– Início compressa morna</span><span class="idx-num">19</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dia 12</strong></span><span class="idx-text">– Compressa morna</span><span class="idx-num">20</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 13</strong></span><span class="idx-text">– Último dia antibiótico e furosemida</span><span class="idx-num">21</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 14</strong></span><span class="idx-text">– Retorno / Retirada de pontos / Possível liberação de faixa noturna</span><span class="idx-num">22</span></div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">🟡 FASE DE RECUPERAÇÃO INICIAL</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dias 15 a 20</strong></span><span class="idx-text">– Rotina de recuperação</span><span class="idx-num">23–28</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 21</strong></span><span class="idx-text">– Retorno / 3ª drenagem possível</span><span class="idx-num">29</span></div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">🟢 FASE DE RECUPERAÇÃO COM PROGRESSÃO</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 22</strong></span><span class="idx-text">– Liberação para atividade física leve</span><span class="idx-num">30</span></div>
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Dias 23 a 44</strong></span><span class="idx-text">– Manutenção da rotina de recuperação</span><span class="idx-num">31–52</span></div>
            <div class="index-item"><span class="idx-star">⭐</span><span class="idx-day"><strong>Dia 45</strong></span><span class="idx-text">– Encerramento + agendamento próximo retorno</span><span class="idx-num">53</span></div>
        </div>

        <h3 style="font-size: 11pt; margin: 12px 0 6px 0;">📘 ANEXOS IMPORTANTES</h3>
        <div class="index-list">
            <div class="index-item"><span class="idx-star"></span><span class="idx-day"><strong>Mensagem Final / Conclusão</strong></span><span class="idx-text"></span><span class="idx-num">54</span></div>
        </div>

        <div class="footer">
            <p>C-Star | Índice do Guia</p>
        </div>
    </div>

    <!-- ==================== INSTRUÇÕES ==================== -->
    <div class="page">
        <div class="logo-container">
            <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 110px;">
        </div>
        
        <h1 style="font-size: 26pt;">BEM-VINDA!</h1>
        <h2 style="font-size: 13pt;">À sua jornada de transformação</h2>
        
        <div class="divider"></div>
        
        <div class="welcome-box">
            <h3>💝 Como usar este guia:</h3>
            <ul>
                <li><strong>Cada dia tem sua própria página</strong> com todas as tarefas organizadas</li>
                <li><strong>Marque cada tarefa realizada</strong> com um ✓ e anote os horários</li>
                <li><strong>Leve este guia em todos os retornos médicos</strong></li>
                <li><strong>Dia 7 = Dia da Cirurgia</strong> (o mais importante!)</li>
            </ul>
        </div>
        
        <div class="welcome-box">
            <h3>📋 Estrutura do Guia:</h3>
            <ul>
                <li><strong>Dias 1-6:</strong> Preparação pré-cirúrgica</li>
                <li><strong>Dia 7:</strong> Dia da cirurgia</li>
                <li><strong>Dias 8-14:</strong> Pós-operatório imediato (fase crítica)</li>
                <li><strong>Dias 15-45:</strong> Recuperação e consolidação</li>
                <li><strong>Orientações nutricionais:</strong> Alimentos para cicatrização</li>
            </ul>
        </div>
        
        <div class="alert-box" style="margin-top: 25px;">
            <strong>💡 DICA IMPORTANTE:</strong> Imprima este guia e mantenha sempre por perto. Anote tudo e tire fotos do seu progresso!
        </div>
        
        <div class="footer">
            <p style="font-family: 'Playfair Display', serif; font-size: 10pt; color: var(--dourado-escuro);">
                <strong>C-STAR - EXCELÊNCIA EM CIRURGIA FACIAL</strong>
            </p>
        </div>
    </div>

`;

// Gerar páginas para cada dia (1-45)
for (let dia = 1; dia <= 45; dia++) {
    const dados = diasProtocolo[dia] || { medicacoes: [], compressas_mornas: true };
    
    // Título especial para dias importantes
    let titulo, subtitle;
    if (dia === 7) {
        titulo = `🏥 DIA ${dia} ⭐ DIA DA CIRURGIA ⭐`;
        subtitle = "O grande dia chegou!";
    } else if (dia === 14) {
        titulo = `👩‍⚕️ DIA ${dia} - RETORNO MÉDICO`;
        subtitle = "1 semana pós-cirurgia - Retirada dos pontos";
    } else if (dia === 21) {
        titulo = `👩‍⚕️ DIA ${dia} - RETORNO MÉDICO`;
        subtitle = "2 semanas pós-cirurgia - Avaliação";
    } else if (dia <= 6) {
        titulo = `📆 DIA ${dia}`;
        subtitle = `Preparação Pré-Cirúrgica (${7 - dia} dias antes da cirurgia)`;
    } else if (dia <= 14) {
        titulo = `📆 DIA ${dia}`;
        subtitle = `Pós-Operatório Imediato (${dia - 7}º dia após cirurgia)`;
    } else {
        titulo = `📆 DIA ${dia}`;
        subtitle = `Fase de Recuperação (${dia - 7}º dia após cirurgia)`;
    }
    
    html += `
    <!-- ==================== DIA ${dia} ==================== -->
    <div class="page">
        <div class="day-title">${titulo}</div>
        <div class="day-subtitle">${subtitle}</div>
        
        <div style="text-align: center; margin: 12px 0; font-size: 10pt;">
            <strong>Data:</strong> ____/____/______
        </div>
        
        <div class="divider"></div>
        
        <h3>✅ Tarefas do Dia</h3>
        
        <table class="task-table">
            <thead>
                <tr>
                    <th width="15%">Horário</th>
                    <th width="30%">Tarefa</th>
                    <th width="40%">Detalhes</th>
                    <th width="15%">✓</th>
                </tr>
            </thead>
            <tbody>
`;
    
    // Adicionar medicações
    for (const [medNome, medDetalhe, medIcon] of dados.medicacoes || []) {
        html += `
                <tr>
                    <td>____:____</td>
                    <td><span class="icon">${medIcon}</span> ${medNome}</td>
                    <td>${medDetalhe}</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    }
    
    // Adicionar compressas de gelo
    if (dados.compressas_gelo) {
        for (const periodo of ["Manhã", "Tarde", "Noite"]) {
            html += `
                <tr>
                    <td>____:____</td>
                    <td><span class="icon">🧊</span> Compressa de Gelo (${periodo})</td>
                    <td>30min (papada/pescoço/rosto)</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
        }
    }
    
    // Adicionar compressas mornas
    if (dados.compressas_mornas) {
        html += `
                <tr>
                    <td>Ao acordar</td>
                    <td><span class="icon">🔥</span> Compressa Morna</td>
                    <td>20min (área operada)</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
                <tr>
                    <td>Antes de dormir</td>
                    <td><span class="icon">🔥</span> Compressa Morna</td>
                    <td>20min (área operada)</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    }
    
    // Hidratação sempre presente
    html += `
                <tr>
                    <td>Durante o dia</td>
                    <td><span class="icon">💧</span> Hidratação</td>
                    <td>Meta: 3 litros (6 copos de 500ml)</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    
    // Drenagem linfática
    if (dados.drenagem) {
        html += `
                <tr style="background: #fff9e6;">
                    <td>____:____</td>
                    <td><span class="icon">💆</span> <strong>${dados.drenagem}</strong></td>
                    <td>Conforme agendamento</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    }
    
    // Câmara hiperbárica
    if (dados.camara_hiper) {
        html += `
                <tr style="background: #fff9e6;">
                    <td>____:____</td>
                    <td><span class="icon">🔬</span> Câmara Hiperbárica</td>
                    <td>Se agendado para hoje</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    }
    
    // Retorno médico
    if (dados.retorno) {
        html += `
                <tr style="background: #fff9e6;">
                    <td>____:____</td>
                    <td><span class="icon">👩‍⚕️</span> <strong>RETORNO NO CONSULTÓRIO</strong></td>
                    <td>Avaliação médica completa</td>
                    <td><span class="checkbox-large"></span></td>
                </tr>
`;
    }
    
    html += `
            </tbody>
        </table>
`;
    
    // Alertas especiais
    if (dia === 5) {
        html += `
        <div class="alert-box">
            <strong>⚠️ IMPORTANTE:</strong> Anote o horário que tomou a Prednisolona! Você deverá tomar nos próximos dias <strong>sempre no mesmo horário</strong>.
        </div>
`;
    } else if (dia === 7) {
        html += `
        <div class="alert-box">
            <strong>🎽 Faixa Compressiva:</strong> A partir de agora, USO 24 HORAS (não remover para nada até o Dia 14!)
        </div>
`;
    } else if (dia === 14) {
        html += `
        <div class="alert-box">
            <strong>✅ Hoje você terá:</strong> Retirada dos pontos, troca de curativo, laser, fotos do progresso e avaliação completa.
        </div>
        <div class="alert-box">
            <strong>🎽 Faixa Compressiva:</strong> A partir de hoje, pode usar apenas para dormir (ou continuar 24h para melhores resultados).
        </div>
`;
    }
    
    // Controle de hidratação
    html += `
        <h3>💧 Controle de Hidratação</h3>
        <div class="hydration-track">
            <div class="water-cup"></div>
            <div class="water-cup"></div>
            <div class="water-cup"></div>
            <div class="water-cup"></div>
            <div class="water-cup"></div>
            <div class="water-cup"></div>
        </div>
`;
    
    // Espaço para anotações
    html += `
        <div class="notes-box">
            <label>📝 Observações do dia:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 5px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 5px 0;"></div>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 5px 0;"></div>
        </div>
        
        <div class="footer">
            <p>C-Star | Dia ${dia} de 45 | Protocolo de Recuperação</p>
        </div>
    </div>
`;
}

// Adicionar páginas de orientação nutricional e final
html += `
    <!-- ==================== ORIENTAÇÃO NUTRICIONAL ==================== -->
    <div class="page">
        <div class="logo-container">
            <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 110px;">
        </div>
        
        <h1 style="font-size: 24pt;">GUIA NUTRICIONAL</h1>
        <h2 style="font-size: 12pt;">Alimentos que aceleram sua recuperação</h2>
        
        <div class="divider"></div>
        
        <p style="text-align: center; font-size: 9.5pt; color: var(--cinza-medio); margin-bottom: 20px;">
            A alimentação é fundamental para uma boa cicatrização!<br>
            Veja os alimentos que devem fazer parte do seu dia a dia:
        </p>
        
        <div class="food-grid">
            <div class="food-card">
                <div class="food-icon">🍗</div>
                <div class="food-category">Proteínas</div>
                <ul class="food-list">
                    <li>Frango (peito sem pele)</li>
                    <li>Peixe (salmão, atum)</li>
                    <li>Ovos</li>
                    <li>Tofu</li>
                    <li>Iogurte grego</li>
                </ul>
            </div>
            
            <div class="food-card">
                <div class="food-icon">🍊</div>
                <div class="food-category">Vitamina C</div>
                <ul class="food-list">
                    <li>Laranja, Limão</li>
                    <li>Acerola ⭐</li>
                    <li>Morango, Kiwi</li>
                    <li>Brócolis, Pimentão</li>
                    <li>Goiaba</li>
                </ul>
            </div>
            
            <div class="food-card">
                <div class="food-icon">🥕</div>
                <div class="food-category">Vitamina A</div>
                <ul class="food-list">
                    <li>Cenoura ⭐</li>
                    <li>Batata-doce ⭐</li>
                    <li>Abóbora</li>
                    <li>Manga</li>
                    <li>Espinafre, Couve</li>
                </ul>
            </div>
            
            <div class="food-card">
                <div class="food-icon">🐟</div>
                <div class="food-category">Ômega-3</div>
                <ul class="food-list">
                    <li>Salmão ⭐</li>
                    <li>Atum, Sardinha</li>
                    <li>Chia, Linhaça</li>
                    <li>Nozes</li>
                    <li>Azeite de oliva</li>
                </ul>
            </div>
            
            <div class="food-card">
                <div class="food-icon">🥜</div>
                <div class="food-category">Zinco</div>
                <ul class="food-list">
                    <li>Castanhas</li>
                    <li>Sementes de abóbora</li>
                    <li>Grão-de-bico</li>
                    <li>Lentilha</li>
                    <li>Carne magra</li>
                </ul>
            </div>
            
            <div class="food-card">
                <div class="food-icon">🥬</div>
                <div class="food-category">Ferro</div>
                <ul class="food-list">
                    <li>Espinafre ⭐</li>
                    <li>Feijão, Lentilha</li>
                    <li>Carne vermelha magra</li>
                    <li>Quinoa</li>
                    <li>Tofu</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>C-Star | Guia Nutricional</p>
        </div>
    </div>
    
    <!-- ==================== ALIMENTOS A EVITAR ==================== -->
    <div class="page">
        <div class="logo-container">
            <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 110px;">
        </div>
        
        <h1 style="font-size: 24pt; color: #c0392b;">ALIMENTOS A EVITAR</h1>
        <h2 style="font-size: 12pt;">Durante o período de recuperação</h2>
        
        <div class="divider"></div>
        
        <div class="food-grid">
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">🍰</div>
                <div class="food-category" style="color: #c0392b;">Açúcares</div>
                <ul class="food-list avoid-list">
                    <li>Bolos e tortas</li>
                    <li>Doces em geral</li>
                    <li>Refrigerantes</li>
                    <li>Sucos industrializados</li>
                </ul>
            </div>
            
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">🍟</div>
                <div class="food-category" style="color: #c0392b;">Frituras</div>
                <ul class="food-list avoid-list">
                    <li>Batata frita</li>
                    <li>Salgadinhos</li>
                    <li>Fast food</li>
                    <li>Congelados fritos</li>
                </ul>
            </div>
            
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">🍺</div>
                <div class="food-category" style="color: #c0392b;">Álcool</div>
                <ul class="food-list avoid-list">
                    <li>Todas as bebidas alcoólicas</li>
                    <li>Prejudicam cicatrização</li>
                    <li>Aumentam inflamação</li>
                </ul>
            </div>
            
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">🥓</div>
                <div class="food-category" style="color: #c0392b;">Embutidos</div>
                <ul class="food-list avoid-list">
                    <li>Salsicha, linguiça</li>
                    <li>Presunto, mortadela</li>
                    <li>Bacon</li>
                    <li>Carnes processadas</li>
                </ul>
            </div>
            
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">☕</div>
                <div class="food-category" style="color: #c0392b;">Cafeína (excesso)</div>
                <ul class="food-list avoid-list">
                    <li>Café em excesso</li>
                    <li>Energéticos</li>
                    <li>Refrigerantes de cola</li>
                </ul>
            </div>
            
            <div class="food-card" style="border-color: #c0392b;">
                <div class="food-icon">🌶️</div>
                <div class="food-category" style="color: #c0392b;">Condimentados</div>
                <ul class="food-list avoid-list">
                    <li>Pimentas</li>
                    <li>Alimentos muito apimentados</li>
                    <li>Condimentos industrializados</li>
                </ul>
            </div>
        </div>
        
        <div class="alert-box" style="margin-top: 20px;">
            <strong>💡 LEMBRE-SE:</strong> Uma boa alimentação acelera a cicatrização, reduz edemas e melhora seus resultados finais!
        </div>
        
        <div class="footer">
            <p>C-Star | Guia Nutricional</p>
        </div>
    </div>
    
    <!-- ==================== SINAIS DE ALERTA ==================== -->
    <div class="page">
        <div class="logo-container">
            <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 110px;">
        </div>
        
        <h1 style="font-size: 24pt;">SINAIS DE ALERTA</h1>
        <h2 style="font-size: 12pt;">Quando entrar em contato imediatamente</h2>
        
        <div class="divider"></div>
        
        <div class="alert-box" style="background: #ffe6e6; border-color: #c0392b; margin: 20px 0;">
            <strong style="color: #c0392b;">🚨 ENTRE EM CONTATO IMEDIATAMENTE SE:</strong>
        </div>
        
        <div class="welcome-box" style="margin: 15px 0;">
            <ul style="font-size: 10pt;">
                <li><strong>Febre acima de 38°C</strong></li>
                <li><strong>Vermelhidão intensa</strong> que piora ou se espalha</li>
                <li><strong>Dor que aumenta</strong> em vez de diminuir</li>
                <li><strong>Secreção purulenta</strong> (pus amarelado/esverdeado)</li>
                <li><strong>Inchaço que aumenta repentinamente</strong></li>
                <li><strong>Odor forte e desagradável</strong> na área operada</li>
                <li><strong>Separação das bordas da cicatriz</strong></li>
                <li><strong>Sangramento intenso</strong></li>
                <li><strong>Dificuldade para respirar</strong></li>
            </ul>
        </div>
        
        <div class="divider"></div>
        
        <h3>✅ SINAIS NORMAIS (não se preocupe):</h3>
        
        <div class="welcome-box">
            <ul style="font-size: 10pt;">
                <li>Inchaço gradual que diminui com o tempo</li>
                <li>Vermelhidão que clareia progressivamente</li>
                <li>Sensação de "repuxamento"</li>
                <li>Coceira leve (sinal de cicatrização)</li>
                <li>Pequenos hematomas (manchas roxas/amareladas)</li>
                <li>Assimetria temporária devido ao edema</li>
            </ul>
        </div>
        
        <div class="divider"></div>
        
        <h3>📞 CONTATOS DE EMERGÊNCIA:</h3>
        
        <div class="notes-box" style="min-height: 120px;">
            <label>Dra. Carolina:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 8px 0;"></div>
            
            <label>Clínica C-Star:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 8px 0;"></div>
            
            <label>Enfermeira:</label>
            <div style="border-bottom: 1px dotted var(--dourado-claro); margin: 8px 0;"></div>
        </div>
        
        <div class="footer">
            <p>C-Star | Protocolo de Segurança</p>
        </div>
    </div>
    
    <!-- ==================== PÁGINA FINAL ==================== -->
    <div class="page cover-page">
        <div class="logo-container" style="margin-top: 70px;">
            <img src="LOGO CSTAR 26 SEM FUNDO.png" alt="C-Star Logo" style="max-width: 220px;">
        </div>
        
        <h1 style="margin-top: 40px;">PARABÉNS!</h1>
        <h2>Você completou os 45 dias</h2>
        
        <div class="divider"></div>
        
        <div class="welcome-box" style="margin: 35px 0;">
            <h3 style="text-align: center;">💝 Sua dedicação fez toda a diferença!</h3>
            <p style="text-align: center; margin-top: 18px; line-height: 1.8; font-size: 10pt;">
                Este guia é seu testemunho de disciplina e amor próprio.<br><br>
                Continue mantendo os hábitos saudáveis adquiridos:<br>
                <strong>Hidratação • Alimentação Balanceada • Faixa para dormir • Atividade física</strong>
            </p>
        </div>
        
        <div class="intro-text" style="margin-top: 45px;">
            <p style="font-size: 11pt; font-style: italic; color: var(--dourado-escuro);">
                "O resultado completo aparece em 12-18 meses.<br>
                Tenha paciência e confie no processo!"
            </p>
        </div>
        
        <div class="doctor-section" style="margin-top: 50px;">
            <img src="dra-carolina-real.jpg" alt="Dra. Carolina" class="doctor-photo" style="width: 120px; height: 120px;">
            <div class="doctor-name" style="font-size: 16pt;">Dra. Carolina</div>
            <div class="doctor-title">Sempre à disposição para acompanhar sua jornada</div>
        </div>
        
        <div class="divider"></div>
        
        <div style="text-align: center; margin-top: 40px;">
            <p style="font-family: 'Playfair Display', serif; font-size: 16pt; color: var(--dourado-escuro);">
                <strong>✨ C-STAR ✨</strong>
            </p>
            <p style="margin-top: 8px; color: var(--cinza-medio); font-size: 10pt;">
                EXCELÊNCIA EM CIRURGIA FACIAL
            </p>
            <p style="margin-top: 12px; color: var(--cinza-medio); font-size: 9pt;">
                Desenvolvido com ❤️ para sua recuperação perfeita
            </p>
            <p style="margin-top: 5px; font-size: 8pt; color: var(--cinza-claro);">
                Versão 3.0 Premium - 2026
            </p>
        </div>
    </div>

</body>
</html>
`;

// Salvar arquivo
fs.writeFileSync('Guia_Completo_45_Dias.html', html, 'utf-8');

console.log("✅ Guia gerado com sucesso!");
console.log("📄 Arquivo: Guia_Completo_45_Dias.html");
console.log(`🌟 Total de páginas: ${2 + 45 + 4} (Capa + Instruções + 45 dias + Nutrição (2) + Sinais + Final)`);
console.log("💾 Total aproximado: 52 páginas A4");
