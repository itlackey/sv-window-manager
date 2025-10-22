import { SashConfig } from '../config/sash-config.js';
import { ConfigRoot } from '../config/config-root.js';
import { strictAssign } from '../utils.js';
import paneModule from './pane.js';
import mainModule from './main.js';
import muntinModule from './muntin.js';
import fitContainerModule from './fit-container.js';
import resizableModule from './resizable.js';
import droppableModule from './droppable.js';

const DEBUG = import.meta.env.VITE_DEBUG == 'true' ? true : false;

/**
 * @think-about:
 *   1. if we need to immediately update the frame size
 *      when `fitContainer` is set true or false
 *   2. add a `fit` method to fit the frame to the container
 *
 */
export class Frame {
  windowElement = null;
  containerElement = null;
  debug = DEBUG;

  constructor(settings) {
    let config = null;

    if (settings instanceof SashConfig) {
      config = settings;
      this.rootSash = settings;
    }
    else {
      config = new ConfigRoot(settings);
      this.rootSash = config.buildSashTree({ resizeStrategy: config.resizeStrategy });
    }

    this.fitContainer = config.fitContainer;
  }

  frame(containerEl) {
    this.containerElement = containerEl;

    this.windowElement = this.createWindow();
    this.glaze();
    this.containerElement.append(this.windowElement);
  }

  // Features can work independently to each other
  enableFeatures() {
    this.enableResize();
    this.enableDrop();
    this.fitContainer && this.enableFitContainer();
  }

  mount(containerEl) {
    this.frame(containerEl);
    this.enableFeatures();
  }

  static assemble(...modules) {
    modules.forEach((module) => {
      strictAssign(this.prototype, module);
    });
  }
}

Frame.assemble(
  mainModule,
  muntinModule,
  paneModule,
  fitContainerModule,
  droppableModule,
  resizableModule
);
