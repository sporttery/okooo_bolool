var mysql_pool = require('../src/mysql_pool');


async function getIdFromDb() {
    const conn = await mysql_pool.getConnection();
    const [rows, fields] = await conn.execute('SELECT max(id)+1 as id FROM `t_match`');
    conn.release();
    return rows[0].id;
}


process.on('exit', async (code) => {
    try {
        await mysql_pool.end()
    } catch (e) {}
})


const argv = process.argv.slice(2);


(async () => {
    let maxId = await getIdFromDb();
    console.log(maxId);
    const Puppeteer = require('puppeteer');
    await Puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 966
        },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        ignoreHTTPSErrors: true
        //ignoreDefaultArgs: ["--enable-automation"]
        // devtools: true

    }).then(async browser => {

        let pages = await browser.pages();
        let page = pages[0];

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36");
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [{
                        0: {
                            type: "application/x-google-chrome-pdf",
                            suffixes: "pdf",
                            description: "Portable Document Format",
                            enabledPlugin: Plugin
                        },
                        description: "Portable Document Format",
                        filename: "internal-pdf-viewer",
                        length: 1,
                        name: "Chrome PDF Plugin"
                    },
                    {
                        0: {
                            type: "application/pdf",
                            suffixes: "pdf",
                            description: "",
                            enabledPlugin: Plugin
                        },
                        description: "",
                        filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                        length: 1,
                        name: "Chrome PDF Viewer"
                    },
                    {
                        0: {
                            type: "application/x-nacl",
                            suffixes: "",
                            description: "Native Client Executable",
                            enabledPlugin: Plugin
                        },
                        1: {
                            type: "application/x-pnacl",
                            suffixes: "",
                            description: "Portable Native Client Executable",
                            enabledPlugin: Plugin
                        },
                        description: "",
                        filename: "internal-nacl-plugin",
                        length: 2,
                        name: "Native Client"
                    }
                ],
            });

            window.chrome = {
                runtime: {},
                loadTimes: function () {},
                csi: function () {},
                app: {}
            };
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => "Win32",
            });
        });

        await page.goto("http://www.okooo.com/jingcai/");
        console.log(await page.title());
        await page.close();
    });
    process.exit();
})();