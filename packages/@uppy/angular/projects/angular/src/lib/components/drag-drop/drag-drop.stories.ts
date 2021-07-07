import { moduleMetadata } from '@storybook/angular';
import { UppyAngularDragDropModule } from './drag-drop.module';
import { DragDropDemoComponent } from './drag-drop-demo.component';

export default {
    title: 'Drag Drop',
    decorators: [
      moduleMetadata({
        imports: [UppyAngularDragDropModule],
        declarations: [DragDropDemoComponent]
      }),
    ]
  };
  
  export const Default = () => ({
    component: DragDropDemoComponent,
  });