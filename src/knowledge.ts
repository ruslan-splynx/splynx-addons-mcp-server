// ============================================================================
// Comprehensive Splynx Addon Development Knowledge Base
// ============================================================================

// ---------------------------------------------------------------------------
// ARCHITECTURE OVERVIEW
// ---------------------------------------------------------------------------
export const ADDON_ARCHITECTURE_OVERVIEW = `# Splynx Addon Architecture Overview

## What is Splynx?
Splynx is an ISP management platform (billing, networking, CRM, helpdesk, scheduling).
It is built on the Yii2 PHP framework and supports modular addon development.

## Addon Structure
A Splynx addon is a self-contained Yii2 module that integrates into the Splynx platform.
Addons are installed to: \`/var/www/splynx/addons/<addon-name>/\`

## Directory Structure
\`\`\`
my-addon/
├── assets/                  # Asset bundles (CSS/JS)
│   └── AppAsset.php
├── build/                   # Build/packaging scripts
│   └── package-files/
├── commands/                # Console commands
│   └── InstallController.php  # REQUIRED: Installation controller
├── components/              # Reusable components
│   └── ValidateConfig.php
├── config/                  # Configuration files
│   ├── config.json          # REQUIRED: Addon settings definition
│   ├── console.php          # Console app config
│   ├── params.example.php   # Parameters template
│   ├── test.php             # Test config
│   ├── url_rules.php        # URL routing rules
│   └── web.php              # Web app config
├── controllers/             # Web controllers
│   └── SiteController.php
├── data/                    # SQLite database files (if needed)
├── migrations/              # Database migrations (SQLite)
├── models/                  # Data models
│   └── Customer.php
├── runtime/                 # Runtime cache/logs
├── tests/                   # Test files
├── views/                   # View templates
│   ├── layouts/
│   │   └── main.php         # Main layout
│   └── site/
│       ├── index.twig       # Pages use Twig templates
│       └── error.twig
├── web/                     # Web root (public assets)
│   └── css/
│       └── site.css
├── widgets/                 # Custom Yii2 widgets
├── composer.json            # PHP dependencies
├── composer.lock
├── codeception.yml          # Test configuration
├── phpstan.neon.dist        # Static analysis config
├── phpstan-baseline.neon
├── yii                      # CLI entry point
├── LICENSE.md
└── README.md
\`\`\`

## Key Concepts
1. **InstallController** - Defines addon metadata, permissions, hooks, entry points
2. **config.json** - Defines user-configurable settings shown in Splynx admin UI
3. **Entry Points** - How your addon appears in Splynx navigation (menu links, tabs, code blocks, action links)
4. **Hooks** - React to Splynx events (customer created, invoice paid, etc.)
5. **API Permissions** - What Splynx API endpoints your addon can access
6. **Models** - Extend Splynx base models (BaseCustomer, BaseActiveApi, etc.)
7. **Views** - Twig templates for the web interface
8. **Additional Fields** - Add custom fields to any Splynx entity

## Framework Details
- PHP 7.4+ / 8.x
- Yii2 framework (controllers, models, views, behaviors, components)
- Twig templating engine for views
- Bootstrap CSS for UI
- SQLite for local addon data storage
- MySQL access to main Splynx database (via Yii2 DB component)
- Redis support for caching
- WebSocket support for real-time browser communication

## Addon Naming Rules
- Addon title: max 64 characters (varchar(64) in DB)
- Module name (identifier): max 32 characters (varchar(32) in DB)
- Module name must be lowercase with underscores (e.g., "splynx_my_addon")

## Addon Lifecycle
1. Fork/copy the skeleton repository
2. Rename module references to your addon name
3. Implement InstallController with metadata and permissions
4. Define config.json for settings
5. Build controllers, models, views
6. Package with \`dpkg-deb\` for distribution
7. Install on Splynx via CLI or package manager
`;

// ---------------------------------------------------------------------------
// INSTALL CONTROLLER
// ---------------------------------------------------------------------------
export const INSTALL_CONTROLLER_GUIDE = `# InstallController - The Heart of Every Splynx Addon

The InstallController (\`commands/InstallController.php\`) is the most critical file in any addon.
It extends \`BaseInstallController\` and defines everything about your addon's integration with Splynx.

## Complete Template

\`\`\`php
<?php

namespace app\\commands;

use splynx\\base\\BaseInstallController;
use Yii;

/**
 * Class InstallController
 * @package app\\commands
 */
class InstallController extends BaseInstallController
{
    /**
     * Module status after installation
     * Options: self::MODULE_STATUS_ENABLED, self::MODULE_STATUS_DISABLED
     */
    public $module_status = self::MODULE_STATUS_ENABLED;

    /**
     * Minimum Splynx version required
     */
    public static $minimumSplynxVersion = '3.1';

    /**
     * Addon display title (max 64 chars)
     */
    public function getAddOnTitle(): string
    {
        return 'My Custom Addon';
    }

    /**
     * Internal module identifier (max 32 chars, lowercase_underscore)
     */
    public function getModuleName(): string
    {
        return 'splynx_my_addon';
    }

    /**
     * API endpoints the addon needs access to.
     * Omit 'actions' array to grant all actions on a controller.
     */
    public function getApiPermissions(): array
    {
        return [
            [
                'controller' => 'api\\admin\\administration\\Administrators',
                'actions' => ['index', 'view'],
            ],
            [
                'controller' => 'api\\admin\\customers\\Customer',
                // No 'actions' = all actions allowed
            ],
        ];
    }

    /**
     * Entry points define where the addon appears in Splynx UI.
     */
    public function getEntryPoints(): array
    {
        return [
            [
                'name' => 'my_addon_main',
                'title' => $this->getAddOnTitle(),
                'root' => 'controllers\\SiteController',
                'place' => 'admin',        // 'admin' or 'portal'
                'type' => 'menu_link',     // 'menu_link', 'code', 'action_link', 'tab'
                'url' => '%2Fmy-addon%2F',
                'icon' => 'fa-puzzle-piece',
            ],
        ];
    }

    /**
     * Event hooks - react to Splynx events via CLI commands.
     */
    public function getHooks(): array
    {
        return [
            [
                'title' => 'My Addon Hook',
                'type' => 'cli',
                'path' => '/var/www/splynx/addons/my-addon/yii hook/process',
                'enabled' => true,
                'events' => [
                    'customer/create' => true,
                    'customer/edit' => true,
                    'customer/delete' => true,
                ],
            ],
        ];
    }

    /**
     * Additional fields added to Splynx entities.
     */
    public function getAdditionalFields(): array
    {
        return [
            [
                'main_module' => 'customers',
                'name' => 'social_id',
                'title' => 'Social ID',
                'type' => 'string',
                'required' => false,
                'show_in_list' => true,
            ],
        ];
    }

    /**
     * Payment accounts configuration (for payment addons only).
     */
    public function getPaymentAccounts(): array
    {
        return [
            'title' => Yii::t('app', 'My Payment'),
            'field_1' => Yii::t('app', 'Account ID'),
            'field_2' => Yii::t('app', 'Payment token'),
            'field_3' => Yii::t('app', 'Last 4 digits'),
            'field_4' => Yii::t('app', 'Cardholder name'),
            'field_5' => Yii::t('app', 'Expiry date'),
        ];
    }
}
\`\`\`

## Available API Permission Controllers

### Admin Controllers
- \`api\\admin\\administration\\Administrators\` - actions: index, view, add, update, delete
- \`api\\admin\\administration\\ApiKeys\`
- \`api\\admin\\administration\\Locations\`
- \`api\\admin\\administration\\Partners\`
- \`api\\admin\\administration\\Roles\`
- \`api\\admin\\customers\\Customer\` - CRUD for customers
- \`api\\admin\\customers\\CustomerBilling\`
- \`api\\admin\\customers\\CustomerDocuments\`
- \`api\\admin\\customers\\CustomerInfo\`
- \`api\\admin\\customers\\CustomerNotes\`
- \`api\\admin\\customers\\CustomerPaymentAccounts\`
- \`api\\admin\\customers\\CustomersOnline\`
- \`api\\admin\\services\\Internet\`
- \`api\\admin\\services\\Voice\`
- \`api\\admin\\services\\Custom\`
- \`api\\admin\\services\\Bundle\`
- \`api\\admin\\finance\\Invoices\`
- \`api\\admin\\finance\\Payments\`
- \`api\\admin\\finance\\Transactions\`
- \`api\\admin\\finance\\Proforma\`
- \`api\\admin\\finance\\BankStatements\`
- \`api\\admin\\finance\\Costs\`
- \`api\\admin\\tariffs\\Internet\`
- \`api\\admin\\tariffs\\Voice\`
- \`api\\admin\\tariffs\\Recurring\`
- \`api\\admin\\tariffs\\OneTime\`
- \`api\\admin\\tariffs\\Bundle\`
- \`api\\admin\\networking\\Routers\`
- \`api\\admin\\networking\\IPv4Networks\`
- \`api\\admin\\networking\\IPv6Networks\`
- \`api\\admin\\networking\\CPE\`
- \`api\\admin\\networking\\Monitoring\`
- \`api\\admin\\support\\Tickets\`
- \`api\\admin\\support\\TicketMessages\`
- \`api\\admin\\crm\\Leads\`
- \`api\\admin\\crm\\Quotes\`
- \`api\\admin\\scheduling\\Projects\`
- \`api\\admin\\scheduling\\Tasks\`
- \`api\\admin\\inventory\\Products\`
- \`api\\admin\\inventory\\Vendors\`
- \`api\\admin\\inventory\\Suppliers\`
- \`api\\admin\\config\\MainConfig\`

### Portal Controllers (customer-facing)
- \`api\\portal\\customers\\Customer\`
- \`api\\portal\\services\\Internet\`
- \`api\\portal\\services\\Voice\`
- \`api\\portal\\finance\\Invoices\`
- \`api\\portal\\finance\\Payments\`
- \`api\\portal\\support\\Tickets\`
- \`api\\portal\\support\\TicketMessages\`

## Additional Field Types
\`string\`, \`integer\`, \`decimal\`, \`numeric\`, \`date\`, \`datetime\`, \`boolean\`,
\`select\`, \`select_multiple\`, \`password\`, \`file\`, \`relation\`, \`relation_multiple\`,
\`add-on\`, \`ip\`, \`textarea\`

## Additional Field Modules
\`administrators\`, \`partners\`, \`locations\`, \`customers\`, \`internet_services\`,
\`voice_services\`, \`custom_services\`, \`bundle_services\`, \`internet_tariffs\`,
\`voice_tariffs\`, \`recurring_tariffs\`, \`one_time_tariffs\`, \`bundle_tariffs\`,
\`invoices\`, \`proforma_invoices\`, \`payments\`, \`tickets\`, \`routers\`,
\`ipv4_networks\`, \`cpe\`, \`leads\`, \`quotes\`, \`projects\`, \`tasks\`,
\`inventory_products\`, \`inventory_items\`, \`monitoring\`
`;

// ---------------------------------------------------------------------------
// CONFIG FILE
// ---------------------------------------------------------------------------
export const CONFIG_FILE_GUIDE = `# config.json - Addon Configuration Definition

The \`config/config.json\` file defines the settings UI that administrators see in
Splynx → Config → Integrations → <Your Addon>.

## Structure

\`\`\`json
{
    "path": "splynx_my_addon",
    "translate": true,
    "blocks": [
        {
            "name": "API Settings",
            "items": [
                {
                    "key": "api_url",
                    "title": "API URL",
                    "type": "string",
                    "default": "https://api.example.com",
                    "description": "The base URL for the external API"
                },
                {
                    "key": "api_key",
                    "title": "API Key",
                    "type": "encrypted",
                    "default": "",
                    "description": "Your API key"
                },
                {
                    "key": "api_secret",
                    "title": "API Secret",
                    "type": "encrypted",
                    "default": "",
                    "description": "Your API secret"
                },
                {
                    "key": "enabled",
                    "title": "Enable Integration",
                    "type": "boolean",
                    "default": false
                },
                {
                    "key": "sync_interval",
                    "title": "Sync Interval (minutes)",
                    "type": "integer",
                    "default": 60
                },
                {
                    "key": "payment_method_id",
                    "title": "Payment Method",
                    "type": "select",
                    "default": "",
                    "relation": "splynx\\\\helpers\\\\relationHelpers\\\\PaymentMethod"
                }
            ]
        },
        {
            "name": "Advanced",
            "items": [
                {
                    "key": "debug_mode",
                    "title": "Debug Mode",
                    "type": "boolean",
                    "default": false
                },
                {
                    "key": "log_level",
                    "title": "Log Level",
                    "type": "select",
                    "default": "error",
                    "options": {
                        "error": "Error",
                        "warning": "Warning",
                        "info": "Info",
                        "debug": "Debug"
                    }
                }
            ]
        }
    ]
}
\`\`\`

## Supported Field Types
- \`string\` - Text input
- \`integer\` - Whole number
- \`decimal\` - Decimal number
- \`numeric\` - Any number
- \`date\` - Date picker
- \`datetime\` - Date and time picker
- \`boolean\` - Checkbox (true/false)
- \`select\` - Dropdown select
- \`multipleSelect\` - Multi-select dropdown
- \`encrypted\` - Encrypted text (for secrets/passwords)
- \`textarea\` - Multi-line text

## Reading Config Values in PHP

\`\`\`php
use splynx\\helpers\\ConfigHelper;

// Get a config value
$apiUrl = ConfigHelper::get('api_url');
$apiKey = ConfigHelper::get('api_key');

// Get partner-specific config value
$currency = ConfigHelper::get('currency', $partnerId);
\`\`\`

## Available Relation Helpers (for select/multipleSelect fields)
- \`splynx\\\\helpers\\\\relationHelpers\\\\Administrator\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Partner\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Location\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\PaymentMethod\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\InternetTariff\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\VoiceTariff\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\RecurringTariff\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\OneTimeTariff\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\BundleTariff\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Customer\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Lead\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Router\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Project\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\Task\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\TicketGroup\`
- \`splynx\\\\helpers\\\\relationHelpers\\\\TicketType\`

## Per-Partner Configuration
Enable partner-specific settings with \`per_partner_options\` blocks:

\`\`\`json
{
    "per_partner_options": [
        {
            "name": "Partner Settings",
            "items": [
                {
                    "key": "currency",
                    "title": "Currency",
                    "type": "string",
                    "default": "USD"
                }
            ]
        }
    ]
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// ENTRY POINTS
// ---------------------------------------------------------------------------
export const ENTRY_POINTS_GUIDE = `# Entry Points - Integrating Your Addon into Splynx UI

Entry points define WHERE and HOW your addon appears in the Splynx interface.
They are defined in \`InstallController::getEntryPoints()\`.

## Entry Point Structure

\`\`\`php
[
    'name' => 'unique_entry_name',    // Unique identifier
    'title' => 'Display Title',       // Shown in UI
    'root' => 'controllers\\SiteController',  // Target controller
    'place' => 'admin',               // 'admin' or 'portal'
    'type' => 'menu_link',            // Type of entry point
    'url' => '%2Fmy-addon%2F',        // URL-encoded path
    'icon' => 'fa-puzzle-piece',      // FontAwesome icon class
]
\`\`\`

## Entry Point Types

### 1. menu_link - Navigation Menu Item
Creates a link in the Splynx navigation sidebar.
\`\`\`php
[
    'name' => 'my_addon_menu',
    'title' => 'My Addon',
    'root' => 'controllers\\SiteController',
    'place' => 'admin',
    'type' => 'menu_link',
    'url' => '%2Fmy-addon%2F',
    'icon' => 'fa-puzzle-piece',
]
\`\`\`

### 2. code - Embedded Code Block
Embeds addon content within an existing Splynx page.
\`\`\`php
[
    'name' => 'my_addon_widget',
    'title' => 'My Widget',
    'root' => 'controllers\\admin\\CustomersController',
    'place' => 'admin',
    'type' => 'code',
    'url' => '%2Fmy-addon%2Fwidget',
    'icon' => 'fa-code',
]
\`\`\`

### 3. action_link - Action Link on Entities
Adds action buttons to entities like services, invoices, tickets.
\`\`\`php
[
    'name' => 'my_addon_action',
    'title' => 'Run Action',
    'root' => 'controllers\\admin\\ServicesController',
    'place' => 'admin',
    'type' => 'action_link',
    'url' => '%2Fmy-addon%2Faction',
    'icon' => 'fa-bolt',
]
\`\`\`

### 4. tab - Tab on Admin Pages
Adds a new tab to existing admin pages.
\`\`\`php
[
    'name' => 'my_addon_tab',
    'title' => 'My Tab',
    'root' => 'controllers\\admin\\CustomersController',
    'place' => 'admin',
    'type' => 'tab',
    'url' => '%2Fmy-addon%2Ftab',
    'icon' => 'fa-folder',
]
\`\`\`

## Available Admin Root Controllers
- \`controllers\\admin\\CustomersController\` - Customer pages
- \`controllers\\admin\\ServicesController\` - Service pages
- \`controllers\\admin\\FinanceController\` - Finance/billing pages
- \`controllers\\admin\\NetworkingController\` - Networking pages
- \`controllers\\admin\\SupportController\` - Support/helpdesk pages
- \`controllers\\admin\\SchedulingController\` - Scheduling pages
- \`controllers\\admin\\CRMController\` - CRM/leads pages
- \`controllers\\admin\\InventoryController\` - Inventory pages
- \`controllers\\admin\\ConfigController\` - Configuration pages
- \`controllers\\admin\\AdministrationController\` - Administration pages
- \`controllers\\admin\\DashboardController\` - Dashboard pages

## Available Portal Root Controllers
- \`controllers\\portal\\DashboardController\` - Portal dashboard
- \`controllers\\portal\\ServicesController\` - Customer services
- \`controllers\\portal\\FinanceController\` - Invoices/payments
- \`controllers\\portal\\SupportController\` - Support tickets
- \`controllers\\portal\\ProfileController\` - Customer profile
`;

// ---------------------------------------------------------------------------
// HOOKS
// ---------------------------------------------------------------------------
export const HOOKS_GUIDE = `# Hooks - Reacting to Splynx Events

Hooks allow your addon to react to events in Splynx (e.g., customer created, invoice paid).

## Defining Hooks in InstallController

\`\`\`php
public function getHooks(): array
{
    return [
        [
            'title' => 'My Addon Hook',
            'type' => 'cli',
            'path' => '/var/www/splynx/addons/my-addon/yii hook/process',
            'enabled' => true,
            'events' => [
                'customer/create' => true,
                'customer/edit' => true,
                'customer/delete' => true,
                'invoice/create' => true,
                'payment/add' => true,
            ],
        ],
    ];
}
\`\`\`

## Processing Hooks

Create \`commands/HookController.php\`:

\`\`\`php
<?php

namespace app\\commands;

use yii\\console\\Controller;

class HookController extends Controller
{
    /**
     * Process incoming hook events.
     * Data arrives as JSON via STDIN.
     */
    public function actionProcess(): void
    {
        $input = file_get_contents('php://stdin');
        $data = json_decode($input, true);

        if (!$data) {
            return;
        }

        $model = $data['model'] ?? '';
        $action = $data['action'] ?? '';
        $attributes = $data['attributes'] ?? [];
        $oldAttributes = $data['old_attributes'] ?? [];

        switch ("$model/$action") {
            case 'customer/create':
                $this->onCustomerCreated($attributes);
                break;
            case 'customer/edit':
                $this->onCustomerEdited($attributes, $oldAttributes);
                break;
            case 'customer/delete':
                $this->onCustomerDeleted($attributes);
                break;
            case 'invoice/create':
                $this->onInvoiceCreated($attributes);
                break;
            case 'payment/add':
                $this->onPaymentAdded($attributes);
                break;
        }
    }

    private function onCustomerCreated(array $attributes): void
    {
        // Handle customer creation
    }

    private function onCustomerEdited(array $attributes, array $oldAttributes): void
    {
        // Handle customer edit - compare attributes with oldAttributes
    }

    private function onCustomerDeleted(array $attributes): void
    {
        // Handle customer deletion
    }

    private function onInvoiceCreated(array $attributes): void
    {
        // Handle invoice creation
    }

    private function onPaymentAdded(array $attributes): void
    {
        // Handle payment
    }
}
\`\`\`

## Available Hook Events

### Administration
- \`administrator/create\`, \`administrator/edit\`, \`administrator/delete\`
- \`api_key/create\`, \`api_key/edit\`, \`api_key/delete\`
- \`location/create\`, \`location/edit\`, \`location/delete\`
- \`partner/create\`, \`partner/edit\`, \`partner/delete\`
- \`role/create\`, \`role/edit\`, \`role/delete\`

### Customers
- \`customer/create\`, \`customer/edit\`, \`customer/delete\`
- \`customer/change_password\`, \`customer/change_status\`
- \`customer_billing/edit\`
- \`customer_document/create\`, \`customer_document/edit\`, \`customer_document/delete\`
- \`customer_note/create\`, \`customer_note/edit\`, \`customer_note/delete\`

### Services
- \`internet_service/create\`, \`internet_service/edit\`, \`internet_service/delete\`
- \`internet_service/stop\`, \`internet_service/activate\`, \`internet_service/kill\`
- \`voice_service/create\`, \`voice_service/edit\`, \`voice_service/delete\`
- \`custom_service/create\`, \`custom_service/edit\`, \`custom_service/delete\`
- \`bundle_service/create\`, \`bundle_service/edit\`, \`bundle_service/delete\`

### Finance
- \`invoice/create\`, \`invoice/edit\`, \`invoice/delete\`, \`invoice/send\`, \`invoice/pay\`
- \`proforma/create\`, \`proforma/edit\`, \`proforma/delete\`, \`proforma/send\`
- \`payment/add\`, \`payment/edit\`, \`payment/delete\`
- \`transaction/create\`, \`transaction/edit\`, \`transaction/delete\`
- \`bank_statement/create\`, \`bank_statement/edit\`, \`bank_statement/delete\`
- \`cost/create\`, \`cost/edit\`, \`cost/delete\`

### Tariffs
- \`internet_tariff/create\`, \`internet_tariff/edit\`, \`internet_tariff/delete\`
- \`voice_tariff/create\`, \`voice_tariff/edit\`, \`voice_tariff/delete\`
- \`recurring_tariff/create\`, \`recurring_tariff/edit\`, \`recurring_tariff/delete\`
- \`one_time_tariff/create\`, \`one_time_tariff/edit\`, \`one_time_tariff/delete\`
- \`bundle_tariff/create\`, \`bundle_tariff/edit\`, \`bundle_tariff/delete\`

### Networking
- \`router/create\`, \`router/edit\`, \`router/delete\`
- \`ipv4_network/create\`, \`ipv4_network/edit\`, \`ipv4_network/delete\`
- \`ipv6_network/create\`, \`ipv6_network/edit\`, \`ipv6_network/delete\`
- \`cpe/create\`, \`cpe/edit\`, \`cpe/delete\`
- \`monitoring/create\`, \`monitoring/edit\`, \`monitoring/delete\`
- \`acs_device/create\`, \`acs_device/edit\`, \`acs_device/delete\`

### Support
- \`ticket/create\`, \`ticket/edit\`, \`ticket/delete\`, \`ticket/close\`, \`ticket/reopen\`
- \`ticket_message/create\`, \`ticket_message/edit\`, \`ticket_message/delete\`
- \`ticket_automation_rule/create\`, \`ticket_automation_rule/edit\`, \`ticket_automation_rule/delete\`

### CRM
- \`lead/create\`, \`lead/edit\`, \`lead/delete\`, \`lead/convert\`
- \`lead_note/create\`, \`lead_note/edit\`, \`lead_note/delete\`
- \`quote/create\`, \`quote/edit\`, \`quote/delete\`, \`quote/send\`

### Scheduling
- \`project/create\`, \`project/edit\`, \`project/delete\`
- \`task/create\`, \`task/edit\`, \`task/delete\`, \`task/close\`, \`task/reopen\`
- \`task_worklog/create\`, \`task_worklog/edit\`, \`task_worklog/delete\`
- \`workflow/create\`, \`workflow/edit\`, \`workflow/delete\`
`;

// ---------------------------------------------------------------------------
// DATABASE (MySQL & SQLite)
// ---------------------------------------------------------------------------
export const DATABASE_GUIDE = `# Database Access in Splynx Addons

Splynx addons can use both MySQL (main Splynx DB) and SQLite (local addon DB).

## MySQL - Accessing Main Splynx Database

### Configuration (config/db.php)

\`\`\`php
<?php

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
\`\`\`

### Add to web.php

\`\`\`php
<?php

return function ($params, $baseDir) {
    return [
        'components' => [
            'db' => require __DIR__ . '/db.php',
            // ... other components
        ],
    ];
};
\`\`\`

### Using ActiveRecord with MySQL

\`\`\`php
<?php

namespace app\\models;

use yii\\db\\ActiveRecord;

class MyModel extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%my_table}}'; // Resolves to SAA_my_table with prefix
    }

    public function rules(): array
    {
        return [
            [['name'], 'required'],
            [['name'], 'string', 'max' => 255],
            [['status'], 'integer'],
        ];
    }
}
\`\`\`

## SQLite - Local Addon Database

SQLite is enabled by default for addons. It's ideal for addon-specific data.

### Setup Steps

1. Create \`data/\` directory in your addon root (with write permissions)
2. Create migrations in \`migrations/\` directory
3. Create models extending appropriate base classes

### SQLite Migration Example

\`\`\`php
<?php

namespace app\\migrations;

use yii\\db\\Migration;

class m230101_000000_create_settings_table extends Migration
{
    public function safeUp(): void
    {
        $this->createTable('settings', [
            'id' => $this->primaryKey(),
            'key' => $this->string(255)->notNull()->unique(),
            'value' => $this->text(),
            'created_at' => $this->datetime(),
            'updated_at' => $this->datetime(),
        ]);
    }

    public function safeDown(): void
    {
        $this->dropTable('settings');
    }
}
\`\`\`

### SQLite Model Example

\`\`\`php
<?php

namespace app\\models;

use yii\\db\\ActiveRecord;

class Setting extends ActiveRecord
{
    public static function getDb()
    {
        return \\Yii::\\$app->sqliteDb;
    }

    public static function tableName(): string
    {
        return 'settings';
    }
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// MODELS
// ---------------------------------------------------------------------------
export const MODELS_GUIDE = `# Models in Splynx Addons

Models in Splynx addons extend base Splynx model classes to interact with the Splynx API.

## Base Model Classes

- \`splynx\\v2\\models\\customer\\BaseCustomer\` - Customer operations
- \`splynx\\v2\\models\\administration\\BaseAdministrator\` - Administrator operations
- \`splynx\\base\\BaseActiveApi\` - Generic API model for custom endpoints
- \`yii\\db\\ActiveRecord\` - Standard Yii2 ActiveRecord for DB models

## Customer Model Example

\`\`\`php
<?php

namespace app\\models;

use splynx\\v2\\models\\customer\\BaseCustomer;

class Customer extends BaseCustomer
{
    /**
     * Get the five most recently added customers.
     * @return Customer[]|null
     */
    public function getFiveLastAdded(): ?array
    {
        return $this->findAll(
            [],       // conditions
            [],       // additional params
            ['id' => 'DESC'],  // order
            5         // limit
        );
    }

    /**
     * Find customers by partner.
     */
    public function findByPartner(int $partnerId): ?array
    {
        return $this->findAll(
            ['partner_id' => $partnerId]
        );
    }
}
\`\`\`

## Custom API Model (for Datasets)

\`\`\`php
<?php

namespace app\\models;

use splynx\\base\\BaseActiveApi;
use splynx\\helpers\\ApiHelper;

class Agent extends BaseActiveApi
{
    const MODULE_NAME = 'splynx_mod_agents';

    public function getApiUrl(): string
    {
        return ApiHelper::getModuleApiUrl(self::MODULE_NAME);
    }

    /**
     * Find agents by IDs.
     */
    public static function findByIds(array $ids): ?array
    {
        $model = new static();
        return $model->findAll(['id' => $ids]);
    }

    /**
     * Find agent by name.
     */
    public static function findByName(string $name): ?self
    {
        $model = new static();
        $items = $model->findAll(['name' => $name], [], [], 1);
        return $items[0] ?? null;
    }

    /**
     * Get items formatted for select dropdown.
     */
    public static function getItemsForSelect(): array
    {
        $model = new static();
        $items = $model->findAll();
        $result = [];
        foreach ($items as $item) {
            $result[$item->id] = $item->name;
        }
        return $result;
    }
}
\`\`\`

## Available Base Model Methods

### BaseCustomer / BaseActiveApi
- \`findAll(conditions, params, order, limit)\` - Find multiple records
- \`findOne(id)\` - Find single record by ID
- \`save()\` - Create or update record
- \`delete()\` - Delete record
- \`getAttributes()\` - Get all attributes
- \`setAttribute(name, value)\` - Set attribute
- \`validate()\` - Validate model
- \`getErrors()\` - Get validation errors

### Common Customer Attributes
- \`id\`, \`login\`, \`password\`, \`name\`, \`email\`, \`phone\`
- \`status\` (active, inactive, blocked, disabled)
- \`partner_id\`, \`location_id\`
- \`billing_type\`, \`date_add\`
- \`street_1\`, \`city\`, \`zip_code\`, \`country\`
`;

// ---------------------------------------------------------------------------
// CONTROLLERS
// ---------------------------------------------------------------------------
export const CONTROLLERS_GUIDE = `# Controllers in Splynx Addons

Controllers handle HTTP requests and render views. They extend Yii2's Controller class.

## Basic Controller Template

\`\`\`php
<?php

namespace app\\controllers;

use app\\models\\Customer;
use yii\\base\\UnknownClassException;
use yii\\filters\\AccessControl;
use yii\\web\\Controller;
use yii\\web\\ErrorAction;

class SiteController extends Controller
{
    /**
     * Error handler action.
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
     * Access control - require authentication.
     */
    public function behaviors(): array
    {
        return [
            'access' => [
                'class' => AccessControl::class,
                'rules' => [
                    [
                        'allow' => true,
                        'roles' => ['@'], // Authenticated users only
                    ],
                ],
            ],
        ];
    }

    /**
     * Main page action.
     * @throws UnknownClassException
     */
    public function actionIndex(): string
    {
        $this->view->title = 'My Addon';
        $model = new Customer();

        return $this->render('index', [
            'model' => $model,
        ]);
    }

    /**
     * Detail page.
     */
    public function actionView(int $id): string
    {
        $model = new Customer();
        $customer = $model->findOne($id);

        if (!$customer) {
            throw new \\yii\\web\\NotFoundHttpException('Customer not found');
        }

        return $this->render('view', [
            'customer' => $customer,
        ]);
    }
}
\`\`\`

## Controller with Multiple User Identities

\`\`\`php
<?php

namespace app\\controllers;

use yii\\filters\\AccessControl;
use yii\\web\\Controller;

class PortalController extends Controller
{
    public function behaviors(): array
    {
        return [
            'access' => [
                'class' => AccessControl::class,
                'rules' => [
                    // Public actions (no auth required)
                    [
                        'actions' => ['callback', 'webhook'],
                        'allow' => true,
                        'roles' => ['?'],
                    ],
                    // Authenticated actions
                    [
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Public webhook endpoint.
     */
    public function actionCallback(): string
    {
        // Process callback without authentication
        $request = \\Yii::\\$app->request;
        $data = $request->getBodyParams();
        // ... process
        return $this->asJson(['status' => 'ok']);
    }
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// VIEWS
// ---------------------------------------------------------------------------
export const VIEWS_GUIDE = `# Views in Splynx Addons

Splynx addons use Twig templating for views and PHP for layouts.

## Main Layout (views/layouts/main.php)

\`\`\`php
<?php

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
\`\`\`

## Twig View Examples

### Index Page (views/site/index.twig)

\`\`\`twig
<div class="panel panel-default">
    <div class="panel-heading">
        <h3>{{ this.title }}</h3>
    </div>
    <div class="panel-body">
        <div class="table-scroll-wrapper">
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Login</th>
                        <th>Full name</th>
                        <th>Email</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {% for customer in model.getFiveLastAdded() %}
                        <tr>
                            <td>{{ customer.id }}</td>
                            <td>{{ customer.login }}</td>
                            <td>{{ customer.name }}</td>
                            <td>{{ customer.email }}</td>
                            <td>{{ customer.status }}</td>
                        </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
</div>
\`\`\`

### Error Page (views/site/error.twig)

\`\`\`twig
<div class="site-error">
    <h1>{{ Html.encode(name) }}</h1>
    <div class="alert alert-danger">
        {{ message | nl2br | raw }}
    </div>
    <p>The above error occurred while the Web server was processing your request.</p>
    <p>Please contact us if you think this is a server error. Thank you.</p>
</div>
\`\`\`

### Form Example

\`\`\`twig
<div class="panel panel-default">
    <div class="panel-heading">Settings</div>
    <div class="panel-body">
        <form method="post" action="{{ Url.to(['site/save']) }}">
            {{ Html.hiddenInput(app.request.csrfParam, app.request.csrfToken) | raw }}

            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" class="form-control" id="name" name="name"
                       value="{{ model.name }}">
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" class="form-control" id="email" name="email"
                       value="{{ model.email }}">
            </div>

            <button type="submit" class="btn btn-primary">Save</button>
        </form>
    </div>
</div>
\`\`\`

## Asset Bundle (assets/AppAsset.php)

\`\`\`php
<?php

namespace app\\assets;

use yii\\web\\AssetBundle;
use yii\\web\\YiiAsset;
use yii\\bootstrap\\BootstrapAsset;
use splynx\\assets\\HelperAsset;
use yii\\web\\View;

class AppAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';

    public $css = [
        'css/site.css',
    ];

    public $js = [];

    public $depends = [
        YiiAsset::class,
        BootstrapAsset::class,
        HelperAsset::class,
    ];

    public $jsOptions = [
        'position' => View::POS_HEAD,
    ];
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// WEB CONFIG
// ---------------------------------------------------------------------------
export const WEB_CONFIG_GUIDE = `# Web Configuration (config/web.php)

The web.php file configures the Yii2 web application for your addon.

## Basic Configuration

\`\`\`php
<?php

use splynx\\v2\\models\\administration\\BaseAdministrator;

return function ($params, $baseDir) {
    return [
        'components' => [
            'request' => [
                'baseUrl' => '/my-addon',
                'enableCookieValidation' => false,
            ],
            'user' => [
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
                'enableAutoLogin' => false,
            ],
        ],
    ];
};
\`\`\`

## With Redis Support

\`\`\`php
<?php

use splynx\\v2\\models\\administration\\BaseAdministrator;
use splynx\\helpers\\ConfigHelper;

return function ($params, $baseDir) {
    return [
        'components' => [
            'request' => [
                'baseUrl' => '/my-addon',
                'enableCookieValidation' => false,
            ],
            'user' => [
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
                'enableAutoLogin' => false,
            ],
            'redis' => array_merge(
                ['class' => 'yii\\redis\\Connection'],
                ConfigHelper::getRedisConfigForAddOns()
            ),
        ],
    ];
};
\`\`\`

## With MySQL Database

\`\`\`php
<?php

use splynx\\v2\\models\\administration\\BaseAdministrator;

return function ($params, $baseDir) {
    return [
        'components' => [
            'request' => [
                'baseUrl' => '/my-addon',
                'enableCookieValidation' => false,
            ],
            'user' => [
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
                'enableAutoLogin' => false,
            ],
            'db' => require __DIR__ . '/db.php',
        ],
    ];
};
\`\`\`

## With Multiple User Identities (Admin + Customer Portal)

\`\`\`php
<?php

use splynx\\v2\\models\\administration\\BaseAdministrator;
use splynx\\v2\\models\\customer\\BaseCustomer;

return function ($params, $baseDir) {
    return [
        'components' => [
            'request' => [
                'baseUrl' => '/my-addon',
                'enableCookieValidation' => false,
            ],
            'admin' => [
                'class' => 'yii\\web\\User',
                'identityClass' => BaseAdministrator::class,
                'idParam' => 'splynx_admin_id',
                'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
                'enableAutoLogin' => false,
            ],
            'customer' => [
                'class' => 'yii\\web\\User',
                'identityClass' => BaseCustomer::class,
                'idParam' => 'splynx_customer_id',
                'loginUrl' => '/portal/login/?return=%2Fmy-addon%2F',
                'enableAutoLogin' => false,
            ],
        ],
    ];
};
\`\`\`

## URL Rules (config/url_rules.php)

\`\`\`php
<?php

return [
    '<alias:index>' => 'site/<alias>',
    'api/<action>' => 'api/<action>',
    'admin/<action>' => 'admin/<action>',
];
\`\`\`
`;

// ---------------------------------------------------------------------------
// PAYMENT ADDON GUIDE
// ---------------------------------------------------------------------------
export const PAYMENT_ADDON_GUIDE = `# Building a Payment Addon for Splynx

Payment addons integrate external payment gateways with Splynx billing.

## Key Components

1. **InstallController** - Define payment accounts, entry points, permissions
2. **PaymentAccount model** - Store payment tokens/credentials per customer
3. **Financial Handler** - Process charges using stored tokens
4. **Callback Controller** - Handle payment gateway callbacks/webhooks
5. **Portal Controller** - Customer-facing payment UI

## InstallController for Payment Addon

\`\`\`php
<?php

namespace app\\commands;

use splynx\\base\\BaseInstallController;
use Yii;

class InstallController extends BaseInstallController
{
    public $module_status = self::MODULE_STATUS_ENABLED;
    public static $minimumSplynxVersion = '4.1';

    public function getAddOnTitle(): string
    {
        return 'My Payment Gateway';
    }

    public function getModuleName(): string
    {
        return 'splynx_my_payment';
    }

    public function getApiPermissions(): array
    {
        return [
            ['controller' => 'api\\admin\\customers\\Customer'],
            ['controller' => 'api\\admin\\customers\\CustomerPaymentAccounts'],
            ['controller' => 'api\\admin\\finance\\Invoices'],
            ['controller' => 'api\\admin\\finance\\Payments'],
            ['controller' => 'api\\admin\\finance\\BankStatements'],
        ];
    }

    public function getEntryPoints(): array
    {
        return [
            // Admin configuration page
            [
                'name' => 'my_payment_config',
                'title' => $this->getAddOnTitle(),
                'root' => 'controllers\\admin\\ConfigController',
                'place' => 'admin',
                'type' => 'menu_link',
                'url' => '%2Fmy-payment%2Fadmin%2Fconfig',
                'icon' => 'fa-credit-card',
            ],
            // Portal payment gateway (for customer self-service)
            [
                'name' => 'my_payment_portal',
                'title' => $this->getAddOnTitle(),
                'root' => 'controllers\\portal\\PayController',
                'place' => 'portal',
                'type' => 'menu_link',
                'url' => '%2Fmy-payment%2Fpay',
                'icon' => 'fa-credit-card',
            ],
        ];
    }

    public function getPaymentAccounts(): array
    {
        return [
            'title' => Yii::t('app', 'My Payment Gateway'),
            'field_1' => Yii::t('app', 'Account ID'),
            'field_2' => Yii::t('app', 'Payment Token'),
            'field_3' => Yii::t('app', 'Last 4 digits'),
            'field_4' => Yii::t('app', 'Cardholder Name'),
            'field_5' => Yii::t('app', 'Expiry Date'),
        ];
    }
}
\`\`\`

## Financial Handler

Location: \`/var/www/splynx/system/external_handlers/finance/charge/\`

Financial handlers process charges using stored payment tokens.
Examine the Braintree addon as a reference implementation.

## Callback Processing (Splynx 4.1+)

\`\`\`php
<?php

namespace app\\controllers\\portal;

use splynx\\helpers\\FinanceStatementCallback;
use app\\models\\BasePaymentModel;
use yii\\web\\Controller;

class CallbackController extends Controller
{
    public function behaviors(): array
    {
        return [
            'access' => [
                'class' => \\yii\\filters\\AccessControl::class,
                'rules' => [
                    [
                        'actions' => ['process', 'webhook'],
                        'allow' => true,
                        'roles' => ['?'], // Allow unauthenticated
                    ],
                ],
            ],
        ];
    }

    /**
     * Process payment gateway callback.
     */
    public function actionProcess(): string
    {
        $request = \\Yii::\\$app->request;
        $customerId = $request->get('customer_id');
        $amount = $request->get('amount');
        $transactionId = $request->get('transaction_id');

        // Verify and process the payment...
        $bankStatement = BasePaymentModel::createFromCallback(
            $customerId, $amount, $transactionId
        );

        // Send result to Splynx
        FinanceStatementCallback::sendResult($bankStatement);

        return $this->render('result', [
            'success' => true,
        ]);
    }
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// DATASETS
// ---------------------------------------------------------------------------
export const DATASET_GUIDE = `# Custom Datasets in Splynx Addons

Datasets allow you to create entirely new data modules (entities) in Splynx,
complete with API endpoints and UI integration.

## InstallController Configuration

\`\`\`php
<?php

namespace app\\commands;

use splynx\\base\\BaseInstallController;
use splynx\\models\\ConsoleModuleConfig;

class InstallController extends BaseInstallController
{
    public function getModuleName(): string
    {
        return 'splynx_mod_agents';
    }

    public function getSimpleModuleName(): string
    {
        return 'splynx_mod_agents';
    }

    public function getApiPermissions(): array
    {
        return [
            [
                'controller' => 'api\\admin\\modules\\' . $this->getSimpleModuleName(),
                'actions' => ['index', 'add', 'update', 'view'],
            ],
        ];
    }

    public function getAdditionalFields(): array
    {
        return [
            [
                'main_module' => $this->getSimpleModuleName(),
                'name' => 'name',
                'title' => 'Name',
                'type' => 'string',
                'required' => true,
            ],
            [
                'main_module' => $this->getSimpleModuleName(),
                'name' => 'commission_percent',
                'title' => 'Commission %',
                'type' => 'decimal',
                'required' => false,
            ],
            [
                'main_module' => $this->getSimpleModuleName(),
                'name' => 'email',
                'title' => 'Email',
                'type' => 'string',
                'required' => false,
            ],
            [
                'main_module' => $this->getSimpleModuleName(),
                'name' => 'customer_id',
                'title' => 'Related Customer',
                'type' => 'relation',
                'required' => false,
            ],
        ];
    }

    public function getNewModulesConfig(): array
    {
        return [
            [
                'name' => $this->getSimpleModuleName(),
                'title' => 'Agents',
                'icon' => 'fa-users',
                'root' => 'controllers\\admin\\AgentsController',
            ],
        ];
    }

    public function actionIndex(): void
    {
        parent::actionIndex();

        // Create the module configuration
        $moduleConfig = new ConsoleModuleConfig();
        $moduleConfig->name = $this->getSimpleModuleName();
        $moduleConfig->title = 'Agents';
        $moduleConfig->icon = 'fa-users';
        $moduleConfig->save();
    }
}
\`\`\`

## Base Model for Datasets

\`\`\`php
<?php

namespace app\\models;

use splynx\\base\\BaseActiveApi;
use splynx\\helpers\\ApiHelper;

abstract class BaseModuleItem extends BaseActiveApi
{
    abstract public function getModuleName(): string;

    public function getApiUrl(): string
    {
        return ApiHelper::getModuleApiUrl($this->getModuleName());
    }

    public function deleteItem(int $id): bool
    {
        return ApiHelper::deleteModuleItem($this->getModuleName(), $id);
    }
}
\`\`\`

## Concrete Dataset Model

\`\`\`php
<?php

namespace app\\models;

class Agent extends BaseModuleItem
{
    const MODULE_NAME = 'splynx_mod_agents';

    public function getModuleName(): string
    {
        return self::MODULE_NAME;
    }

    public static function findByIds(array $ids): ?array
    {
        $model = new static();
        return $model->findAll(['id' => $ids]);
    }

    public static function findByName(string $name): ?self
    {
        $model = new static();
        $items = $model->findAll(['name' => $name], [], [], 1);
        return $items[0] ?? null;
    }

    public static function getItemsForSelect(): array
    {
        $model = new static();
        $items = $model->findAll();
        $result = [];
        if ($items) {
            foreach ($items as $item) {
                $result[$item->id] = $item->name;
            }
        }
        return $result;
    }
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// BROWSER COMMUNICATION & REDIS
// ---------------------------------------------------------------------------
export const BROWSER_COMMUNICATION_GUIDE = `# Browser Communication & Redis in Splynx Addons

## Sending Notifications to Admin Browser

### Direct Script Method

\`\`\`php
$adminId = 1;
$message = 'Sync completed successfully';
$addToPanel = 1; // 0 = display only, 1 = save and display
$time = date('Y-m-d H:i:s');
$type = 'success'; // success (green), message (grey), warning (yellow), info (blue), error (red)

exec("/var/www/splynx/system/script/tools send-notification " .
    "--admin={$adminId} " .
    "--message='{$message}' " .
    "--addToPanel={$addToPanel} " .
    "--time='{$time}' " .
    "--type={$type}");
\`\`\`

### Notification Types
- \`success\` - Green notification
- \`message\` - Grey notification
- \`warning\` - Yellow notification
- \`info\` - Blue notification
- \`error\` - Red notification

## WebSocket Communication

For real-time bidirectional communication, use the BrowserEventEmitter component
and RedisSession base class from the Splynx framework.

## Redis Integration

### Configuration (config/web.php)

\`\`\`php
'redis' => array_merge(
    ['class' => 'yii\\redis\\Connection'],
    ConfigHelper::getRedisConfigForAddOns()
),
\`\`\`

### Usage

\`\`\`php
// Set a value
Yii::\\$app->redis->set('my_key', 'my_value');

// Get a value
$value = Yii::\\$app->redis->get('my_key');

// Delete a key
Yii::\\$app->redis->delete('my_key');

// Set with expiration (TTL in seconds)
Yii::\\$app->redis->setex('my_key', 3600, 'my_value');

// Check if key exists
$exists = Yii::\\$app->redis->exists('my_key');
\`\`\`
`;

// ---------------------------------------------------------------------------
// USER AUTHORIZATION
// ---------------------------------------------------------------------------
export const USER_AUTHORIZATION_GUIDE = `# User Authorization in Splynx Addons

## Single User Identity (Admin Only)

Default setup - addon is accessible only to authenticated Splynx administrators.

### config/web.php

\`\`\`php
'user' => [
    'identityClass' => 'splynx\\v2\\models\\administration\\BaseAdministrator',
    'idParam' => 'splynx_admin_id',
    'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
    'enableAutoLogin' => false,
    'authTimeout' => 1800, // 30 minutes session timeout
],
\`\`\`

## Multiple User Identities (Admin + Customer)

When your addon needs to serve both administrators and customers (e.g., payment portal).

### config/web.php

\`\`\`php
'admin' => [
    'class' => 'yii\\web\\User',
    'identityClass' => 'splynx\\v2\\models\\administration\\BaseAdministrator',
    'idParam' => 'splynx_admin_id',
    'loginUrl' => '/admin/login/?return=%2Fmy-addon%2F',
    'enableAutoLogin' => false,
],
'customer' => [
    'class' => 'yii\\web\\User',
    'identityClass' => 'splynx\\v2\\models\\customer\\BaseCustomer',
    'idParam' => 'splynx_customer_id',
    'loginUrl' => '/portal/login/?return=%2Fmy-addon%2F',
    'enableAutoLogin' => false,
],
\`\`\`

### Access Control in Controllers

\`\`\`php
public function behaviors(): array
{
    return [
        'access' => [
            'class' => AccessControl::class,
            'user' => 'admin', // or 'customer'
            'rules' => [
                [
                    'actions' => ['callback'],
                    'allow' => true,
                    'roles' => ['?'], // Guest (no auth required)
                ],
                [
                    'allow' => true,
                    'roles' => ['@'], // Authenticated only
                ],
            ],
        ],
    ];
}
\`\`\`

## Custom User Identity

You can implement your own user identity:

\`\`\`php
<?php

namespace app\\models;

use yii\\web\\IdentityInterface;

class User implements IdentityInterface
{
    public $id;
    public $username;
    public $authKey;

    public static function findIdentity($id) { /* ... */ }
    public static function findIdentityByAccessToken($token, $type = null) { /* ... */ }
    public function getId() { return $this->id; }
    public function getAuthKey() { return $this->authKey; }
    public function validateAuthKey($authKey) { return $this->authKey === $authKey; }
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// SPLYNX API REFERENCE
// ---------------------------------------------------------------------------
export const SPLYNX_API_REFERENCE = `# Splynx REST API v2.0 Reference

Base URL: \`https://<your-splynx-url>/api/2.0/\`
Full docs: https://splynx.docs.apiary.io

## Authentication

### Method 1: API Key with HMAC-SHA256 Signature (Recommended)
\`\`\`
Authorization: Splynx-EA (key=<API_KEY>&nonce=<TIMESTAMP>&signature=<HMAC_SHA256>)
\`\`\`
- \`key\` = Your API key from Administration → API Keys
- \`nonce\` = Current Unix timestamp in seconds
- \`signature\` = HMAC-SHA256 of (nonce + API key) using API secret

### Method 2: Access Token
1. POST \`/api/2.0/admin/auth/tokens\` with \`{login, password}\`
2. Receive token (valid 30 minutes)
3. Use token in subsequent requests

### Method 3: Basic Auth (Development only)
\`\`\`
Authorization: Basic <base64(api_secret)>
\`\`\`

## Response Codes
- 200 - Success (GET/HEAD)
- 201 - Created (POST)
- 202 - Accepted (PUT)
- 204 - No Content (DELETE)
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 405 - Method Not Allowed
- 500 - Internal Server Error

## Common Query Parameters
- \`main_attributes\` - Filter by main fields
- \`additional_attributes\` - Filter by custom fields
- \`order\` - Sort (\`{"field":"id","direction":"DESC"}\`)
- \`limit\` - Max results (default varies)
- \`offset\` - Pagination offset

## Key Endpoints

### Authentication
- POST \`/admin/auth/tokens\` - Get access token
- GET \`/admin/auth/tokens/{token}\` - Renew token
- DELETE \`/admin/auth/tokens/{token}\` - Revoke token

### Customers
- GET \`/admin/customers/customer\` - List customers
- POST \`/admin/customers/customer\` - Create customer
- GET \`/admin/customers/customer/{id}\` - Get customer
- PUT \`/admin/customers/customer/{id}\` - Update customer
- DELETE \`/admin/customers/customer/{id}\` - Delete customer
- GET \`/admin/customers/customer-info/{id}\` - Get customer info
- GET \`/admin/customers/billing-info/{id}\` - Get billing info
- GET \`/admin/customers/customer-documents/{id}\` - List documents
- GET \`/admin/customers/customers-online\` - List online customers

### Services
- GET \`/admin/customers/customer/{id}/internet-services\` - List internet services
- POST \`/admin/customers/customer/{id}/internet-services\` - Add internet service
- GET \`/admin/customers/customer/{id}/voice-services\` - List voice services
- GET \`/admin/customers/customer/{id}/custom-services\` - List custom services
- GET \`/admin/customers/customer/{id}/bundle-services\` - List bundle services

### Tariffs
- GET \`/admin/tariffs/internet\` - List internet tariffs
- POST \`/admin/tariffs/internet\` - Create internet tariff
- GET \`/admin/tariffs/internet/{id}\` - Get tariff
- PUT \`/admin/tariffs/internet/{id}\` - Update tariff
- DELETE \`/admin/tariffs/internet/{id}\` - Delete tariff
- Same pattern for: voice, recurring, bundle, one-time

### Finance
- GET \`/admin/finance/invoices\` - List invoices
- POST \`/admin/finance/invoices\` - Create invoice
- GET \`/admin/finance/invoices/{id}\` - Get invoice
- PUT \`/admin/finance/invoices/{id}\` - Update invoice
- DELETE \`/admin/finance/invoices/{id}\` - Delete invoice
- Same pattern for: payments, transactions, proforma, bank-statements, costs

### Networking
- GET \`/admin/networking/routers\` - List routers
- POST \`/admin/networking/routers\` - Add router
- GET \`/admin/networking/ipv4-networks\` - List IPv4 networks
- GET \`/admin/networking/ipv6-networks\` - List IPv6 networks
- GET \`/admin/networking/cpe\` - List CPE devices
- GET \`/admin/networking/monitoring\` - List monitoring entries

### Support / Helpdesk
- GET \`/admin/support/tickets\` - List tickets
- POST \`/admin/support/tickets\` - Create ticket
- GET \`/admin/support/tickets/{id}\` - Get ticket
- PUT \`/admin/support/tickets/{id}\` - Update ticket
- GET \`/admin/support/tickets/{id}/messages\` - List ticket messages
- POST \`/admin/support/tickets/{id}/messages\` - Add message

### CRM
- GET \`/admin/crm/leads\` - List leads
- POST \`/admin/crm/leads\` - Create lead
- GET \`/admin/crm/leads/{id}\` - Get lead
- PUT \`/admin/crm/leads/{id}\` - Update lead (or convert)
- GET \`/admin/crm/quotes\` - List quotes

### Scheduling
- GET \`/admin/scheduling/projects\` - List projects
- GET \`/admin/scheduling/tasks\` - List tasks

### Administration
- GET \`/admin/administration/administrators\` - List admins
- GET \`/admin/administration/locations\` - List locations
- GET \`/admin/administration/partners\` - List partners

### FUP (Fair Usage Policy)
- GET \`/admin/fup/counter\` - List FUP counters
- GET \`/admin/fup/policies\` - List FUP policies
- GET \`/admin/fup/usage/{service_id}\` - Get traffic usage

### Dashboard
- GET \`/admin/dashboard/dashboard\` - Get admin widgets
- OPTIONS \`/admin/dashboard/dashboard\` - Get widget list

## PHP API Client Usage

\`\`\`php
// From addon code using Splynx's internal API
use splynx\\v2\\models\\customer\\BaseCustomer;

$customer = new BaseCustomer();

// Find all customers
$customers = $customer->findAll();

// Find by conditions
$active = $customer->findAll(['status' => 'active']);

// Find one
$single = $customer->findOne(123);

// Create
$newCustomer = new BaseCustomer();
$newCustomer->name = 'John Doe';
$newCustomer->email = 'john@example.com';
$newCustomer->login = 'johndoe';
$newCustomer->save();
\`\`\`

## External API Client (PHP)

\`\`\`php
// Using splynx-php-api package
require_once 'vendor/autoload.php';

$api = new SplynxApi('https://your-splynx.com', 'API_KEY', 'API_SECRET');

// Get all customers
$customers = $api->get('admin/customers/customer');

// Create customer
$newCustomer = $api->post('admin/customers/customer', [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'login' => 'johndoe',
    'password' => 'secure123',
    'partner_id' => 1,
    'location_id' => 1,
]);

// Update customer
$api->put('admin/customers/customer/123', [
    'name' => 'John Updated',
]);

// Delete customer
$api->delete('admin/customers/customer/123');
\`\`\`
`;

// ---------------------------------------------------------------------------
// COMPOSER.JSON TEMPLATE
// ---------------------------------------------------------------------------
export const COMPOSER_JSON_TEMPLATE = `{
    "name": "splynx/splynx-addon-{{ADDON_SLUG}}",
    "description": "{{ADDON_DESCRIPTION}}",
    "keywords": [
        "splynx"
    ],
    "homepage": "https://splynx.com",
    "type": "project",
    "license": "BSD-3-Clause",
    "authors": [
        {
            "name": "{{AUTHOR_NAME}}",
            "email": "{{AUTHOR_EMAIL}}",
            "role": "Developer"
        }
    ],
    "require": {
    },
    "require-dev": {
    },
    "config": {
        "sort-packages": true
    }
}`;

// ---------------------------------------------------------------------------
// SPLYNX PLATFORM OVERVIEW
// ---------------------------------------------------------------------------
export const SPLYNX_PLATFORM_OVERVIEW = `# Splynx Platform Overview

Splynx is a comprehensive ISP management and billing platform. Understanding its modules
helps you build addons that integrate properly.

## Core Modules

### Customer Management
- Customer profiles (personal info, contacts, addresses)
- Customer statuses: New, Active, Inactive, Blocked, Disabled
- Login/password management
- Document management (contracts, invoices, etc.)
- Notes and comments
- Customer portal (self-service)

### Services
- **Internet services** - PPPoE, DHCP, Static IP, Hotspot
- **Voice services** - VoIP, SIP trunks
- **Custom services** - Any recurring/one-time service
- **Bundle services** - Combinations of the above
- Service statuses: Active, Disabled, Stopped, Pending

### Billing & Finance
- Recurring billing (prepaid/postpaid)
- Invoicing (auto-generate, manual)
- Proforma invoices
- Payments (cash, bank transfer, online gateways)
- Transactions
- Bank statements
- Credit notes
- Costs tracking
- Tax management

### Networking
- Router management (MikroTik, Cisco, Juniper, etc.)
- IPv4/IPv6 address management
- CPE (Customer Premises Equipment) management
- RADIUS authentication
- Bandwidth management
- Network monitoring
- ACS (Auto Configuration Server) / TR-069
- Hotspot management

### CRM (Customer Relationship Management)
- Lead management
- Quotes/proposals
- Lead-to-customer conversion
- Sales pipeline

### Support / Helpdesk
- Ticket system
- Email integration
- Automation rules
- Ticket groups, types, priorities
- SLA management

### Scheduling
- Projects
- Tasks
- Checklists
- Work logs
- Workflows
- Calendar

### Inventory
- Products catalog
- Vendors/suppliers
- Stock management
- Rental/sales items
- Barcodes

### Administration
- Multi-admin with roles/permissions
- Partners (multi-tenant)
- Locations
- API keys management
- System configuration
- Backup/restore

## Addon Integration Points
Addons can integrate with ANY of the above modules through:
1. Entry points (menu links, tabs, code blocks, action links)
2. Hooks (event listeners on any entity CRUD operation)
3. Additional fields (custom fields on any entity)
4. API permissions (access to any API endpoint)
5. Custom datasets (new entity types)
6. Payment gateways (financial handlers)
7. Browser notifications
8. Redis pub/sub for real-time features

## Technical Stack
- PHP 7.4+ / 8.x
- Yii2 Framework
- MySQL/MariaDB
- SQLite (for addon data)
- Redis
- RADIUS (FreeRADIUS)
- Nginx web server
- Debian/Ubuntu Linux
- Bootstrap CSS
- jQuery
- Twig templating
`;
