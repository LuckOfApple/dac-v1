const { workerData, parentPort } = require('worker_threads')
const crypto = require('crypto')
const fs = require('fs')

const Captcha = new (require('./util/Captcha'))(workerData)
const OAuth = new (require('./util/OAuth'))(workerData)
const Randomization = new (require('./util/Randomization'))(workerData)
const Verification = new (require('./util/Verification'))(workerData)
const Util = new (require('./util/Util'))(workerData)
const logger = new (require('./util/Logger'));
a()
async function a() {
  let cookies = await Util.getCookies()
  logger.success(`Thread #${workerData.thread}: Found cookies...`)
    let fingerprint = await Util.getFingerprint(cookies.dcf, cookies.sdc)
    logger.success(`Thread #${workerData.thread}: Found fingerprint...`)
    logger.info(`Thread #${workerData.thread}: Awaiting captcha solver...`)
    let captchaKey = await Captcha.twoCaptchaSolver('register')
    logger.success(`Thread #${workerData.thread}: Captcha solved...`)
    const pwd = crypto.randomBytes(10).toString('hex')
    let register = await OAuth.register(fingerprint, cookies, captchaKey, workerData.email, workerData.username, pwd)
    logger.success(`Thread #${workerData.thread}: Registered, waiting for phone and email verification.`)
    const b_ = fs.readFileSync('./tokens.txt', { encoding: 'utf8' })
    let data = `${workerData.email}:${pwd}:${register}`
    if (b_ === "") {
      data = `${workerData.email}:${pwd}:${register}`
    }
    fs.appendFile('./tokens.txt', data + "\n", function (err) {
        if (err) {
          console.log(err)
          console.log(data)
        } else {
        }
    })
    //logger.info(`Thread #${workerData.thread}: Awaiting email verification...`)
    //let emailVerif = await Verification.verifyGmailDot(register, workerData.email, 'zxcjv213@')
    logger.info(`Thread #${workerData.thread}: Awaiting phone verification...`)
    let phoneVerif = await Verification.smsActivatePhone(register, pwd)
    logger.success(`Thread #${workerData.thread}: Complete.`)
}

