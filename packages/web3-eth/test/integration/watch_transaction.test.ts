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
import { DEFAULT_RETURN_FORMAT } from 'web3-utils';
import { TransactionReceipt } from 'web3-types';
import { Web3PromiEvent } from 'web3-core';
import { Web3Account } from 'web3-eth-accounts';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Web3 } from 'web3';
import { Web3Eth, SendTransactionEvents } from '../../src';
import { sendFewTxes } from './helper';

import {
	getSystemTestProvider,
	describeIf,
	closeOpenConnection,
	isSocket,
	waitForOpenConnection,
	createLocalAccount,
	// eslint-disable-next-line import/no-relative-packages
} from '../fixtures/system_test_utils';
// eslint-disable-next-line import/no-extraneous-dependencies

const waitConfirmations = 2;

type Resolve = (value?: unknown) => void;

describeIf(isSocket)('watch subscription transaction', () => {
	let web3: Web3;
	let clientUrl: string;
	let account1: Web3Account;
	let account2: Web3Account;
	beforeEach(async () => {
		clientUrl = getSystemTestProvider();
		web3 = new Web3(clientUrl);
		account1 = await createLocalAccount(web3);
		account2 = await createLocalAccount(web3);
		await waitForOpenConnection(web3.eth);
	});
	describe('wait for confirmation subscription', () => {
		it('subscription to heads', async () => {
			web3.eth.setConfig({ transactionConfirmationBlocks: waitConfirmations });

			const sentTx: Web3PromiEvent<
				TransactionReceipt,
				SendTransactionEvents<typeof DEFAULT_RETURN_FORMAT>
			> = web3.eth.sendTransaction({
				from: account1.address,
				to: account2.address,
				value: '0x1',
				gas: '0x5218',
			});

			const receiptPromise = new Promise((resolve: Resolve) => {
				// Tx promise is handled separately
				// eslint-disable-next-line no-void
				void sentTx.on('receipt', (params: TransactionReceipt) => {
					expect(params.status).toBe(BigInt(1));
					resolve();
				});
			});

			let shouldBe = 1;
			const confirmationPromise = new Promise((resolve: Resolve) => {
				// Tx promise is handled separately
				// eslint-disable-next-line no-void
				void sentTx.on('confirmation', ({ confirmations }) => {
					expect(Number(confirmations)).toBeGreaterThanOrEqual(shouldBe);
					shouldBe += 1;
					if (shouldBe >= waitConfirmations) {
						resolve();
					}
				});
			});
			await receiptPromise;
			await sendFewTxes({
				web3Eth: web3.eth as unknown as Web3Eth,
				from: account1.address,
				to: account2.address,
				value: '0x1',
				gas: '0x5218',
				times: waitConfirmations,
			});
			await confirmationPromise;
			await closeOpenConnection(web3.eth);
		});
	});
});
