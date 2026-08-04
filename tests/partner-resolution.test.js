const assert = require('assert');
const { buildPartnerLookupQuery } = require('../lib/partner-resolution');

const query = buildPartnerLookupQuery({ email: 'Partner@Example.com', fullName: 'City Gate Pharmacy' });
assert.ok(query && query.$or && query.$or.length >= 6, 'expected a broad partner lookup query');
console.log('partner-resolution lookup query built successfully');
