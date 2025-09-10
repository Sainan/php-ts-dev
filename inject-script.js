(() => {
	const ws = new WebSocket("/php-ts-dev-ws");
	ws.onmessage = () => {
		location.reload();
	};
})();
