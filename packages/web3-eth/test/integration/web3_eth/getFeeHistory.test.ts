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
import WebSocketProvider from 'web3-providers-ws';

import { BlockNumberOrTag, Numbers } from 'web3-utils';
import { Web3RequestManager } from 'web3-core';

import Web3Eth from '../../../src';
import {
	getSystemTestProvider,
	isWs,
	describeIf,
	getSystemTestBackend,
} from '../../fixtures/system_test_utils';

describeIf(getSystemTestBackend().includes('geth'))('Web3Eth.getFeeHistory', () => {
	let web3Eth: Web3Eth;
	let systemProvider: string;

	beforeAll(async () => {
		systemProvider = getSystemTestProvider();
		web3Eth = new Web3Eth(systemProvider);
	});

	afterAll(() => {
		if (isWs) {
			(web3Eth.provider as WebSocketProvider).disconnect();
		}
	});

	test('should return fee history with right data', async () => {
		const blockCount: Numbers = '0x1';
		const newestBlock: BlockNumberOrTag = 'latest';
		const rewardPercentiles: number[] = [];
		const requestManager: Web3RequestManager = new Web3RequestManager(systemProvider);

		const functionResponse = await web3Eth.getFeeHistory(
			blockCount,
			newestBlock,
			rewardPercentiles,
		);

		const functionResponseKeys = Object.keys(functionResponse);

		const requestResponse = await requestManager.send({
			method: 'eth_feeHistory',
			params: [blockCount, newestBlock, rewardPercentiles],
		});

		const requestResponseKeys = Object.keys(requestResponse);

		expect(requestResponseKeys).toEqual(functionResponseKeys);
	});
});
