import { POST } from './app/api/dev/seed-roles/route.ts';

const req = new Request('http://localhost:3001/api/dev/seed-roles', {
  method: 'POST',
  headers: { 'x-seed-secret': 'seedroles456' },
});

const res = await POST(req);
console.log(res.status);
console.log(await res.text());
