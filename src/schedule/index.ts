import { Subscribe, CQLog } from '@/models'
import { getNotPushDynamic, biliDynamicFormat, saveSubscribeList, isNewLive, biliLiveFormat } from '@/services'
import { sleep, sendMsg, sendGroupMsg, sendPrivateMsg, printTime } from '@/utils'
import { IS_DEBUG, API_SLEEP_TIME, MSG_SLEEP_TIME, SLEEP_TIME } from '@/config'
import { SUBSCRIBE_LIST } from '@/db'
import { logger2 } from '../utils/logger2'
import node_localStorage from 'node-localstorage';
const node_localStorage2 = node_localStorage.LocalStorage;
const bili = new node_localStorage2('./bili'); //插件是否连上机器人


/**
 * 向订阅者推送最新动态
 *
 * @author CaoMeiYouRen
 * @date 2020-06-18
 * @export
 * @param {Subscribe[]} list
 * @returns
 */
export async function pushDynamic(list: Subscribe[]) {
    for (let i = 0; i < list.length; i++) {
        if (bili.getItem("huozhe") == "false") {
            logger2.error(new Date().toString() + ",连不上机器人，跳过订阅bilibili2")
            break
        }
        const sub = list[i]
        const dynamics = await getNotPushDynamic(sub.userId, sub.dynamic_id, sub.dynamic_id2, 12)//单次最多可以推送12个动态
        //logger2.info("dynamics.length: "+dynamics.length);
        if (sub.dynamic_id == 0) {//解决首次订阅疯狂转发12条消息
            logger2.info("首次获取订阅信息")
            sub.lastDynamic = Date.now()
            sub.lasturl = dynamics[dynamics.length - 1].link
            sub.dynamic_id = dynamics[dynamics.length - 1].dynamic_id;
            sub.dynamic_id2 = dynamics[dynamics.length - 2].dynamic_id;
            await saveSubscribeList(list)
        }
        else if (dynamics.length > 0) {
            for (let j = 0; j < dynamics.length; j++) {
                const d = dynamics[j]
                //logger2.info(JSON.stringify(d));
                const suber = sub.subscribers
                let text = biliDynamicFormat(sub.userName, d)
                for (let k = 0; k < suber.length; k++) {
                    const s = suber[k]
                    //logger2.info(text)
                    if (s.subType === 'group') {
                        await sendGroupMsg(s.subId, text)
                    } else {
                        await sendPrivateMsg(s.subId, text)
                    }
                    await sleep(MSG_SLEEP_TIME)
                }
            }
            sub.lastDynamic = Date.now()
            sub.lasturl = dynamics[dynamics.length - 1].link
            sub.dynamic_id = dynamics[dynamics.length - 1].dynamic_id
            if (dynamics.length > 1) {
                sub.dynamic_id2 = dynamics[dynamics.length - 2].dynamic_id
            }
            else {
                sub.dynamic_id2 = dynamics[dynamics.length - 1].dynamic_id
            }
            await saveSubscribeList(list)
        } else {
            printTime(`当前用户 ${sub.userName} 没有新动态`, CQLog.LOG_DEBUG)
        }
        await sleep(API_SLEEP_TIME)
        let live = await isNewLive(sub.userId)
        if (live) {//直播
            let suber = sub.subscribers
            let text = biliLiveFormat(sub.userName, live)
            for (let k = 0; k < suber.length; k++) {
                const s = suber[k]
                if (s.subType === 'group') {
                    await sendGroupMsg(s.subId, text)
                } else {
                    await sendPrivateMsg(s.subId, text)
                }
                await sleep(MSG_SLEEP_TIME)
            }
            list[i].lastLive = Date.now()
            await saveSubscribeList(list)

        } else {
            printTime(`当前用户 ${sub.userName} 没有新开播`, CQLog.LOG_DEBUG)
        }
        await sleep(API_SLEEP_TIME)

    }
    return true
}


setTimeout(async () => {
    printTime('开始轮询最新动态', CQLog.LOG_DEBUG)
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (bili.getItem("huozhe") == "false") {
            logger2.error(new Date().toString() + ",连不上机器人，跳过订阅bilibili")
        }
        else {
            try {
                await pushDynamic(SUBSCRIBE_LIST)
            } catch (error) {
                logger2.error("schedule" + error)
            }
        }
        await sleep(SLEEP_TIME)
    }
}, 2000)
