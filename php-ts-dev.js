#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const chokidar = require("chokidar");
const { WebSocketServer } = require("ws");

// CLI arguments
let proxyPort = 8080;
let dirs = ".";
for (let i = 2; i < process.argv.length; ) {
	switch (process.argv[i++]) {
		case "--port":
			proxyPort = parseInt(process.argv[i++]);
			break;

		case "--dirs":
			dirs = process.argv[i++];
			break;
	}
}

// Global state
let wsServer;

// Initial compile
spawn("npm exec -- tsc --watch" /* --preserveWatchOutput */, {
	shell: true,
	stdio: "inherit",
}).on("exit", (code) => {
	process.exit(code);
});

// Start PHP dev server on a free port
const getFreePort = () => {
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.listen(0, () => {
			const { port } = server.address();
			server.close(() => resolve(port));
		});
		server.on("error", reject);
	});
};
getFreePort().then((phpPort) => {
	spawn("php", ["-S", `127.0.0.1:${phpPort}`], { stdio: "inherit" });

	// Proxy requests to it
	const injectScript = fs.readFileSync(
		path.join(__dirname, "inject-script.js"),
		"utf8",
	);
	const server = http.createServer((req, res) => {
		const options = {
			hostname: "127.0.0.1",
			port: phpPort,
			path: req.url,
			method: req.method,
			headers: req.headers,
		};
		const proxy = http.request(options, (phpRes) => {
			res.writeHead(phpRes.statusCode, phpRes.headers);
			if ((phpRes.headers["content-type"] || "").includes("text/html")) {
				res.write(`<script>${injectScript}</script>`);
			}
			phpRes.pipe(res, { end: true });
		});
		req.pipe(proxy, { end: true });
		proxy.on("error", (err) => {
			console.error("Proxy error:", err);
			res.writeHead(502);
			res.end("Bad Gateway");
		});
	});
	server.listen(proxyPort, () => {
		//console.log(`Proxy server running at http://127.0.0.1:${proxyPort}`);

		wsServer = new WebSocketServer({ server: server });
	});
});

chokidar.watch(dirs).on("change", (changedFile) => {
	changedFile = changedFile.split("\\").join("/");
	if (
		!changedFile.endsWith(".ts") &&
		!changedFile.startsWith(".") && // ignore top-level Git index changes
		!changedFile.includes("/.") // ignore nested Git index changes
	) {
		console.log(`Change to ${changedFile} detected`);
		if (wsServer) {
			for (const client of wsServer.clients) {
				client.send("");
			}
		}
	}
});
