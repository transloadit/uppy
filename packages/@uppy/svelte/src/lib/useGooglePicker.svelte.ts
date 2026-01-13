import {
	createGooglePickerController,
	type GooglePickerOptions,
} from "@uppy/components";
import { onDestroy } from "svelte";
import { getUppyContext } from "./components/headless/uppyContext.js";
import { useExternalStore } from "./useSyncExternalStore.svelte.js";

type GooglePickerSnapshot = {
	loading: boolean;
	accessToken: string | null | undefined;
};

type SvelteGooglePickerSnapshot = GooglePickerSnapshot & {
	show: () => Promise<void>;
	logout: () => Promise<void>;
};

export function useGooglePicker({
	requestClientId,
	companionUrl,
	companionHeaders,
	companionCookiesRule,
	pickerType,
	clientId,
	apiKey,
	appId,
}: GooglePickerOptions): SvelteGooglePickerSnapshot {
	const ctx = getUppyContext();

	const {
		store: { subscribe, getSnapshot },
		reset,
		show,
		logout,
	} = createGooglePickerController({
		uppy: ctx.uppy,
		requestClientId,
		companionUrl,
		companionHeaders,
		companionCookiesRule,
		pickerType,
		clientId,
		apiKey,
		appId,
	});

	const state = useExternalStore<GooglePickerSnapshot>(getSnapshot, subscribe);

	onDestroy(() => {
		reset();
	});

	// Using getters like this was the only way to maintain reactivity
	return {
		get loading() {
			return state.value.loading;
		},
		get accessToken() {
			return state.value.accessToken;
		},
		show,
		logout,
	};
}
