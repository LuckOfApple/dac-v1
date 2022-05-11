const phin = require('phin');
const axios = require('axios');
const ProxyAgent = require('proxy-agent');

class Util {
    constructor(config) {
        this.config = config;
        this.proxy = config?.proxy;
        this.agent = new ProxyAgent(`http` + "://" + config?.proxy?.proxy)
    }
    async getCookies() {
        const headers = {
            "Host": "discord.com",
            "Connection": "keep-alive",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-User": "?1",
            "Sec-Fetch-Dest": "document",
            "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
            "sec-ch-ua-mobile": "?0",
            "Upgrade-Insecure-Requests": "1",
            //"Accept-Language": "en-us,en;q=0.9",
        }
        let res;
        try {
        res = await phin({
            url: `https://discord.com/register`,
            method: 'GET',
            headers: headers,
            core: {
                agent: this.agent
            }
        });
    } catch (e){
        console.log(e)
        process.exit(1)
    }
        let sep = res.headers['set-cookie'][0].split(";")
        let sx = sep[0]
        let sx2 = sx.split("=")
        let dcf = sx2[1]
    
        let split = res.headers['set-cookie'][1].split(";")
        let spl = split[0]
        let split2 = spl.split("=")
        let sdc = split2[1]
        return {
            "original": res.headers['set-cookie'],
            "dcf": dcf,
            "sdc": sdc
        }
    }
    async getEmailToken(clickURL) {
        const res = await phin({
            url: `${clickURL}`,
            method: 'GET'
        });
        return res.headers.location.split('https://discord.com/verify#token=')[1]
    }
    async getFingerprint(dcf, sdc) {
        const headers = {
            "Host": "discord.com",
            "Connection": "keep-alive",
            //"Cookie": `__dcfduid=${dcf}; __sdcfduid=${sdc}`,
            "X-Super-Properties": `${this.config.useragent.toString('base64')}`,
            "X-Context-Properties": "eyJsb2NhdGlvbiI6IlJlZ2lzdGVyIn0=",
            "Accept-Language": "en-US,en;q=0.5",
            //"sec-ch-ua-mobile": "?0",
            //"DNT": "1",
            "TE": "trailers",
            //"X-Debug-Options": "bugReporterEnabled",
            //"X-Discord-Locale": "en-US",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            //"Accept": "*/*",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Referer": "https://discord.com/register",
        }
        /*
        const res = await axios.get('https://discord.com/api/v9/experiments', {
            httpAgent: this.agent,
            timeout: 10000,
            headers: headers,
        })*/
        const res = await phin({
            url: `https://discord.com/api/v9/experiments`,
            method: 'GET',
            parse: 'json',
            headers: headers,
            core: {
                agent: this.agent
            },
            timeout: 10000
        });
        return res.body.fingerprint
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Util;