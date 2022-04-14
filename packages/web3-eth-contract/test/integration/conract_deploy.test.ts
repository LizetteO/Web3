import { Contract } from '../../src';
import { accounts } from '../shared_fixtures/integration_test_accounts';
import { greeterByteCode, greeterContractAbi } from '../shared_fixtures/sources/Greeter';
import { deployRevertAbi, deployRevertByteCode } from '../shared_fixtures/sources/DeployRevert';

// eslint-disable-next-line no-promise-executor-return
const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('contract', () => {
	describe('deploy', () => {
		let contract: Contract<typeof greeterContractAbi>;
		let deployOptions: Record<string, unknown>;
		let sendOptions: Record<string, unknown>;

		beforeEach(() => {
			contract = new Contract(greeterContractAbi, undefined, {
				provider: 'http://localhost:8545',
			});

			deployOptions = {
				data: greeterByteCode,
				arguments: ['My Greeting'],
			};

			sendOptions = { from: accounts[0].address, gas: '1000000' };
		});

		it('should deploy the contract', async () => {
			const deployedContract = await contract.deploy(deployOptions).send(sendOptions);

			expect(deployedContract).toBeDefined();
		});

		it('should deploy the contract if data is provided at initiation', async () => {
			contract = new Contract(greeterContractAbi, undefined, {
				provider: 'http://localhost:8545',
				data: greeterByteCode,
				from: accounts[0].address,
				gas: '1000000',
			});
			const deployedContract = await contract.deploy({ arguments: ['Hello World'] }).send();

			expect(deployedContract).toBeDefined();
		});

		it('should return instance of the contract', async () => {
			const deployedContract = await contract.deploy(deployOptions).send(sendOptions);

			expect(deployedContract).toBeInstanceOf(Contract);
		});

		it('should set contract address on new contract instance', async () => {
			const deployedContract = await contract.deploy(deployOptions).send(sendOptions);

			expect(deployedContract.options.address).toBeDefined();
		});

		// TODO: It works fine but tests hangs because of confirmation handler
		it.skip('should emit the "confirmation" event', async () => {
			const confirmationHandler = jest.fn();

			contract
				.deploy(deployOptions)
				.send(sendOptions)
				.on('confirmation', confirmationHandler);

			// Deploy once again to trigger block mining to trigger confirmation
			// We can send any other transaction as well
			await contract.deploy(deployOptions).send(sendOptions);

			await sleep(1000);

			expect(confirmationHandler).toHaveBeenCalled();
		});

		it('should emit the "transactionHash" event', async () => {
			const transactionHashHandler = jest.fn();

			contract
				.deploy(deployOptions)
				.send(sendOptions)
				.on('transactionHash', transactionHashHandler);

			await sleep(100);

			expect(transactionHashHandler).toHaveBeenCalled();
		});

		it('should emit the "sending" event', async () => {
			const sendingHandler = jest.fn();

			contract.deploy(deployOptions).send(sendOptions).on('sending', sendingHandler);

			await sleep(100);

			expect(sendingHandler).toHaveBeenCalled();
		});

		it('should emit the "sent" event', async () => {
			const sentHashHandler = jest.fn();

			contract.deploy(deployOptions).send(sendOptions).on('sent', sentHashHandler);

			await sleep(100);

			expect(sentHashHandler).toHaveBeenCalled();
		});

		it('should emit the "receipt" event', async () => {
			const receiptHandler = jest.fn();

			contract.deploy(deployOptions).send(sendOptions).on('receipt', receiptHandler);

			await sleep(100);

			expect(receiptHandler).toHaveBeenCalled();
		});

		it('should fail with errors on "intrinic gas too low" OOG', async () => {
			return expect(
				contract.deploy(deployOptions).send({ ...sendOptions, gas: '100' }),
			).rejects.toThrow('Returned error: intrinsic gas too low');
		});

		it('should fail with errors deploying a zero length bytecode', async () => {
			return expect(() =>
				contract
					.deploy({
						...deployOptions,
						data: '0x',
					})
					.send(sendOptions),
			).toThrow('No data provided.');
		});

		it('should fail with errors on revert', async () => {
			const revert = new Contract(deployRevertAbi);
			revert.provider = 'http://localhost:8545';

			return expect(() =>
				revert
					.deploy({
						data: deployRevertByteCode,
					})
					.send(sendOptions),
			).rejects.toThrow('contract deployment error');
		});
	});
});
