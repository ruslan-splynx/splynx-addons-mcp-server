interface ConfigJsonParams {
  module_name: string;
  blocks: Array<{
    name: string;
    key: string;
    items: Array<{
      key: string;
      title: string;
      type?: string;
      default_value?: string;
      description?: string;
      relation?: string;
      options?: Record<string, string>;
    }>;
  }>;
  per_partner: boolean;
}

export function generateConfigJson(params: ConfigJsonParams): string {
  const config: Record<string, unknown> = {
    path: params.module_name,
    translate: true,
    blocks: {} as Record<string, unknown>,
  };

  const blocks = config.blocks as Record<string, unknown>;

  for (const block of params.blocks) {
    const items: Record<string, unknown> = {};
    for (const item of block.items) {
      const itemConfig: Record<string, unknown> = {
        title: item.title,
        type: item.type || "string",
      };
      if (item.default_value !== undefined) {
        itemConfig.default = item.default_value;
      }
      if (item.description) {
        itemConfig.description = item.description;
      }
      if (item.relation) {
        itemConfig.relation = item.relation;
      }
      if (item.options) {
        itemConfig.options = item.options;
      }
      items[item.key] = itemConfig;
    }
    blocks[block.key] = {
      title: block.name,
      items,
    };
  }

  if (params.per_partner) {
    (config as Record<string, unknown>).per_partner_options = {
      partner_settings: {
        title: "Partner Settings",
        items: {
          enabled: {
            title: "Enable for this partner",
            type: "boolean",
            default: true,
          },
        },
      },
    };
  }

  const json = JSON.stringify(config, null, 4);

  return `# Generated config.json\n\nFile: \`config/config.json\`\n\n\`\`\`json\n${json}\n\`\`\`\n\n## Reading Config Values\n\n\`\`\`php\nuse splynx\\helpers\\ConfigHelper;\n\n// Get a config value\n$value = ConfigHelper::get('setting_key');\n\n// Get partner-specific config\n$value = ConfigHelper::get('setting_key', $partnerId);\n\`\`\``;
}
