const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const A4_WIDTH_PX_96 = 794;
const A4_HEIGHT_PX_96 = 1123;
const DPI_SCALE = 300 / 96;

function getOutputName(index, classList) {
    const semQuadro = classList.includes('page--sem-quadro');
    if (classList.includes('page--azul')) {
        return semQuadro ? 'modelo_azul_sem_quadro.png' : 'modelo_azul.png';
    }
    if (classList.includes('page--dourado')) {
        return semQuadro ? 'modelo_dourado_sem_quadro.png' : 'modelo_dourado.png';
    }
    return `modelo_${index + 1}.png`;
}

async function main() {
    const inputArg = process.argv[2] || 'Modelos_Oferta_Vazios.html';
    const outputDirArg = process.argv[3] || 'exports';

    const inputPath = path.resolve(process.cwd(), inputArg);
    const outputDir = path.resolve(process.cwd(), outputDirArg);

    if (!fs.existsSync(inputPath)) {
        throw new Error(`Arquivo nao encontrado: ${inputPath}`);
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({
        width: A4_WIDTH_PX_96,
        height: A4_HEIGHT_PX_96,
        deviceScaleFactor: DPI_SCALE,
    });

    await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pageElements = await page.$$('.page');
    if (!pageElements.length) {
        throw new Error('Nenhuma div com a classe .page encontrada no HTML.');
    }

    for (let i = 0; i < pageElements.length; i += 1) {
        const pageElement = pageElements[i];
        const classList = await pageElement.evaluate((el) => Array.from(el.classList));
        const fileName = getOutputName(i, classList);
        const outputPath = path.join(outputDir, fileName);

        await pageElement.screenshot({
            path: outputPath,
            type: 'png',
        });
    }

    await browser.close();
    console.log(`Imagens geradas em: ${outputDir}`);
}

main().catch((error) => {
    console.error('Erro ao gerar imagens:', error.message);
    process.exit(1);
});
