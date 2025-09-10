(() => {
	const ping = () => {
		fetch(`/php-ts-dev-ping?${Date.now()}`, { cache: "no-store" })
			.then((res) => {
				if (res.status < 500) {
					location.reload();
				} else {
					setTimeout(ping, 1000);
				}
			})
			.catch(() => {
				setTimeout(ping, 1000);
			});
	};

	const ws = new WebSocket("/php-ts-dev-ws");
	ws.onmessage = () => {
		location.reload();
	};
	ws.onclose = ping;
})();
