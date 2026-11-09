import type { INodeProperties } from 'n8n-workflow';
import {
	pricingTierOptions,
	salesChannelOptions,
	destinationOptions,
	sendChoices,
	sendSpecs,
	supplierOptions,
} from '../shared';

const forProduct = { resource: ['product'] };

const productIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Product ID',
	name: 'canonicalProductId',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'bella-canvas-3001',
	description:
		'The POD Benchmark product ID, such as bella-canvas-3001. Search Products and Find by Supplier Link return it.',
	displayOptions: { show: { ...forProduct, operation: operations } },
	routing: { send: { type: 'body', property: 'canonicalProductId' } },
});

const choicesField = (operations: string[]): INodeProperties => ({
	displayName: 'Choices',
	name: 'choices',
	type: 'fixedCollection',
	placeholder: 'Add Choice',
	default: {},
	typeOptions: { multipleValues: true },
	description:
		'The configuration to price, such as size M and color Black. Get Options lists the fields and values for a product.',
	displayOptions: { show: { ...forProduct, operation: operations } },
	options: [
		{
			displayName: 'Choice',
			name: 'choice',
			values: [
				{
					displayName: 'Field',
					name: 'field',
					type: 'string',
					default: '',
					placeholder: 'size',
					description: 'The option field, such as size, color or capacity',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'm',
					description: 'The value, matched against its key or label without regard to case',
				},
			],
		},
	],
	routing: { send: { preSend: [sendChoices] } },
});

export const productOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forProduct },
		options: [
			{
				name: 'Compare Suppliers',
				value: 'compare',
				action: 'Compare supplier prices for a product',
				description:
					'Compare product cost, shipping, delivered total and delivery time across suppliers for one configuration and destination',
				routing: {
					request: { method: 'POST', url: '/tools/compare_product' },
				},
			},
			{
				name: 'Find by Supplier Link',
				value: 'resolveLink',
				action: 'Find the product behind a supplier link',
				description:
					'Match a Printify, Printful, Gelato or other supplier product link to a POD Benchmark product',
				routing: {
					request: { method: 'POST', url: '/tools/resolve_supplier_link' },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product',
				description: "Get a product's specs, print methods and similar products",
				routing: {
					request: { method: 'POST', url: '/tools/get_product' },
				},
			},
			{
				name: 'Get Options',
				value: 'getOptions',
				action: 'Get a product s options',
				description: 'List the sizes, colors and other configurations a product comes in',
				routing: {
					request: { method: 'POST', url: '/tools/get_product_options' },
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search products',
				description: 'Find products by type, brand or model with their starting delivered price',
				routing: {
					request: { method: 'POST', url: '/tools/search_products' },
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
						postReceive: [{ type: 'rootProperty', properties: { property: 'products' } }],
					},
				},
			},
		],
		default: 'compare',
	},

	// Search
	{
		displayName: 'Search Text',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'bella canvas 3001',
		description:
			'Product type, brand or model, such as hoodie or Gildan 5000. Leave empty to browse with filters.',
		displayOptions: { show: { ...forProduct, operation: ['search'] } },
		routing: { send: { type: 'body', property: 'query' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { ...forProduct, operation: ['search'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...forProduct, operation: ['search'], returnAll: [false] } },
		routing: { send: { type: 'body', property: 'limit' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...forProduct, operation: ['search'] } },
		options: [
			{
				displayName: 'Audiences',
				name: 'audiences',
				type: 'string',
				default: '',
				placeholder: 'unisex, womens',
				description: 'Comma-separated audiences, such as unisex, mens, womens or kids',
				routing: {
					send: {
						type: 'body',
						property: 'audiences',
						value: '={{ $value.split(",").map(v => v.trim()).filter(v => v) }}',
					},
				},
			},
			{
				displayName: 'Brands',
				name: 'brands',
				type: 'string',
				default: '',
				placeholder: 'Bella+Canvas, Gildan',
				description: 'Comma-separated brands',
				routing: {
					send: {
						type: 'body',
						property: 'brands',
						value: '={{ $value.split(",").map(v => v.trim()).filter(v => v) }}',
					},
				},
			},
			{
				displayName: 'Category Name or ID',
				name: 'category',
				type: 'options',
				default: '',
				description:
					'Only products in this category. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'POST',
								url: '/tools/list_categories',
								body: { limit: 100 },
							},
							output: {
								postReceive: [
									{ type: 'rootProperty', properties: { property: 'categories' } },
									{
										type: 'setKeyValue',
										properties: { name: '={{$responseItem.name}}', value: '={{$responseItem.id}}' },
									},
									{ type: 'sort', properties: { key: 'name' } },
								],
							},
						},
					},
				},
				routing: { send: { type: 'body', property: 'category' } },
			},
			{
				displayName: 'Include Filter Counts',
				name: 'includeFacets',
				type: 'boolean',
				default: false,
				description:
					'Whether to also count brands, suppliers, audiences and spec values. Only applies when Return All is off.',
				routing: { send: { type: 'body', property: 'includeFacets' } },
			},
			{
				displayName: 'Max Weight (Oz)',
				name: 'maxWeightOz',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 100 },
				default: 10,
				routing: { send: { type: 'body', property: 'maxWeightOz' } },
			},
			{
				displayName: 'Min Weight (Oz)',
				name: 'minWeightOz',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 100 },
				default: 0,
				routing: { send: { type: 'body', property: 'minWeightOz' } },
			},
			{
				displayName: 'Priced Only',
				name: 'pricedOnly',
				type: 'boolean',
				default: true,
				description: 'Whether to return only products with a delivered price for the destination',
				routing: { send: { type: 'body', property: 'pricedOnly' } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Cheapest First', value: 'cheapest' },
					{ name: 'Most Expensive First', value: 'priciest' },
					{ name: 'Most Suppliers First', value: 'most-suppliers' },
					{ name: 'Name', value: 'name' },
					{ name: 'Relevance', value: 'relevance' },
				],
				routing: { send: { type: 'body', property: 'sort' } },
			},
			{
				displayName: 'Spec Filters',
				name: 'specs',
				type: 'fixedCollection',
				placeholder: 'Add Spec Filter',
				default: {},
				typeOptions: { multipleValues: true },
				options: [
					{
						displayName: 'Spec',
						name: 'spec',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								default: 'fit',
								options: [
									{ name: 'Capacity', value: 'capacity' },
									{ name: 'Construction', value: 'construction' },
									{ name: 'Eco-Friendly', value: 'ecoFriendly' },
									{ name: 'Fabric Blend', value: 'fabricBlendCategory' },
									{ name: 'Fit', value: 'fit' },
									{ name: 'Label Type', value: 'labelType' },
									{ name: 'Material', value: 'material' },
									{ name: 'Neckline', value: 'neckline' },
									{ name: 'Sleeve', value: 'sleeve' },
								],
							},
							{
								displayName: 'Values',
								name: 'values',
								type: 'string',
								default: '',
								placeholder: 'classic, relaxed',
								description: 'Comma-separated values; a product matches any of them',
							},
						],
					},
				],
				routing: { send: { preSend: [sendSpecs] } },
			},
			{
				displayName: 'Suppliers',
				name: 'suppliers',
				type: 'multiOptions',
				default: [],
				description: 'Only products at least one of these suppliers sells',
				options: supplierOptions,
				routing: { send: { type: 'body', property: 'suppliers' } },
			},
		],
	},

	// Get, Get Options, Compare
	productIdField(['get', 'getOptions', 'compare']),
	{
		displayName: 'Similar Products',
		name: 'similarLimit',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 20 },
		default: 5,
		description: 'How many similar products to return, with what they share and how they differ',
		displayOptions: { show: { ...forProduct, operation: ['get'] } },
		routing: { send: { type: 'body', property: 'similarLimit' } },
	},
	{
		displayName: 'Filter Text',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'm black',
		description: 'Words to narrow the list of configurations',
		displayOptions: { show: { ...forProduct, operation: ['getOptions'] } },
		routing: { send: { type: 'body', property: 'query' } },
	},
	choicesField(['getOptions', 'compare']),
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...forProduct, operation: ['getOptions'] } },
		routing: { send: { type: 'body', property: 'limit' } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...forProduct, operation: ['compare'] } },
		options: [
			{
				displayName: 'Only Supplier',
				name: 'supplier',
				type: 'options',
				default: 'printify',
				description:
					'Show only this supplier, with every product and print provider it offers for the choice',
				options: supplierOptions,
				routing: { send: { type: 'body', property: 'supplier' } },
			},
			{
				displayName: 'Option Key',
				name: 'optionKey',
				type: 'string',
				default: '',
				description: 'An exact configuration key from Get Options. Use instead of Choices.',
				routing: { send: { type: 'body', property: 'optionKey' } },
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
				displayName: 'Sales Channel',
				name: 'salesChannel',
				type: 'options',
				default: 'etsy',
				description:
					'Where you sell. Needed with Selling Price or Target Margin to include platform fees.',
				options: salesChannelOptions,
				routing: { send: { type: 'body', property: 'salesChannel' } },
			},
			{
				displayName: 'Selling Price',
				name: 'sellingPrice',
				type: 'number',
				typeOptions: { minValue: 0, numberPrecision: 2 },
				default: 0,
				description:
					'What your customer pays for one item, including any shipping you charge, in the chosen currency. Returns your profit with each supplier.',
				routing: { send: { type: 'body', property: 'sellingPrice' } },
			},
			{
				displayName: 'Shop Location',
				name: 'shopLocation',
				type: 'options',
				default: 'US',
				description: 'The country your shop is based in, used for platform fees',
				options: destinationOptions,
				routing: { send: { type: 'body', property: 'shopLocation' } },
			},
			{
				displayName: 'Target Margin (%)',
				name: 'targetMargin',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 94 },
				default: 30,
				description:
					'The share of the sale you want to keep after supplier cost and platform fees. Returns the price to charge with each supplier. Use instead of Selling Price.',
				routing: { send: { type: 'body', property: 'targetMargin' } },
			},
			{
				displayName: 'Your Supplier',
				name: 'yourSupplier',
				type: 'options',
				default: 'printify',
				description:
					'The supplier you use today. It is listed first and every other row shows the difference per sale.',
				options: supplierOptions,
				routing: { send: { type: 'body', property: 'yourSupplier' } },
			},
		],
	},

	// Find by Supplier Link
	{
		displayName: 'Supplier Link',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder:
			'https://www.printful.com/custom/mens/t-shirts/unisex-staple-t-shirt-bella-canvas-3001',
		description: "A supplier's product page. POD Benchmark matches it without opening it.",
		displayOptions: { show: { ...forProduct, operation: ['resolveLink'] } },
		routing: { send: { type: 'body', property: 'url' } },
	},
];
