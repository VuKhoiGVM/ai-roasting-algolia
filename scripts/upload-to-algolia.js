#!/usr/bin/env node
/**
 * Upload processed startup data to Algolia indices
 * Algolia JavaScript API Client v5 (latest: 5.46.2)
 * Usage: node scripts/upload-to-algolia.js
 *
 * REST API Documentation:
 * - Batch operations: https://www.algolia.com/doc/rest-api/search/batch
 * - Replace all records: https://www.algolia.com/doc/libraries/sdk/methods/search/replace-all-objects
 * - Index settings: https://www.algolia.com/doc/rest-api/search/set-settings
 */

import { algoliasearch } from "algoliasearch";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const DATA_DIR = join(ROOT_DIR, "data", "processed");

// Algolia credentials from environment
const ALGOLIA_APP_ID =
	process.env.ALGOLIA_APPLICATION_ID || process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY =
	process.env.ALGOLIA_ADMIN_API_KEY || process.env.ALGOLIA_API_KEY;

if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY) {
	console.error("❌ Missing Algolia credentials!");
	console.error(
		"Set ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY environment variables.",
	);
	console.error("\nGet your credentials at: https://dashboard.algolia.com/api-keys");
	process.exit(1);
}

// Initialize Algolia client (v5)
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Settings for startups index (v5 syntax)
// Based on: https://www.algolia.com/doc/rest-api/search/set-settings
const STARTUPS_SETTINGS = {
	searchableAttributes: [
		"name",
		"description",
		"long_description",
		"tags",
		"category",
		"sector",
	],
	attributesForFaceting: [
		"category",
		"status",
		"saturation",
		"batch",
		"is_hiring",
		"year_founded",
	],
	ranking: [
		"desc(status:Active)",
		"desc(survival_score)",
		"typo",
		"geo",
		"words",
		"proximity",
		"attribute",
		"exact",
		"custom",
	],
	customRanking: ["desc(survival_score)"],
	attributesToHighlight: ["name", "description"],
	attributesToSnippet: ["description:50", "long_description:100"],
	highlightPreTag: "<mark>",
	highlightPostTag: "</mark>",
	snippetEllipsisText: "…",
};

// Settings for graveyard index (v5 syntax)
const GRAVEYARD_SETTINGS = {
	searchableAttributes: [
		"name",
		"why_they_failed",
		"what_they_did",
		"takeaway",
		"category",
		"sector",
	],
	attributesForFaceting: [
		"category",
		"sector",
		"why_they_failed",
		// Boolean flags for faceting
		"lost_to_giants",
		"competition",
		"poor_market_fit",
		"monetization_failure",
		"execution_flaws",
	],
	ranking: [
		"typo",
		"geo",
		"words",
		"proximity",
		"attribute",
		"exact",
		"custom",
	],
	customRanking: ["desc(raised_amount)"],
	attributesToHighlight: ["name", "why_they_failed", "what_they_did"],
	attributesToSnippet: ["why_they_failed:80", "what_they_did:50"],
	highlightPreTag: "<mark>",
	highlightPostTag: "</mark>",
};

/**
 * Replace all records in an index using replaceAllObjects
 * This is the recommended method for full index replacement:
 * 1. Creates a temporary index
 * 2. Copies settings, synonyms, rules to temp index
 * 3. Adds all records to temp index
 * 4. Replaces original index with temp index
 * 5. Zero downtime for searches!
 *
 * Required ACL: addObject
 * Docs: https://www.algolia.com/doc/libraries/sdk/methods/search/replace-all-objects
 */
async function replaceAllRecords(indexName, records, settings) {
	console.log(`\n📤 Replacing all records in: ${indexName}`);
	console.log(`   Records: ${records.length}`);

	// Use replaceAllObjects for atomic replacement (no search interruption)
	// This automatically handles batching internally (default 1000 per batch)
	const response = await client.replaceAllObjects({
		indexName,
		objects: records,
		batchSize: 1000, // Algolia default, safe for most data sizes
		// Scopes to copy from original index (settings, synonyms, rules)
		scopes: ["settings", "synonyms", "rules"],
	});

	console.log(`   Task IDs: ${response.taskIDs?.length || 1} batch(es)`);
	return response;
}

/**
 * Legacy method: Clear + Configure + Batch Upload
 * Use this if replaceAllObjects fails or for incremental updates
 *
 * REST API endpoints used:
 * - POST /1/indexes/{indexName}/clear (clear all records)
 * - POST /1/indexes/{indexName}/settings (configure settings)
 * - POST /1/indexes/{indexName}/batch (batch upload records)
 */
async function uploadToIndexLegacy(indexName, data, settings) {
	console.log(`\n📤 Uploading to Algolia index: ${indexName} (legacy method)`);
	console.log(`   Records: ${data.length}`);

	// Step 1: Clear existing records
	// REST: POST /1/indexes/{indexName}/clear
	console.log("   Clearing existing records...");
	const clearResponse = await client.clearObjects({ indexName });
	await client.waitForTask({ indexName, taskID: clearResponse.taskID });

	// Step 2: Configure index settings
	// REST: POST /1/indexes/{indexName}/settings
	console.log("   Configuring index settings...");
	const settingsResponse = await client.setSettings({
		indexName,
		settings,
	});
	await client.waitForTask({ indexName, taskID: settingsResponse.taskID });

	// Step 3: Upload data in batches
	// REST: POST /1/indexes/{indexName}/batch
	const BATCH_SIZE = 1000;
	const batches = Math.ceil(data.length / BATCH_SIZE);

	for (let i = 0; i < batches; i++) {
		const batch = data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
		console.log(`   Uploading batch ${i + 1}/${batches} (${batch.length} records)...`);

		const batchResponse = await client.saveObjects({
			indexName,
			objects: batch,
		});
		await client.waitForTask({ indexName, taskID: batchResponse.taskID });
	}

	console.log(`✅ Uploaded ${data.length} records to ${indexName}`);
	return { indexName, count: data.length };
}

/**
 * Configure index settings separately (for first-time setup)
 * REST: POST /1/indexes/{indexName}/settings
 */
async function configureIndex(indexName, settings) {
	console.log(`   Configuring settings for ${indexName}...`);
	const response = await client.setSettings({
		indexName,
		settings,
	});
	return response.taskID;
}

/**
 * Test the Algolia connection
 * REST: GET /1/indexes
 */
async function testConnection() {
	try {
		await client.listIndices();
		return true;
	} catch (error) {
		console.error("\n❌ Connection failed!");
		if (error.message?.includes("unauthorized") || error.message?.includes("Invalid")) {
			console.error("\n💡 Check your Algolia credentials:");
			console.error("   - ALGOLIA_APPLICATION_ID (found in Dashboard > API Keys)");
			console.error("   - ALGOLIA_ADMIN_API_KEY (Admin API Key, NOT the search-only key!)");
		}
		return false;
	}
}

/**
 * Get index stats
 * REST: GET /1/indexes/{indexName}/stats
 */
async function getIndexStats(indexName) {
	try {
		const response = await client.getStats({ indexName });
		return response;
	} catch (error) {
		console.error(`   Warning: Could not get stats for ${indexName}`);
		return null;
	}
}

/**
 * List all indices
 * REST: GET /1/indexes
 */
async function listAllIndices() {
	try {
		const response = await client.listIndices();
		return response.items || [];
	} catch (error) {
		console.error("   Warning: Could not list indices");
		return [];
	}
}

/**
 * Delete an index
 * REST: DELETE /1/indexes/{indexName}
 */
async function deleteIndex(indexName) {
	const response = await client.deleteIndex({ indexName });
	return response.taskID;
}

/**
 * Copy an index (settings, records, synonyms, rules)
 * REST: POST /1/indexes/{sourceIndexName}/operation/copy/{destinationIndexName}
 */
async function copyIndex(sourceIndexName, destinationIndexName) {
	const response = await client.copyIndex({
		sourceIndexName,
		destinationIndexName,
		scopes: ["settings", "synonyms", "rules", "records"],
	});
	return response.taskID;
}

/**
 * Move an index (atomic rename, replaces destination if exists)
 * REST: POST /1/indexes/{sourceIndexName}/operation/move/{destinationIndexName}
 */
async function moveIndex(sourceIndexName, destinationIndexName) {
	const response = await client.moveIndex({
		sourceIndexName,
		destinationIndexName,
	});
	return response.taskID;
}

/**
 * Main upload function
 */
async function main() {
	console.log("🔥 Startup Roast - Algolia Upload (v5 API)");
	console.log("===========================================");

	// Test connection first
	console.log("\n🔌 Testing Algolia connection...");
	const connected = await testConnection();
	if (!connected) {
		process.exit(1);
	}
	console.log("✅ Connection successful!");

	try {
		// List existing indices
		console.log("\n📋 Existing indices:");
		const existingIndices = await listAllIndices();
		if (existingIndices.length > 0) {
			existingIndices.forEach((idx) => {
				console.log(`   - ${idx.name} (${idx.entries || 0} records)`);
			});
		} else {
			console.log("   (none)");
		}

		// Load processed data
		console.log("\n📂 Loading processed data...");
		const startups = JSON.parse(
			readFileSync(join(DATA_DIR, "startups.json"), "utf8"),
		);
		const graveyard = JSON.parse(
			readFileSync(join(DATA_DIR, "graveyard.json"), "utf8"),
		);

		console.log(`   Startups: ${startups.length}`);
		console.log(`   Graveyard: ${graveyard.length}`);

		// First, configure settings for new indices (if they don't exist)
		const needsConfig = [];
		for (const [indexName, settings] of [
			["startups", STARTUPS_SETTINGS],
			["graveyard", GRAVEYARD_SETTINGS],
		]) {
			const exists = existingIndices.some((idx) => idx.name === indexName);
			if (!exists) {
				console.log(`\n⚙️ First-time setup for ${indexName}...`);
				const taskID = await configureIndex(indexName, settings);
				await client.waitForTask({ indexName, taskID });
				console.log(`   ✅ ${indexName} configured`);
			}
		}

		// Replace all records using replaceAllRecords (recommended)
		console.log("\n🔄 Replacing all records (zero-downtime method)...");
		const results = await Promise.all([
			replaceAllRecords("startups", startups, STARTUPS_SETTINGS),
			replaceAllRecords("graveyard", graveyard, GRAVEYARD_SETTINGS),
		]);

		// Wait for all tasks to complete
		console.log("\n⏳ Waiting for indexing to complete...");
		for (const [indexName, records] of [
			["startups", startups],
			["graveyard", graveyard],
		]) {
			const result = results.find((r) =>
				r.updatedObjectName === indexName || r.objectID === indexName
			);
			if (result?.taskIDs) {
				// Wait for the last task (temp index replacement)
				const lastTaskID = result.taskIDs[result.taskIDs.length - 1];
				// Note: taskIDs are for the temp index, but we wait on the main index
				// The actual replacement happens after all batches complete
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}

		// Summary
		console.log("\n✅ Upload complete!");
		console.log("\n📊 Summary:");
		console.log(`   startups: ${startups.length} records`);
		console.log(`   graveyard: ${graveyard.length} records`);

		console.log(`\n🔗 View your indices:`);
		console.log(`   https://dashboard.algolia.com/${ALGOLIA_APP_ID}/indices`);

		// Verify with stats
		console.log("\n📈 Verifying upload...");
		for (const indexName of ["startups", "graveyard"]) {
			const stats = await getIndexStats(indexName);
			if (stats) {
				console.log(`   ${indexName}: ${stats.entries || 0} records indexed`);
			}
		}

		// Test search
		console.log("\n🔍 Testing search...");
		const { results: searchResults } = await client.search({
			requests: [
				{ indexName: "startups", query: "", hitsPerPage: 1 },
				{ indexName: "graveyard", query: "", hitsPerPage: 1 },
			],
		});

		searchResults.forEach((result, i) => {
			const indexName = ["startups", "graveyard"][i];
			if (result?.hits) {
				console.log(`   ✅ ${indexName}: ${result.nbHits} records searchable`);
			}
		});

		console.log("\n🎉 All done! Your indices are ready.");

	} catch (error) {
		console.error("\n❌ Upload failed:", error.message);
		console.error(error);

		// Fallback suggestion
		if (error.message?.includes("replaceAllObjects")) {
			console.error("\n💡 Try using the legacy method instead.");
		}
		process.exit(1);
	}
}

main();
