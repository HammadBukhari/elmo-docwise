import { getProvider, type ModelConfig } from "@workspace/lib/providers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { brandSearchCountry, readBrandSearchCountries, runBrandTarget } from "./brand-search-country";

const chatgpt: ModelConfig = { model: "chatgpt", provider: "cloro", webSearch: true };
const overview: ModelConfig = { model: "google-ai-overview", provider: "cloro", webSearch: true };

beforeEach(() => {
	vi.stubEnv("BRAND_SEARCH_COUNTRIES", "");
	vi.stubEnv("CLORO_API_KEY", "test-key");
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	vi.useRealTimers();
});

function mockCloro() {
	vi.useFakeTimers();
	const requests: { taskType: string; payload: { country: string; prompt?: string; query?: string } }[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (_url: string, init?: RequestInit) => {
			if (init?.method === "POST") {
				requests.push(JSON.parse(String(init.body)));
				return Response.json({ task: { id: `task-${requests.length}`, status: "QUEUED" } });
			}
			return Response.json({
				task: { status: "COMPLETED" },
				response: { text: "Example answer", aioverview: { text: "Example answer" } },
			});
		}),
	);
	return requests;
}

describe("brand search country", () => {
	it("uses the UK when no brand override is set", () => {
		expect(brandSearchCountry("brand-one")).toBe("GB");
		expect(brandSearchCountry("toString")).toBe("GB");
	});

	it("matches the exact brand ID and keeps all other brands in the UK", () => {
		vi.stubEnv("BRAND_SEARCH_COUNTRIES", '{"brand-one":"CA","brand-two":"GB"}');
		expect(brandSearchCountry("brand-one")).toBe("CA");
		expect(brandSearchCountry("brand-two")).toBe("GB");
		expect(brandSearchCountry("brand-one-new")).toBe("GB");
	});

	it.each([
		"{",
		"null",
		"[]",
		'"CA"',
		"1",
		'{"brand-one":null}',
		'{"brand-one":"US"}',
		'{"brand-one":"ca"}',
		'{"":"CA"}',
		'{" brand-one":"CA"}',
	])("rejects invalid country settings: %s", (raw) => {
		expect(() => readBrandSearchCountries(raw)).toThrow("BRAND_SEARCH_COUNTRIES");
	});

	it("sends UK requests for both tracking engines when no override is set", async () => {
		const requests = mockCloro();
		const calls = Promise.all(
			[chatgpt, overview].map((target) =>
				runBrandTarget("brand-one", "Example question", target, getProvider(target.provider)),
			),
		);
		await vi.runAllTimersAsync();
		await calls;
		expect(requests.map((request) => request.payload.country)).toEqual(["GB", "GB"]);
	});

	it("sends Canada for every prompt of the selected brand while other brands run in the UK", async () => {
		vi.stubEnv("BRAND_SEARCH_COUNTRIES", '{"brand-canada":"CA"}');
		const requests = mockCloro();
		const calls = Promise.all(
			["brand-canada", "brand-uk"].flatMap((brandId) =>
				["First question", "Next question"].flatMap((prompt) =>
					[chatgpt, overview].map((target) =>
						runBrandTarget(brandId, `${brandId}: ${prompt}`, target, getProvider(target.provider)),
					),
				),
			),
		);
		await vi.runAllTimersAsync();
		await calls;
		expect(requests).toHaveLength(8);
		for (const request of requests) {
			const question = request.payload.prompt ?? request.payload.query;
			expect(request.payload.country).toBe(question?.startsWith("brand-canada:") ? "CA" : "GB");
		}
		expect(requests.filter((request) => request.taskType === "CHATGPT")).toHaveLength(4);
		expect(requests.filter((request) => request.taskType === "GOOGLE")).toHaveLength(4);
	});

	it("rejects an unsupported Canada provider before it sends a request", async () => {
		vi.stubEnv("BRAND_SEARCH_COUNTRIES", '{"brand-canada":"CA"}');
		const provider = getProvider("openrouter");
		const run = vi.spyOn(provider, "run");
		await expect(
			runBrandTarget("brand-canada", "Example question", { ...chatgpt, provider: "openrouter" }, provider),
		).rejects.toThrow("Canada tracking requires Cloro");
		expect(run).not.toHaveBeenCalled();
	});

	it("keeps the configured target options for UK brands on other providers", async () => {
		const provider = getProvider("openrouter");
		const run = vi.spyOn(provider, "run").mockResolvedValue({ rawOutput: {}, webQueries: [] });
		const config = { ...chatgpt, provider: "openrouter", version: "example/model" };
		await runBrandTarget("brand-uk", "Example question", config, provider);
		expect(run).toHaveBeenCalledWith("chatgpt", "Example question", {
			webSearch: true,
			version: "example/model",
		});
	});
});
