interface ModelParams {
  name: string;
  namespace: string;
  type: "api" | "activerecord" | "sqlite" | "dataset";
  base_class?: string;
  table_name?: string;
  module_name?: string;
  attributes: Array<{ name: string; type?: string; required?: boolean }>;
  methods: Array<{ name: string; description: string; return_type?: string }>;
}

export function generateModel(params: ModelParams): string {
  let code = `<?php

namespace ${params.namespace};

`;

  switch (params.type) {
    case "api": {
      const baseClass =
        params.base_class || "BaseCustomer";
      const importPath =
        baseClass === "BaseCustomer"
          ? "splynx\\v2\\models\\customer\\BaseCustomer"
          : baseClass === "BaseActiveApi"
            ? "splynx\\v2\\base\\BaseActiveApi"
            : `splynx\\base\\${baseClass}`;

      code += `use ${importPath};

/**
 * Class ${params.name}
 * @package ${params.namespace}
 */
class ${params.name} extends ${baseClass}
{
`;
      // Custom methods
      for (const method of params.methods) {
        code += `    /**
     * ${method.description}
     */
    public function ${method.name}(): ${method.return_type || "void"}
    {
        // TODO: Implement ${method.name}
    }

`;
      }
      break;
    }

    case "activerecord": {
      code += `use yii\\db\\ActiveRecord;

/**
 * Class ${params.name}
 * @package ${params.namespace}
 */
class ${params.name} extends ActiveRecord
{
    /**
     * @inheritdoc
     */
    public static function tableName(): string
    {
        return '{{%${params.table_name || params.name.toLowerCase()}}}';
    }

    /**
     * @inheritdoc
     */
    public function rules(): array
    {
        return [
`;
      const required = params.attributes.filter((a) => a.required);
      if (required.length > 0) {
        const reqNames = required.map((a) => `'${a.name}'`).join(", ");
        code += `            [[${reqNames}], 'required'],\n`;
      }
      for (const attr of params.attributes) {
        if (attr.type === "string") {
          code += `            [['${attr.name}'], 'string', 'max' => 255],\n`;
        } else if (attr.type === "integer" || attr.type === "int") {
          code += `            [['${attr.name}'], 'integer'],\n`;
        } else if (attr.type === "boolean" || attr.type === "bool") {
          code += `            [['${attr.name}'], 'boolean'],\n`;
        } else if (attr.type === "decimal" || attr.type === "float") {
          code += `            [['${attr.name}'], 'number'],\n`;
        }
      }
      code += `        ];
    }

`;
      for (const method of params.methods) {
        code += `    /**
     * ${method.description}
     */
    public function ${method.name}(): ${method.return_type || "void"}
    {
        // TODO: Implement ${method.name}
    }

`;
      }
      break;
    }

    case "sqlite": {
      code += `use yii\\db\\ActiveRecord;

/**
 * Class ${params.name}
 * @package ${params.namespace}
 */
class ${params.name} extends ActiveRecord
{
    /**
     * Use the addon's SQLite database connection.
     */
    public static function getDb()
    {
        return \\Yii::\$app->sqliteDb;
    }

    /**
     * @inheritdoc
     */
    public static function tableName(): string
    {
        return '${params.table_name || params.name.toLowerCase()}';
    }

    /**
     * @inheritdoc
     */
    public function rules(): array
    {
        return [
`;
      const required = params.attributes.filter((a) => a.required);
      if (required.length > 0) {
        const reqNames = required.map((a) => `'${a.name}'`).join(", ");
        code += `            [[${reqNames}], 'required'],\n`;
      }
      code += `        ];
    }

`;
      for (const method of params.methods) {
        code += `    /**
     * ${method.description}
     */
    public function ${method.name}(): ${method.return_type || "void"}
    {
        // TODO: Implement ${method.name}
    }

`;
      }
      break;
    }

    case "dataset": {
      const moduleName = params.module_name || "splynx_mod_custom";
      code += `use splynx\\v2\\base\\BaseActiveApi;
use splynx\\v2\\helpers\\ApiHelper;

/**
 * Class ${params.name}
 * @package ${params.namespace}
 */
class ${params.name} extends BaseActiveApi
{
    const MODULE_NAME = '${moduleName}';

    public \$id;
    public \$additional_attributes = [];
    public static \$apiUrl = 'admin/config/module';

    /**
     * Get API URL for this dataset module.
     */
    protected function getApiUrl(\$id = null, \$conditions = []): string
    {
        \$result = self::\$apiUrl . '/' . self::MODULE_NAME;

        if (\$id !== null) {
            \$result .= '--' . \$id;
        }

        if (\$conditions !== []) {
            \$result .= '?' . http_build_query(\$conditions);
        }

        return \$result;
    }

    /**
     * Find items by IDs.
     */
    public static function findByIds(array \$ids): array
    {
        return (new static())->findAll(['id' => ['IN', \$ids]]);
    }

    /**
     * Get items formatted for select dropdown.
     */
    public static function getItemsForSelect(): array
    {
        \$result = [];
        foreach ((new static())->findAll() as \$item) {
            \$result[\$item->id] = \$item->additional_attributes[self::MODULE_NAME . '_name'] ?? \$item->id;
        }
        return \$result;
    }

    /**
     * Delete an item by ID.
     */
    public function deleteItem(int \$id): bool
    {
        \$result = ApiHelper::getInstance()->delete(\$this->getApiUrl(\$id), null);
        return \$result['result'] ?? false;
    }

`;
      for (const method of params.methods) {
        code += `    /**
     * ${method.description}
     */
    public function ${method.name}(): ${method.return_type || "void"}
    {
        // TODO: Implement ${method.name}
    }

`;
      }
      break;
    }
  }

  code += `}\n`;

  return `# Generated Model: ${params.name}\n\nFile: \`models/${params.name}.php\`\n\n\`\`\`php\n${code}\`\`\``;
}
