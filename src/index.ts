process.env.TZ='Asia/Shanghai';
import path = require('path')
import fs = require('fs-extra')
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, './'))
import { CQWebSocket } from 'cq-websocket'
import { getCQWebSocketOption, printTime, sendPrivateMsg, sleep } from './utils'
import { CQLog } from './models'
import './db'
import './schedule'//直接执行？
import { app } from './routes'
import { logger2 } from './utils/logger2'
import node_localStorage from 'node-localstorage';
const node_localStorage2 = node_localStorage.LocalStorage;
const bili = new node_localStorage2('./bili'); //插件是否连上机器人

export const bot = new CQWebSocket(getCQWebSocketOption())
bili.setItem("huozhe", false)

bot.on('socket.connecting', (socketType, attempts) => {
    printTime(`[WebSocket] 尝试第${attempts}次连线`, CQLog.LOG_INFO)
}).on('socket.connect', (socketType, sock, attempts) => {
    printTime(`[WebSocket] 第${attempts}次连线尝试成功`, CQLog.LOG_INFO_SUCCESS)
    bili.setItem("huozhe", true)
}).on('socket.failed', (socketType, attempts) => {
    printTime(`[WebSocket] 第${attempts}次连线尝试失败 `, CQLog.LOG_WARNING)
    bili.setItem("huozhe", false)
}).on('socket.error', (socketType, error) => {
    printTime('[WebSocket] 连线出现了socket.error错误！！', CQLog.LOG_ERROR)
    logger2.error("index1:" + error)
    bili.setItem("huozhe", false)
    //process.exit()
}).on('error', (error) => {
    printTime('[WebSocket] 连线出现了error！！', CQLog.LOG_FATAL)
    logger2.error("index2:" + error)
    //bili.setItem("huozhe", false)
})

bot.connect()

bot.on('ready', async () => {
    const file = await fs.readJSON('package.json')
    printTime(`[Info] 当版本号：${file.version}`, CQLog.LOG_INFO)
    printTime('[WebSocket] 连接成功！', CQLog.LOG_INFO)
    app.run(bot)
})


bot.on('message.private', (event, ctx, tags) => {
    printTime(`[接收私聊消息] 类型:${ctx.sub_type} QQId:${ctx.user_id} msg:${ctx.message}`, CQLog.LOG_INFO_SUCCESS)
})

bot.on('message.group', (event, ctx, tags) => {
    printTime(`[接收群聊消息] 类型:${ctx.sub_type} GroupId:${ctx.group_id} QQId:${ctx.user_id} msg:${ctx.message}`, CQLog.LOG_INFO_SUCCESS)
})

bot.on('meta_event.heartbeat', (ctx) => { // 响应心跳连接
    (async function () {
        try {
            const result = await bot('get_status')
            printTime(`API调用测试：get_status:${result.status}`, CQLog.LOG_DEBUG)
            if (result.status !== 'ok') {
                printTime('发生了异常', CQLog.LOG_ERROR)
            }
        } catch (error) {
            printTime('发生了异常', CQLog.LOG_ERROR)
        }
    }())
})