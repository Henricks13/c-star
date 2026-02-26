const path = require('path');
const puppeteer = require('puppeteer');

const htmlPath = path.resolve(__dirname, 'Lipo_Papada_Lift_Pescoco.html');
const outputPath = path.resolve(__dirname, 'Lipo_Papada_Lift_Pescoco.pdf');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.emulateMediaType('print');

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();
    console.log('PDF gerado em:', outputPath);
})().catch((error) => {
    console.error('Erro ao gerar PDF:', error);
    process.exit(1);
});
