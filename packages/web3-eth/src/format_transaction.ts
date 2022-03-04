import { convertToValidType, Numbers, ValidReturnTypes, ValidTypes, mergeDeep } from 'web3-utils';
import { TransactionDataAndInputError } from './errors';
import { Transaction } from './types';

export function formatTransaction<
	DesiredType extends ValidTypes,
	NumberType extends ValidReturnTypes[DesiredType] = ValidReturnTypes[DesiredType],
>(transaction: Transaction, desiredType: DesiredType): Transaction<NumberType> {
	const formattedTransaction = mergeDeep(
		{},
		transaction as Record<string, unknown>,
	) as Transaction;
	if (transaction.common !== undefined) {
		formattedTransaction.common = { ...transaction.common };
		if (transaction.common.customChain !== undefined)
			formattedTransaction.common.customChain = { ...transaction.common.customChain };
	}

	const formattableProperties: (keyof Transaction)[] = [
		'value',
		'gas',
		'gasPrice',
		'type',
		'maxFeePerGas',
		'maxPriorityFeePerGas',
		'nonce',
		'chainId',
		'gasLimit',
		'v',
	];
	for (const transactionProperty of formattableProperties) {
		const formattedProperty = formattedTransaction[transactionProperty];
		if (
			formattedProperty !== undefined &&
			formattedProperty !== null &&
			typeof formattedProperty !== 'object' &&
			!Array.isArray(formattedProperty)
		) {
			if (transactionProperty === 'value' && formattedProperty === '0x') continue;
			(formattedTransaction[transactionProperty] as Numbers) = convertToValidType(
				formattedProperty,
				desiredType,
			);
		}
	}

	if (formattedTransaction.common?.customChain !== undefined) {
		if (formattedTransaction.common.customChain.networkId !== undefined)
			formattedTransaction.common.customChain.networkId = convertToValidType(
				formattedTransaction.common.customChain.networkId,
				desiredType,
			);
		if (formattedTransaction.common.customChain.chainId !== undefined)
			formattedTransaction.common.customChain.chainId = convertToValidType(
				formattedTransaction.common.customChain.chainId,
				desiredType,
			);
	}

	if (formattedTransaction.data !== undefined && formattedTransaction.input !== undefined)
		throw new TransactionDataAndInputError({
			data: formattedTransaction.data,
			input: formattedTransaction.input,
		});
	else if (formattedTransaction.input !== undefined) {
		formattedTransaction.data = formattedTransaction.input;
		delete formattedTransaction.input;
	}

	return formattedTransaction as Transaction<NumberType>;
}
