const mt5Socket = require('../../mt5Socket');
const Service = require('../core/baseService');
const _ = require('lodash');
const Promise = require('bluebird');
const net = require('net');

class Mt5Service extends Service {
  // 无用方法。仅仅注册一下

  LoginIn() {}
  UserPasswordCheckWithOutLog() {}
  isConnected() {}
  disconnect() {}
  CfgRequestSymbolGroup() {}

  async login(manager, password) {
    const CURRENT_USED_SERVER = {
      manager, password,
    };
    const res = await mt5Socket.getData({
      code: 'LOGIN',
      params: {},
      app: { CURRENT_USED_SERVER }
    });

    // 登录成功
    return res;
  }
  // 链接
  async connect(server) {
    return new Promise(function(resolve) {
      const client = new net.Socket();
      client.connect('443', server, function() {
        // 连接
        mt5Socket.config.HOST = server;
        resolve(true);
        client.destroy();
      });
      client.on('error', function(data) {
        resolve(false);
        client.destroy();
      });
    });
  }

  // 获取组
  async groups() {
    const params = {};
    // 获取所有组,首先获取total GROUP_TOTAL
    const group_total = await mt5Socket.getData({
      code: 'group_total',
      params,
      app: this.app
    });
    if (!group_total) return false;
    const groupTotal = group_total.TOTAL;

    const symbol_total = await mt5Socket.getData({
      code: 'symbol_total',
      params,
      app: this.app
    });
    if (!symbol_total) return false;
    const symbolTotal = symbol_total.TOTAL;

    // 获取所有的组
    const groupProp = {};
    for (let i = 0; i < ~~groupTotal; i++) {
      groupProp[i] = mt5Socket.getData({
        code: 'group_next',
        params: { index: i },
        app: this.app
      });
    }

    // 获取所有的组
    const symProp = {};
    for (let i = 0; i < ~~symbolTotal; i++) {
      symProp[i] = mt5Socket.getData({
        code: 'SYMBOL_NEXT',
        params: { index: i },
        app: this.app
      });
    }

    const groupRes = await Promise.props(groupProp);
    const symRes = await Promise.props(symProp);
    const groups = Object.values(groupRes).filter(item => {
      return item.data && !item.data.Group.includes('managers');
    });
    const symbols = Object.values(symRes);
    if (groups.length < 0 || symbols < 0) return false;

    const resList = groups.map(group => {
      const data = {
        group: group.data.Group
      };
      return data;
    });
    const symbolNames = symbols.map(item => {
      return item.data && item.data.Path && item.data.Path.split('\\')[0];
    });
    const uniq = _.uniq(symbolNames);
    resList.forEach((item, id) => {
      if (id === 0) {
        item.secGroups = uniq.map(symbol => {
          return {
            secgroup: symbol,
            spread_diff: 0
          };
        });
        return true;
      }
      item.secGroups = [];
    });

    return resList;
  }

  // 获取所有的交易组
  async SymbolsGetAll() {
    const params = {};
    const symbol_total = await mt5Socket.getData({
      code: 'symbol_total',
      params,
      app: this.app
    });
    const symbolTotal = symbol_total.TOTAL;
    // 获取所有的组
    const symProp = {};
    for (let i = 0; i < symbolTotal; i++) {
      symProp[i] = mt5Socket.getData({
        code: 'SYMBOL_NEXT',
        params: { index: i },
        app: this.app
      });
    }

    const resdata = await Promise.props(symProp);

    const symbols = _.map(Object.values(resdata), 'data');

    const bigSymbols = _.uniq(
      symbols.map(item => item && item.Path.split('\\')[0])
    );

    const resList = symbols.map((item, i) => {
      if (!item) return {};
      return {
        symbol: item.Symbol,
        exemode: item.ExecMode,
        stops_level: item.StopsLevel,
        spread: item.Spread,
        type: bigSymbols.indexOf(item.Path.split('\\')[0]),
        contract_size: item.ContractSize
      };
    });
    return resList;
  }

  // 获取大组
  async SymbolsGroupsGet() {
    const params = {};
    const symbol_total = await mt5Socket.getData({
      code: 'symbol_total',
      params,
      app: this.app
    });
    const symbolTotal = symbol_total.TOTAL;
    // 获取所有的组
    const symProp = {};
    for (let i = 0; i < symbolTotal; i++) {
      symProp[i] = mt5Socket.getData({
        code: 'SYMBOL_NEXT',
        params: { index: i },
        app: this.app
      });
    }

    const symRes = await Promise.props(symProp);
    const symbolNames = Object.values(symRes).map(item => {
      return item.data && item.data.Path.split('\\')[0];
    });
    const uniq = _.uniq(symbolNames);
    const resList = uniq.map(symbol => {
      return {
        name: symbol,
        description: ''
      };
    });
    return resList;
  }

  // 获取时区
  async managerCommon(mt4_server, manager, password) {
    if (!this.app.CURRENT_USED_SERVER.mt4_server) {
      return {
        timezone: 0,
        owner: ''
      };
    }
    const CURRENT_USED_SERVER = {
      mt4_server, manager, password,
    };
    const res = await mt5Socket.getData({
      code: 'TIME_GET',
      params: {},
      app: { CURRENT_USED_SERVER },
    });
    if (res && res.RETCODE === '0 Done') {
      return {
        timezone: res.data.TimeZone / 60,
        owner: res.data.TimeServer
      };
    }
    return false;
  }

  // 获取用户信息
  async UserRecordGet(login) {
    const params = {
      login
    };
    const res1 = await mt5Socket.getData({
      code: 'user_get',
      params,
      app: this.app
    });
    const res2 = await mt5Socket.getData({
      code: 'user_account_get',
      params,
      app: this.app
    });

    const log = {
      operation: 'UserRecordGet',
      params: { login },
      res: res1
    };
    await this.createMtLog(JSON.stringify(log));

    const newUser = this.formatAttrToLowercase(res1.data);
    const newAccount = this.formatAttrToLowercase(res2.data);

    // 权限转换
    const rights = (~~newUser.rights).toString(2);
    newUser.send_reports = ~~rights[3];
    newUser.enable = ~~rights[rights.length - 1];
    newUser.enable_read_only = ~~rights[rights.length - 3];
    newUser.enable_change_password = ~~rights[rights.length - 2];

    const comUser = _.assign(newUser, newAccount);
    // comUser.lastdate = this.getZeroTimeZoneTime(comUser.lastAccess);
    // comUser.regdate = this.getZeroTimeZoneTime(comUser.registration);
    comUser.lastdate = comUser.lastAccess;
    comUser.regdate = comUser.registration;
    if (res1 && res1.RETCODE === '0 Done') return comUser;
    return false;
  }
  // 删除用户信息
  async UserDelete(login) {
    const params = {
      Login: login
    };
    const res = await mt5Socket.getData({
      code: 'user_delete',
      params,
      app: this.app
    });

    const log = {
      operation: 'UserDelete',
      params: { login },
      res
    };

    await this.createMtLog(JSON.stringify(log));
    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 注册
  async register(data) {
    const params = {
      login: data.login, // 必填字段，數字字符串都支持
      pass_main: data.password, // 必填字段，必须是强密码，例如：A123.com
      pass_investor: data.password_investor, // 必填字段，必须是强密码，例如：A123.com
      group: data.group, // 必填字段并且，需要管理員拥有这个组的权限
      name: data.name, // 必填字段，暂时不支持中文

      // 以下是非必填字段
      leverage: data.leverage, // 杠杆
      country: data.country || '', // 国家
      city: data.city || '', // 城市
      address: '', // 地址
      phone: '', // 电话
      email: '' // 邮箱
      // agent: '0', // 代理账号
      // rights: '2315', // 用户权限
      // company: '我宇宙第一大厂', // 公司名
      // language: 'english', // 语言
      // state: '蓝田省', // 省
      // zipcode: '710222', // 邮编
      // id: '610588964561223', // 身份证
      // status: '1', // 状态
      // comment: '这是测试的数据', // 备注
      // color: 'red', // 颜色
      // pass_phone: '1122', // 电话密码
      // account: '6101234568922', // 银行用户账号，对应mt5管理端银行字段
    };

    // 处理权限的问题
    let rights = 2531;
    if (!data.enable) rights = rights - 2;
    if (data.enable_read_only) rights = rights - 4;
    if (!data.send_reports) rights = rights - 256;

    params.rights = rights;

    const res = await mt5Socket.getData({
      code: 'user_add',
      params,
      app: this.app
    });

    const log = {
      operation: 'register',
      params: { ...params, password: '', password_investor: '' },
      res
    };
    await this.createMtLog(JSON.stringify(log));

    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 修改信息(具体字段请参考新增方法)
  async UserRecordUpdate(data) {
    const str =
      'login,name,email,enable,leverage,enable_read_only,group,send_reports,enable_change_password,id,comment,state,city,phone,address,country';
    data = _.pick(data, str.split(','));

    const account = await mt5Socket.getData({
      code: 'user_get',
      params: { login: data.login },
      app: this.app
    });

    // 处理权限的问题
    const rights = (~~account.data.Rights).toString(2).split('');
    if (data.enable || data.enable === 0) rights[11] = ~~!~~rights[11];
    if (data.enable_read_only || data.enable_read_only === 0)
      rights[9] = ~~!~~rights[9];
    if (data.send_reports || data.send_reports === 0)
      rights[3] = ~~!~~rights[3];
    if (data.enable_change_password || data.enable_change_password === 0)
      rights[10] = ~~!~~rights[10];

    data.rights = Number.parseInt(rights.join(''), 2);
    // data.rights = '2531';
    const res = await mt5Socket.getData({
      code: 'user_update',
      params: data,
      app: this.app
    });
    const log = {
      operation: 'register',
      params: { ...data, password: '', password_investor: '' },
      res
    };
    await this.createMtLog(JSON.stringify(log));

    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 出入金
  async TradeTransaction(data) {
    const params = {
      login: data.mtid,
      // login: 1050,
      balance: data.number,
      comment: data.comment
    };
    const res = await mt5Socket.getData({
      code: 'trade_balance',
      params,
      app: this.app
    });

    const log = {
      operation: 'TradeTransaction',
      params: { params, res }
    };
    await this.createMtLog(JSON.stringify(log));

    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 检查密码
  async UserPasswordCheck(login, password) {
    const params = {
      login,
      type: 'main', // main主密碼，investor只讀密码 api API客户为连接使用的密码
      password
    };
    const res = await mt5Socket.getData({
      code: 'user_pass_check',
      params,
      app: this.app
    });
    const log = {
      operation: 'UserPasswordCheck',
      params: { login },
      res
    };
    await this.createMtLog(JSON.stringify(log));

    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 修改密码
  async UserPasswordSet(login, password) {
    const params = {
      login,
      type: 'MAIN', // main主密碼，investor只讀密码 api API客户为连接使用的密码
      password
    };
    const res = await mt5Socket.getData({
      code: 'user_pass_change',
      params,
      app: this.app
    });
    const log = {
      operation: 'UserPasswordSet',
      params: { login },
      res
    };
    await this.createMtLog(JSON.stringify(log));
    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
  // 修改投资者密码
  async UserInvestorPasswordSet(login, password) {
    const params = {
      login,
      type: 'INVESTOR', // main主密碼，investor只讀密码 api API客户为连接使用的密码
      password
    };
    const res = await mt5Socket.getData({
      code: 'user_pass_change',
      params,
      app: this.app
    });
    const log = {
      operation: 'UserInvestorPasswordSet',
      params: { login },
      res
    };
    await this.createMtLog(JSON.stringify(log));
    if (res && res.RETCODE === '0 Done') return true;
    return false;
  }
}
module.exports = Mt5Service;
