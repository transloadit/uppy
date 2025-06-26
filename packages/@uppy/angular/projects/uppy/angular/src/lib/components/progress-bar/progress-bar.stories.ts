import { CommonModule } from "@angular/common";
import { moduleMetadata } from "@storybook/angular";
import { ProgressBarDemoComponent } from "./progress-bar-demo.component";

export default {
	title: "Progress Bar",
	decorators: [
		moduleMetadata({
			imports: [CommonModule],
			declarations: [ProgressBarDemoComponent],
		}),
	],
};

export const Default = () => ({
	component: ProgressBarDemoComponent,
});
