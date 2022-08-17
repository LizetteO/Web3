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

// eslint-disable-next-line import/no-relative-packages
import { closeOpenConnection, isWs } from '../../../shared_fixtures/system_tests_utils';

describe('Black Box Unit Tests - web3.eth.accounts.hashMessage', () => {
	let web3: Web3;

	beforeAll(() => {
		web3 = new Web3(process.env.WEB3_SYSTEM_TEST_PROVIDER);
	});

	afterAll(async () => {
		if (isWs) await closeOpenConnection(web3);
	});

	it('should hash provided message', () => {
		expect(web3.eth.accounts.hashMessage('Hello World')).toBe(
			'0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2',
		);
	});
});
