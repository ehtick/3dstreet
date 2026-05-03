/**
 * AIChatTools.js
 *
 * Thin wrapper over the LLM tool registry (`src/editor/lib/commands/
 * registry.js`). The registry is the source of truth — adding a new command
 * with `static llmTool` exposes it here automatically. See #1594.
 */

import {
  dispatchToolCall,
  getGeminiFunctionDeclarations
} from '../../lib/commands/registry.js';

export const entityTools = {
  functionDeclarations: getGeminiFunctionDeclarations()
};

const AIChatTools = {
  executeFunction: async (functionName, args, currentUser) => {
    return await dispatchToolCall(functionName, args, currentUser);
  }
};

export default AIChatTools;
