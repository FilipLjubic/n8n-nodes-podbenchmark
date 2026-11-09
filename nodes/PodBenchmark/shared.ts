import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

export const destinationOptions: INodePropertyOptions[] = [
	{ name: 'Australia', value: 'AU' },
	{ name: 'Canada', value: 'CA' },
	{ name: 'Germany', value: 'DE' },
	{ name: 'United Kingdom', value: 'GB' },
	{ name: 'United States', value: 'US' },
];

export const currencyOptions: INodePropertyOptions[] = [
	{ name: 'Destination Currency', value: '' },
	{ name: 'AUD', value: 'AUD' },
	{ name: 'CAD', value: 'CAD' },
	{ name: 'EUR', value: 'EUR' },
	{ name: 'GBP', value: 'GBP' },
	{ name: 'USD', value: 'USD' },
];

export const supplierOptions: INodePropertyOptions[] = [
	{ name: 'Apliiq', value: 'apliiq' },
	{ name: 'Artelo', value: 'artelo' },
	{ name: 'CustomCat', value: 'customcat' },
	{ name: 'Fourthwall', value: 'fourthwall' },
	{ name: 'Gelato', value: 'gelato' },
	{ name: 'Inkthreadable', value: 'inkthreadable' },
	{ name: 'merchOne', value: 'merchone' },
	{ name: 'Printful', value: 'printful' },
	{ name: 'Printify', value: 'printify' },
	{ name: 'Prodigi', value: 'prodigi' },
];

export const salesChannelOptions: INodePropertyOptions[] = [
	{ name: 'Etsy', value: 'etsy' },
	{ name: 'Shopify', value: 'shopify' },
	{ name: 'TikTok Shop', value: 'tiktok-shop' },
	{ name: 'WooCommerce', value: 'woocommerce' },
];

export const pricingTierOptions: INodePropertyOptions[] = [
	{
		name: 'Standard Price',
		value: 'base',
		description: "Each supplier's price without a paid plan",
	},
	{
		name: 'First Paid Plan',
		value: 'tier1',
		description: "Each supplier's first paid plan, such as Printify Premium",
	},
	{
		name: 'Second Paid Plan',
		value: 'tier2',
		description: "Each supplier's second paid plan, where it has one",
	},
];

const destinationCurrency: Record<string, string> = {
	AU: 'AUD',
	CA: 'CAD',
	DE: 'EUR',
	GB: 'GBP',
	US: 'USD',
};

function body(requestOptions: IHttpRequestOptions): IDataObject {
	if (typeof requestOptions.body !== 'object' || requestOptions.body === null) {
		requestOptions.body = {};
	}
	return requestOptions.body as IDataObject;
}

/** Sends the chosen currency, or the destination's own currency when none is chosen. */
export async function sendCurrency(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const currency = this.getNodeParameter('currency', '') as string;
	const destination = this.getNodeParameter('destination', 'US') as string;
	body(requestOptions).currency = currency || destinationCurrency[destination] || 'USD';
	return requestOptions;
}

/** Turns the Choices list (field and value pairs) into the API's choices object. */
export async function sendChoices(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const raw = this.getNodeParameter('choices', {}) as {
		choice?: Array<{ field?: string; value?: string }>;
	};
	const choices: IDataObject = {};
	for (const { field, value } of raw.choice ?? []) {
		const key = field?.trim();
		const text = value?.trim();
		if (key && text) choices[key] = text;
	}
	if (Object.keys(choices).length > 0) body(requestOptions).choices = choices;
	return requestOptions;
}

/** Turns comma-separated text into a list, dropping empty entries. */
export function splitList(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(String).filter(Boolean);
	if (typeof value !== 'string') return [];
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

/** Turns the Spec Filters list into the API's specs object. */
export async function sendSpecs(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const raw = this.getNodeParameter('filters.specs', {}) as {
		spec?: Array<{ field?: string; values?: string }>;
	};
	const specs: Record<string, string[]> = {};
	for (const { field, values } of raw.spec ?? []) {
		const list = splitList(values);
		if (field && list.length > 0) specs[field] = [...(specs[field] ?? []), ...list];
	}
	if (Object.keys(specs).length > 0) body(requestOptions).specs = specs;
	return requestOptions;
}

/** Sends "how close counts as near-cheapest" as the API's within object. */
export async function sendWithin(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const kind = this.getNodeParameter('options.withinKind', '') as string;
	if (!kind) return requestOptions;
	const amount = this.getNodeParameter('options.withinValue', 1) as number;
	body(requestOptions).within =
		kind === 'percent' ? { kind: 'percent', percent: amount } : { kind: 'amount', amount };
	return requestOptions;
}

type Offer = IDataObject & { profit?: IDataObject | null };

const round = (value: unknown, digits: number): number | null =>
	typeof value === 'number' ? Number(value.toFixed(digits)) : null;

/**
 * With Simplify on, turns a comparison into one item per supplier, cheapest first as the
 * API orders them. Unknown prices stay null; they are never shown as zero.
 */
export async function simplifyComparison(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!(this.getNodeParameter('simplify', true) as boolean)) return items;
	return items.flatMap((item) => {
		const comparison = item.json;
		const rows = (comparison.suppliers ?? []) as Array<{ offer?: Offer | null }>;
		const product = (comparison.product ?? {}) as IDataObject;
		return rows.flatMap(({ offer }) => {
			if (!offer) return [];
			const profit = offer.profit?.status === 'calculated' ? offer.profit : null;
			return [
				{
					json: {
						supplier: offer.supplier,
						delivered: offer.delivered ?? null,
						currency: offer.currency ?? comparison.currency,
						productCost: offer.price ?? null,
						shipping: offer.shipping ?? null,
						duty: offer.duty ?? null,
						deliveryDaysMin: offer.deliveryDaysMin ?? null,
						deliveryDaysMax: offer.deliveryDaysMax ?? null,
						cheapest: offer.cheapest === true,
						profit: profit?.keep ?? null,
						marginPercent: round(
							typeof profit?.margin === 'number' ? profit.margin * 100 : undefined,
							1,
						),
						sellingPrice: profit?.sale ?? null,
						platformFees: profit?.fees ?? null,
						differencePerSale: offer.versusYours ?? null,
						isYourSupplier: offer.isYourSupplier === true,
						available: offer.available === true,
						comparable: offer.comparable === true,
						printProvider: offer.provider ?? null,
						supplierProduct: offer.product ?? null,
						supplierId: offer.supplierId,
						note: offer.note ?? null,
						checkedAt: offer.checkedAt ?? null,
						supplierLink: offer.actionUrl ?? offer.productUrl ?? null,
						product: product.name ?? null,
						productId: product.id ?? comparison.canonicalProductId ?? null,
						configuration: comparison.optionLabel ?? null,
						destination: comparison.destination,
						comparisonUrl: product.url ?? null,
					},
					pairedItem: item.pairedItem,
				},
			];
		});
	});
}
