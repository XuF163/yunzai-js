import plugin from '../../lib/plugins/plugin.js';

let butn = [[{ text: "开枪", input: "开枪", send: true }]];

export class example extends plugin {
  constructor() {
    super({
      name: '俄罗斯轮盘',
      dsc: '俄罗斯轮盘',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?(开启俄罗斯轮盘|开盘|开启轮盘|开启转盘|t1)$',
          fnc: 'startELSGame'
        },
        {
          reg: '^#?(开枪|t2)$',
          fnc: 'shoot'
        },
        {
          reg: '^#?结束游戏$',
          fnc: 'stopELSGame'
        },
        {
          reg: '^#?当前子弹$',
          fnc: 'nowBullet'
        }
      ]
    });
  }

  async startELSGame(e) {
    let groupId = e.group_id;
    if (await redis.exists(`PAIMON:ELS2:${groupId}`) === 1) {
      e.reply([segment.at(e.user_id), '当前群俄罗斯轮盘正在进行中！\n请发送#开枪 参与游戏', segment.button(...butn)]);
      return;
    }

    if (await redis.exists(`PAIMON:BAN:${groupId}:${e.sender.user_id}`) === 1) {
      let remainingTime = await redis.ttl(`PAIMON:BAN:${groupId}:${e.sender.user_id}`);
      e.reply(`您被禁言中，剩余禁言时间为 ${remainingTime} 秒，无法参与游戏。`);
      return;
    }

    let length = Math.floor(Math.random() * 6) + 3;
    let arr = new Array(length).fill(0);
    let target = Math.floor(Math.random() * length);
    arr[target] = 1;
    Bot.logger.mark('arr', arr);
    await redis.set(`PAIMON:ELS2:${groupId}`, JSON.stringify(arr), { EX: 60 * 60 * 24 });
    e.reply([segment.at(e.user_id),`当前群俄罗斯轮盘已开启！\n弹夹有【${length}】发子弹。\n请发送#开枪 参与游戏`, segment.button(...butn)]);
  }

  async shoot(e) {
    if (!e.isGroup) {
      e.reply('当前不在群聊里');
      return false;
    }

    let username = e.sender.nickname;
    let groupId = e.group_id;
    if (await redis.exists(`PAIMON:ELS2:${groupId}`) === 0) {
      await this.startELSGame(e);
    }

    let arr = JSON.parse(await redis.get(`PAIMON:ELS2:${groupId}`));
    if (arr === null) {
      await redis.del(`PAIMON:ELS2:${groupId}`);
      await this.startELSGame(e);
      return;
    }

    let banTime = await redis.get(`PAIMON:BAN:${groupId}:${e.sender.user_id}`);
    if (banTime !== null) {
      let remainingTime = parseInt(banTime, 10) - Math.floor(Date.now() / 1000);
      let butn = [[{ text: "开枪", input: "开枪", send: true }]];
      e.reply([segment.at(e.user_id),`您被禁言中，剩余禁言时间为 ${remainingTime} 秒，无法开枪。`, segment.button(...butn)]);
      return;
    }

    if (arr[0] === 0) {
      arr.shift();
      if (arr.length === 1) {
        let butn = [[{ text: "开枪", input: "开枪", send: true }]];
        e.reply([segment.at(e.user_id), `开了一枪，没响。\n由于只剩一发子弹，本轮游戏结束。\n请使用#开盘 开启新一轮游戏`, segment.image('https://www.loliapi.com/acg/pc/'), segment.button(...butn)]);
        await redis.del(`PAIMON:ELS2:${groupId}`);
        return;
      }
      e.reply([segment.at(e.user_id), `开了一枪，没响。\n还剩【${arr.length}】发子弹`, segment.button(...butn)]);
      await redis.set(`PAIMON:ELS2:${groupId}`, JSON.stringify(arr), { EX: 60 * 60 * 24 });
      return;
    }

    if (arr[0] === 1) {
      let time = Math.floor(Math.random() * 240) + 60;
      await redis.set(`PAIMON:BAN:${groupId}:${e.sender.user_id}`, String(Math.floor(Date.now() / 1000) + time), { EX: time });
      let butn = [[{ text: "开枪", input: "开枪", send: true }]];
      e.reply([segment.at(e.user_id), `开了一枪，枪响了。\n恭喜您被禁言了 ${time} 秒。\n本轮游戏结束。请使用#开盘 开启新一轮游戏`, segment.button(...butn)]);
      await redis.del(`PAIMON:ELS2:${groupId}`);
    }
  }

  async stopELSGame(e) {
    if (!e.isGroup) {
      e.reply('当前不在群聊里');
      return false;
    }

    let groupId = e.group_id;
    let arr = await redis.exists(`PAIMON:ELS2:${groupId}`);
    if (arr === 0) {
      e.reply('当前群没有开盘');
    } else {
      await redis.del(`PAIMON:ELS2:${groupId}`);
      e.reply('结束成功');
    }
  }

  async nowBullet(e) {
    if (!e.isGroup) {
      e.reply('当前不在群聊里');
      return false;
    }

    let groupId = e.group_id;
    let arr = JSON.parse(await redis.get(`PAIMON:ELS2:${groupId}`));
    if (!arr) {
      e.reply('当前群没有开盘');
    } else {
      e.reply(`当前还有【${arr.length}】发子弹`);
    }
  }
}
