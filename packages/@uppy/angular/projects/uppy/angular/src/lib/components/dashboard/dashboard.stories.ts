import { moduleMetadata } from "@storybook/angular";
import { DashboardDemoComponent } from "./dashboard-demo.component";

export default {
	title: "Dashboard",
	decorators: [
		moduleMetadata({
			declarations: [DashboardDemoComponent],
		}),
	],
};

export const Default = () => ({
	component: DashboardDemoComponent,
});
