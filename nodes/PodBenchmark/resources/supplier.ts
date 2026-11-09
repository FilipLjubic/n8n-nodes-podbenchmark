import type { INodeProperties } from 'n8n-workflow';
import {
	destinationOptions,
	pricingTierOptions,
	salesChannelOptions,
	sendWithin,
	supplierOptions,
} from '../shared';

const forSupplier = { resource: ['supplier'] };

export const supplierOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forSupplier },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a supplier',
				description:
					'Get how a supplier works: plans and fees, branding, support, where it prints and its print providers',
				routing: {
					request: { method: 'POST', url: '/tools/get_supplier' },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many suppliers',
				description: 'List the print-on-demand suppliers POD Benchmark compares',
				routing: {
					request: { method: 'POST', url: '/tools/list_suppliers' },
					send: { paginate: '={{ $parameter.returnAll }}' },
					operations: {
						pagination: {
							type: 'offset',
							properties: {
								limitParameter: 'limit',
								offsetParameter: 'offset',
								pageSize: 50,
								type: 'body',
							},
						},
					},
					output: {
						postReceive: [{ type: 'rootProperty', properties: { property: 'suppliers' } }],
					},
				},
			},
			{
				name: 'Get Price Standing',
				value: 'getPrices',
				action: 'Get where a supplier is cheapest',
				description:
					'See how many products a supplier is cheapest for, where it costs more and by how much',
				routing: {
					request: { method: 'POST', url: '/tools/get_supplier_prices' },
				},
			},
			{
				name: 'Match to Shop',
				value: 'guide',
				action: 'Match suppliers to a shop',
				description:
					'Find which suppliers fit a product type and shop, with dated reasons and a delivered price range',
				routing: {
					request: { method: 'POST', url: '/tools/supplier_guide' },
				},
			},
		],
		default: 'getAll',
	},

	// Get Many
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { ...forSupplier, operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...forSupplier, operation: ['getAll'], returnAll: [false] } },
		routing: { send: { type: 'body', property: 'limit' } },
	},

	// Get, Get Price Standing
	{
		displayName: 'Supplier',
		name: 'supplierId',
		type: 'options',
		required: true,
		default: 'printify',
		options: supplierOptions,
		displayOptions: { show: { ...forSupplier, operation: ['get', 'getPrices'] } },
		routing: { send: { type: 'body', property: 'supplierId' } },
	},
	{
		displayName: 'Include',
		name: 'include',
		type: 'multiOptions',
		default: ['facts'],
		options: [
			{
				name: 'Facts',
				value: 'facts',
				description: 'Plans, fees, branding and who handles what',
			},
			{
				name: 'Production Locations',
				value: 'locations',
				description: 'Where the supplier reports printing',
			},
			{
				name: 'Print Providers',
				value: 'providers',
				description: "A marketplace's print providers",
			},
		],
		displayOptions: { show: { ...forSupplier, operation: ['get'] } },
		routing: { send: { type: 'body', property: 'include' } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...forSupplier, operation: ['get'] } },
		options: [
			{
				displayName: 'Location Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'US',
				description: 'Only production locations in this country, as a two-letter code',
				routing: { send: { type: 'body', property: 'country' } },
			},
			{
				displayName: 'Print Provider',
				name: 'provider',
				type: 'string',
				default: '',
				description: 'Only this print provider',
				routing: { send: { type: 'body', property: 'provider' } },
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...forSupplier, operation: ['getPrices'] } },
		options: [
			{
				displayName: 'Category ID',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 't-shirts',
				description: 'Only products in this category',
				routing: { send: { type: 'body', property: 'category' } },
			},
			{
				displayName: 'Near-Cheapest Margin',
				name: 'withinValue',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 1,
				description: 'How close to the cheapest still counts as near-cheapest, in the unit below',
			},
			{
				displayName: 'Near-Cheapest Unit',
				name: 'withinKind',
				type: 'options',
				default: 'amount',
				options: [
					{ name: 'Amount in Currency', value: 'amount' },
					{ name: 'Percent', value: 'percent' },
				],
				routing: { send: { preSend: [sendWithin] } },
			},
			{
				displayName: 'Pricing Plan',
				name: 'pricingTier',
				type: 'options',
				default: 'base',
				options: pricingTierOptions,
				routing: { send: { type: 'body', property: 'pricingTier' } },
			},
			{
				displayName: 'Product Search Text',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Only products matching this text',
				routing: { send: { type: 'body', property: 'search' } },
			},
			{
				displayName: 'Versus Supplier',
				name: 'versus',
				type: 'options',
				default: 'printful',
				description: 'Compare against this supplier only, instead of every other one',
				options: supplierOptions,
				routing: { send: { type: 'body', property: 'versus' } },
			},
		],
	},

	// Match to Shop
	{
		displayName: 'Product Type',
		name: 'productType',
		type: 'options',
		default: 't-shirts',
		options: [
			{ name: 'Hoodies', value: 'hoodies' },
			{ name: 'Mugs', value: 'mugs' },
			{ name: 'Phone Cases', value: 'phone-cases' },
			{ name: 'Stickers', value: 'stickers' },
			{ name: 'T-Shirts', value: 't-shirts' },
			{ name: 'Wall Art', value: 'wall-art' },
		],
		displayOptions: { show: { ...forSupplier, operation: ['guide'] } },
		routing: { send: { type: 'body', property: 'productType' } },
	},
	{
		displayName: 'Shop',
		name: 'shop',
		type: 'collection',
		placeholder: 'Add Shop Detail',
		default: {},
		displayOptions: { show: { ...forSupplier, operation: ['guide'] } },
		options: [
			{
				displayName: 'Needs Custom Branding',
				name: 'needsCustomBranding',
				type: 'boolean',
				default: true,
				description: 'Whether you need your own labels, packing slips or inserts',
				routing: { send: { type: 'body', property: 'needsCustomBranding' } },
			},
			{
				displayName: 'Sales Channel',
				name: 'salesChannel',
				type: 'options',
				default: 'etsy',
				options: salesChannelOptions,
				routing: { send: { type: 'body', property: 'salesChannel' } },
			},
			{
				displayName: 'Shop Location',
				name: 'shopLocation',
				type: 'options',
				default: 'US',
				options: destinationOptions,
				routing: { send: { type: 'body', property: 'shopLocation' } },
			},
			{
				displayName: 'Wants Free Start',
				name: 'wantsFreeStart',
				type: 'boolean',
				default: true,
				description: 'Whether you want to start without a monthly fee',
				routing: { send: { type: 'body', property: 'wantsFreeStart' } },
			},
			{
				displayName: 'Wants to Choose Print Provider',
				name: 'wantsToChooseProvider',
				type: 'boolean',
				default: true,
				description: 'Whether you want to pick which print shop makes each order',
				routing: { send: { type: 'body', property: 'wantsToChooseProvider' } },
			},
		],
	},
];
