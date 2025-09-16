import '@testing-library/jest-dom';

// matchMedia polyfill for components using it (if any)
if (typeof window !== 'undefined' && !window.matchMedia) {
	// @ts-ignore
	window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
}

// Canvas getContext stub for qrcode / canvas usage in tests to avoid jsdom warnings
if (typeof HTMLCanvasElement !== 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(HTMLCanvasElement.prototype as any).getContext = function () { return {
		// minimal mock surface the qrcode library might touch
		fillRect: () => {},
		clearRect: () => {},
		getImageData: () => ({ data: [] }),
		putImageData: () => {},
		createImageData: () => [],
		setTransform: () => {},
		drawImage: () => {},
		save: () => {},
		fillText: () => {},
		restore: () => {},
		beginPath: () => {},
		moveTo: () => {},
		lineTo: () => {},
		closePath: () => {},
		stroke: () => {},
		translate: () => {},
		scale: () => {},
		rotate: () => {},
		arc: () => {},
		fill: () => {},
		measureText: () => ({ width: 0 }),
		transform: () => {},
		rect: () => {},
		clip: () => {},
	}; };
}
