import plugin from '../../lib/plugins/plugin.js'

export class WhatToEatPlugin extends plugin {
  constructor () {
    super({
      name: '今天吃什么',
      dsc: '随机返回一个食物',
      event: 'message',
      priority: 6,
      rule: [
        {
          reg: '^#?(今天吃什么|吃啥|eat)$',
          fnc: 'whatToEat'
        },
        {
          reg: '^#?吃派蒙$',
          fnc: 'eatPaimon'
        }
      ]
    })
    this.foods = [
      "米饭",
      "面条",
      "饺子",
      "炒饭",
      "炒面",
      "煎饼",
      "披萨",
      "汉堡",
      "寿司",
      "拉面",
      "火锅",
      "烤肉",
      "麻辣烫",
      "炸鸡",
      "炸串",
      "炸薯条",
      "炸鱼",
      "烧烤",
      "凉皮",
      "冒菜",
      "酸菜鱼",
      "麻辣香锅",
      "麻辣串串香"
    ];
  }

  async whatToEat (e) {
    let randomFoodIndex = Math.floor(Math.random() * this.foods.length);
    let randomFood = this.foods[randomFoodIndex];
    let buttons = [
      [{ text: "再来一份", input: "今天吃什么", send: true }]
    ];
    e.reply([`再来一份${randomFood}怎么样？`, segment.button(...buttons)]);
  }

  async eatPaimon (e) {
    e.reply('派蒙不是应急食品！');
  }
}
