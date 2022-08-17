/*
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

import Web3 from 'web3';

// import { blockSchema } from 'web3-eth';

describe('Black Box Unit Tests', () => {
	let web3: Web3;

	beforeAll(() => {
		web3 = new Web3('http://localhost:8545');
	});

	it('should get the latest block', async () => {
		const response = await web3.eth.getBlock('latest');
		expect(response).toBeDefined();
	});
});
