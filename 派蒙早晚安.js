import plugin from '../../lib/plugins/plugin.js'

export class RussiaRoundPlatePlugin extends plugin {
  constructor () {
    super({
      name: '派蒙早晚安',
      dsc: '派蒙早晚安-仅适配trss',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?(早安|早上好)$',
          fnc: 'morning'
        },
        {
          reg: '^#?晚安$',
          fnc: 'evening'
        },
        {
          reg: '^#?我睡了多久$',
          fnc: 'sleepDuration'
        }, {
          reg: '^#?现在几点了$',
          fnc: 'nowtime'
        }
      ]
    })
  }

  async sendWithButton(e, message) {
    let buttons = [
      [{ text: "早安", input: "早安", send: true }, { text: "晚安", input: "晚安", send: true }],
      [{ text: "我睡了多久", input: "我睡了多久", send: true }, { text: "现在几点了", input: "现在几点了", send: true }]
    ];
    e.reply([message, segment.button(...buttons)]);
  }

  async morning (e) {
    if (!e.isGroup) {
      e.reply('当前不在群聊里')
      return false
    }

    let userId = e.user_id;
    let sleepTimeKey = `PAIMON:早晚安:sleepTime:${userId}`;
    let sleepRankKey = `PAIMON:早晚安:sleepRank`;

    let sleepTime = await redis.get(sleepTimeKey);

    if (sleepTime) {
      let sleepRank = await redis.get(sleepRankKey); // 获取当前排名
      await redis.del(sleepTimeKey); // 删除睡觉记录
      await redis.set(sleepRankKey, sleepRank - 1); // 更新排名
    }

    this.sendWithButton(e, "早安！今天也要加油哦~");
  }

  async evening (e) {
    if (!e.isGroup) {
      e.reply('当前不在群聊里')
      return false
    }

    let userId = e.user_id;
    let sleepTimeKey = `PAIMON:早晚安:sleepTime:${userId}`;
    let sleepRankKey = `PAIMON:早晚安:sleepRank`;

    if (await redis.exists(sleepTimeKey) === 1) {
      this.sendWithButton(e, '你今天已经发送过晚安了');
      return;
    }

    let sleepRank = await redis.incr(sleepRankKey); // 睡觉排名自增
    await redis.set(sleepTimeKey, Date.now(), 'EX', 86400); // 设置睡眠时间键的过期时间为24小时

    this.sendWithButton(e, `你是今天第${sleepRank}个睡觉的`);
  }

  async sleepDuration (e) {
    let userId = e.user_id;
    let sleepTimeKey = `PAIMON:早晚安:sleepTime:${userId}`;

    let sleepTime = await redis.get(sleepTimeKey);

    if (sleepTime) {
      let sleepDuration = Date.now() - parseInt(sleepTime);
      let hours = Math.floor(sleepDuration / (1000 * 60 * 60));
      let minutes = Math.floor((sleepDuration % (1000 * 60 * 60)) / (1000 * 60));
      this.sendWithButton(e, `你昨晚睡了${hours}小时${minutes}分钟`);
    } else {
      this.sendWithButton(e, "你昨晚没睡觉");
    }
  }

  async nowtime (e) {
    let now = new Date();
    this.sendWithButton(e, `现在是${now.getHours()}时${now.getMinutes()}分`);
  }
}
