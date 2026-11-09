import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { categoryOperations } from './resources/category';
import { productOperations } from './resources/product';
import { supplierOperations } from './resources/supplier';
import { currencyOptions, destinationOptions, sendCurrency } from './shared';

const pricedOperations = {
	product: ['search', 'getOptions', 'compare'],
	category: ['getAll'],
	supplier: ['getPrices'],
};

export class PodBenchmark implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'POD Benchmark',
		name: 'podBenchmark',
		icon: { light: 'file:podbenchmark.svg', dark: 'file:podbenchmark.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Compare print-on-demand supplier prices, shipping and delivery for Printify, Printful, Gelato, Prodigi and more',
		defaults: {
			name: 'POD Benchmark',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		requestDefaults: {
			baseURL: 'https://podbenchmark.com/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: {},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Category', value: 'category' },
					{ name: 'Product', value: 'product' },
					{ name: 'Supplier', value: 'supplier' },
				],
				default: 'product',
			},
			...productOperations,
			...categoryOperations,
			...supplierOperations,
			...Object.entries(pricedOperations).flatMap(([resource, operation]) => [
				{
					displayName: 'Ship To',
					name: 'destination',
					type: 'options' as const,
					default: 'US',
					description: 'Where your customer lives. Prices include shipping there.',
					options: destinationOptions,
					displayOptions: { show: { resource: [resource], operation } },
					routing: { send: { type: 'body' as const, property: 'destination' } },
				},
				{
					displayName: 'Currency',
					name: 'currency',
					type: 'options' as const,
					default: '',
					description: 'Currency for every price',
					options: currencyOptions,
					displayOptions: { show: { resource: [resource], operation } },
					routing: { send: { preSend: [sendCurrency] } },
				},
			]),
			{
				displayName: 'Ship To',
				name: 'destination',
				type: 'options',
				default: 'US',
				description: 'Where your customers live',
				options: destinationOptions,
				displayOptions: { show: { resource: ['supplier'], operation: ['guide'] } },
				routing: { send: { type: 'body', property: 'destination' } },
			},
		],
	};
}
