import { Command } from '../command.js';
import useStore from '@/store';

/**
 * Updates the scene title in Zustand. Captured in history so undo restores
 * the previous title.
 *
 * payload: { value, name? }
 */
export class SceneTitleCommand extends Command {
  static llmTool = {
    name: 'updateSceneTitle',
    description: 'Update the scene title in the global state',
    inputSchema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          description: 'The new scene title'
        }
      },
      required: ['value']
    }
  };

  constructor(editor, payload) {
    super(editor);

    this.type = 'scenetitle';
    this.name = payload.name || 'Update Scene Title';
    this.updatable = false;

    this.newValue = payload.value;
    this.oldValue = useStore.getState().sceneTitle;
  }

  execute(nextCommandCallback) {
    useStore.getState().setSceneTitle(this.newValue);
    nextCommandCallback?.();
  }

  undo(nextCommandCallback) {
    useStore.getState().setSceneTitle(this.oldValue);
    nextCommandCallback?.();
  }
}
