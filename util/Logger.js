const c = require('chalk')
function dateTimePad(value, digits) {
    let number = value;
    while (number.toString().length < digits) {
        number = "0" + number;
    }
    return number;
}
function format(tDate = new Date(Date.now())) {
    return tDate.getFullYear() + "-" +
        dateTimePad((tDate.getMonth() + 1), 2) + "-" +
        dateTimePad(tDate.getDate(), 2) + " " +
        dateTimePad(tDate.getHours(), 2) + ":" +
        dateTimePad(tDate.getMinutes(), 2) + ":" +
        dateTimePad(tDate.getSeconds(), 2) + " ";
}

module.exports = class Logger {
    log(tolog, options = null) {
        if (!options) {
            console.log(c.cyan(`[LOG] ${format()}- ${tolog}`))
        } else {
            console.log(c.cyan(`[LOG] ${format()}- ${tolog}`), options)
        }
    }
    info(tolog, options = null) {
        if (!options) {
            console.log(c.blue(`[INFO] ${format()}- ${tolog}`))
        } else {
            console.log(c.blue(`[INFO] ${format()}- ${tolog}`), options)
        }
    }
    success(tolog, options = null) {
        if (!options) {
            console.log(c.green(`[SUCCESS] ${format()}- ${tolog}`))
        } else {
            console.log(c.green(`[SUCCESS] ${format()}- ${tolog}`), options)
        }
    }
    warn(tolog, options = null) {
        if (!options) {
            console.log(c.hex("#FF8400")`[WARN] ${format()}- ${tolog}`)
        } else {
            console.log(c.hex("#FF8400")`[WARN] ${format()}- ${tolog}`, options)
        }
    }
    error(tolog, options = null) {
        if (!options) {
            console.log(c.red(`[ERROR] ${format()}- ${tolog}`))
        } else {
            console.log(c.red(`[ERROR] ${format()}- ${tolog}`), options)
        }
    }
}