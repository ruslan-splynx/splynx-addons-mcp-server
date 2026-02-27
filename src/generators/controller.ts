interface ControllerParams {
  name: string;
  namespace: string;
  actions: Array<{
    name: string;
    renders_view?: boolean;
    view_name?: string;
    params?: Array<{ name: string; type?: string }>;
  }>;
  auth_required: boolean;
  public_actions: string[];
  user_component?: string;
  models: string[];
  page_title?: string;
}

export function generateController(params: ControllerParams): string {
  const imports: string[] = [
    `use yii\\web\\Controller;`,
    `use yii\\web\\ErrorAction;`,
  ];

  if (params.auth_required || params.public_actions.length > 0) {
    imports.push(`use yii\\filters\\AccessControl;`);
  }

  for (const model of params.models) {
    imports.push(`use app\\models\\${model};`);
  }

  let code = `<?php

namespace ${params.namespace};

${imports.join("\n")}

/**
 * Class ${params.name}
 * @package ${params.namespace}
 */
class ${params.name} extends Controller
{
    /**
     * @inheritdoc
     */
    public function actions(): array
    {
        return [
            'error' => [
                'class' => ErrorAction::class,
            ],
        ];
    }
`;

  // Behaviors
  if (params.auth_required || params.public_actions.length > 0) {
    code += `
    /**
     * @inheritdoc
     */
    public function behaviors(): array
    {
        return [
            'access' => [
                'class' => AccessControl::class,`;

    if (params.user_component) {
      code += `
                'user' => '${params.user_component}',`;
    }

    code += `
                'rules' => [`;

    if (params.public_actions.length > 0) {
      const publicStr = params.public_actions
        .map((a) => `'${a}'`)
        .join(", ");
      code += `
                    [
                        'actions' => [${publicStr}],
                        'allow' => true,
                        'roles' => ['?'],
                    ],`;
    }

    if (params.auth_required) {
      code += `
                    [
                        'allow' => true,
                        'roles' => ['@'],
                    ],`;
    }

    code += `
                ],
            ],
        ];
    }
`;
  }

  // Action methods
  for (const action of params.actions) {
    const methodName = `action${action.name.charAt(0).toUpperCase() + action.name.slice(1)}`;
    const viewName = action.view_name || action.name;
    const paramsList =
      action.params
        ?.map((p) => {
          const type = p.type === "int" || p.type === "integer" ? "int " : "";
          return `${type}$${p.name}`;
        })
        .join(", ") || "";

    code += `
    /**
     * ${action.name.charAt(0).toUpperCase() + action.name.slice(1)} action.
     */
    public function ${methodName}(${paramsList}): string
    {`;

    if (params.page_title && action.name === "index") {
      code += `
        $this->view->title = '${params.page_title}';`;
    }

    if (action.renders_view !== false) {
      code += `
        return $this->render('${viewName}');`;
    } else {
      code += `
        return $this->asJson(['status' => 'ok']);`;
    }

    code += `
    }
`;
  }

  code += `}\n`;

  return `# Generated Controller: ${params.name}\n\nFile: \`controllers/${params.name}.php\`\n\n\`\`\`php\n${code}\`\`\``;
}
