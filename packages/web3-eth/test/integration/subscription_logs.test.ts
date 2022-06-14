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
// eslint-disable-next-line import/no-extraneous-dependencies
import { Contract, decodeEventABI } from 'web3-eth-contract';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AbiEventFragment } from 'web3-eth-abi';
import { Web3BaseProvider } from 'web3-common';
import { Web3Eth } from '../../src';
import { BasicAbi, BasicBytecode } from '../shared_fixtures/build/Basic';
import { Resolve } from './helper';
import { LogsSubscription } from '../../src/web3_subscriptions';
import {
	describeIf,
	getSystemTestAccounts,
	getSystemTestProvider,
} from '../fixtures/system_test_utils';

const checkEventCount = 3;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const eventAbi: AbiEventFragment = BasicAbi.find((e: any) => {
	return e.name === 'StringEvent' && (e as AbiEventFragment).type === 'event';
})! as AbiEventFragment;
type MakeFewTxToContract = {
	sendOptions: Record<string, unknown>;
	contract: Contract<typeof BasicAbi>;
	testDataString: string;
};
const makeFewTxToContract = async ({
	contract,
	sendOptions,
	testDataString,
}: MakeFewTxToContract): Promise<void> => {
	const prs = [];
	for (let i = 0; i < checkEventCount; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		prs.push(await contract.methods?.firesStringEvent(testDataString).send(sendOptions));
	}
};
describeIf(getSystemTestProvider().startsWith('ws'))('subscription', () => {
	let clientUrl: string;
	let accounts: string[] = [];
	let web3Eth: Web3Eth;
	let providerWs: WebSocketProvider;
	let contract: Contract<typeof BasicAbi>;
	let deployOptions: Record<string, unknown>;
	let sendOptions: Record<string, unknown>;
	let from: string;
	const testDataString = 'someTestString';
	beforeAll(async () => {
		clientUrl = getSystemTestProvider();
		accounts = await getSystemTestAccounts();
		[, from] = accounts;
		providerWs = new WebSocketProvider(
			clientUrl,
			{},
			{ delay: 1, autoReconnect: false, maxAttempts: 1 },
		);
		contract = new Contract(BasicAbi, undefined, {
			provider: clientUrl,
		});

		deployOptions = {
			data: BasicBytecode,
			arguments: [10, 'string init value'],
		};

		sendOptions = { from, gas: '1000000' };

		contract = await contract.deploy(deployOptions).send(sendOptions);
	});
	afterAll(() => {
		providerWs.disconnect();
	});

	describe('logs', () => {
		it(`wait for ${checkEventCount} logs`, async () => {
			web3Eth = new Web3Eth(providerWs as Web3BaseProvider);

			const sub: LogsSubscription = await web3Eth.subscribe('logs', {
				address: contract.options.address,
			});

			let count = 0;

			const pr = new Promise((resolve: Resolve) => {
				sub.on('data', (data: any) => {
					count += 1;
					const decodedData = decodeEventABI(
						eventAbi as AbiEventFragment & { signature: string },
						data,
					);
					expect(decodedData.returnValue['0']).toBe(testDataString);
					if (count >= checkEventCount) {
						resolve();
					}
				});
			});

			await makeFewTxToContract({ contract, sendOptions, testDataString });

			await pr;
			await web3Eth.clearSubscriptions();
		});
		it(`wait for ${checkEventCount} logs with from block`, async () => {
			web3Eth = new Web3Eth(providerWs as Web3BaseProvider);
			const fromBlock = await web3Eth.getTransactionCount(String(contract.options.address));

			await makeFewTxToContract({ contract, sendOptions, testDataString });

			const sub: LogsSubscription = await web3Eth.subscribe('logs', {
				fromBlock,
				address: contract.options.address,
			});

			let count = 0;

			const pr = new Promise((resolve: Resolve) => {
				sub.on('data', (data: any) => {
					count += 1;
					const decodedData = decodeEventABI(
						eventAbi as AbiEventFragment & { signature: string },
						data,
					);
					expect(decodedData.returnValue['0']).toBe(testDataString);
					if (count >= checkEventCount) {
						resolve();
					}
				});
			});

			await pr;
			await web3Eth.clearSubscriptions();
		});
		it(`clear`, async () => {
			web3Eth = new Web3Eth(providerWs as Web3BaseProvider);
			const sub: LogsSubscription = await web3Eth.subscribe('logs');
			expect(sub.id).toBeDefined();
			await web3Eth.clearSubscriptions();
			expect(sub.id).toBeUndefined();
		});
	});
});
