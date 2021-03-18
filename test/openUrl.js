
const argv = process.argv.slice(2);
console.log(argv);
var headless = true;
if(argv[1] == "false"){
    headless = false;
}
(async () => {
    const Puppeteer = require('puppeteer');
    await Puppeteer.launch({
        headless: headless,
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
        /*await page.evaluateOnNewDocument(() => {
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
*/
        await page.on("console",function(msg){
            console.log(msg.text());
        });

        await page.on('error',function(e){
            console.log("error");
            console.log(e);
            process.exit();
        });

        await page.on('pageerror',function(e){
            console.log("pageerror");
            console.log(e);
            process.exit();
        })

        await page.on('requestfailed',async function(e){
            var url = await e.url();
            var failure = await e.failure();
            console.log("requestfailed" , url);
            console.log(failure);
            process.exit();
        })

        await page.on('request',async function(req){
            var url = await req.url();
            console.log('request ',url);
        })

        function waitForExit(n_sec){
            if(n_sec.sec == 1){
                process.exit();
            }else{
                n_sec.sec -= 1; 
                process.stdout.write(n_sec.sec+" ");
                setTimeout(waitForExit,1000,n_sec);
            }
        }

        await page.on("requestfinished",async function(req){
            var url = await req.url();
            if(url.indexOf("/api/getBoloolByIds")!=-1){
                console.log("数据已经全部获取了，10秒后即将退出");
                n_sec={sec:10};
                setTimeout(waitForExit,1000,n_sec);
            }
        })

        await page.goto(argv[0]);
        console.log(await page.title());
        // await page.close();
    });
})();