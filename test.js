const notifier = require('mail-notifier');
const phin = require('phin')

//a()

async function a(ab) {

const res = await phin({
    url: `${ab}`,
    method: 'GET'
});
console.log(res.headers.location.split('https://discord.com/verify#token=')[1])
}
const imap = {
  user: "",
  password: "",
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false }
};

async function b() {
    let key = undefined;
    while (true) {
        let a = notifier(imap)
        a.on('mail', mail => {
            if (mail.subject.includes('Verify') && mail.from[0].name.includes('Discord')) {
                console.log(mail.text.split('Verify Email: ')[1].replace(/\n/g, ''))
                key = mail.text.split('Verify Email: ')[1].replace(/\n/g, '')
            }
        })
        a.start()
        await sleep(5000)
        if (typeof key !== 'undefined') {
            a.stop()
            break;
        } else {
            console.log('waiting')
        }
    }

    await a(key)
    console.log("complete")
    return true
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
b()
