import type { NonNullableUppyContext, UppyContext } from "@uppy/components";
import { getContext } from "svelte";

import { UppyContextKey } from "./UppyContextProvider.svelte";

export function getUppyContext(): NonNullableUppyContext {
	const ctx = getContext<UppyContext>(UppyContextKey);

	if (!ctx?.uppy) {
		throw new Error("Component must be called within a UppyContextProvider");
	}

	return ctx as NonNullableUppyContext; // covered by the if statement above
}
