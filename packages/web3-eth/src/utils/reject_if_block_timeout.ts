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
import { EthExecutionAPI, Bytes, Web3BaseProvider, BlockHeaderOutput } from 'web3-types';
import { Web3Context } from 'web3-core';
import { rejectIfConditionAtInterval } from 'web3-utils';

import { TransactionBlockTimeoutError } from 'web3-errors';
import { NUMBER_DATA_FORMAT } from '../constants';
// eslint-disable-next-line import/no-cycle
import { getBlockNumber } from '../rpc_method_wrappers';
import { NewHeadsSubscription } from '../web3_subscriptions';

export interface ResourceCleaner {
	clean: () => void;
}

function resolveByPolling(
	web3Context: Web3Context<EthExecutionAPI>,
	starterBlockNumber: number,
	transactionHash?: Bytes,
): [Promise<never>, ResourceCleaner] {
	const pollingInterval = web3Context.transactionPollingInterval;
	const [intervalId, promiseToError]: [NodeJS.Timer, Promise<never>] =
		rejectIfConditionAtInterval(async () => {
			let lastBlockNumber;
			try {
				lastBlockNumber = await getBlockNumber(web3Context, NUMBER_DATA_FORMAT);
			} catch (error) {
				// console.debug('An error happen while trying to get the block number', error);
				return undefined;
			}
			const numberOfBlocks = lastBlockNumber - starterBlockNumber;
			if (numberOfBlocks >= web3Context.transactionBlockTimeout) {
				return new TransactionBlockTimeoutError({
					starterBlockNumber,
					numberOfBlocks,
					transactionHash,
				});
			}
			return undefined;
		}, pollingInterval);

	const clean = () => {
		clearInterval(intervalId);
	};

	return [promiseToError, { clean }];
}

async function resolveBySubscription(
	web3Context: Web3Context<EthExecutionAPI>,
	starterBlockNumber: number,
	transactionHash?: Bytes,
): Promise<[Promise<never>, ResourceCleaner]> {
	// The following variable will stay true except if the data arrived,
	//	or if watching started after an error had occurred.
	let needToWatchLater = true;

	let subscription: NewHeadsSubscription;
	let resourceCleaner: ResourceCleaner;
	// internal helper function
	function revertToPolling(
		reject: (value: Error | PromiseLike<Error>) => void,
		previousError?: Error,
	) {
		if (previousError) {
			// console.debug('error happened at subscription revert to polling...', previousError);
		}
		resourceCleaner.clean();

		needToWatchLater = false;
		const [promiseToError, newResourceCleaner] = resolveByPolling(
			web3Context,
			starterBlockNumber,
			transactionHash,
		);
		resourceCleaner.clean = newResourceCleaner.clean;
		promiseToError.catch(error => reject(error as Error));
	}
	try {
		subscription = (await web3Context.subscriptionManager?.subscribe(
			'newHeads',
		)) as unknown as NewHeadsSubscription;
		resourceCleaner = {
			clean: () => {
				web3Context.subscriptionManager
					?.removeSubscription(subscription)
					.then(() => {
						// console.debug('ending subscription successfully');
					})
					.catch(() => {
						// console.debug('error happened while ending subscription', error);
					});
			},
		};
	} catch (error) {
		// console.debug('error happened when trying to subscribe to `newHeads`.', error);
		return resolveByPolling(web3Context, starterBlockNumber, transactionHash);
	}
	const promiseToError: Promise<never> = new Promise((_, reject) => {
		try {
			subscription.on('data', (lastBlockHeader: BlockHeaderOutput) => {
				needToWatchLater = false;
				if (!lastBlockHeader?.number) {
					return;
				}
				const numberOfBlocks = Number(
					BigInt(lastBlockHeader.number) - BigInt(starterBlockNumber),
				);

				if (numberOfBlocks >= web3Context.transactionBlockTimeout) {
					// console.debug(
					// 	'Transaction Block Timeout Error has been resolved by subscription',
					// );

					// console.log(
					// 	'resolveBySubscription -> starterBlockNumber:',
					// 	lastBlockHeader.number,
					// 	', transactionHash:',
					// 	transactionHash,
					// );

					reject(
						new TransactionBlockTimeoutError({
							starterBlockNumber,
							numberOfBlocks,
							transactionHash,
						}),
					);
				}
			});
			subscription.on('error', error => {
				revertToPolling(reject, error);
			});
		} catch (error) {
			revertToPolling(reject, error as Error);
		}

		// Fallback to polling if tx receipt didn't arrived in "blockHeaderTimeout" [10 seconds]
		setTimeout(() => {
			if (needToWatchLater) {
				// console.debug(
				// 	'blockHeaderTimeout reached without getting the blocks by subscription. Try by polling',
				// );
				revertToPolling(reject);
			}
		}, web3Context.blockHeaderTimeout * 1000);
	});

	return [promiseToError, resourceCleaner];
}

/* TODO: After merge, there will be constant block mining time (exactly 12 second each block, except slot missed that currently happens in <1% of slots. ) so we can optimize following function
for POS NWs, we can skip checking getBlockNumber(); after interval and calculate only based on time  that certain num of blocked are mined after that for internal double check, can do one getBlockNumber() call and timeout. 
*/
export async function rejectIfBlockTimeout(
	web3Context: Web3Context<EthExecutionAPI>,
	transactionHash?: Bytes,
): Promise<[Promise<never>, ResourceCleaner]> {
	const provider: Web3BaseProvider = web3Context.requestManager.provider as Web3BaseProvider;
	let callingRes: [Promise<never>, ResourceCleaner];
	const starterBlockNumber = await getBlockNumber(web3Context, NUMBER_DATA_FORMAT);
	if (provider.supportsSubscriptions()) {
		callingRes = await resolveBySubscription(web3Context, starterBlockNumber, transactionHash);
	} else {
		callingRes = resolveByPolling(web3Context, starterBlockNumber, transactionHash);
	}
	return callingRes;
}
