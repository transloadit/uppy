import { moduleMetadata } from "@storybook/angular";
import { DashboardModalDemoComponent } from "./dashboard-modal-demo.component";

export default {
	title: "Dashboard",
	decorators: [
		moduleMetadata({
			declarations: [DashboardModalDemoComponent],
		}),
	],
};

export const Default = () => ({
	component: DashboardModalDemoComponent,
});
