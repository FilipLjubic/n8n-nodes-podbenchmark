import type { INodeProperties } from 'n8n-workflow';

const forCategory = { resource: ['category'] };

export const categoryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forCategory },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many categories',
				description: 'List product categories with product counts and starting delivered prices',
				routing: {
					request: { method: 'POST', url: '/tools/list_categories' },
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
						postReceive: [{ type: 'rootProperty', properties: { property: 'categories' } }],
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { ...forCategory, operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...forCategory, operation: ['getAll'], returnAll: [false] } },
		routing: { send: { type: 'body', property: 'limit' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...forCategory, operation: ['getAll'] } },
		options: [
			{
				displayName: 'Parent Category ID',
				name: 'parent',
				type: 'string',
				default: '',
				placeholder: 'apparel',
				description: 'Only the children of this category',
				routing: { send: { type: 'body', property: 'parent' } },
			},
			{
				displayName: 'Search Text',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'shirts',
				routing: { send: { type: 'body', property: 'query' } },
			},
		],
	},
];
