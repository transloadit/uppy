import { useEffect, useState } from 'react';

const TTL = 6 * 60 * 60 * 1000; // 6h — these numbers barely move, rate limits do.

type Options<T> = {
	/** Cache key, unique per metric. */
	key: string;
	url: string;
	/** Pulls the number out of the response body. */
	select: (data: T) => number | undefined;
	/**
	 * Rendered on the server and on first paint so nothing resizes under the
	 * cursor, and so the page still reads correctly if the API is unreachable.
	 */
	fallback: number;
};

function readCache(key: string): number | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const { value, at } = JSON.parse(raw);
		return Date.now() - at < TTL ? value : null;
	} catch {
		return null;
	}
}

export default function useLiveCount<T>({
	key,
	url,
	select,
	fallback,
}: Options<T>): number {
	const [count, setCount] = useState(fallback);

	useEffect(() => {
		const cached = readCache(key);
		if (cached) {
			setCount(cached);
			return;
		}

		const controller = new AbortController();
		fetch(url, { signal: controller.signal })
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then((data) => {
				const value = select(data);
				if (typeof value !== 'number') return;
				setCount(value);
				try {
					localStorage.setItem(key, JSON.stringify({ value, at: Date.now() }));
				} catch {
					// Private mode or quota — the fallback is good enough.
				}
			})
			.catch(() => {
				// Rate limited or offline: keep the fallback.
			});

		return () => controller.abort();
	}, [key, url]);

	return count;
}

/** 30891 → "30.9k", 1108622 → "1.1M". */
export function compact(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	return String(value);
}
