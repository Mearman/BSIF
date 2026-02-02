// BSIF Reference Implementation - Registry Server (Minimal)
// Uses Node.js built-in http module, no external dependencies

import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { FileStorage } from "./storage.js";
import type { RegistryEntry } from "./types.js";
import { parseContent } from "../parser.js";
import { validate } from "../validator.js";

export interface RegistryServerOptions {
	readonly port?: number;
	readonly host?: string;
	readonly storagePath: string;
}

export class RegistryServer {
	private server: Server | null = null;
	private readonly storage: FileStorage;
	private readonly port: number;
	private readonly host: string;

	constructor(options: RegistryServerOptions) {
		this.storage = new FileStorage(options.storagePath);
		this.port = options.port ?? 8642;
		this.host = options.host ?? "127.0.0.1";
	}

	async start(): Promise<{ port: number; host: string }> {
		await this.storage.init();

		return new Promise((resolve, reject) => {
			this.server = createServer((req, res) => {
				void this.handleRequest(req, res);
			});
			this.server.on("error", reject);
			this.server.listen(this.port, this.host, () => {
				resolve({ port: this.port, host: this.host });
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.server) {
				resolve();
				return;
			}
			this.server.close(() => {
				this.server = null;
				resolve();
			});
		});
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? "/", `http://${this.host}:${this.port}`);
		const method = req.method ?? "GET";

		try {
			// POST /specs — publish a spec
			if (method === "POST" && url.pathname === "/specs") {
				await this.handlePublish(req, res);
				return;
			}

			// GET /specs/:name/versions — list versions
			const versionsMatch = /^\/specs\/([^/]+)\/versions$/.exec(url.pathname);
			if (method === "GET" && versionsMatch && versionsMatch[1]) {
				await this.handleVersions(versionsMatch[1], res);
				return;
			}

			// GET /specs/:name/:version — fetch specific version
			const versionMatch = /^\/specs\/([^/]+)\/([^/]+)$/.exec(url.pathname);
			if (method === "GET" && versionMatch && versionMatch[1] && versionMatch[2]) {
				await this.handleFetch(versionMatch[1], versionMatch[2], res);
				return;
			}

			// GET /specs/:name — fetch latest
			const nameMatch = /^\/specs\/([^/]+)$/.exec(url.pathname);
			if (method === "GET" && nameMatch && nameMatch[1]) {
				await this.handleFetch(nameMatch[1], undefined, res);
				return;
			}

			// GET /search?q=... — search
			if (method === "GET" && url.pathname === "/search") {
				const query = url.searchParams.get("q") ?? "";
				await this.handleSearch(query, res);
				return;
			}

			sendJson(res, 404, { error: "Not found" });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			sendJson(res, 500, { error: message });
		}
	}

	private async handlePublish(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const body = await readBody(req);
		if (!body) {
			sendJson(res, 400, { error: "Empty body" });
			return;
		}

		let doc;
		try {
			doc = parseContent(body, "upload.json");
		} catch {
			sendJson(res, 400, { error: "Invalid BSIF document" });
			return;
		}

		const result = validate(doc);
		if (!result.valid) {
			sendJson(res, 400, { error: "Validation failed", details: result.errors });
			return;
		}

		const entry: RegistryEntry = {
			name: doc.metadata.name,
			version: doc.metadata.version ?? "0.0.0",
			publishedAt: new Date().toISOString(),
			...(doc.metadata.description !== undefined ? { description: doc.metadata.description } : {}),
			...(doc.metadata.author !== undefined ? { author: doc.metadata.author } : {}),
		};

		await this.storage.store(doc.metadata.name, entry.version, body, entry);
		sendJson(res, 201, { name: entry.name, version: entry.version });
	}

	private async handleFetch(name: string, version: string | undefined, res: ServerResponse): Promise<void> {
		const content = await this.storage.fetch(decodeURIComponent(name), version ? decodeURIComponent(version) : undefined);
		if (!content) {
			sendJson(res, 404, { error: `Spec not found: ${name}${version ? `@${version}` : ""}` });
			return;
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(content);
	}

	private async handleVersions(name: string, res: ServerResponse): Promise<void> {
		const versions = await this.storage.versions(decodeURIComponent(name));
		sendJson(res, 200, versions);
	}

	private async handleSearch(query: string, res: ServerResponse): Promise<void> {
		const result = await this.storage.search(query);
		sendJson(res, 200, result);
	}
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string | null> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => {
			const body = Buffer.concat(chunks).toString("utf-8");
			resolve(body || null);
		});
		req.on("error", reject);
	});
}
