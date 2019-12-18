/* eslint-disable default-case */
const net = require('net');
const icon = require('iconv-lite');
const crypto = require('crypto');
const buffer = require('buffer');
const _ = require('lodash');
// const client = new net.Socket();
const Promise = require('bluebird');

const config = {
  // HOST: '218.242.245.218',
  // HOST: 'mt5.zhaodaishu.com',
  HOST: 'promt5live.itraderserver.com',
  PORT: 443,
  // PASSWORD: '123.com',
  PASSWORD: 'waat5djx',
  GETDATACODE: [
    'USER_GET',
    'USER_ACCOUNT_GET',
    'GROUP_GET',
    'GROUP_NEXT',
    'SYMBOL_NEXT',
    'SYMBOL_GET_GROUP',
    'TIME_GET'
  ],
  clientList: [],
  isConnect: 0,
  // codeData: '',
  AUTH_START: {
    number: '0001',
    data: {
      version: '2190',
      agent: 'mannager',
      // login: '1100',
      login: '1100',
      type: 'MANAGER',
      crypt_method: 'NONE'
    }
  },
  LOGIN: {
    number: '0001'
  },
  AUTH_ANSWER: {
    number: '0002'
  },
  TRADE_BALANCE: {
    number: '0003',
    data: {
      login: '1050',
      type: '2',
      balance: '5555',
      comment: '你妹的你妹的',
      check_margin: '1'
    }
  },
  USER_PASS_CHECK: {
    number: '0004',
    data: {
      login: '',
      type: 'main', // main主密碼，investor只讀密码 api API客户为连接使用的密码
      password: ''
    }
  },
  USER_PASS_CHANGE: {
    number: '0005',
    data: {
      login: '',
      type: 'main', // main主密碼，investor只讀密码 api API客户为连接使用的密码
      password: ''
    }
  },
  USER_DELETE: {
    number: '0006',
    data: {
      login: ''
    }
  },
  USER_ADD: {
    number: '0007',
    data: {
      login: '1051', // 必填字段，數字字符串都支持
      pass_main: 'A123.com', // 必填字段，必须是强密码，例如：A123.com
      pass_investor: 'A123.com', // 必填字段，必须是强密码，例如：A123.com
      group: 'real\\neo', // 必填字段并且，需要管理員拥有这个组的权限
      name: '你妹的' // 必填字段，暂时不支持中文

      // 以下是非必填字段
      // agent: '0', // 代理账号
      // rights: '2315', // 用户权限
      // company: '我宇宙第一大厂', // 公司名
      // language: 'english', // 语言
      // country: '蓝田国', // 国家
      // city: '蓝田城', // 城市
      // state: '蓝田省', // 省
      // zipcode: '710222', // 邮编
      // address: '地址', // 地址
      // phone: '18392438443', // 电话
      // email: 'yyshengfan@126.com', // 邮箱
      // id: '610588964561223', // 身份证
      // status: '1', // 状态
      // comment: '这是测试的数据', // 备注
      // color: 'red', // 颜色
      // pass_phone: '1122', // 电话密码
      // leverage: '500', // 杠杆
      // account: '6101234568922' // 银行用户账号，对应mt5管理端银行字段
    }
  },
  USER_UPDATE: {
    number: '0020',
    data: {
      login: '1051', // 必填字段，數字字符串都支持
      pass_main: 'A123.com', // 必填字段，必须是强密码，例如：A123.com
      pass_investor: 'A123.com', // 必填字段，必须是强密码，例如：A123.com
      group: 'real\\neo', // 必填字段并且，需要管理員拥有这个组的权限
      name: 'neotest' // 必填字段，暂时不支持中文

      // 以下是非必填字段
      // agent: '0', // 代理账号
      // rights: '2315', // 用户权限
      // company: '我宇宙第一大厂', // 公司名
      // language: 'english', // 语言
      // country: '蓝田国', // 国家
      // city: '蓝田城', // 城市
      // state: '蓝田省', // 省
      // zipcode: '710222', // 邮编
      // address: '地址', // 地址
      // phone: '18392438443', // 电话
      // email: 'yyshengfan@126.com', // 邮箱
      // id: '610588964561223', // 身份证
      // status: '1', // 状态
      // comment: '这是测试的数据', // 备注
      // color: 'red', // 颜色
      // pass_phone: '1122', // 电话密码
      // leverage: '500', // 杠杆
      // account: '6101234568922', // 银行用户账号，对应mt5管理端银行字段
    }
  },
  GROUP_GET: {
    number: '0021',
    data: {
      group: 'neoceshi'
    }
  },
  USER_GET: {
    number: '0022',
    data: {
      login: '111124'
    }
  },
  USER_ACCOUNT_GET: {
    number: '0023',
    data: {
      login: ''
    }
  },
  GROUP_TOTAL: {
    number: '0024',
    data: {}
  },
  GROUP_NEXT: {
    number: '0025',
    data: {
      index: 0
    }
  },
  SYMBOL_TOTAL: {
    number: '0026',
    data: {}
  },
  SYMBOL_NEXT: {
    number: '0027',
    data: {
      index: 0
    }
  },
  SYMBOL_GET_GROUP: {
    number: '0028',
    data: {}
  },
  TIME_GET: {
    number: '0029',
    data: {}
  }
};
const initClient = function() {
  for (let i = 0; i < 10; i++) {
    const client = new net.Socket();
    client.isUse = false;
    client.isConnect = false;
    config.clientList.push(client);
  }
};
initClient();
const key_value = function(obj) {
  let str = '';
  for (const key in obj) {
    str += key.toUpperCase() + '=' + obj[key] + '|';
  }
  return str;
};

const concatHeader = function(str) {
  if (str.length > 3) return str;
  str = 0 + str;
  return concatHeader(str);
};
const formatRes = function(str) {
  const subString = str.slice(9).toString('utf16le');
  const code = subString.slice(0, subString.indexOf('|'));

  const array = subString.split('|');

  const obj = {};

  array.forEach(item => {
    // item = item.replace(/\s/g, '');
    if (!item.includes('=') || item.replace(/\s/g, '').startsWith('{')) {
      return false;
    }
    const itemArray = item.split('=');
    obj[itemArray[0]] = itemArray[1];
  });

  // 处理JSON
  if (config.GETDATACODE.includes(code) && obj.RETCODE === '0 Done') {
    obj.data = {};
    try {
      const dataStr = subString
        .slice(subString.indexOf('{') - 1)
        .replace(/\s/, '');
      obj.data = JSON.parse(dataStr);
    } catch (e) {
      console.log(e);
    }
  }
  obj.number = str.slice(4, 8);
  return obj;
};

const getCommand = function(code, params) {
  const unionData = _.assign(config[code].data, params);
  const command = code + '|' + key_value(unionData) + '\r\n';
  const dataLength = (command.length * 2).toString(16);

  const headerStr = concatHeader(dataLength) + config[code].number + '0';
  const header = Buffer.from(headerStr);
  const first_command =
    config[code].number === '0001' ? Buffer.from('MT5WEBAPI') : Buffer.from('');
  const data16 = icon.encode(command, 'utf16le');

  return Buffer.concat([first_command, header, data16]);
};

const processAuth = function(answer, password) {
  //---
  const pass_md5 = crypto.createHash('md5');
  const buf = buffer.transcode(
    Buffer.from(password, 'utf8'),
    'utf8',
    'utf16le'
  );
  pass_md5.update(buf, 'binary');
  const pass_md5_digest = pass_md5.digest('binary');
  //---
  const md5 = crypto.createHash('md5');
  md5.update(pass_md5_digest, 'binary');
  md5.update('WebAPI', 'ascii');
  const md5_digest = md5.digest('binary');
  //---
  const answer_md5 = crypto.createHash('md5');
  answer_md5.update(md5_digest, 'binary');
  const buf1 = Buffer.from(answer.SRV_RAND, 'hex');
  answer_md5.update(buf1, 'binary');
  //---
  return answer_md5.digest('hex');
};

const mt5Connect = function(client, params) {
  config.HOST = (params && params.server) || config.HOST;
  return new Promise(function(resolve) {
    client.connect(config.PORT, config.HOST, async function(err) {
      console.log('Connected to: ' + config.HOST + ':' + config.PORT);
      // 连接
      const command = getCommand('AUTH_START', {
        login: (params && params.manager) || config.AUTH_START.data.login
      });
      client.write(command);
      resolve(true);
    });
  });
};

const shortRes = function(data) {
  // const codeData = data.slice(0, 9) + icon.decode(data.slice(9), 'utf16le');
  const codeData = data.slice(0, 9) + data.slice(9).toString('utf16le');
  if (codeData.includes('RETCODE=0')) {
    const newData = codeData.slice(0, codeData.lastIndexOf('|'));
    return formatRes(newData);
  }
  return formatRes(codeData);
};

const getData = function(attrs) {

  console.log('------------------dll调用------------------');
  // 创建 socket
  const client = _.find(config.clientList, { isUse: false });

  if (client) {
    client.isUse = true;

    let codeData;
    let isComplish = false;
    let { code, params, app, server } = attrs;
    code = code.toUpperCase();
    const serverData = app && app.CURRENT_USED_SERVER;
    if (serverData) {
      config.HOST = serverData.mt4_server || config.HOST;
      config.PASSWORD = serverData.password || config.PASSWORD;
      config.AUTH_START.data.login =
        serverData.manager || config.AUTH_START.data.login;
    }

    // config.PASSWORD = params.pass;
    return new Promise(async function(resolve) {
      client.on('data', function(data) {
        if (isComplish) return;
        // 返回数据格式化
        const rescode = icon.decode(data.slice(4, 8), 'utf8');
        switch (rescode) {
          //  验证
          case '0001': {
            // const resStr =
            //   data.slice(0, 9) + icon.decode(data.slice(9), 'utf16le');
            const res = formatRes(data);
            const SRV_RAND_ANSWER = processAuth(res, config.PASSWORD);
            const command = getCommand('AUTH_ANSWER', {
              SRV_RAND_ANSWER,
              CLI_RAND: res.SRV_RAND
            });
            client.write(command);
            break;
          }
          case '0002': {
            // 验证成功，进行下一步操作
            client.isConnect = 1;
            const res = formatRes(data);

            if (res.RETCODE.startsWith('1001')) {
              console.log('anwer error......');
              break;
            }
            console.log('anwer success......');

            // 发空数据包
            if (code === 'LOGIN') resolve(true);
            if (config.timer) break;
            config.timer = setInterval(() => {
              client.write(Buffer.from('000000640'));
            }, 10000);

            break;
          }

          default: {
            // 修改性的操作
            if (config[code].number === rescode && ~~rescode < 20) {
              console.log('------------short----------');
              return resolve(shortRes(data));
            }

            if (!codeData) {
              // 第一次进来了
              codeData = data;
            } else {
              // 第二次进来,去掉尾缀
              const length16 = parseInt(codeData.slice(0, 4).toString(), 16);
              const needLength = length16 - codeData.length + 9;
              data = data.slice(0, needLength);
              codeData = Buffer.concat([codeData, data]);
            }

            const code16 = codeData.slice(0, 4).toString();
            const resLength = concatHeader(
              codeData.slice(9).length.toString(16)
            );
            const body = codeData.slice(9).toString('utf16le');
            if (code16 === resLength) {
              if (body.slice(0, body.indexOf('|')) === code) {
                resolve(formatRes(codeData));
                isComplish = true;
                client.isUse = false;
                if (config.clientList > 10) {
                  client.destroy();
                  config.clientList.splice(
                    config.clientList.indexOf(client),
                    1
                  );
                }
                return;
              }
              codeData = '';
            }
            break;
          }
        }
      });

      client.on('error', function(data) {
        console.log('--------------err-------------');
        resolve(false);
        client.destroy();
        config.clientList.splice(config.clientList.indexOf(client), 1);
      });

      client.on('close', function(data) {
        client.isConnect = 0;
        console.log('Connection closed');
        resolve(false);
        client.destroy();
      });

      if (!client.isConnect) await mt5Connect(client, params);

      const timer = setInterval(() => {
        if (!client.isConnect || code === 'LOGIN') return;

        const command = getCommand(code, params);
        client.write(command);
        clearInterval(timer);
      }, 5);
    });
  }
  initClient();
  return getData(attrs);
};

setTimeout(async () => {
  // const params = {};
  // // 获取所有组,首先获取total GROUP_TOTAL
  // const res = await getData({
  //   code: 'group_total',
  //   params,
  //   app: this.app
  // });
  // return res;
}, 1);

module.exports = { getData, mt5Connect, config };
