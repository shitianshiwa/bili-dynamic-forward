import moment from 'moment'
import colors = require('colors')
import ChiTimeNlpAfter = require('chi-time-nlp-after')
import { CQLog } from '@/models'
import {logger2} from './logger2'

/**
 * 解析自然语言中的时间
 *
 * @author CaoMeiYouRen
 * @date 2019-12-11
 * @export
 * @param {(string | Date)} str
 * @returns
 */
export function parseTime(str: string | Date) {
    if (str instanceof Date) {
        return str
    }
    if (str) {
        const timeNlp = new ChiTimeNlpAfter()
        const date: Date = timeNlp.parse(str)
        if (date && (String(date).toUpperCase() !== 'Invalid Date'.toUpperCase())) { // 如果是正确的日期就直接返回
            return date
        }
    }
    return new Date() // 如果是错误的日期就重新 new 一个
}

/**
 * 格式化时间
 * @export
 * @param {(Date | number | string)} [date=Date.now()]
 * @param {string} [pattern='YYYY-MM-DD HH:mm:ss']
 * @returns {string}
 */
export function timeFormat(date: Date | number | string = Date.now(), pattern: string = 'YYYY-MM-DD HH:mm:ss'): string {
    let dateTime: Date | number | string = date
    if (typeof date === 'number') {
        if (date < 1e10) {
            dateTime = date * 1000
        }
    }
    dateTime = new Date(dateTime)
    return moment(dateTime).format(pattern)
}
/**
 *
 * 在控制台输出 HH:mm:ss:SSS->msg 格式的消息
 * @export
 * @param {string} msg
 * @param {number} [level=0]
 */
export function printTime(msg: string, level: CQLog = CQLog.LOG_DEBUG) {
    const time = timeFormat(Date.now(), 'HH:mm:ss.SSS')
    switch (level) {
        case CQLog.LOG_DEBUG:
            logger2.info(time+'->'+colors.gray(msg))
            break
        case CQLog.LOG_INFO:
            logger2.info(time+ '->'+ msg)
            break
        case CQLog.LOG_INFO_SUCCESS:
            logger2.info(time+ '->'+ colors.cyan(msg))
            break
        case CQLog.LOG_INFO_RECV:
            logger2.info(time+ '->'+ colors.blue(msg))
            break
        case CQLog.LOG_INFO_SEND:
            logger2.info(time+ '->'+ colors.green(msg))
            break
        case CQLog.LOG_WARNING:
            logger2.error(time+ '->'+ colors.yellow(msg))
            break
        case CQLog.LOG_ERROR:
            logger2.error(time+ '->'+ colors.red(msg))
            break
        case CQLog.LOG_FATAL:
            logger2.error(time+ '->'+ colors.magenta(msg))
            break
    }
}
