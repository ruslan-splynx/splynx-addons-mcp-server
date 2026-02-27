interface WebConfigParams {
  base_url: string;
  auth_type: "admin" | "customer" | "both" | "none";
  include_redis: boolean;
  include_mysql: boolean;
  additional_components: Record<string, string>;
}

export function generateWebConfig(params: WebConfigParams): string {
  const urlEncoded = encodeURIComponent(params.base_url).replace(/%2F/gi, "%2F");

  const imports: string[] = [];
  const components: string[] = [];

  // Request component
  components.push(`            'request' => [
                'baseUrl' => '${params.base_url}',
                'enableCookieValidation' => false,
            ],`);

  // Auth components
  if (params.auth_type === "admin" || params.auth_type === "both") {
    imports.push(
      "use splynx\\v2\\models\\administration\\BaseAdministrator;"
    );
    const componentName = params.auth_type === "both" ? "admin" : "user";
    let componentConfig = "";
    if (params.auth_type === "both") {
      componentConfig = `
                'class' => 'yii\\web\\User',`;
    }
    components.push(`            '${componentName}' => [${componentConfig}
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=${urlEncoded}',
                'enableAutoLogin' => false,
            ],`);
  }

  if (params.auth_type === "customer" || params.auth_type === "both") {
    imports.push("use splynx\\v2\\models\\customer\\BaseCustomer;");
    const componentName = params.auth_type === "both" ? "customer" : "user";
    let componentConfig = "";
    if (params.auth_type === "both") {
      componentConfig = `
                'class' => 'yii\\web\\User',`;
    }
    components.push(`            '${componentName}' => [${componentConfig}
                'identityClass' => BaseCustomer::class,
                'idParam' => 'splynx_customer_id',
                'loginUrl' => '/portal/login/?return=${urlEncoded}',
                'enableAutoLogin' => false,
            ],`);
  }

  // Redis
  if (params.include_redis) {
    imports.push("use splynx\\helpers\\ConfigHelper;");
    components.push(`            'redis' => array_merge(
                ['class' => 'yii\\redis\\Connection'],
                ConfigHelper::getRedisConfigForAddOns()
            ),`);
  }

  // MySQL
  if (params.include_mysql) {
    components.push(
      `            'db' => require __DIR__ . '/db.php',`
    );
  }

  const code = `<?php

${imports.join("\n")}

return function ($params, $baseDir) {
    return [
        'components' => [
${components.join("\n")}
        ],
    ];
};
`;

  return `# Generated web.php\n\nFile: \`config/web.php\`\n\n\`\`\`php\n${code}\`\`\``;
}
