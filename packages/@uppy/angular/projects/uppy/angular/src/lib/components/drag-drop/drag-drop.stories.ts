import { moduleMetadata } from '@storybook/angular';
import { DragDropDemoComponent } from './drag-drop-demo.component';

export default {
    title: 'Drag Drop',
    decorators: [
      moduleMetadata({
        declarations: [DragDropDemoComponent]
      }),
    ]
  };

  export const Default = () => ({
    component: DragDropDemoComponent,
  });
