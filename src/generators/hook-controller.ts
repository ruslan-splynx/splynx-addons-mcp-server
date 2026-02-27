interface HookControllerParams {
  events: Array<{
    event: string;
    handler_description: string;
  }>;
  addon_path: string;
}

export function generateHookController(params: HookControllerParams): string {
  let switchCases = "";
  let handlerMethods = "";

  for (const event of params.events) {
    const parts = event.event.split("/");
    const methodName =
      "on" +
      parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");

    switchCases += `            case '${event.event}':
                $this->${methodName}($attributes, $oldAttributes);
                break;\n`;

    handlerMethods += `
    /**
     * ${event.handler_description}
     */
    private function ${methodName}(array $attributes, array $oldAttributes): void
    {
        // TODO: Implement - ${event.handler_description}
    }
`;
  }

  const code = `<?php

namespace app\\commands;

use yii\\console\\Controller;

/**
 * Class HookController
 * Processes incoming hook events from Splynx via STDIN.
 * @package app\\commands
 */
class HookController extends Controller
{
    /**
     * Process incoming hook events.
     * Splynx sends event data as a JSON string via STDIN.
     */
    public function actionProcess(): void
    {
        defined('STDIN') or define('STDIN', fopen('php://stdin', 'r'));

        $input = fgets(STDIN);
        $data = json_decode($input, true);

        if (!$data) {
            return;
        }

        $model = $data['model'] ?? '';
        $action = $data['action'] ?? '';
        $attributes = $data['attributes'] ?? [];
        $oldAttributes = $data['old_attributes'] ?? [];

        $event = "$model/$action";

        switch ($event) {
${switchCases}            default:
                // Unhandled event
                break;
        }
    }
${handlerMethods}}
`;

  let hookConfig = `\n## InstallController Hook Configuration\n\nAdd this to your \`commands/InstallController.php\`:\n\n\`\`\`php\npublic function getHooks(): array\n{\n    return [\n        [\n            'title' => $this->getAddOnTitle(),\n            'type' => 'cli',\n            'path' => '${params.addon_path}/yii hook/process',\n            'enabled' => true,\n            'events' => [\n`;

  for (const event of params.events) {
    hookConfig += `                '${event.event}' => true,\n`;
  }

  hookConfig += `            ],\n        ],\n    ];\n}\n\`\`\``;

  return `# Generated HookController.php\n\nFile: \`commands/HookController.php\`\n\n\`\`\`php\n${code}\`\`\`\n${hookConfig}`;
}
