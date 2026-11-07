# Docwise Fork Features

## Search Country by Brand

This feature sets the search country for all tracked prompts of a brand. The worker uses the permanent brand ID. A change to the brand name or URL does not change the country setting.

| Setting | Search country |
| --- | --- |
| No override | United Kingdom (`GB`) |
| `GB` | United Kingdom |
| `CA` | Canada |

Canada tracking uses Cloro. This includes the configured ChatGPT and Google AI Overview targets. If a Canada brand has a target from another provider, that target fails before it sends a request. It does not collect a result from another country.

### Configuration

Set `BRAND_SEARCH_COUNTRIES` in Dokploy Environment. Use a JSON object with brand IDs as keys:

```dotenv
BRAND_SEARCH_COUNTRIES={"example-brand-id":"CA"}
```

All other brands use the UK. Use an empty value or `{}` to keep every brand in the UK. Only `GB` and `CA` are accepted. The worker rejects invalid JSON, invalid country codes, and brand IDs with surrounding spaces at startup.

To start Canada tracking:

1. Add the new brand and keep tracking disabled.
2. Get its permanent ID from the `brands` table. Use the ID, not the display name, URL, or organization ID.
3. Add the ID with value `CA` to `BRAND_SEARCH_COUNTRIES`. Keep any other overrides in the same JSON object.
4. Deploy the service to apply the setting.
5. Check the worker logs, then enable tracking for the brand.

Set the country before the first tracking run. A country change applies to future runs. It does not replace saved results. The results do not have a separate country field, so use a separate brand when you need to keep two countries apart.

The worker sends each prompt as written. This feature has no language selector. It does not change one-off reports or onboarding research.

### Verification and Maintenance

The worker tests check UK defaults and exact brand ID matching. They check Canada requests for both tracking engines and concurrent UK and Canada requests. They also check rejection of invalid settings and unsupported providers. The HTTP tests use a local substitute for Cloro and do not use paid credits.

Before you enable a target for Canada, confirm that `CA` is in Cloro's model-specific [country list](https://cloro.dev/docs/api-reference/endpoint/countries). Coverage can differ by engine.

This is a local fork feature. Keep it when you merge upstream `main`. Recheck the worker dispatch and Cloro request tests after an upstream provider change. No database migration is required for this feature.
