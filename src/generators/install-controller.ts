interface InstallControllerParams {
  addon_name: string;
  module_name: string;
  min_splynx_version: string;
  api_permissions: Array<{ controller: string; actions?: string[] }>;
  entry_points: Array<{
    name: string;
    title: string;
    root: string;
    place?: string;
    type?: string;
    url: string;
    icon?: string;
  }>;
  hook_events: string[];
  additional_fields: Array<{
    main_module: string;
    name: string;
    title: string;
    type?: string;
    required?: boolean;
  }>;
  include_payment_accounts: boolean;
}

export function generateInstallController(
  params: InstallControllerParams
): string {
  const slug = params.module_name.replace(/_/g, "-");
  const needsYii = params.include_payment_accounts;

  let code = `<?php

namespace app\\commands;

use splynx\\base\\BaseInstallController;${needsYii ? "\nuse Yii;" : ""}

/**
 * Class InstallController
 * @package app\\commands
 */
class InstallController extends BaseInstallController
{
    /**
     * @inheritdoc
     */
    public $module_status = self::MODULE_STATUS_ENABLED;

    /**
     * @inheritdoc
     */
    public static $minimumSplynxVersion = '${params.min_splynx_version}';

    /**
     * @inheritdoc
     */
    public function getAddOnTitle(): string
    {
        return '${params.addon_name}';
    }

    /**
     * @inheritdoc
     */
    public function getModuleName(): string
    {
        return '${params.module_name}';
    }
`;

  // API Permissions
  if (params.api_permissions.length > 0) {
    code += `
    /**
     * @inheritdoc
     */
    public function getApiPermissions(): array
    {
        return [
`;
    for (const perm of params.api_permissions) {
      if (perm.actions && perm.actions.length > 0) {
        const actionsStr = perm.actions.map((a) => `'${a}'`).join(", ");
        code += `            [
                'controller' => '${perm.controller}',
                'actions' => [${actionsStr}],
            ],\n`;
      } else {
        code += `            [
                'controller' => '${perm.controller}',
            ],\n`;
      }
    }
    code += `        ];
    }
`;
  }

  // Entry Points
  if (params.entry_points.length > 0) {
    code += `
    /**
     * @inheritdoc
     */
    public function getEntryPoints(): array
    {
        return [
`;
    for (const ep of params.entry_points) {
      code += `            [
                'name' => '${ep.name}',
                'title' => '${ep.title}',
                'root' => '${ep.root}',
                'place' => '${ep.place || "admin"}',
                'type' => '${ep.type || "menu_link"}',
                'url' => '${ep.url}',
                'icon' => '${ep.icon || "fa-puzzle-piece"}',
            ],\n`;
    }
    code += `        ];
    }
`;
  }

  // Hooks
  if (params.hook_events.length > 0) {
    const eventsStr = params.hook_events
      .map((e) => `                    '${e}' => true,`)
      .join("\n");
    code += `
    /**
     * @inheritdoc
     */
    public function getHooks(): array
    {
        return [
            [
                'title' => $this->getAddOnTitle(),
                'type' => 'cli',
                'path' => '/var/www/splynx/addons/splynx-addon-${slug}/yii hook/process',
                'enabled' => true,
                'events' => [
${eventsStr}
                ],
            ],
        ];
    }
`;
  }

  // Additional Fields
  if (params.additional_fields.length > 0) {
    code += `
    /**
     * @inheritdoc
     */
    public function getAdditionalFields(): array
    {
        return [
`;
    for (const field of params.additional_fields) {
      code += `            [
                'main_module' => '${field.main_module}',
                'name' => '${field.name}',
                'title' => '${field.title}',
                'type' => '${field.type || "string"}',
                'required' => ${field.required ? "true" : "false"},
                'show_in_list' => true,
            ],\n`;
    }
    code += `        ];
    }
`;
  }

  // Payment Accounts
  if (params.include_payment_accounts) {
    code += `
    /**
     * @inheritdoc
     */
    public function getPaymentAccounts(): array
    {
        return [
            'title' => Yii::t('app', '${params.addon_name}'),
            'field_1' => Yii::t('app', 'Account ID'),
            'field_2' => Yii::t('app', 'Payment Token'),
            'field_3' => Yii::t('app', 'Last 4 digits'),
            'field_4' => Yii::t('app', 'Cardholder Name'),
            'field_5' => Yii::t('app', 'Expiry Date'),
        ];
    }
`;
  }

  code += `}\n`;

  return `# Generated InstallController.php\n\nFile: \`commands/InstallController.php\`\n\n\`\`\`php\n${code}\`\`\``;
}
