import type { ModelConfig, Provider, ProviderOptions } from "@workspace/lib/providers";

type SearchCountry = NonNullable<ProviderOptions["country"]>;

export function readBrandSearchCountries(raw = process.env.BRAND_SEARCH_COUNTRIES): ReadonlyMap<string, SearchCountry> {
	if (!raw?.trim()) return new Map();
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("BRAND_SEARCH_COUNTRIES must be a JSON object with brand IDs as keys and GB or CA as values.");
	}
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("BRAND_SEARCH_COUNTRIES must be a JSON object.");
	}
	const countries = new Map<string, SearchCountry>();
	for (const [brandId, country] of Object.entries(parsed)) {
		if (!brandId.trim() || brandId !== brandId.trim()) {
			throw new Error("BRAND_SEARCH_COUNTRIES keys must be brand IDs with no surrounding spaces.");
		}
		if (country !== "GB" && country !== "CA") {
			throw new Error("BRAND_SEARCH_COUNTRIES values must be GB or CA.");
		}
		countries.set(brandId, country);
	}
	return countries;
}

export function brandSearchCountry(brandId: string): SearchCountry {
	return readBrandSearchCountries().get(brandId) ?? "GB";
}

export async function runBrandTarget(brandId: string, prompt: string, config: ModelConfig, provider: Provider) {
	const country = brandSearchCountry(brandId);
	if (country === "CA" && config.provider !== "cloro") {
		throw new Error(`Canada tracking requires Cloro. The ${config.provider} target was not called.`);
	}
	return provider.run(config.model, prompt, {
		webSearch: config.webSearch,
		version: config.version,
		...(config.provider === "cloro" ? { country } : {}),
	});
}
