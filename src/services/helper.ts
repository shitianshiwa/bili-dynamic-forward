import _ = require('lodash')
import { globalCache, filestore } from '@/db'
import { ajax, ajax2 } from '@/utils'
import { FollowingResult, Following, Subscribe, Vtuber } from '@/models'
//import { logger2 } from '../utils/logger2'


/**
 * 取用户名
 *
 * @author CaoMeiYouRen
 * @author CaoMeiYouRen2
 * @date 2020-06-17
 * @date2 2020-09-15
 * @export
 * @param {number} uid
 * @returns
 */
export async function getUsernameFromUID(uid: number) {
    if (typeof uid !== 'number' || uid <= 0) {
        return ''
    }
    //https://api.bilibili.com/x/space/acc/info?mid=2&jsonp=jsonp
    /**
    const result = await ajax2({
            url: 'https://space.bilibili.com/ajax/member/GetInfo',
            data: { mid: uid },
            method: 'POST',
            headers: {
                Referer: `https://space.bilibili.com/${uid}/`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
     */
    const key = `bili-username-from-uid-${uid}`
    let name: string = (await globalCache.get(key)) || ''
    if (!name) {
        const result = await ajax('https://api.bilibili.com/x/space/acc/info', {
            mid: uid, jsonp: 'jsonp'
        }, {}, 'GET', {
            Referer: `https://space.bilibili.com/${uid}/`,
        })
        //console.log(result.data)
        if (result.data?.code == 0) {
            name = result.data?.data?.name
            await globalCache.set(key, name, 3600 * 24 * 7)
        }
        //console.log("name:" + name + "," + JSON.stringify(result.data.data.name))
    }
    return name
}

/**
 * 根据uid获取直播间号
 *
 * @author CaoMeiYouRen
 * @date 2020-06-23
 * @export
 * @param {number} uid
 * @returns
 */
export async function getRoomIdFromUID(uid: number) {
    if (typeof uid !== 'number' || uid <= 0) {
        return 0
    }
    const key = `bili-roomid-from-uid-${uid}`
    let roomid: number = Number((await filestore.get(key)) || 0)
    if (!roomid) {
        const result = await ajax('https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld', {
            mid: uid,
        }, {}, 'GET', {
            Referer: `https://space.bilibili.com/${uid}/`,
        })
        // console.log(result.data)
        if (result.data?.code === 0) {
            roomid = result.data?.data?.roomid
            await filestore.set(key, roomid)
        }
    }
    return roomid
}

/**
 * 校验用户是否有效
 *
 * @author CaoMeiYouRen
 * @date 2020-06-17
 * @export
 * @param {number} uid
 * @returns {Promise<boolean>}
 */
export async function isValidUser(uid: number): Promise<boolean> {
    return Boolean(await getUsernameFromUID(uid))
}

/**
 * 获取指定用户的全部关注
 *
 * @author CaoMeiYouRen
 * @date 2020-06-17
 * @export
 * @param {number} uid
 */
export async function getAllFollowings(uid: number, tag?: number) {
    const m = await getFollowingNumber(uid)
    if (m <= 0) {
        return []
    }
    const n = Math.ceil(m / 50) % 5 + 1// 每页最多50，最多5页
    let followings: Following[] = []
    for (let i = 0; i < n; i++) {
        const temp = await getFollowings(uid, i + 1, tag)
        followings = followings.concat(temp)
    }
    return followings
}
/**
 *  获取指定用户的关注
 *
 * @author CaoMeiYouRen
 * @date 2020-06-18
 * @export
 * @param {number} uid
 * @param {number} pn 第几页
 * @param {number} [tag]
 */
export async function getFollowings(uid: number, pn: number, tag?: number) {
    const result = await ajax2({
        url: 'https://api.bilibili.com/x/relation/followings',
        query: {
            vmid: uid,
            pn,
        },
        headers: {
            Referer: `https://space.bilibili.com/${uid}/`,
        },
    })
    if (result.data?.code !== 0) {
        return []
    }
    const data: FollowingResult = result.data
    return data?.data?.list.filter(e => {
        if (!tag) {
            return true
        }
        return e?.tag?.includes(tag)
    })
}

/**
 * 获取关注数
 *
 * @author CaoMeiYouRen
 * @date 2020-06-18
 * @export
 * @param {number} uid
 * @returns {Promise<number>}
 */
export async function getFollowingNumber(uid: number): Promise<number> {
    const result = await ajax2({
        url: 'https://api.bilibili.com/x/relation/stat',
        query: {
            vmid: uid,
        },
        headers: {
            Referer: `https://space.bilibili.com/${uid}/`,
        },
    })
    return result.data?.data?.following || 0
}

