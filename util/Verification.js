const phin = require('phin');
const Logger = new (require('./Logger'));
const notifier = require('mail-notifier');
const ProxyAgent = require('proxy-agent');
const Util = new (require('./Util'))(null)

class Verification {
    constructor(config) {
        this.config = config;
        this.agent = new ProxyAgent(`http` + "://" + config?.proxy?.proxy)
    }
    async verifyGmailDot(token, imapEmail, imapPassword, imapHost = "imap.gmail.com", imapPort = 993, imapTLS = true) {
        const details = {
            user: imapEmail,
            password: imapPassword,
            host: imapHost,
            port: imapPort,
            tls: imapTLS,
            tlsOptions: { rejectUnauthorized: false }
        };
        let clickURL = undefined;
        while (true) {
            let imap = notifier(details)
            imap.on('mail', mail => {
                if (mail.subject.includes('Verify') && mail.from[0].name.includes('Discord') && imapEmail.includes(mail.to[0].address)) {
                    clickURL = mail.text.split('Verify Email: ')[1].replace(/\n/g, '')
                }
            })
            imap.start()
            await Util.sleep(5000)
            if (typeof clickURL !== 'undefined') {
                console.log('complete')
                imap.stop()
                break;
            } else {
                console.log('waiting')
                imap.stop()
                continue;
            }
        }
        const verifToken = await Util.getEmailToken(clickURL)
        const Captcha = new (require('./Captcha'))(this.config)
        Logger.log(`Thread #${this.config.thread}: Awaiting captcha solver for email verification...`)
        const key = await Captcha.twoCaptchaSolver('email')
        const headers = {
            "accept": "*/*",
            //"accept-language": "en-US",
            "authorization": `${token}`,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/verify",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            "x-debug-options": "bugReporterEnabled",
            //"x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
        }
        const res = await phin({
            url: "https://discord.com/api/v9/auth/verify",
            method: "POST",
            headers: headers,
            parse: "json",
            data: {
                captcha_key: `${key}`,
                token: `${verifToken}`
            },
            core: {
                agent: this.agent
            }
        })
        console.log(JSON.stringify(res.body))
        if (res?.body?.errors) {
            Logger.log(`Thread #${this.config.thread}: Email verification provided an error.`)
            process.exit(1)
        } else if (res?.body?.token) {
            Logger.log(`Thread #${this.config.thread}: Email verified!`)
        } else {
            Logger.log(`Thread #${this.config.thread}: Email verification failed with unknown error.`)
            process.exit(1)
        }
        return true
    }
    async smsActivatePhone(token, password) {
        const headers = {
            "accept": "*/*",
            //"accept-language": "en-US",
            "authorization": `${token}`,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            "x-debug-options": "bugReporterEnabled",
            //"x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
        }
        const res = await phin({
            url: `https://sms-activate.org/stubs/handler_api.php?api_key=${this.config.smsActivateKey}&action=getNumber&service=ds&country=0`,
            method: 'GET',
            parse: 'string',
        });
        const { body } = res;
        if (body.includes('ACCESS_NUMBER')) {
            Logger.log(`Thread #${this.config.thread}: Number acquired for phone verification.`)
            const activationId = body.split(':')[1];
            const number = body.split(':')[2];
            const Captcha = new (require('./Captcha'))(this.config)
            Logger.log(`Thread #${this.config.thread}: Awaiting captcha solver for phone verification...`)
            const key = await Captcha.twoCaptchaSolver('phone')
            const json = {
                "captcha_key": `${await key}`,
                "change_phone_reason": "user_action_required",
                "phone": `+${number}`
            }
            const dc1 = await phin({
                url: `https://discord.com/api/v9/users/@me/phone`,
                method: 'POST',
                parse: 'json',
                data: json,
                headers: headers
            });
            const toggle = await phin({
                url: `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.config.smsActivateKey}&action=setStatus&status=1&id=${activationId}`,
                method: 'GET',
                parse: 'string',
            });
            let verified = false;
            let code = 'placeholderrrr';
            Logger.log(`Thread #${this.config.thread}: Awaiting SMS code...`)
            while (!verified) {
                await Util.sleep(5000);
                const res2 = await phin({
                    url: `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.config.smsActivateKey}&action=getStatus&id=${activationId}`,
                    method: 'GET',
                    parse: 'string',
                });
                const body2 = res2.body;
                if (body2.includes('STATUS_WAIT_CODE')) {
                    continue;
                } else if (body2.includes('STATUS_OK')) {
                    verified = true;
                    code = body2.split(':')[1];
                    const bruh = await phin({
                        url: `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.config.smsActivateKey}&action=setStatus&status=6&id=${activationId}`,
                        method: 'GET',
                        parse: 'string',
                    });
                    break;
                } else {
                    continue
                }
            }
            const json2 = {
                "code": `${code}`,
                "phone": `+${number}`
            }
            const headers2 = {
                "accept": "*/*",
                //"accept-language": "en-US",
                "authorization": token,
                "content-type": "application/json",
                "origin": "https://discord.com",
                "referer": "https://discord.com/channels/@me",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
                "x-debug-options": "bugReporterEnabled",
                //"x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
            }
          const dc2 = await phin({
            url: `https://discord.com/api/v9/phone-verifications/verify`,
            method: 'POST',
            parse: 'json',
            data: json2,
            headers: headers2
        });
        const finaltoken = dc2.body.token;
        const json3 = {
            "phone_token": finaltoken,
            "password": password,
            "change_phone_reason": "user_action_required"
        }
        const headers3 = {
            "accept": "*/*",
            //"accept-language": "en-US",
            "authorization": token,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
            "x-debug-options": "bugReporterEnabled",
            //"x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
          }
          const dc3 = await phin({
            url: `https://discord.com/api/v9/users/@me/phone`,
            method: 'POST',
            parse: 'json',
            data: json3,
            headers: headers3
        });
    } else {
        Logger.log(`Thread #${this.config.thread}: Error in phone verification, exiting...`)
        process.exit(1)
        }
    }




    async onlineSimPhone(token, password) {
        const headers = {
            "accept": "*/*",
            "accept-language": "en-US",
            "authorization": `${token}`,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
            "x-debug-options": "bugReporterEnabled",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
        }
        const res = await phin({
            url: `https://onlinesim.io/api/getNum.php?country=372&apikey=${this.config.onlineSimKey}&service=Discord&number=true`,
            method: 'GET',
            parse: 'json',
            headers: {
                "Content-Type": "application/json",
            }
        });
        const { body } = res;
        console.log(body)
        if (body.repsonse === 1) {
            const Captcha = new (require('./util/Captcha'))(this.config)
            const key = await Captcha.twoCaptchaSolver('phone')
            const json = {
                "captcha_key": `${key}`,
                "change_phone_reason": "user_action_required",
                "phone": `${body.number}`
            }
            console.log("awaitng phone captcha solver...")
            const dc1 = await phin({
                url: `https://discord.com/api/v9/users/@me/phone`,
                method: 'POST',
                parse: 'json',
                data: json,
                headers: headers
            });
            console.log(dc1.body)
            const tzid = body.tzid;
            let verified = false;
            let code = 'placeholderrrr';
            while (!verified) {
                await Util.sleep(5000);
                const res2 = await phin({
                    url: `https://onlinesim.io/api/getState.php?tzid=${tzid}&apikey=${this.config.onlineSimKey}`,
                    method: 'GET',
                    parse: 'json',
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const { body2 } = res2;
                if (body2.response !== 1) {
                    console.log(body2.repsonse)
                    continue;
                } else {
                    console.log(body2.repsonse)
                    verified = true;
                    code = body2.msg;
                    break;
                }
            }
            const json2 = {
                "code" : `${code}`,
                "phone" : `${body.number}`
            }
            const headers2 = {
            "accept": "*/*",
            "accept-language": "en-US",
            "authorization": token,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
            "x-debug-options": "bugReporterEnabled",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
          }
          const dc2 = await phin({
            url: `https://discord.com/api/v9/phone-verifications/verify`,
            method: 'POST',
            parse: 'json',
            data: json2,
            headers: headers2
        });
        console.log(dc2.body)
        const finaltoken = dc2.body.token;
        const json3 = {
            "phone_token": finaltoken,
            "password": password,
            "change_phone_reason": "user_action_required"
        }
        const headers3 = {
            "accept": "*/*",
            "accept-language": "en-US",
            "authorization": token,
            "content-type": "application/json",
            "origin": "https://discord.com",
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
            "x-debug-options": "bugReporterEnabled",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkzLjAuNDU3Ny44MiBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiOTMuMC40NTc3LjgyIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2xvZ2luIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjk3NjYyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
          }
          const dc3 = await phin({
            url: `https://discord.com/api/v9/users/@me/phone`,
            method: 'POST',
            parse: 'json',
            data: json3,
            headers: headers3
        });
        console.log(dc3.body)

        } else {
            Logger.log(`Phone Verification Error: "${body.error}"`);
        }
    }
}

module.exports = Verification;