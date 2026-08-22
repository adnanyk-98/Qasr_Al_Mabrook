require('dotenv').config({ path: '.env.local' });

(async () => {
  const host = process.env.DEV_HOST ?? 'http://localhost:3000';
  const res = await fetch(host + '/en');
  console.log('status', res.status);
  const headers = {} as Record<string,string>;
  ['content-security-policy','referrer-policy','x-content-type-options','x-frame-options','permissions-policy'].forEach((k)=>{
    headers[k] = res.headers.get(k) ?? 'MISSING';
  });
  console.log(headers);
})();
