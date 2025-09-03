const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
    console.error('⚠️  Bot token não definido! Crie um arquivo .env com BOT_TOKEN=seu_token_aqui');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// URL fixa do summoner
const URL_TO_SCREENSHOT = 'https://op.gg/pt/tft/summoners/br/Toji%20Cubat%C3%A3o-BR1';

// Detecta se estamos no Linux
const isLinux = process.platform === 'linux';

// Função para abrir o Puppeteer de forma cross-platform
async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        executablePath: isLinux ? '/usr/bin/chromium-browser' : undefined, // ajuste se necessário no seu Linux
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
}

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} online!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const command = message.content.trim();

    if (command === '!duff-link'){
        message.reply(`${URL_TO_SCREENSHOT}`);
    }

    // ======= COMANDO !duff =======
    if (command === '!duff') {
        await message.reply('Aguarde, o print da página pode demorar alguns segundos...');
        try {
            const browser = await launchBrowser();
            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            );
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto(URL_TO_SCREENSHOT, { waitUntil: 'networkidle2' });

            // espera a página carregar
            await new Promise(resolve => setTimeout(resolve, 3000));

            // captura apenas o painel do summoner
            const element = await page.$('div.flex.flex-col.p-3');
            if (!element) throw new Error('Não encontrou o painel do summoner');
            const screenshotBuffer = await element.screenshot();

            await browser.close();

            const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'screenshot.png' });
            await message.reply({ files: [attachment] });
        } catch (error) {
            console.error(error);
            message.reply('Erro ao tentar tirar o print da página.');
        }
    }

    // ======= COMANDO !update =======
    if (command === '!duff-update') {
        await message.reply('Aguarde, tentando atualizar os status do op.gg...');
        try {
            const browser = await launchBrowser();
            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            );
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto(URL_TO_SCREENSHOT, { waitUntil: 'networkidle2' });

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Seleciona o botão "Completo"
            const button = await page.$('button.bg-yellow-500');
            if (!button) throw new Error('Botão não encontrado');

            // Verifica se está disabled
            const isDisabled = await page.evaluate(btn => btn.disabled, button);

            if (isDisabled) {
                // pega o valor da última atualização
                const lastUpdate = await page.$('div[data-tooltip-id="last-updated"]');
                const text = lastUpdate ? await page.evaluate(el => el.innerText, lastUpdate) : 'Indisponível';
                await message.reply(`Botão desativado. Valor atual: ${text}`);
            } else {
                // tenta clicar no botão
                await button.click();
                await message.reply('Atualizado com sucesso!');
            }

            await browser.close();
        } catch (error) {
            console.error(error);
            message.reply('Erro ao tentar atualizar.');
        }
    }
});

client.login(TOKEN);
