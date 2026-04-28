
const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
const payload = {
  sub: userId,
  email: 'tootifrootie3@yopmail.com',
  role: 'creator',
  exp: Math.floor(Date.now() / 1000) + 3600
};

const header = { alg: 'HS256', typ: 'JWT' };

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const token = `${b64(header)}.${b64(payload)}.signature`;
console.log(token);
