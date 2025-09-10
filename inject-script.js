(() => {
	const startPing = () => {
		const interval = setInterval(() => {
			fetch(`/php-ts-dev-ping?${Date.now()}`, { cache: "no-store" })
				.then((res) => {
					if (res.status < 500) {
						clearInterval(interval);
						location.reload();
					}
				})
				.catch(() => {});
		}, 1000);
	};

	const ws = new WebSocket("/php-ts-dev-ws");
	ws.onmessage = () => {
		location.reload();
	};
	ws.onclose = startPing;
	ws.onerror = startPing;
})();
