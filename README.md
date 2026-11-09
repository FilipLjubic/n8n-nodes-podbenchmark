# n8n-nodes-podbenchmark

An n8n community node for [POD Benchmark](https://podbenchmark.com). Use it to compare print-on-demand suppliers in your workflows: product cost, shipping, delivered total and delivery time for the same product, size and color.

It covers Printify, Printful, Gelato, Prodigi, CustomCat, Fourthwall, Inkthreadable, Apliiq, Artelo and merchOne, shipping to the US, UK, Germany, Canada and Australia. Prices come from POD Benchmark's weekly supplier checks, and each price carries the date it was checked.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Compatibility](#compatibility) · [Usage](#usage) · [Resources](#resources)

## Installation

In n8n, open **Settings → Community Nodes → Install** and enter `n8n-nodes-podbenchmark`. The [community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) covers self-hosted installs.

## Operations

**Product**

- **Search**: find products by type, brand or model (`hoodie`, `bella canvas 3001`). You can filter by category, supplier, brand, audience, specs and weight. Each result is a product with its starting delivered price.
- **Get**: a product's specs, print methods and similar products.
- **Get Options**: the sizes, colors and other configurations a product comes in.
- **Compare Suppliers**: every supplier's product cost, shipping, delivered total and delivery days for one configuration. Optionally add your selling price or target margin, sales channel and shop location to get profit after platform fees. Add your current supplier and each row shows the difference per sale.
- **Find by Supplier Link**: paste a Printify, Printful, Gelato or other supplier product link to get the matching product, ready to compare.

**Category**

- **Get Many**: product categories with product counts and starting delivered prices.

**Supplier**

- **Get Many**: the suppliers POD Benchmark compares.
- **Get**: a supplier's plans and monthly fees, custom branding, who handles support, production locations and print providers. Each fact lists its sources and the date it was checked.
- **Get Price Standing**: how many products a supplier is cheapest for, overall, by category or against one other supplier.
- **Match to Shop**: which suppliers fit a product type and shop (where your customers are, your sales channel, branding needs, free start), with dated reasons.

Missing prices come back as `null`, never `0`. Affiliate links never change the order of results.

## Credentials

None. The POD Benchmark API is free and needs no account or key.

## Compatibility

Built with `@n8n/node-cli` 0.55 and tested on n8n 2.46.7. The node uses no runtime dependencies.

## Usage

A typical flow is **Search → Get Options → Compare Suppliers**:

1. **Product → Search** with Search Text `bella canvas 3001` returns `bella-canvas-3001`.
2. **Product → Compare Suppliers** with Product ID `bella-canvas-3001`, Choices `size = m` and `color = black`, shipping to the United States. On 9 November 2026 Gelato was cheapest at $15.68 delivered ($10.69 product + $4.99 shipping, 4–6 days), followed by Fourthwall at $16.04.

Choices match a value's key or label without regard to case, so `m`, `M` and `Adult M` all work. **Get Options** lists the fields and values for each product.

The node works as a tool for the n8n **AI Agent**, so an agent can answer "which supplier is cheapest for a black M Bella+Canvas 3001 shipped to Germany?" from live data.

Some workflows to build:

- Get a weekly Slack message with the cheapest supplier for each of your best sellers.
- Recheck your margins when supplier prices change: compare with **Your Supplier** set and **Selling Price** filled in.
- Pull a product link from a spreadsheet, use **Find by Supplier Link**, then compare.

## Resources

- [POD Benchmark](https://podbenchmark.com)
- [POD Benchmark CLI and MCP server](https://github.com/FilipLjubic/podbenchmark-cli)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE)
