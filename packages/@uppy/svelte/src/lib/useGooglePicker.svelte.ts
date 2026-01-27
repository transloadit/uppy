import {
  createGooglePickerController,
  createGooglePickerPluginAdapter,
  type GooglePickerOptions,
} from '@uppy/components';
import { onDestroy, onMount } from "svelte";
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
	pickerType,
	storage,
}: Pick<GooglePickerOptions, 'pickerType' | 'storage'>): SvelteGooglePickerSnapshot {
	const ctx = getUppyContext();

	const { store, opts } = createGooglePickerPluginAdapter(ctx.uppy, pickerType)

	const { subscribe, getSnapshot } = store;

	const {
		reset,
		init,
		show,
		logout,
	} = createGooglePickerController({
		uppy: ctx.uppy,
		pickerType,
		store,
		storage,
		...opts,
	});

	const state = useExternalStore<GooglePickerSnapshot>(getSnapshot, subscribe);

	onMount(() => {
		init()
	});

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
