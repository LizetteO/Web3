import { EthExecutionAPI } from 'web3-common';
import { Web3Context } from 'web3-core';
import { BlockTags, ValidTypes } from 'web3-utils';
import HttpProvider from 'web3-providers-http';

import * as rpcMethods from '../../src/rpc_methods';
import { populateTransaction } from '../../src/eth_tx';
import {
	PopulatedUnsignedEip1559Transaction,
	PopulatedUnsignedEip2930Transaction,
	Transaction,
} from '../../src/types';
import {
	Eip1559NotSupportedError,
	UnableToPopulateNonceError,
	UnsupportedTransactionTypeError,
} from '../../src/errors';

jest.mock('../../src/rpc_methods');

describe('populateTransaction', () => {
	const expectedFrom = '0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01';
	const expectedNonce = '0x42';
	const expectedGas = '0x5208';
	const expectedGasLimit = expectedGas;
	const expectedGasPrice = '0x4a817c800';
	const expectedBaseFeePerGas = '0x13afe8b904';
	const expectedMaxPriorityFeePerGas = '0x9502f900';
	const expectedMaxFeePerGas = '0x27f4d46b08';
	const transaction: Transaction = {
		from: expectedFrom,
		to: '0x3535353535353535353535353535353535353535',
		value: '0x174876e800',
		gas: expectedGas,
		gasLimit: expectedGasLimit,
		gasPrice: expectedGasPrice,
		type: '0x0',
		maxFeePerGas: expectedMaxFeePerGas,
		maxPriorityFeePerGas: expectedMaxPriorityFeePerGas,
		data: '0x0',
		nonce: expectedNonce,
		chain: 'mainnet',
		hardfork: 'berlin',
		chainId: '0x1',
		common: {
			customChain: {
				name: 'foo',
				networkId: '0x4',
				chainId: '0x42',
			},
			baseChain: 'mainnet',
			hardfork: 'berlin',
		},
	};
	const mockBlockData = {
		parentHash: '0xe99e022112df268087ea7eafaf4790497fd21dbeeb6bd7a1721df161a6657a54',
		sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
		miner: '0xbb7b8287f3f0a933474a79eae42cbca977791171',
		stateRoot: '0xddc8b0234c2e0cad087c8b389aa7ef01f7d79b2570bccb77ce48648aa61c904d',
		transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
		receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
		logsBloom:
			'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
		difficulty: '0x4ea3f27bc',
		number: '0x1b4',
		gasLimit: '0x1388',
		gasUsed: '0x1c96e73',
		timestamp: '0x55ba467c',
		extraData: '0x476574682f4c5649562f76312e302e302f6c696e75782f676f312e342e32',
		mixHash: '0x4fffe9ae21f1c9e15207b1f472d5bbdd68c9595d461666602f2be20daf5e7843',
		nonce: '0x1c11920a4',
		totalDifficulty: '0x78ed983323d',
		size: '0x220',
		transactions: [
			'0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
			'0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
			'0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
		],
		uncles: [
			'0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
			'0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
			'0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
		],
		hash: '0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
		baseFeePerGas: expectedBaseFeePerGas,
	};
	let web3Context: Web3Context<EthExecutionAPI>;
	let getTransactionCountSpy: jest.SpyInstance;

	beforeEach(() => {
		// @ts-expect-error - Mocked implementation doesn't have correct method signature
		// (i.e. requestManager, blockNumber, hydrated params), but that doesn't matter for the test
		jest.spyOn(rpcMethods, 'getBlockByNumber').mockImplementation(() => mockBlockData);
		getTransactionCountSpy = jest
			.spyOn(rpcMethods, 'getTransactionCount')
			// @ts-expect-error - Mocked implementation doesn't have correct method signature
			// (i.e. requestManager, blockNumber, hydrated params), but that doesn't matter for the test
			.mockImplementation(() => expectedNonce);
		// @ts-expect-error - Mocked implementation doesn't have correct method signature
		// (i.e. requestManager, blockNumber, hydrated params), but that doesn't matter for the test
		jest.spyOn(rpcMethods, 'getGasPrice').mockImplementation(() => expectedGasPrice);

		web3Context = new Web3Context<EthExecutionAPI>(new HttpProvider('http://127.0.0.1'));
	});

	describe('should populate from', () => {
		it('should use privateKey to populate', async () => {
			const input = { ...transaction };
			delete input.from;

			const result = await populateTransaction(
				input,
				web3Context,
				ValidTypes.HexString,
				'0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709',
			);
			expect(result.from).toBe(expectedFrom);
		});

		it('should use web3Context.defaultAccount to populate', async () => {
			web3Context = new Web3Context<EthExecutionAPI>(new HttpProvider('http://127.0.0.1'), {
				defaultAccount: expectedFrom,
			});

			const input = { ...transaction };
			delete input.from;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.from).toBe(expectedFrom);
		});
	});

	describe('should populate nonce', () => {
		it('should throw UnableToPopulateNonceError', async () => {
			const input = { ...transaction };
			delete input.from;
			delete input.nonce;

			await expect(
				populateTransaction(input, web3Context, ValidTypes.HexString),
			).rejects.toThrow(new UnableToPopulateNonceError());
		});

		it('should use web3Eth.getTransactionCount to populate nonce', async () => {
			const input = { ...transaction };
			delete input.nonce;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.nonce).toBe(expectedNonce);
			expect(getTransactionCountSpy).toHaveBeenCalledWith(
				web3Context.requestManager,
				expectedFrom,
				BlockTags.PENDING,
			);
		});
	});

	describe('should populate value', () => {
		it('should populate with 0x', async () => {
			const input = { ...transaction };
			delete input.value;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.value).toBe('0x');
		});
	});

	describe('should populate data', () => {
		it('should populate with 0x', async () => {
			const input = { ...transaction };
			delete input.data;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.data).toBe('0x');
		});
	});

	describe('should populate chain', () => {
		it('should populate with 0x', async () => {
			const input = { ...transaction };
			delete input.chain;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.chain).toBe('mainnet');
		});
	});

	describe('should populate hardfork', () => {
		it('should populate with 0x', async () => {
			const input = { ...transaction };
			delete input.hardfork;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.hardfork).toBe('london');
		});
	});

	describe('should populate chainId', () => {
		// TODO - web3Eth.getChainId not implemented
		it.skip('should populate with web3Eth.getChainId', async () => {
			const input = { ...transaction };
			delete input.chainId;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.chainId).toBe('0x1');
		});
	});

	describe('should populate gas', () => {
		it('should populate with gasLimit', async () => {
			const input = { ...transaction };
			delete input.gas;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.gas).toBe(expectedGas);
		});
	});

	describe('should populate gasLimit', () => {
		it('should populate with gas', async () => {
			const input = { ...transaction };
			delete input.gasLimit;

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.gasLimit).toBe(expectedGasLimit);
		});
	});

	describe('should populate type', () => {
		it('should populate with 0x0', async () => {
			const input = { ...transaction };
			delete input.type;

			// Used by detectTransactionType
			delete input.maxFeePerGas;
			delete input.maxPriorityFeePerGas;
			delete input.common?.hardfork;
			delete input.accessList;
			// detectTransactionType will automatically set type to 0x2 for london
			// and 0x1 for berlin, so manually setting to something it doesn't handle yet
			input.hardfork = 'merge';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.type).toBe('0x0');
		});

		it('should throw UnsupportedTransactionTypeError', async () => {
			const input = { ...transaction };
			input.type = '0x4';

			await expect(
				populateTransaction(input, web3Context, ValidTypes.HexString),
			).rejects.toThrow(new UnsupportedTransactionTypeError(input.type));
		});
	});

	describe('should populate gasPrice', () => {
		it('should populate with web3Eth.getGasPrice (tx.type 0x0)', async () => {
			const input = { ...transaction };
			delete input.gasPrice;
			input.type = '0x0';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.gasPrice).toBe(expectedGasPrice);
		});

		it('should populate with web3Eth.getGasPrice (tx.type 0x1)', async () => {
			const input = { ...transaction };
			delete input.gasPrice;
			input.type = '0x1';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect(result.gasPrice).toBe(expectedGasPrice);
		});
	});

	describe('should populate accessList', () => {
		it('should populate with [] (tx.type 0x1)', async () => {
			const input = { ...transaction };
			delete input.accessList;
			input.type = '0x1';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip2930Transaction).accessList).toStrictEqual([]);
		});

		it('should populate with [] (tx.type 0x2)', async () => {
			const input = { ...transaction };
			delete input.accessList;
			input.type = '0x2';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip1559Transaction).accessList).toStrictEqual([]);
		});
	});

	describe('should populate maxPriorityFeePerGas and maxFeePerGas', () => {
		it('should throw Eip1559NotSupportedError', async () => {
			const mockBlockDataNoBaseFeePerGas = { ...mockBlockData, baseFeePerGas: undefined };
			jest.spyOn(rpcMethods, 'getBlockByNumber').mockImplementation(
				// @ts-expect-error - Mocked implementation doesn't have correct method signature
				// (i.e. requestManager, blockNumber, hydrated params), but that doesn't matter for the test
				() => mockBlockDataNoBaseFeePerGas,
			);

			const input = { ...transaction };
			input.type = '0x2';

			await expect(
				populateTransaction(input, web3Context, ValidTypes.HexString),
			).rejects.toThrow(new Eip1559NotSupportedError());
		});

		it('should populate with gasPrice', async () => {
			const input = { ...transaction };
			delete input.maxPriorityFeePerGas;
			delete input.maxFeePerGas;
			input.type = '0x2';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip1559Transaction).maxPriorityFeePerGas).toBe(
				expectedGasPrice,
			);
			expect((result as PopulatedUnsignedEip1559Transaction).maxPriorityFeePerGas).toBe(
				expectedGasPrice,
			);
			expect(result.gasPrice).toBeUndefined();
		});

		it('should populate with default maxPriorityFeePerGas and calculated maxFeePerGas (no maxPriorityFeePerGas and maxFeePerGas)', async () => {
			const input = { ...transaction };
			delete input.maxPriorityFeePerGas;
			delete input.maxFeePerGas;
			delete input.gasPrice;
			input.type = '0x2';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip1559Transaction).maxPriorityFeePerGas).toBe(
				expectedMaxPriorityFeePerGas,
			); // 2.5 Gwei, hardcoded in populateTransaction;
			expect((result as PopulatedUnsignedEip1559Transaction).maxFeePerGas).toBe(
				expectedMaxFeePerGas,
			);
		});

		it('should populate with default maxPriorityFeePerGas and calculated maxFeePerGas (no maxFeePerGas)', async () => {
			const input = { ...transaction };
			delete input.maxFeePerGas;
			delete input.gasPrice;
			input.type = '0x2';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip1559Transaction).maxPriorityFeePerGas).toBe(
				expectedMaxPriorityFeePerGas,
			); // 2.5 Gwei, hardcoded in populateTransaction;
			expect((result as PopulatedUnsignedEip1559Transaction).maxFeePerGas).toBe(
				expectedMaxFeePerGas,
			);
		});

		it('should populate with default maxPriorityFeePerGas and calculated maxFeePerGas (no maxPriorityFeePerGas)', async () => {
			const input = { ...transaction };
			delete input.maxPriorityFeePerGas;
			delete input.gasPrice;
			input.type = '0x2';

			const result = await populateTransaction(input, web3Context, ValidTypes.HexString);
			expect((result as PopulatedUnsignedEip1559Transaction).maxPriorityFeePerGas).toBe(
				expectedMaxPriorityFeePerGas,
			); // 2.5 Gwei, hardcoded in populateTransaction;
			expect((result as PopulatedUnsignedEip1559Transaction).maxFeePerGas).toBe(
				expectedMaxFeePerGas,
			);
		});
	});
});
