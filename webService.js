/* eslint-disable default-case */
const net = require('net');
const config = {
  // HOST: '218.242.245.218',
  HOST: '218.242.245.218',
  PORT: 443,
  WAPQUOTES:
    'WWAPQUOTES-EURUSD,USDCNH,GBPUSD,USDJPY,AUDUSD,USDCAD,NZDUSD,EURAUD,EURGBP,GBPJPY,EURNZD,XAGUSD,XAUUSD,\nQUIT\n',
  QUOTES:
    'WQUOTES-EURUSD,USDCNH,GBPUSD,USDJPY,AUDUSD,USDCAD,NZDUSD,EURAUD,EURGBP,GBPJPY,EURNZD,XAGUSD,XAUUSD,\nQUIT\n',
  WAPUSER: 'WWAPUSER-55555 | _some_password_  nQUIT  n', // WWAPUSER-55555 | _some_password_ | 888888 \ nQUIT \ n
  HISTORYNEW:
    'WHISTORYNEW-symbol = EURUSD | period = 60 | from = 1117551473 | to = 1120143473  nQUIT  n',
  USERINFO: 'WUSERINFO-login = 55555 | password = 55555  nQUIT  n',
  USERHISTORY:
    'WUSERHISTORY-login = 55555 | password = 55555 | from = 1117551473 | to = 1120143473  nQUIT  n',
  CONTESTTOP: 'WCONTESTTOP-from = 0 | to = 10 | group = contest2  nQUIT  n',
  CONTESTACCOUNT: `WCONTESTACCOUNT-name=Ivan Ivanov|group=precontest2|country=Russia|city=Kazan|state=RT|zipcode=420000|"
  ."address=Yamasheva ave. 49|phone=999999|email=support@metaquotes.net|comment=This is comment\nQUIT\n`,
};

const key_value = function(obj) {
  let str = '';
  for (const key in obj) {
    str += key + '=' + obj[key] + '|';
  }
  return str.slice(0, str.length - 1);
};

const formatParameter = function(methodName, parameters) {
  switch (methodName) {
    case 'WAPQUOTES':
      return `WWAPQUOTES-${parameters},\nQUIT\n`;
    case 'QUOTES':
      return `WQUOTES-${parameters},\nQUIT\n`;
    case 'WAPUSER':
      return `WWAPUSER-${parameters.join('|')}\nQUIT\n`;
    case 'HISTORYNEW':
      return `WHISTORYNEW-${key_value(parameters)}\nQUIT\n`;
    case 'USERINFO':
      return `WUSERINFO-${key_value(parameters)}\nQUIT\n`;
    case 'USERHISTORY':
      return `WUSERHISTORY-${key_value(parameters)}\nQUIT\n`;
    case 'CONTESTTOP':
      return `WCONTESTTOP-${key_value(parameters)}\nQUIT\n`;
    case 'CONTESTACCOUNT':
      return `WCONTESTACCOUNT-${key_value(parameters)}\nQUIT\n`;
  }
};

const getData = function(methodName, parameters) {
  const command = formatParameter(methodName, parameters);
  return new Promise(function(resolve) {
    const client = new net.Socket();
    client.connect(config.PORT, config.HOST, function() {
      console.log('Connected to: ' + config.HOST + ':' + config.PORT);
      client.write(command); // 测试查询货币对的命令， 周末是休市时间， 所以请求不到结果
    });

    client.on('data', function(data) {
      resolve(data.toString('ASCII'));
      client.destroy();
      client.on('close', function() {
        console.log('Connection closed');
      });
    });
  });
};

module.exports = {
  WAPQUOTES: getData,
  QUOTES: getData,
  WAPUSER: getData,
  HISTORYNEW: getData,
  USERINFO: getData,
  USERHISTORY: getData,
  CONTESTTOP: getData,
  CONTESTACCOUNT: getData,
  config,
};

setInterval(async () => {
  const res = await getData('QUOTES', config.QUOTES);
  console.log(res);
}, 6666);
