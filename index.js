const crypto = require('crypto')
const chalk = require('chalk')
const fs = require('fs')
const { Worker } = require('worker_threads')

const config = require('./config.json')
//const Captcha = new (require('./util/Captcha'))(config)
//const OAuth = new (require('./util/OAuth'))(config)
//const Randomization = new (require('./util/Randomization'))(config)
//const Verification = new (require('./util/Verification'))(config)
//const Util = new (require('./util/Util'))(config)
const logger = new (require('./util/Logger'));

process.env['FORCE_COLOR'] = chalk.level.toString();

test()
//init()

async function init() {
    config.proxies = fs.readFileSync('./proxies.txt').toString().split('\n');
    config.proxies = config.proxies.filter(proxy => proxy.length > 0);
    if (config.proxies.length === 0) {
        config.proxy.enable = false;
    }
    console.log(config)
}

async function start() {
    console.log(`
    _____       _             
    \\_   \\_ __ | |_ _ __ __ _ 
     / /\\/ \'_ \\| __| \'__/ _\` |
  /\\/ /_ | | | | |_| | | (_| |
  \\____/ |_| |_|\\__|_|  \\__,_|
                      \n        
    `)
    logger.log('Starting...')
    logger.success('Successfully authed.') // add auth here
    await Util.sleep(2000)
    console.clear()

    let tokens = [];
    
    let fingerprint = await Util.getFingerprint()
    logger.success("Found fingerprint...")
    let cookies = await Util.getCookies()
    logger.success("Found cookies...")
    logger.info("Awaiting captcha solver...")
    let captchaKey = await Captcha.twoCaptchaSolver()
    logger.success("Captcha solved...")
    const pwd = crypto.randomBytes(10).toString('hex')
    let register = await OAuth.register(fingerprint, captchaKey, 'a.n.gelbyth.eafterlife@gmail.com', 'IsssBughaBald', pwd)
    logger.success("Successfully registered!")
    console.log(register)
    tokens.push(register)
    logger.info("Awaiting phone verification...")
    let phoneVerif = await Verification.smsActivatePhone(register, pwd)
    console.log(`PASS: ${pwd}`)
    console.log(tokens)
    process.exit(1)
}

async function test(threads = '7') {
    let proxies = fs.readFileSync('./proxies.txt').toString().split('\n');
    let emails = fs.readFileSync('./emails.txt').toString().split('\n');
    let usernames = fs.readFileSync('./usernames.txt').toString().split('\n');
    let a_ = 0;
    for (let i = 0; i < threads; i++) {
        config.thread = i+1;
        config.email = emails[i];
        config.proxy.proxy = proxies[i];
        config.proxy.proxytype = 'HTTP';
        config.username = usernames[Math.floor(Math.random() * usernames.length)];
        if (typeof emails[i] === 'undefined' || emails[i].length < 1) {
            logger.error(`Thread #${config.thread}: No emails left. Exiting thread...`)
            continue;
        }
        const result = runService(config)
    }
}

function runService(workerData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./threading.js', { workerData });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
          return
      })
    })
  }

  process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
  });