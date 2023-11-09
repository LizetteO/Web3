﻿/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/

const { Web3Validator } = require('../../../packages/web3-validator');

const abi = [
	{ indexed: true, internalType: 'address', name: 'from', type: 'address' },
	{ indexed: true, internalType: 'address', name: 'to', type: 'address' },
	{ indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
];

const abiJsonSchema = {
	type: 'array',
	items: [
		{ name: 'from', format: 'address' },
		{ name: 'to', format: 'address' },
		{ name: 'value', format: 'uint256' },
	],
};

const abiData = [
	'0xCB00CDE33a7a0Fba30C63745534F1f7Ae607076b',
	'0xCB00CDE33a7a0Fba30C63745534F1f7Ae607076b',
	'0xCB00CDE33a7a0Fba30C63745534F1f7Ae607076b',
];

const simpleSchema = {
	type: 'object',
	required: ['blockHash', 'blockNumber', 'from', 'to', 'data'],
	properties: {
		blockHash: {
			format: 'bytes32',
		},
		blockNumber: {
			format: 'uint',
		},
		from: {
			format: 'address',
		},
		to: {
			oneOf: [{ format: 'address' }, { type: 'null' }],
		},
		data: {
			format: 'bytes',
		},
	},
};

const simpleData = {
	blockHash: '0x0dec0518fa672a70027b04c286582e543ab17319fbdd384fa7bc8f3d5a542c0b',
	blockNumber: BigInt(2),
	from: '0xCB00CDE33a7a0Fba30C63745534F1f7Ae607076b',
	to: '0xCB00CDE33a7a0Fba30C63745534F1f7Ae607076b',
	data: '0xafea',
};

const createHugeSchema = (schema, data, n = 3) => {
	if (n > 0) {
		const { data: resultData, schema: resultSchema } = createHugeSchema(
			{ ...simpleSchema },
			{ ...simpleData },
			n - 1,
		);
		return {
			data: { ...data, simple: resultData },
			schema: { ...schema, properties: { ...schema.properties, simple: resultSchema } },
		};
	}
	return {
		schema,
		data,
	};
};

const { schema: hugeSchema, data: hugeData } = createHugeSchema(
	{ ...simpleSchema },
	{ ...simpleData },
	500,
);

const { schema: hugeSchema1000, data: hugeData1000 } = createHugeSchema(
	{ ...simpleSchema },
	{ ...simpleData },
	1000,
);

const validator = new Web3Validator();

console.time('huge schema');
validator.validateJSONSchema(hugeSchema, hugeData);
console.timeLog('huge schema');

console.time('huge schema 1000');
validator.validateJSONSchema(hugeSchema1000, hugeData1000);
console.timeLog('huge schema 1000');

console.time('simple schema multiple times');
for (let i = 0; i < 500; i += 1) {
	validator.validateJSONSchema(simpleSchema, simpleData);
}
console.timeLog('simple schema multiple times');

console.time('simple schema 1000 times');
for (let i = 0; i < 1000; i += 1) {
	validator.validateJSONSchema(simpleSchema, simpleData);
}
console.timeLog('simple schema 1000 times');

console.time('simple JSON schema 1000 times');
for (let i = 0; i < 1000; i += 1) {
	validator.validateJSONSchema(abiJsonSchema, abiData);
}
console.timeLog('simple JSON schema 1000 times');

console.time('simple ABI 1000 times');
for (let i = 0; i < 1000; i += 1) {
	validator.validate(abi, abiData);
}
console.timeLog('simple ABI 1000 times');
