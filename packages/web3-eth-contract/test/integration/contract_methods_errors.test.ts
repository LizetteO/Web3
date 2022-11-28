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

import { ContractExecutionError, ERR_CONTRACT_EXECUTION_REVERTED } from 'web3-errors';
import { VendingMachineAbi, VendingMachineBytecode } from '../shared_fixtures/build/VendingMachine';
import { Contract } from '../../src';
import { getSystemTestProvider, createTempAccount } from '../fixtures/system_test_utils';

// todo remove
jest.setTimeout(600000);

describe('contract errors', () => {
	let sendOptions: Record<string, unknown>;
	let contract: Contract<typeof VendingMachineAbi>;
	let deployOptions: Record<string, unknown>;

	let deployedContract: Contract<typeof VendingMachineAbi>;

	beforeAll(async () => {
		const acc = await createTempAccount();
		sendOptions = { from: acc.address };

		contract = new Contract(VendingMachineAbi, undefined, {
			provider: getSystemTestProvider(),
		});

		deployOptions = {
			data: VendingMachineBytecode,
		};

		const sendOptionsLocal = { from: acc.address, gas: '10000000' };
		deployedContract = await contract.deploy(deployOptions).send(sendOptionsLocal);

		// console.log(deployedContract['_address'], acc);
		// console.log(getSystemTestProvider());
		contract.setProvider(getSystemTestProvider());
	});

	describe('Test EIP-838 Error Codes', () => {
		it('Unauthorized', async () => {
			let error: ContractExecutionError | undefined;
			try {
				await deployedContract.methods.withdraw().send(sendOptions);

				// execution should throw before this line, if not throw here to indicate an issue.
			} catch (err: any) {
				error = err;
			}

			// console.log(error);
			expect(error).toBeDefined();

			expect(error).toMatchObject({
				message: expect.stringContaining(
					'Error happened while trying to execute a function inside a smart contract',
				),
				code: ERR_CONTRACT_EXECUTION_REVERTED,
				innerError: {
					errorName: 'Unauthorized',
					errorSignature: 'Unauthorized()',
				},
			});
		});
	});
});
