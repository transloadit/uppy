import { moduleMetadata } from "@storybook/angular";
import { StatusBarDemoComponent } from "./status-bar-demo.component";

export default {
	title: "Status Bar",
	decorators: [
		moduleMetadata({
			declarations: [StatusBarDemoComponent],
		}),
	],
};

export const Default = () => ({
	component: StatusBarDemoComponent,
});
