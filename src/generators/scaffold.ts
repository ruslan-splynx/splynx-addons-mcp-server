interface ScaffoldParams {
  addon_name: string;
  module_name: string;
  description: string;
  author_name: string;
  author_email: string;
  min_splynx_version: string;
  base_url: string;
  features: {
    hooks?: boolean;
    entry_points?: boolean;
    additional_fields?: boolean;
    mysql?: boolean;
    sqlite?: boolean;
    redis?: boolean;
    payment?: boolean;
    portal?: boolean;
    dataset?: boolean;
  };
}

export function generateAddonScaffold(params: ScaffoldParams): string {
  const slug = params.module_name.replace(/_/g, "-");
  const urlEncoded = encodeURIComponent(params.base_url).replace(/%2F/gi, "%2F");
  const files: Record<string, string> = {};

  // composer.json
  files["composer.json"] = JSON.stringify(
    {
      name: `splynx/splynx-addon-${slug}`,
      description: params.description,
      keywords: ["splynx"],
      type: "project",
      license: "BSD-3-Clause",
      authors: [
        {
          name: params.author_name,
          email: params.author_email,
          role: "Developer",
        },
      ],
      require: {},
      "require-dev": {},
      config: { "sort-packages": true },
    },
    null,
    4
  );

  // config/config.json
  const configJson: Record<string, unknown> = {
    path: params.module_name,
    translate: true,
    blocks: {
      settings: {
        title: "Settings",
        items: {
          enabled: {
            title: "Enable addon",
            type: "boolean",
            default: false,
          },
        },
      },
    },
  };

  if (params.features.payment) {
    (configJson.blocks as Record<string, unknown>).api = {
      title: "API Settings",
      items: {
        api_url: { title: "API URL", type: "string" },
        api_key: { title: "API Key", type: "encrypted" },
        api_secret: { title: "API Secret", type: "encrypted" },
      },
    };
  }

  files["config/config.json"] = JSON.stringify(configJson, null, 4);

  // config/web.php
  let webConfigImports = `use splynx\\v2\\models\\administration\\BaseAdministrator;`;
  let webConfigComponents = `
            'request' => [
                'baseUrl' => '${params.base_url}',
                'enableCookieValidation' => false,
            ],
            'user' => [
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=${urlEncoded}',
                'enableAutoLogin' => false,
            ],`;

  if (params.features.portal) {
    webConfigImports += `\nuse splynx\\v2\\models\\customer\\BaseCustomer;`;
    webConfigComponents += `
            'customer' => [
                'class' => 'yii\\web\\User',
                'identityClass' => BaseCustomer::class,
                'idParam' => 'splynx_customer_id',
                'loginUrl' => '/portal/login/?return=${urlEncoded}',
                'enableAutoLogin' => false,
            ],`;
  }

  if (params.features.redis) {
    webConfigImports += `\nuse splynx\\helpers\\ConfigHelper;`;
    webConfigComponents += `
            'redis' => array_merge(
                ['class' => 'yii\\redis\\Connection'],
                ConfigHelper::getRedisConfigForAddOns()
            ),`;
  }

  if (params.features.mysql) {
    webConfigComponents += `
            'db' => require __DIR__ . '/db.php',`;
  }

  files["config/web.php"] = `<?php

${webConfigImports}

return function ($params, $baseDir) {
    return [
        'components' => [${webConfigComponents}
        ],
    ];
};
`;

  // config/console.php
  files["config/console.php"] = `<?php

return function ($params, $baseDir) {
    return [];
};
`;

  // config/params.example.php
  files["config/params.example.php"] = `<?php

return [
];
`;

  // config/test.php
  files["config/test.php"] = `<?php

return function ($params, $baseDir) {
    return [];
};
`;

  // config/url_rules.php
  files["config/url_rules.php"] = `<?php

return [
    '<alias:index>' => 'site/<alias>',
];
`;

  // config/db.php (if MySQL)
  if (params.features.mysql) {
    files["config/db.php"] = `<?php

use splynx\\helpers\\ConfigHelper;

$splynxConfig = ConfigHelper::getSplynxConfig();

return [
    'class' => 'yii\\db\\Connection',
    'dsn' => 'mysql:host=' . $splynxConfig['db_host']
        . ';dbname=' . $splynxConfig['db_name']
        . ';charset=' . $splynxConfig['db_charset'],
    'username' => $splynxConfig['db_user'],
    'password' => trim(shell_exec(
        '/var/www/splynx/system/script/security decrypt --hash=' . $splynxConfig['db_password']
    )),
    'tablePrefix' => 'SAA_',
    'enableLogging' => false,
    'enableProfiling' => false,
];
`;
  }

  // commands/InstallController.php
  let installMethods = "";

  if (params.features.entry_points !== false) {
    installMethods += `
    /**
     * @inheritdoc
     */
    public function getEntryPoints(): array
    {
        return [
            [
                'name' => '${params.module_name}_main',
                'title' => $this->getAddOnTitle(),
                'root' => 'controllers\\\\SiteController',
                'place' => 'admin',
                'type' => 'menu_link',
                'url' => '${urlEncoded}',
                'icon' => 'fa-puzzle-piece',
            ],
        ];
    }
`;
  }

  if (params.features.hooks) {
    installMethods += `
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
                    'customer/create' => true,
                    'customer/edit' => true,
                ],
            ],
        ];
    }
`;
  }

  if (params.features.additional_fields) {
    installMethods += `
    /**
     * @inheritdoc
     */
    public function getAdditionalFields(): array
    {
        return [
            // Add your custom fields here
            // [
            //     'main_module' => 'customers',
            //     'name' => 'custom_field',
            //     'title' => 'Custom Field',
            //     'type' => 'string',
            //     'required' => false,
            //     'show_in_list' => true,
            // ],
        ];
    }
`;
  }

  if (params.features.payment) {
    installMethods += `
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

  const useYii = params.features.payment ? "\nuse Yii;" : "";

  files["commands/InstallController.php"] = `<?php

namespace app\\commands;

use splynx\\base\\BaseInstallController;${useYii}

/**
 * Class InstallController
 * @package app\\commands
 */
class InstallController extends BaseInstallController
{
    /**
     * @inheritdoc
     */
    public \\$module_status = self::MODULE_STATUS_ENABLED;

    /**
     * @inheritdoc
     */
    public static \\$minimumSplynxVersion = '${params.min_splynx_version}';

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

    /**
     * @inheritdoc
     */
    public function getApiPermissions(): array
    {
        return [
            [
                'controller' => 'api\\\\admin\\\\customers\\\\Customer',
            ],
        ];
    }
${installMethods}}
`;

  // controllers/SiteController.php
  files["controllers/SiteController.php"] = `<?php

namespace app\\controllers;

use yii\\filters\\AccessControl;
use yii\\web\\Controller;
use yii\\web\\ErrorAction;

/**
 * Class SiteController
 * @package app\\controllers
 */
class SiteController extends Controller
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

    /**
     * @inheritdoc
     */
    public function behaviors(): array
    {
        return [
            'access' => [
                'class' => AccessControl::class,
                'rules' => [
                    [
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Main page.
     */
    public function actionIndex(): string
    {
        $this->view->title = '${params.addon_name}';

        return $this->render('index');
    }
}
`;

  // Hook controller
  if (params.features.hooks) {
    files["commands/HookController.php"] = `<?php

namespace app\\commands;

use yii\\console\\Controller;

/**
 * Class HookController
 * @package app\\commands
 */
class HookController extends Controller
{
    /**
     * Process incoming hook events from Splynx.
     * Data arrives as JSON via STDIN.
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

        // Route events to handler methods
        switch ("\\$model/\\$action") {
            case 'customer/create':
                $this->onCustomerCreated($attributes);
                break;
            case 'customer/edit':
                $this->onCustomerEdited($attributes, $oldAttributes);
                break;
        }
    }

    private function onCustomerCreated(array $attributes): void
    {
        // TODO: Handle customer creation event
    }

    private function onCustomerEdited(array $attributes, array $oldAttributes): void
    {
        // TODO: Handle customer edit event
    }
}
`;
  }

  // models/Customer.php
  files["models/Customer.php"] = `<?php

namespace app\\models;

use splynx\\v2\\models\\customer\\BaseCustomer;

/**
 * Class Customer
 * @package app\\models
 */
class Customer extends BaseCustomer
{
}
`;

  // components/ValidateConfig.php
  files["components/ValidateConfig.php"] = `<?php

namespace app\\components;

use splynx\\components\\BaseValidateConfig;

/**
 * Class ValidateConfig
 * @package app\\components
 */
class ValidateConfig extends BaseValidateConfig
{
}
`;

  // assets/AppAsset.php
  files["assets/AppAsset.php"] = `<?php

namespace app\\assets;

use yii\\web\\AssetBundle;
use yii\\web\\YiiAsset;
use yii\\bootstrap\\BootstrapAsset;
use splynx\\assets\\HelperAsset;
use yii\\web\\View;

/**
 * Class AppAsset
 * @package app\\assets
 */
class AppAsset extends AssetBundle
{
    public \\$basePath = '@webroot';
    public \\$baseUrl = '@web';

    public \\$css = [
        'css/site.css',
    ];

    public \\$js = [];

    public \\$depends = [
        YiiAsset::class,
        BootstrapAsset::class,
        HelperAsset::class,
    ];

    public \\$jsOptions = [
        'position' => View::POS_HEAD,
    ];
}
`;

  // views/layouts/main.php
  files["views/layouts/main.php"] = `<?php

use app\\assets\\AppAsset;
use app\\widgets\\Alert;
use yii\\helpers\\Html;
use yii\\web\\View;

/** @var View $this */
/** @var string $content */

AppAsset::register($this);
?>
<?php $this->beginPage() ?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?= Html::csrfMetaTags() ?>
    <title><?= Html::encode($this->title) ?></title>
    <?php $this->head() ?>
</head>
<body>
<?php $this->beginBody() ?>

<?= Alert::widget() ?>

<?= $content ?>

<?php $this->endBody() ?>
</body>
</html>
<?php $this->endPage() ?>
`;

  // views/site/index.twig
  files["views/site/index.twig"] = `<div class="panel panel-default">
    <div class="panel-heading">
        <h3>{{ this.title }}</h3>
    </div>
    <div class="panel-body">
        <p>Welcome to ${params.addon_name}.</p>
    </div>
</div>
`;

  // views/site/error.twig
  files["views/site/error.twig"] = `<div class="site-error">
    <h1>{{ Html.encode(name) }}</h1>
    <div class="alert alert-danger">
        {{ message | nl2br | raw }}
    </div>
    <p>The above error occurred while the Web server was processing your request.</p>
    <p>Please contact us if you think this is a server error. Thank you.</p>
</div>
`;

  // widgets/Alert.php
  files["widgets/Alert.php"] = `<?php

namespace app\\widgets;

use yii\\bootstrap\\Alert as BootstrapAlert;
use yii\\bootstrap\\Widget;

/**
 * Class Alert
 * @package app\\widgets
 */
class Alert extends Widget
{
    /**
     * @inheritdoc
     */
    public function run(): string
    {
        $flashes = \\Yii::\\$app->session->getAllFlashes();
        $result = '';

        foreach ($flashes as $type => $data) {
            $data = (array) $data;
            foreach ($data as $message) {
                $result .= BootstrapAlert::widget([
                    'body' => $message,
                    'options' => ['class' => 'alert-' . $type],
                ]);
            }
        }

        return $result;
    }
}
`;

  // web/index.php
  files["web/index.php"] = `<?php

$baseDir = dirname(__DIR__);
$configPath = $baseDir . '/config/web.php';

if (file_exists($baseDir . '/config/dev.php')) {
    defined('YII_DEBUG') or define('YII_DEBUG', true);
}

require($baseDir . '/../splynx-addon-base-2/vendor/autoload.php');
require($baseDir . '/../splynx-addon-base-2/vendor/yiisoft/yii2/Yii.php');
require($baseDir . '/vendor/autoload.php');

(new splynx\\base\\WebApplication($baseDir, $configPath))->run();
`;

  // web/css/site.css
  files["web/css/site.css"] = `/* ${params.addon_name} styles */
`;

  // web/robots.txt
  files["web/robots.txt"] = `User-agent: *
Disallow: /
`;

  // yii (CLI entry point)
  files["yii"] = `#!/usr/bin/env php
<?php

defined('YII_DEBUG') or define('YII_DEBUG', true);

$baseDir = __DIR__;
$configPath = $baseDir . '/config/console.php';

require($baseDir . '/../splynx-addon-base-2/vendor/autoload.php');
require($baseDir . '/../splynx-addon-base-2/vendor/yiisoft/yii2/Yii.php');
require($baseDir . '/vendor/autoload.php');

$application = new splynx\\base\\ConsoleApplication($baseDir, $configPath);
$exitCode = $application->run();
exit($exitCode);
`;

  // .gitignore
  files[".gitignore"] = `.idea
nbproject
.buildpath
.project
.settings
Thumbs.db
/vendor
composer.phar
.DS_Store
.vagrant
config/params.php
data/data.db
config/config.ini.php
config/dev.php
/tests/_output/
/tests/unit.suite.yml
/tests/functional.suite.yml
/tests/_support/_generated/
phpstan.neon
`;

  // nginx config
  const nginxPath = `build/package-files/etc/nginx/sites-available/splynx-addon-${slug}.addons`;
  files[nginxPath] = `location ${params.base_url} {
    try_files $uri $uri/ ${params.base_url}/index.php?$args;
}
`;

  // runtime/.gitignore
  files["runtime/.gitignore"] = `*
!.gitignore
`;

  // web/assets/.gitignore
  files["web/assets/.gitignore"] = `*
!.gitignore
`;

  // data dir for SQLite
  if (params.features.sqlite) {
    files["data/.gitignore"] = `*
!.gitignore
`;
  }

  // Format output
  let output = `# Generated Splynx Addon Scaffold: ${params.addon_name}\n\n`;
  output += `Module name: ${params.module_name}\n`;
  output += `Base URL: ${params.base_url}\n\n`;
  output += `## Directory Structure\n\n\`\`\`\n`;

  const sortedPaths = Object.keys(files).sort();
  for (const path of sortedPaths) {
    output += `${path}\n`;
  }
  output += `\`\`\`\n\n`;

  output += `## File Contents\n\n`;
  output += `Write each file below to the addon project directory.\n\n`;

  for (const path of sortedPaths) {
    output += `### ${path}\n\n\`\`\`\n${files[path]}\`\`\`\n\n`;
  }

  output += `## Installation Instructions\n\n`;
  output += `\`\`\`bash\n`;
  output += `# 1. Ensure addon base is installed\n`;
  output += `cd /var/www/splynx/addons\n`;
  output += `# git clone git@bitbucket.org:splynx/splynx-addon-base-2.git (if not already)\n`;
  output += `# cd splynx-addon-base-2 && composer install\n\n`;
  output += `# 2. Place addon files\n`;
  output += `cd /var/www/splynx/addons/splynx-addon-${slug}\n`;
  output += `composer install\n\n`;
  output += `# 3. Install addon\n`;
  output += `php yii install/index\n\n`;
  output += `# 4. Create web symlink\n`;
  output += `ln -s /var/www/splynx/addons/splynx-addon-${slug}/web/ /var/www/splynx/web${params.base_url}\n\n`;
  output += `# 5. Add nginx config and restart\n`;
  output += `sudo cp ${nginxPath} /etc/nginx/sites-available/\n`;
  output += `sudo service nginx restart\n`;
  output += `\`\`\`\n`;

  return output;
}
