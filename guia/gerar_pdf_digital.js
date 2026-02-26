const path = require('path');
const puppeteer = require('puppeteer');

const htmlPath = path.resolve(__dirname, 'Guia_Completo_45_Dias.html');
const outputPath = path.resolve(__dirname, 'Guia_Completo_45_Dias_digital.pdf');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.emulateMediaType('print');

    await page.addStyleTag({
        content: `
            .page:not(.cover-page) {
                background: #ffffff !important;
                box-shadow: none !important;
            }
            .page:not(.cover-page)::before,
            .page:not(.cover-page)::after {
                content: none !important;
                border: none !important;
            }
            .page:not(.cover-page) .day-watermark {
                display: none !important;
            }
        `
    });

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();
    console.log('PDF digital gerado em:', outputPath);
})().catch((error) => {
    console.error('Erro ao gerar PDF digital:', error);
    process.exit(1);
});
