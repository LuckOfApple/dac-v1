const phin = require('phin');
const crypto = require('crypto');
const Logger = new (require('./Logger'));
const ProxyAgent = require('proxy-agent');

class OAuth {
    constructor(config) {
        this.config = config;
        this.proxy = config?.proxy;
        this.agent = new ProxyAgent(`http` + "://" + config?.proxy?.proxy)
    }
    async register(fingerprint, cookies, resKey, email, username, password = crypto.randomBytes(10).toString('hex')) {
        let res;
        try {
            res = await phin({
                url: `https://discord.com/api/v9/auth/register`,
                method: 'POST',
                parse: 'json',
                headers: {
                    "Authorization": "undefined",
                    "Accept": "*/*",
                    //"Accept-Language": "en-US,en;q=0.5",
                    //"Connection": "keep-alive",
                    //"Content-Length": "4797",
                    "Content-Type": "application/json",
                    "Host": "discord.com",
                    "DNT": "1",
                    "Cookie": `__dcfduid=${cookies.dcf}; __sdcfduid=${cookies.sdc}`,
                    "Origin": "https://discord.com",
                    "Referer": "https://discord.com/register",
                    //"X-Debug-Options": "bugReporterEnabled",
                    //"TE": "trailers",
                    //"sec-ch-ua" : "Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99",
                    "Sec-Fetch-Dest":"empty",
                    "Sec-Fetch-Mode":"cors",
                    "Sec-Fetch-Site":"same-origin",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
                    //"X-Discord-Locale": "en-US",
                    "X-Fingerprint": `${fingerprint}`,
                    "X-Super-Properties": `${this.config.useragent.toString('base64')}`
                },
                data: {
                    "captcha_key": resKey,
                    "consent": true,
                    "date_of_birth": "2000-06-08",
                    "email": `${email}`,
                    "fingerprint": fingerprint,
                    "gift_code_sku_id": null,
                    "invite": null,
                    "password": `${password}`,
                    "username": `${username}`
                },
                core: {
                    agent: this.agent
                }
            });
        } catch (e) {
            console.log(e)
            process.exit(1)
        }
            if (res?.body?.captcha_key) {
                Logger.error(`Thread #${this.config.thread}: IP is captcha ratelimited.`)
                process.exit(1)
            } else if (typeof res?.body?.token === 'undefined') {
                Logger.error(`Thread #${this.config.thread}: Registration error, exiting...`)
                process.exit(1)
            }
            return res.body.token;
    }
}

module.exports = OAuth;