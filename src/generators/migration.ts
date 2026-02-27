interface MigrationParams {
  name: string;
  type: "create_table" | "add_column" | "drop_table" | "custom";
  table_name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    unique?: boolean;
    default_value?: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

export function generateMigration(params: MigrationParams): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:]/g, "")
    .slice(0, 14)
    .replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1$2$3_$4$5$6");
  const className = `m${timestamp}_${params.name}`;

  let code = `<?php

namespace app\\migrations;

use yii\\db\\Migration;

/**
 * Class ${className}
 */
class ${className} extends Migration
{
`;

  switch (params.type) {
    case "create_table": {
      code += `    /**
     * @inheritdoc
     */
    public function safeUp(): void
    {
        $this->createTable('${params.table_name}', [
`;
      for (const col of params.columns) {
        let colDef = `            '${col.name}' => $this->`;
        const colType = col.type.toLowerCase();

        if (colType === "primarykey" || colType === "pk") {
          colDef += `primaryKey()`;
        } else if (colType.startsWith("string")) {
          const match = colType.match(/\((\d+)\)/);
          const len = match ? match[1] : "255";
          colDef += `string(${len})`;
        } else if (colType === "text") {
          colDef += `text()`;
        } else if (colType === "integer" || colType === "int") {
          colDef += `integer()`;
        } else if (colType === "biginteger" || colType === "bigint") {
          colDef += `bigInteger()`;
        } else if (colType === "boolean" || colType === "bool") {
          colDef += `boolean()`;
        } else if (colType === "decimal" || colType === "float") {
          colDef += `decimal(10, 2)`;
        } else if (colType === "datetime") {
          colDef += `dateTime()`;
        } else if (colType === "date") {
          colDef += `date()`;
        } else if (colType === "timestamp") {
          colDef += `timestamp()`;
        } else {
          colDef += `${colType}()`;
        }

        if (col.nullable === false) {
          colDef += `->notNull()`;
        }
        if (col.unique) {
          colDef += `->unique()`;
        }
        if (col.default_value !== undefined) {
          colDef += `->defaultValue(${isNaN(Number(col.default_value)) ? `'${col.default_value}'` : col.default_value})`;
        }

        colDef += `,\n`;
        code += colDef;
      }
      code += `        ]);
`;

      // Indexes
      for (const idx of params.indexes) {
        const colsStr = idx.columns.map((c) => `'${c}'`).join(", ");
        if (idx.unique) {
          code += `\n        $this->createIndex('${idx.name}', '${params.table_name}', [${colsStr}], true);`;
        } else {
          code += `\n        $this->createIndex('${idx.name}', '${params.table_name}', [${colsStr}]);`;
        }
      }

      code += `
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): void
    {
        $this->dropTable('${params.table_name}');
    }
`;
      break;
    }

    case "add_column": {
      code += `    /**
     * @inheritdoc
     */
    public function safeUp(): void
    {
`;
      for (const col of params.columns) {
        const colType = col.type.toLowerCase();
        let yiiType = `$this->string()`;
        if (colType === "integer" || colType === "int") {
          yiiType = `$this->integer()`;
        } else if (colType === "boolean" || colType === "bool") {
          yiiType = `$this->boolean()`;
        } else if (colType === "text") {
          yiiType = `$this->text()`;
        } else if (colType === "decimal" || colType === "float") {
          yiiType = `$this->decimal(10, 2)`;
        }

        code += `        $this->addColumn('${params.table_name}', '${col.name}', ${yiiType});\n`;
      }
      code += `    }

    /**
     * @inheritdoc
     */
    public function safeDown(): void
    {
`;
      for (const col of params.columns) {
        code += `        $this->dropColumn('${params.table_name}', '${col.name}');\n`;
      }
      code += `    }
`;
      break;
    }

    case "drop_table": {
      code += `    /**
     * @inheritdoc
     */
    public function safeUp(): void
    {
        $this->dropTable('${params.table_name}');
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): void
    {
        // Cannot reverse table drop
    }
`;
      break;
    }

    case "custom": {
      code += `    /**
     * @inheritdoc
     */
    public function safeUp(): void
    {
        // TODO: Add your migration logic here
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): void
    {
        // TODO: Add reverse migration logic here
    }
`;
      break;
    }
  }

  code += `}\n`;

  return `# Generated Migration: ${params.name}\n\nFile: \`migrations/${className}.php\`\n\n\`\`\`php\n${code}\`\`\``;
}
