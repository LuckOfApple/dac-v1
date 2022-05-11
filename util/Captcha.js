const phin = require('phin');
const Logger = new (require('./Logger'));
const Util = new (require('./Util'))(null)
const Captchaa = require("2captcha")

class Captcha {
    constructor(config) {
        this.config = config;
        this.proxy = config.proxy.proxy;
        this.proxytype = config.proxy.proxytype;
    }
    async twoCaptchaSolver(type = 'register', proxy = '', proxytype = '') {
    const solver = new Captchaa.Solver(this.config.captchaKey)
    let key = 'bruh'
    let sitekey;
    switch (type) {
        case 'register':
            sitekey = '4c672d35-0701-42b2-88c3-78380b0db560'
            break;
        case 'phone':
            sitekey = 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34'
            break;
        case 'email':
            sitekey = 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34'
            break;
        default:
            sitekey = '4c672d35-0701-42b2-88c3-78380b0db560'
            break;
    }
    await solver.hcaptcha(sitekey, "discord.com", {
        proxy: this.proxy,
        proxytype: "HTTP",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
    }).then((res) => {
        key = res.data;
    }).catch((err) => {
        Logger.log(`Thread #${this.config.thread}: Error while solving captcha: "${err}"`);
        process.exit(1)
    })
    /*
    
        // Types are register, phone, and email.
        const res = await phin({
            url: `http://2captcha.com/in.php`,
            method: 'POST',
            parse: 'json',
            data: {
                "key": `${this.config.captchaKey}`,
                "method": `hcaptcha`,
                "sitekey": `${sitekey}`,
                "pageurl": `https://discord.com/`,
                "userAgent": `${this.config.useragent}`,
                "json": 1,
                //"soft_id": null,
                "proxy": `${this.proxy}`, // login:password@123.123.123.123:3128
                "proxytype": `${this.proxytype}`, // Type of your proxy: HTTP, HTTPS, SOCKS4, SOCKS5.
            }
        });
        const id = res.body.request;
        let solved = false;
        let i;
        let final;
        while (!solved) {
            await Util.sleep(5000);
            i = await phin({
                url: `http://2captcha.com/res.php?key=${this.config.captchaKey}&action=get&id=${id}&json=1`,
                method: 'POST',
                parse: 'json',
                headers: {
                    "Content-Type": "application/json",
                    'User-Agent': `${this.config.useragent}`,
                },
            });
            if (i.body.request === 'CAPCHA_NOT_READY') {
                continue;
            } else if (i.body.request === 'ERROR_CAPTCHA_UNSOLVABLE') {
                Logger.log(`Thread #${this.config.thread}: Captcha unsolvable, exiting...`)
                process.exit(1)
            } else if (i.body.request === 'ERROR_WRONG_USER_KEY') {
                Logger.log(`Thread #${this.config.thread}: Wrong 2Captcha user key, exiting...`)
                process.exit(1)
            } else if (i.body.request === 'ERROR_KEY_DOES_NOT_EXIST') {
                Logger.log(`Thread #${this.config.thread}: 2Captcha key does not exist, exiting...`)
                process.exit(1)
            } else if (i.body.request === 'ERROR_ZERO_BALANCE') {
                Logger.log(`Thread #${this.config.thread}: No balance available for captcha solving, exiting...`)
                process.exit(1)
            } else if (i.body.status === 1) {
                final = i.body.request;
                solved = true;
                break;
            } else {
                console.log(await i.body)
                Logger.log(`Thread #${this.config.thread}: Captcha solving error, exiting...`)
                process.exit(1)
            }
        }
        */
        return key;
    }
}

module.exports = Captcha;