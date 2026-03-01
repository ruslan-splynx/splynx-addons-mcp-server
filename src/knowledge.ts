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

// ---------------------------------------------------------------------------
// ACCOUNTING / INTEGRATION ADDON GUIDE
// ---------------------------------------------------------------------------
export const ACCOUNTING_ADDON_GUIDE = `# Accounting & External Integration Addon Guide

This guide covers advanced patterns used by accounting integration addons (QuickBooks, Xero, etc.)
that synchronize data bidirectionally between Splynx and external accounting platforms.

## Overview

An accounting addon is significantly more complex than a basic addon. It involves:
- OAuth2 authentication with external APIs
- Bidirectional data synchronization (customers, invoices, credit notes, payments)
- Entity pairing (mapping Splynx entities to external entities)
- API rate limiting
- Process locking (PID restrictions)
- Cron-based background sync
- Complex DI container wiring (Bootstrap class)
- License checking
- Multi-log targets
- Build/packaging with ionCube

## Directory Structure (Accounting Addon)

\`\`\`
my-accounting-addon/
├── assets/AppAsset.php
├── base/
│   └── Bootstrap.php                # DI container wiring (BootstrapInterface)
├── build/
│   ├── config.php                   # Build metadata, conflicts, symlink
│   ├── sync.php                     # Release script
│   └── package-files/
│       └── etc/
│           ├── cron.d/              # Cron job definition
│           └── nginx/sites-available/  # Nginx location config
├── commands/
│   ├── BaseCommandController.php    # Shared console command base
│   ├── InstallController.php        # Install/uninstall with accounting init
│   ├── SyncController.php           # Cron-driven sync orchestrator
│   └── ToolsController.php          # Manual sync/reset/migration tools
├── components/
│   ├── LicenseChecker.php           # ionCube license validation
│   ├── ValidateConfig.php           # Pre-sync config validation
│   └── <provider>/                  # e.g. quickbooks/ or xero/
│       ├── AccountingApiCaller.php  # API proxy with rate limiting
│       ├── exceptions/
│       │   ├── Exception.php
│       │   ├── ApiAuthException.php      # HTTP 401
│       │   ├── ApiCallException.php      # General API errors
│       │   └── ApiCallLimitException.php # HTTP 429
│       └── oauth2/
│           ├── AuthService.php      # OAuth2 token management
│           └── AccessToken.php      # Token value object
├── config/
│   ├── common.php                   # Shared web+console config with Bootstrap
│   ├── config.json                  # Settings: api, accounting_api, sync, cron blocks
│   ├── console.php                  # Console config with license check
│   ├── db.php                       # SQLite DB connection
│   ├── url_rules.php
│   ├── validator_launch_time.php    # Custom cron time validator
│   └── web.php                      # Web config with license check
├── controllers/
│   ├── AuthController.php           # OAuth2 connect/disconnect flow
│   ├── ConfigController.php         # Category/tax/bank mapping UI
│   ├── ManualPairingCustomersController.php  # Manual customer pairing
│   ├── SiteController.php           # Dashboard, sync trigger, log tailing
│   └── ToolsController.php          # Reset, migration tools
├── defaults/
│   └── etc/cron.d/                  # Default cron for deployment
├── helpers/
│   ├── AuthTokenHelper.php          # Redis-based OAuth token storage
│   ├── CompareHelper.php            # Float comparison for financials
│   ├── ConfigHelper.php             # Addon config read/write
│   └── TailHelper.php              # Log file tailing for real-time UI
├── migrations/                      # SQLite tables for pair/limit/pid data
├── models/
│   ├── accounting/                  # Accounting status tracking
│   │   ├── BaseAccounting.php       # Abstract: status, modified, soft-delete
│   │   ├── BaseAccountingMapping.php # Abstract: reference data mapping
│   │   ├── AccountingCustomers.php
│   │   ├── AccountingInvoices.php
│   │   ├── AccountingPayments.php
│   │   ├── AccountingCreditNotes.php
│   │   ├── AccountingCategories.php    # Mapping table
│   │   ├── AccountingTaxRates.php      # Mapping table
│   │   ├── AccountingBankAccounts.php  # Mapping table
│   │   └── config/
│   │       └── CategoriesMappingForm.php
│   ├── limit/                       # API rate limiting
│   │   ├── ApiLimitInterface.php
│   │   ├── ApiLimit.php             # Per-call tracking
│   │   ├── ApiLimitCounter.php      # Per-minute/day counter
│   │   └── ApiLimitService.php      # Composite limiter
│   ├── pair/                        # Entity pairing (Splynx <-> External)
│   │   ├── BasePair.php             # Abstract ActiveRecord with change detection
│   │   ├── PairCustomer.php
│   │   ├── PairInvoice.php
│   │   ├── PairPayment.php          # In-memory only (not persisted)
│   │   ├── PairCreditNote.php
│   │   ├── PairExpense.php          # In-memory only
│   │   ├── PairCollection.php       # Batch API request aggregator
│   │   └── CustomersManualPairing.php
│   ├── splynx/                      # Splynx entity wrappers
│   │   ├── Customer.php, Invoice.php, Payment.php, CreditNote.php
│   │   ├── Tax.php, Partners.php, PaymentsTypes.php
│   │   ├── BankStatement.php, BankStatementProcess.php
│   │   └── db/                      # Direct DB models
│   ├── PidRestriction.php           # Process locking
│   ├── Resetable.php                # Interface for data reset
│   └── SyncService.php              # Central sync orchestrator
├── views/
│   ├── auth/                        # OAuth form and result
│   ├── common/menu.twig             # Addon navigation menu
│   ├── config/                      # Config UI with category mapping
│   ├── entry-point/                 # JS injection into Splynx core pages
│   │   ├── categories-config.twig
│   │   ├── bank-accounts-config.twig
│   │   ├── tax-rates-config.twig
│   │   └── check-notification.twig  # Dashboard notification
│   ├── manual-pairing-customers/    # Manual pairing UI
│   ├── site/                        # Main dashboard, sync status
│   └── tools/                       # Tools/reset UI
├── widgets/Alert.php
├── web/, yii, composer.json
\`\`\`

## 1. OAuth2 Flow with External API

Accounting addons use OAuth2 authorization code flow with a remote Splynx auth app:

### Auth Flow
1. User clicks "Connect" -> addon generates random token, stores in Redis (600s TTL)
2. User redirected to remote Splynx auth app URL with domain, scope, token
3. Remote app handles actual OAuth flow with the provider (QuickBooks/Xero)
4. Remote app POSTs access token data back to addon's \`actionConnectResult()\`
5. Addon validates Redis token, saves access token to config (encrypted field)

### AuthService Pattern
\`\`\`php
class AuthService
{
    public function getNewAccessToken($code, $realmOrTenant) { /* Exchange code for tokens */ }
    public function refreshAccessToken() { /* Refresh expired access token */ }
    public function isNeedToAuth()    { /* Check if refresh token expired */ }
    public function isNeedToRefresh() { /* Check if access token expires within 600s */ }
}
\`\`\`

### AccessToken Value Object
\`\`\`php
// Stored serialized + base64-encoded in config with type "encrypted", "hidden": true
class AccessToken
{
    public $accessToken;
    public $refreshToken;
    public $accessTokenExpiresAt;
    public $refreshTokenExpiresAt;
    public $realmId; // or tenantId

    public function save()
    {
        ConfigHelper::set('oauth2_access_token', base64_encode(serialize($this)));
    }
}
\`\`\`

### AuthController
\`\`\`php
class AuthController extends Controller
{
    // Disable CSRF for external callback
    public function beforeAction($action)
    {
        if ($action->id === 'connect-result') {
            $this->enableCsrfValidation = false;
        }
        return parent::beforeAction($action);
    }

    public function actionConnect()
    {
        $token = AuthTokenHelper::generateAndStore(); // Redis with 600s TTL
        $url = ConfigHelper::get('auth_url') . '?' . http_build_query([
            'splynx_url' => ConfigHelper::get('splynx_domain'),
            'token' => $token,
        ]);
        return $this->redirect($url);
    }

    public function actionConnectResult()
    {
        // Validate Redis token, save access token, sync organizations
    }
}
\`\`\`

### AuthTokenHelper (Redis)
\`\`\`php
class AuthTokenHelper
{
    public static function generateAndStore(): string
    {
        $token = Yii::$app->security->generateRandomString(64);
        RedisHelper::setex(static::$tokenName, 600, $token);
        return $token;
    }

    public static function validate($token): bool
    {
        return RedisHelper::get(static::$tokenName) === $token;
    }
}
\`\`\`

## 2. Sync Engine Architecture

The sync engine is the core of an accounting addon, responsible for bidirectional data synchronization.

### Central SyncService
The SyncService orchestrates all sync operations (typically 2000-3000+ lines):

\`\`\`php
class SyncService
{
    // Customer sync
    public function addNewCustomers()    { /* Batch export new customers */ }
    public function updateCustomers()    { /* Batch export modified customers */ }

    // Invoice sync
    public function addNewInvoices()     { /* Export invoices with category/tax mapping */ }
    public function updateInvoices()     { /* Update modified invoices */ }
    public function allocateInvoices()   { /* Link payments to invoices in external system */ }

    // Credit note sync
    public function addNewCreditNotes()  { /* Export credit notes */ }
    public function updateCreditNotes()  { /* Update modified credit notes */ }
    public function allocateCreditNotes() { /* Link credit notes to invoices */ }

    // Payment sync (bidirectional)
    public function addNewPayments($fromDate)  { /* Import FROM external INTO Splynx */ }
    public function pushNewPayments()          { /* Export FROM Splynx TO external */ }
    public function deletePayments()           { /* Sync payment deletions */ }

    // Mapping data sync (reference data from external system)
    public function syncAccountingCategories()  { /* Pull chart of accounts */ }
    public function syncAccountingTaxRates()    { /* Pull tax codes */ }
    public function syncAccountingBankAccounts() { /* Pull bank accounts */ }

    // Manual pairing
    public function loadAccountingCustomersForManualPairing() { /* Load external customers */ }
}
\`\`\`

### SyncController (Console Commands)
\`\`\`php
class SyncController extends BaseCommandController
{
    private $_pidRestriction;
    private $_syncService;
    private $_isInternalCall = false;

    public function beforeAction($action)
    {
        // 1. Check PID restriction (prevent concurrent sync)
        if (!$this->_pidRestriction->updatePid()) {
            $this->stderr('Another sync process is running');
            return false;
        }
        // 2. Validate config
        ValidateConfig::checkApi();
        return parent::beforeAction($action);
    }

    // Main cron entry point
    public function actionCron()
    {
        if (!$this->isLaunchTime()) return ExitCode::OK;

        if (ConfigHelper::get('cron_sync_customers')) $this->actionCustomers();
        if (ConfigHelper::get('cron_sync_invoices'))  $this->actionInvoices();
        if (ConfigHelper::get('cron_sync_credit_notes')) $this->actionCreditNotes();
        if (ConfigHelper::get('cron_sync_payments')) {
            switch (ConfigHelper::get('payments_sync_direction')) {
                case 'import':  $this->actionPayments(); break;
                case 'export':  $this->actionPushPayments(); break;
                case 'bidirectional':
                    $this->actionPushPayments();
                    $this->actionPayments();
                    break;
            }
        }
    }
}
\`\`\`

### Alternative: Separate Operation Classes Per Entity (Xero Pattern)
\`\`\`
models/sync/
  SyncCustomers.php        -> customers/ExportNew.php, customers/ExportModified.php
  SyncInvoices.php         -> invoices/ExportNew.php, invoices/ExportModified.php, invoices/ExportAllocations.php
  SyncCreditNotes.php      -> creditNotes/ExportNew.php, creditNotes/ExportModified.php
  SyncPayments.php         -> payments/Export.php, payments/Import.php,
                              payments/ImportPrepayments.php, payments/ImportOverpayments.php,
                              payments/ExportDeleted.php, payments/ExportAllocations.php
\`\`\`

Each operation class extends BaseSyncService, uses traits for shared state, and has a \`run()\` method.

## 3. Three-Layer Data Model

### Layer 1: Splynx API Models (models/splynx/)
Wrappers around Splynx internal API for customers, invoices, payments, etc.

### Layer 2: Accounting Status Tables (models/accounting/)
Track sync status for each entity. Shared base for all accounting addons.

\`\`\`php
abstract class BaseAccounting extends ActiveRecord
{
    const ACCOUNTING_STATUS_NEW = 0;
    const ACCOUNTING_STATUS_PENDING = 1;
    const ACCOUNTING_STATUS_UNKNOWN = 2;
    const ACCOUNTING_STATUS_ERROR = 3;
    const ACCOUNTING_STATUS_OK = 4;
    const BATCH_SIZE = 25;

    // Fields: id, modified, accounting_id, create_date, last_update,
    //         accounting_status, additional_1/2/3, deleted

    public function getNewRecords()      { /* Status=NEW, not deleted, batch */ }
    public function getModifiedRecords() { /* Modified=1, status=OK, batch */ }
    public function success() { $this->accounting_status = self::ACCOUNTING_STATUS_OK; }
    public function fail()    { $this->accounting_status = self::ACCOUNTING_STATUS_ERROR; }
}
\`\`\`

\`\`\`php
// For reference data (categories, tax rates, bank accounts)
abstract class BaseAccountingMapping extends ActiveRecord
{
    // Fields: id, accounting_id, name, additional_1/2/3, deleted
    public function reset()    { $this->delete(); }
    public function resetAll() { static::deleteAll(); }
}
\`\`\`

### Layer 3: Pair Tables (models/pair/)
Store detailed state of each synced record for change detection.

\`\`\`php
abstract class BasePair extends ActiveRecord implements PairInterface
{
    // Fields: id (Splynx ID), accounting_id (external ID), sync_token, timestamps

    abstract public function getPairAttributes(): array;

    public function getPairData(bool $changed = false): array
    {
        $currentData = $this->getCurrentDataFromSplynx();
        if (!$changed) return $currentData;
        return array_filter($currentData, fn($key) =>
            $currentData[$key] !== $this->getAttribute($key)
        );
    }

    public function isUpdateRequired(): bool { return !empty($this->getPairData(true)); }
    public function prepareToAdd()    { /* Create external API model */ }
    public function prepareToUpdate() { /* Update external API model */ }
}
\`\`\`

### PairCollection (Batch API Requests)
\`\`\`php
class PairCollection implements IteratorAggregate
{
    private $_models; // SplObjectStorage
    public function attach(BasePair $model) { $this->_models->attach($model); }
    public function sendRequest(string $action, bool $savePair = true)
    {
        // Send batch API request, process responses, report per model
    }
}
\`\`\`

## 4. API Rate Limiting

\`\`\`php
interface ApiLimitInterface
{
    const CALL_STATUS_SUCCESS = 1;
    const CALL_STATUS_ERROR = 2;
    const CALL_STATUS_LIMIT = 3;
    public function apiCallAllowed(): bool;
    public function addApiCall(int $status, string $message = ''): void;
}

// Composite limiter
class ApiLimitService implements ApiLimitInterface
{
    private $_limits; // SplObjectStorage
    public function attach(ApiLimitInterface $limit) { $this->_limits->attach($limit); }
    public function apiCallAllowed(): bool
    {
        foreach ($this->_limits as $limit) {
            if (!$limit->apiCallAllowed()) return false;
        }
        return true;
    }
}
\`\`\`

### AccountingApiCaller (API Proxy)
\`\`\`php
class AccountingApiCaller
{
    public function __call($name, $arguments)
    {
        if (!$this->limit->apiCallAllowed()) {
            throw new ApiCallLimitException($this->limit->getErrorMessage());
        }
        sleep(1); // Rate limit delay
        try {
            $result = call_user_func_array([$this->apiService, $name], $arguments);
            $this->limit->addApiCall(ApiLimitInterface::CALL_STATUS_SUCCESS);
            return $result;
        } catch (ServiceException $e) {
            if ($e->getCode() === 429) throw new ApiCallLimitException($e->getMessage());
            if ($e->getCode() === 401) throw new ApiAuthException($e->getMessage());
            throw new ApiCallException($e->getMessage());
        }
    }
}
\`\`\`

## 5. PID Restriction (Process Locking)

\`\`\`php
class PidRestriction extends ActiveRecord
{
    public function isRunning(): bool
    {
        exec('ps -p ' . $this->pid, $output);
        return count($output) > 1;
    }

    public function updatePid(): bool
    {
        $oldPid = $this->getOldPid();
        if ($oldPid && $oldPid->isRunning()) return false;
        if ($oldPid) $oldPid->delete();
        $this->pid = getmypid();
        $this->key = 'sync';
        return $this->save();
    }
}
\`\`\`

## 6. Bootstrap DI Container Wiring

\`\`\`php
class Bootstrap implements BootstrapInterface
{
    public function bootstrap($app)
    {
        $container = Yii::$container;

        // Rate limiting
        $container->setSingleton(ApiLimitService::class, function() {
            $service = new ApiLimitService();
            $service->attach(ApiLimit::getInstance());
            $service->attach(ApiLimitCounter::getInstance());
            return $service;
        });

        // Auth service, External API SDK (with auto-refresh), API caller
        $container->setSingleton(AccountingApiCaller::class, function() use ($container) {
            return new AccountingApiCaller(
                $container->get(DataService::class),
                $container->get(ApiLimitService::class)
            );
        });
    }
}
\`\`\`

Registered in config/common.php: \`'bootstrap' => ['app\\\\base\\\\Bootstrap']\`

## 7. License Checking

\`\`\`php
class LicenseChecker
{
    const AVAILABLE_MODULE = 'available_accounting_integration';
    const PERMITTED_VALUES = ['all', 'splynx-quickbooks'];

    public static function check(): bool
    {
        if (!function_exists('ioncube_license_properties')) return true; // Dev
        $properties = ioncube_license_properties();
        return in_array($properties[self::AVAILABLE_MODULE]['value'] ?? null, self::PERMITTED_VALUES);
    }
}
\`\`\`

## 8. Cron-Based Synchronization

Cron job: \`* 0-10 * * * splynx /var/www/splynx/addons/<addon>/yii sync/cron\`
- Multiple comma-separated launch times
- On install, randomized to spread API load
- Per-entity boolean toggles
- Custom PHP validator for HH:MM format

## 9. Config Structure (config.json)

Four blocks: **api** (Splynx connection), **accounting_api** (provider OAuth + settings),
**synchronization** (payment methods, direction, patterns), **cron** (toggles + launch time).

Key features:
- Conditional fields: \`"conditions": [{"field": "country_code", "value": "US"}]\`
- Encrypted hidden fields for tokens
- Relations: PaymentsMethodsSelect, Partner
- Custom validators: \`"validator": "config/validator_launch_time.php"\`

## 10. Entry Points for Finance Config Tabs

Type "code" entry points inject JS into Splynx core admin pages:
\`\`\`php
['name' => 'categories_config', 'type' => 'code',
 'root' => 'controllers\\\\admin\\\\config\\\\finance\\\\AccountingCategoriesController',
 'url' => urlencode('/addon-url/sync-accounting-categories')]
\`\`\`

Dashboard notifications check for misconfiguration via AJAX on page load.

## 11. Background Console Execution from Web

\`\`\`php
protected function runCommand($action, $params = '')
{
    $cmd = Yii::getAlias('@app') . "/yii sync/{$action} {$params} >> {$logFile} 2>&1 &";
    exec($cmd);
}
// Frontend polls /addon-url/tail every 1000ms for real-time log output
\`\`\`

## 12. Multi-Organization Support (Xero)

Some providers support multiple organizations per OAuth token:
- XeroOrganization ActiveRecord: tenant_id, name, is_active
- Organization selection UI after OAuth
- Warns about data reset on organization change

## 13. Build/Packaging

\`\`\`php
$ionCubeEncode = true;
$webSymLink = 'quickbooks-accounting';
$controlConfig['Conflicts'] = 'splynx-xero, splynx-sageone, splynx-holded';
\`\`\`

## 14. Financial Helpers

\`\`\`php
class CompareHelper
{
    public static function numbersEqual($a, $b, $epsilon = 0.0001): bool
    {
        return abs($a - $b) < $epsilon;
    }
    public static function truncateNumber($number, $decimals = 2): float
    {
        return floor($number * pow(10, $decimals)) / pow(10, $decimals);
    }
}
\`\`\`

## 15. Allocation System

After creating invoices/credit notes/payments, a second pass allocates (links) them.
The additional_2/additional_3 fields track "needToAllocate" and "allocated" flags.

## 16. Rounding Fix Pattern

External systems may calculate totals differently:
\`\`\`php
if (!CompareHelper::numbersEqual($this->total, $this->accounting_total)) {
    // Add "Rounding" line item with difference amount
}
\`\`\`

## 17. Manual Customer Pairing

Full GridView UI with Select2 AJAX search for manually linking Splynx customers
to external system contacts. Stores external contacts in local CustomersManualPairing table.

## 18. Validation System

\`\`\`php
class ValidateConfig extends BaseValidateConfig
{
    public static function checkAccountingApi()              { /* OAuth token exists */ }
    public static function checkAccountingCategoriesConfig() { /* All categories mapped */ }
    public static function checkAccountingBankAccountsConfig() { /* Default bank account */ }
    public static function checkAccountingTaxRatesConfig()   { /* All taxes mapped */ }
    public static function checkInvoicesSyncConfig()         { /* Combined check */ }
}
\`\`\`

## 19. InstallController Specifics

\`\`\`php
public function actionIndex()
{
    touch(Yii::getAlias('@addons') . '/splynx-accounting'); // Marker file
    AccountingCustomers::initFromBeginning();
    AccountingInvoices::initFromDate(date('Y-m-d'));
    AccountingCreditNotes::initFromDate(date('Y-m-d'));
    AccountingPayments::initFromDate(date('Y-m-d'));
    $this->createPaymentMethod('QuickBooks');
    $this->addRandomCronLaunchTime();
    $this->runMigrations();
}

// API permissions needed for accounting addons:
// customers: Customer, CustomerInfo, CustomerBilling
// finance: Invoices, Payments, Transactions, BankStatements, BankStatementsProcess, CreditNotes
// Also: CustomerPaymentAccounts, PaymentsMethods, etc.
\`\`\`

## 20. Multi-Log Targets

\`\`\`php
// config/common.php - 6-7 dedicated log files per aspect
'log' => ['targets' => [
    ['logFile' => '@runtime/logs/output.log', 'categories' => ['output']],
    ['logFile' => '@runtime/logs/api_error.log', 'categories' => ['api_error']],
    ['logFile' => '@runtime/logs/sync_error.log', 'levels' => ['error']],
    ['logFile' => '@runtime/logs/bidirectional.log', 'categories' => ['bidirectional_sync']],
    // ...
]],
\`\`\`
`;

export const E_INVOICING_ADDON_GUIDE = `# E-Invoicing Addon Guide

E-invoicing addons submit financial documents (invoices, credit notes) directly to a government tax authority.
Unlike accounting addons (QuickBooks/Xero), these are **one-directional** (Splynx → government), do **not sync customers**, and use **tracker pattern** instead of pair pattern.

Reference implementations: AADE myDATA (Greece), Verifactu (Spain).

## Key Differences from Accounting Addons

| Aspect | Accounting | E-Invoicing |
|---|---|---|
| Direction | Bidirectional sync | One-way (Splynx → government) |
| Customer sync | Yes | No |
| Authentication | OAuth2 flow | API keys (AADE) or digital certificates (Verifactu) |
| Data format | JSON REST | XML (Sabre XML or DOMDocument) |
| Change detection | Pair pattern (ID mapping) | Tracker pattern (hash comparison) |
| Document types | Generic invoices/payments | Government-coded types (e.g., "1.1" Sales Invoice, "F1" Standard) |
| Tax handling | Simple rate sync | Complex: composite taxes, exemption causes, income classifications |
| Unique output | — | QR code URLs, government marks/UIDs |

## Architecture Overview

\\\`\\\`\\\`
addon/
├── base/
│   ├── Bootstrap.php              # DI container wiring (BootstrapInterface)
│   └── BaseWebController.php      # Base controller with auth
├── commands/
│   ├── InstallController.php      # Addon installation
│   ├── ServiceController.php      # Sync start/stop/cron
│   ├── ConfigController.php       # Setup/reset einvoicing tables
│   ├── ProcessController.php      # Background task processing
│   ├── HookController.php         # Real-time hook handlers (optional)
│   └── BaseCommandController.php  # Timestamped output base
├── components/
│   ├── <provider>/                # Government API integration
│   │   ├── api/                   # API client, service, models (AADE)
│   │   ├── services/              # Service classes (Verifactu)
│   │   ├── models/                # XML data models
│   │   ├── enums/                 # Government-mandated code enums
│   │   ├── schemes/               # XSD/WSDL schema files
│   │   └── ErrorRegistry.php      # Government error codes
│   ├── ValidateConfig.php         # Pre-sync config validation
│   └── Mappings.php               # Tax/type code mappings
├── config/
│   ├── config.json                # 3 blocks: api, service, synchronization
│   ├── web.php / console.php
│   ├── common.php                 # Multi-target logging
│   ├── url_rules.php
│   └── InvoiceTypeMap.php         # Billing category → government type mapping
├── controllers/
│   ├── SiteController.php         # Dashboard: manual sync, log tailing
│   ├── ConfigController.php       # Invoice type mapping UI
│   ├── TransmittedDocsController  # View submitted documents (AADE)
│   └── CertificateController.php  # Certificate management (Verifactu)
├── models/
│   ├── SyncService.php            # Central sync orchestrator
│   ├── einvoicing/                # DB records: BaseEInvoicing, mappings
│   ├── managers/                  # Document lifecycle managers
│   ├── trackers/                  # Hash-based change detection
│   ├── tasks/                     # Background task models
│   ├── api/                       # Splynx API wrappers (read-only)
│   ├── splynx/                    # Splynx DB models (read-only)
│   ├── sync/                      # Sync operation classes (Verifactu)
│   └── config/                    # Config form models
├── views/
│   ├── site/                      # Manual sync dashboard
│   ├── config/                    # Invoice type mapping
│   ├── transmitted-docs/          # Submitted documents viewer
│   ├── common/menu.twig           # Addon navigation menu
│   └── certificate/               # Certificate upload (Verifactu)
├── helpers/
│   ├── ConfigHelper.php           # Config value access
│   ├── CompanyInfo.php            # Partner company data
│   └── XmlServiceHelper.php       # XML namespace/deserializer config
├── actions/
│   └── HandleNotificationsAction  # Dashboard error notifications
├── data/
│   └── certificates/<partnerId>/  # Digital certificate storage (Verifactu)
├── migrations/                    # SQLite migrations
└── build/
    ├── config.php                 # ionCube, Region flag, dependencies
    └── package-files/etc/cron.d/  # Cron job definition
\\\`\\\`\\\`

## Government API Authentication

### API Key Authentication (AADE Greece)
\\\`\\\`\\\`php
// Client sends headers with every request
'aade-user-id' => $username,
'Ocp-Apim-Subscription-Key' => $apiKey
\\\`\\\`\\\`
Config stores service_login and service_auth_key (encrypted type).

### Certificate-Based Authentication (Verifactu Spain)
\\\`\\\`\\\`php
// SOAP client uses mutual TLS
$soapOptions = [
    'local_cert' => $pemFilePath,  // Combined cert + key PEM
    'passphrase' => $certPassword,
];
\\\`\\\`\\\`
- CertificateManagerService reads PFX/P12/PEM files
- Extracts X.509 certificate and private key
- Supports OpenSSL 3.x legacy fallback (-legacy flag for RC2-40 ciphers)
- Per-partner certificate storage in data/certificates/<partnerId>/
- Config uses addon_button type to redirect to certificate upload page

## Tracker Pattern (Change Detection)

Unlike accounting's pair pattern (which maps Splynx ID <-> external ID), e-invoicing uses trackers that store a **snapshot** of document state and detect changes via hash comparison.

\\\`\\\`\\\`php
interface Trackable {
    public function getTracker(): BaseTracker;
}

class BaseTracker extends ActiveRecord {
    // Fields: id, einvoicing_id, created_at, updated_at
    abstract public function loadForSave($model, string $eInvoicingId, array $data);
}

class InvoiceTracker extends BaseTracker {
    // Additional: customer_id, number, date_created, items (SHA-256 hash)
    // Verifactu adds: huella_hash, submit_timestamp, status

    public function isUpdateRequired(Invoice $model): bool {
        // Compare current state against stored snapshot
        return $this->number !== $model->number
            || $this->date_created !== $model->date_created
            || $this->items !== self::hashItems($model->items);
    }
}
\\\`\\\`\\\`

The items field stores a SHA-256 hash of JSON-serialized invoice line items (description, price, tax, quantity). This enables detecting content changes without storing full item data.

## EInvoicing Database Records

The addon uses Splynx's built-in einvoicing_invoices and einvoicing_credit_notes tables (created via ConfigController setup commands).

\\\`\\\`\\\`php
class BaseEInvoicing extends ActiveRecord {
    const STATUS_NEW = 'new';
    const STATUS_PENDING = 'pending';
    const STATUS_OK = 'ok';
    const STATUS_ERROR = 'error';

    // Virtual properties via field_* columns:
    // field_1 = error message, field_2 = uid, field_3 = cancellationMark, field_4 = previousMark

    public function getNewRecords(int $limit = 25);      // Batch size 25
    public function getModifiedRecords(int $limit = 25);
    public function findRecordsForDelete();

    // Records are NEVER deleted, only soft-deleted
    public function delete() { throw new NotSupportedException(); }
}
\\\`\\\`\\\`

## Manager Pattern (Document Lifecycle)

Managers orchestrate the complete document lifecycle (create -> update -> cancel):

\\\`\\\`\\\`php
class BaseManager {
    protected $_apiInstance;    // Government API service (lazy from DI)
    protected $_splynxModel;   // Splynx invoice/credit note
    protected $_apiModel;      // XML document model
    protected $_eInvoicingModel; // EInvoicing DB record

    abstract public function populateApiModel();  // Build XML document
    public function add();     // Submit new document
    public function update();  // Re-submit if tracker detects changes
    public function cancel();  // Cancel submitted document
}
\\\`\\\`\\\`

**Add flow:**
1. populateApiModel() builds XML document with issuer, counterpart, header, items, tax details
2. Submit to government API
3. On success: update tracker, save QR URL to Splynx invoice, store government mark/uid
4. On failure: mark einvoicing record as failed

**Update flow:**
- AADE: Submit as new document, store previousInvoiceMark
- Verifactu: If only items changed -> send with Subsanacion='S'; if number/date changed -> cancel old + submit new

**Cancel flow:**
- AADE: Call CancelInvoice endpoint with stored mark
- Verifactu: Submit RegistroAnulacion XML with chaining to previous document

## Invoice Type Mapping

E-invoicing requires mapping Splynx billing categories to government-specific document types. The mapping is often **dual**: different types for companies vs. private persons.

\\\`\\\`\\\`php
// AADE: invoice_type_map table
class InvoiceTypeMap extends ActiveRecord {
    // billing_transaction_category_id -> einvoicing_id (company) + einvoicing_private_person_id (person)
}

// Example AADE types:
// 1.1 = Sales Invoice, 1.2 = Intra-community Sales, 2.1 = Service Rendered
// 5.2 = Credit Invoice, 11.1 = Retail Sales Receipt, 11.3 = Simplified Invoice

// Verifactu types (PHP 8.1 enums):
enum InvoiceType: string {
    case F1 = 'F1';  // Standard
    case F2 = 'F2';  // Simplified
    case R1 = 'R1';  // Rectification (credit note for companies)
    // ...
}
\\\`\\\`\\\`

## Tax & Classification Mapping

### Tax Rate Mapping
Each Splynx tax rate maps to a government VAT category:
- AADE: 8 categories (24%, 13%, 6%, 17%, 9%, 4%, Without VAT, Records without VAT) + composite taxes
- Verifactu: uses standard Spanish tax rates with regime types

### Composite Taxes (Telecom-specific)
AADE supports composite taxes where VAT and telecom fees are combined:
\\\`\\\`\\\`php
// Example: 30.2% = 24% VAT + 5% landline subscriber fee
$compositeTaxes = [
    1001 => ['vat' => 24, 'fee' => 5, 'vatCategory' => 1, 'feeCategory' => 7],
];
\\\`\\\`\\\`

### Income Classification (AADE)
Required per line item with government E3 category + type codes:
\\\`\\\`\\\`php
$incomeClassificationCategory = [
    'category1_1' => 'Commodity Sales Income',
    'category1_2' => 'Product Sales Income',
    'category1_3' => 'Service Provision Income',
    // 11 categories total
];
$incomeClassificationType = [
    'E3_561_001' => 'Sales of goods & commodities',
    'E3_561_002' => 'Product sales at third parties',
    // 32 types total
];
\\\`\\\`\\\`

## XML Document Generation

### REST + Sabre XML (AADE)
\\\`\\\`\\\`php
// Bootstrap wires XmlService via DI
$xmlService = new Sabre\\Xml\\Service();
XmlServiceHelper::configureService($xmlService);
// Registers namespace mappings and element->model deserializers

// InvoicesCollection implements XmlSerializable
class InvoicesCollection implements XmlSerializable {
    public array $invoice = [];
    public function xmlSerialize(Writer $writer): void {
        foreach ($this->invoice as $inv) {
            $writer->write(['{namespace}invoice' => $inv]);
        }
    }
}

// MyDataService serializes and sends
$xml = $xmlService->write('{namespace}InvoicesDoc', $collection);
$response = $client->call('POST', 'SendInvoices', ['body' => $xml]);
\\\`\\\`\\\`

### SOAP + DOMDocument + xmlseclibs (Verifactu)
\\\`\\\`\\\`php
// InvoiceSerializer builds XML using DOMDocument
$doc = new DOMDocument('1.0', 'UTF-8');
$registroAlta = $doc->createElementNS(SF_NAMESPACE, 'sf:RegistroAlta');
// ... build full XML structure

// XmlSignerService signs each document
$objDSig = new XMLSecurityDSig();
$objDSig->setCanonicalMethod(XMLSecurityDSig::EXC_C14N);
$objKey = new XMLSecurityKey(XMLSecurityKey::RSA_SHA256, ['type' => 'private']);
$objKey->loadKey($privateKey);
$objDSig->sign($objKey, $doc->documentElement);

// SoapClientFactoryService creates SOAP client with certificate
$client = new SoapClient($wsdlPath, [
    'local_cert' => $combinedPemPath,
    'passphrase' => $password,
]);

// VerifactuService sends via SOAP
$response = $client->RegFactuSistemaFacturacion(new SoapVar($xml, XSD_ANYXML));
\\\`\\\`\\\`

## Hash Chaining (Verifactu)

Verifactu requires SHA-256 hash chain integrity. Each document references the previous document's hash:

\\\`\\\`\\\`php
class HashGeneratorService {
    // Submission hash: IDEmisorFactura=NIF&NumSerieFactura=num&FechaExpedicion=date&
    //                  TipoFactura=type&CuotaTotal=tax&ImporteTotal=total&
    //                  Huella=previousHash&FechaHoraHusoGenRegistro=timestamp
    public function generateSubmissionHash(InvoiceSubmission $invoice): string {
        return strtoupper(hash('sha256', $dataString));
    }
}

class Chaining {
    // Mutually exclusive: first record OR reference to previous
    public ?string $primerRegistro = null;  // 'S' if first in chain
    public ?PreviousInvoiceChaining $registroAnterior = null;
}
\\\`\\\`\\\`

Before first sync, the addon queries the government API to find the last document in the chain.

## QR Code Generation

Both addons generate government verification QR codes saved as additional fields on invoices:

\\\`\\\`\\\`php
// AADE: QR URL returned by API in response
$invoice->additional_attributes['aade_qr_code_url'] = $response->qrUrl;

// Verifactu: QR URL computed locally
$qrUrl = "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR" .
    "?nif={nif}&numserie={number}&fecha={date}&importe={total}";
$invoice->additional_attributes['verifactu_qr_code_url'] = $qrUrl;
\\\`\\\`\\\`

Verifactu uses HookController to generate QR codes in real-time on invoice create/edit events.

## Sync Architecture

### Entry Points
- **Cron**: service/cron (every 4 hours AADE / every 2 hours Verifactu)
- **Manual**: SiteController -> Background task -> SyncWorker
- **CLI**: service/start-sync command

### Sync Flow (SyncService)
\\\`\\\`\\\`
addNewInvoices()       -> Submit new invoices in batches
updateInvoices()       -> Re-submit modified invoices
cancelInvoices()       -> Cancel deleted invoices
addNewCreditNotes()    -> Submit new credit notes
updateCreditNotes()    -> Re-submit modified credit notes
cancelCreditNotes()    -> Cancel deleted credit notes
\\\`\\\`\\\`

Documents are grouped by partner_id. Each partner initializes its own API config.

### Batch Processing
- AADE: Batch size 25 (per API recommendation)
- Verifactu: Batch up to 1000 documents, or when submission_time expires

### Response Processing
Government returns per-document status:
- Success (store mark/uid, update tracker, save QR)
- Accepted with errors (needs correction)
- Rejected (mark as failed with error code)
- Duplicate (already submitted)

## Config Validation

\\\`\\\`\\\`php
class ValidateConfig {
    public function validate(): array {
        return array_merge(
            $this->checkServiceApi(),              // API credentials set
            $this->checkEinvoicingTaxRatesConfig(), // All taxes mapped
            $this->checkEinvoicingPaymentTypesConfig(), // All payment methods mapped
            $this->checkEinvoicingInvoiceTypeConfig(),  // All billing categories mapped
            $this->checkEinvoicingCategoriesConfig(),   // Income classifications mapped
        );
    }
}
\\\`\\\`\\\`

All mappings must be complete before sync runs. Incomplete config shows as dashboard notification.

## InstallController Specifics

\\\`\\\`\\\`php
class InstallController extends BaseInstallController {
    public function getModuleName(): string { return 'splynx_addon_<name>'; }
    public function getMinVersion(): string { return '4.0'; }

    // API permissions for invoice/credit note operations
    public function getApiPermissions(): array {
        return [
            ['controller' => 'admin\\\\customers\\\\Customer', 'actions' => ['index', 'view']],
            ['controller' => 'admin\\\\finance\\\\Invoices', 'actions' => ['index', 'view', 'update']],
            ['controller' => 'admin\\\\finance\\\\CreditNotes', 'actions' => ['index', 'view', 'update']],
            // update needed for saving QR code URL back to Splynx
        ];
    }

    // Additional fields on Splynx entities
    public function getAdditionalFields(): array {
        return [
            ['module' => 'customers', 'name' => '<prefix>_country', 'title' => 'Country Code'],
            ['module' => 'invoices', 'name' => '<prefix>_qr_code_url', 'title' => 'QR Code URL', 'readonly' => true],
            ['module' => 'credit_notes', 'name' => '<prefix>_qr_code_url', 'title' => 'QR Code URL', 'readonly' => true],
        ];
    }

    // Entry points: menu link + dashboard notification
    public function getEntryPoints(): array {
        return [
            ['name' => 'menu', 'root' => 'admin/finance/...', 'type' => 'menu_link'],
            ['name' => 'notification', 'root' => 'admin/dashboard/...', 'type' => 'code'],
        ];
    }

    // afterAction triggers einvoicing module initialization:
    // - Setup einvoicing tables (from install date)
    // - Enable einvoicing flag file: /var/www/splynx/addons/splynx-eInvoicing
    // - Setup tax rates, payment methods, categories mappings
}
\\\`\\\`\\\`

The flag file /var/www/splynx/addons/splynx-eInvoicing enables einvoicing UI elements in Splynx core.

## Per-Partner Support

Both addons support multi-partner Splynx installations:
- Partner ignore list in config
- Documents grouped by customer's partner_id
- Per-partner API credentials or certificates
- Per-partner company info (NIF/VAT, name, branch)
- Config supports per_partner_options block for partner-specific settings

## Credit Note Handling

Credit notes require special treatment:
- **AADE**: Mapped to credit invoice types (5.2, 11.4)
- **Verifactu**: Sent as rectification invoices (R1-R5) with negated totals, linked to original invoice via FacturasRectificadas
- Both track credit notes in separate tracker tables
- Credit note items may be validated against original invoice items

## Error Handling

### Government Error Codes
Each authority has its own error code registry:
- Verifactu: ~200 categorized error codes (4xxx shipment errors, 1xxx validation, 3xxx duplication, 2xxx accepted-with-errors)
- AADE: Error responses parsed from XML with status codes per document

### Dashboard Notifications
HandleNotificationsAction checks for:
- Documents with errors in last 30 days
- Incomplete configuration mappings
- Displays notifications on Splynx admin dashboard via code entry point

## Logging

Multi-target logging via Yii2 log component:
\\\`\\\`\\\`php
// config/common.php
'targets' => [
    ['logFile' => 'output.log', 'categories' => ['output']],
    ['logFile' => 'http_client_log.log', 'categories' => ['einvoicing_api_*']],
    ['logFile' => 'api_error_responses.log', 'categories' => ['api_error']],
    ['logFile' => 'sync_error.log', 'categories' => ['sync_error']],
    ['logFile' => 'sync_info.log', 'categories' => ['sync_info']],
]
\\\`\\\`\\\`

## Build Configuration

\\\`\\\`\\\`php
// build/config.php
$ionCubeEncode = true;
$webSymLink = '<addon-url>';
$controlConfig = [
    'Depends' => '{{addonBasePackage}} (>= {{addonBaseVersion}}), php8.3-xml, ...',
    'Region' => 'gr',  // Country-specific region flag
];
\\\`\\\`\\\`

Dependencies typically include: php-xml, php-soap (Verifactu), php-openssl (Verifactu).
`;

// ---------------------------------------------------------------------------
// ADVANCED PATTERNS (cross-cutting patterns from real production addons)
// ---------------------------------------------------------------------------
export const ADVANCED_PATTERNS_GUIDE = `# Advanced Splynx Addon Patterns

Real-world Splynx addons use patterns beyond the basics. This guide covers cross-cutting patterns observed across production addons (hotspot provisioning, banking integrations, fee engines, reseller management, mail processing).

## Console-Only (Headless) Addons

Some addons have NO web interface at all — no web.php, no controllers, no views. They operate entirely through hooks and console commands.

### When to Use
- Email/notification processing
- Background data synchronization
- Bulk operations triggered by Splynx events

### Structure
\\\`\\\`\\\`
my-headless-addon/
├── commands/
│   ├── InstallController.php
│   ├── HookController.php
│   └── ToolsController.php    # Manual CLI operations
├── components/
│   └── ActionInterface.php
├── config/
│   ├── config.json
│   ├── console.php            # Only console config, NO web.php
│   └── params.example.php
├── data/
├── migrations/
├── models/
└── build/
\\\`\\\`\\\`

Key differences:
- No \\\`config/web.php\\\` — addon cannot serve HTTP requests
- Entry points use \\\`type: "code"\\\` to inject JS snippets into Splynx pages (e.g., opt-in toggles on customer pages)
- All logic runs via hooks (STDIN JSON) and cron console commands
- ToolsController provides manual CLI for re-running operations

## ActionInterface Pattern

Decouple business logic from controllers into standalone Action classes. Each action is a single-responsibility unit.

\\\`\\\`\\\`php
interface ActionInterface
{
    public function run(): void;
}

// Each action is self-contained
class ProcessInvoicesAction implements ActionInterface
{
    private SplynxApi $api;
    private SqliteDb $db;

    public function __construct(SplynxApi $api, SqliteDb $db)
    {
        $this->api = $api;
        $this->db = $db;
    }

    public function run(): void
    {
        $invoices = $this->api->getInvoices();
        foreach ($invoices as $invoice) {
            $this->processOne($invoice);
        }
    }
}

// HookController dispatches to actions
class HookController extends Controller
{
    public function actionProcess(): void
    {
        $data = json_decode(file_get_contents('php://stdin'), true);
        $action = $this->resolveAction($data['model'], $data['action']);
        $action->run();
    }
}
\\\`\\\`\\\`

Benefits: testable, composable (cron can also call actions), single-responsibility.

## Dual Database Pattern (SQLite + MySQL)

Some addons need BOTH databases simultaneously:
- **SQLite**: Addon-owned data (rules, settings, logs, tracking records)
- **MySQL (Splynx)**: Read-only access to Splynx entities (customers, invoices, services)

\\\`\\\`\\\`php
// config/console.php (or web.php)
'components' => [
    // SQLite — addon's own database (read-write)
    'sqliteDb' => require __DIR__ . '/db_sqlite.php',
    // MySQL — Splynx main database (typically read-only)
    'db' => require __DIR__ . '/db.php',
],

// Model using SQLite
class FeeRule extends ActiveRecord {
    public static function getDb() { return \\Yii::\\$app->sqliteDb; }
    public static function tableName() { return 'fee_rules'; }
}

// Model reading from Splynx MySQL (read-only, no writes!)
class SplynxCustomer extends ActiveRecord {
    // Uses default 'db' component = MySQL
    public static function tableName() { return '{{%customers}}'; }
}
\\\`\\\`\\\`

**Critical rule**: Never write to Splynx MySQL tables directly. Use the Splynx API for writes. MySQL is read-only for performance (batch reads, joins, aggregations that API can't do efficiently).

## Repository Pattern with Static Caching

For addons processing many records in batch (cron jobs, bulk hooks), cache API/DB results in memory to avoid repeated queries:

\\\`\\\`\\\`php
class CustomerRepository
{
    private static ?array $cache = null;

    public static function getAll(): array
    {
        if (self::$cache === null) {
            self::$cache = SplynxApi::getCustomers();
        }
        return self::$cache;
    }

    public static function findById(int $id): ?array
    {
        $all = self::getAll();
        return $all[$id] ?? null;
    }

    public static function clearCache(): void
    {
        self::$cache = null;
    }
}
\\\`\\\`\\\`

Use at the start of a batch operation, clear at the end. Avoids N+1 API calls when processing hundreds of entities in a cron run.

## ChunkApiLoadTrait — Batched API Queries

The Splynx API has URL length limits. When loading many entities by IDs, chunk the requests:

\\\`\\\`\\\`php
trait ChunkApiLoadTrait
{
    protected function loadByIds(array $ids, string $endpoint): array
    {
        $chunkSize = 80; // Safe chunk size to avoid URL length limits
        $results = [];

        foreach (array_chunk($ids, $chunkSize) as $chunk) {
            $filter = implode(',', $chunk);
            $response = $this->api->get($endpoint, ['id__in' => $filter]);
            $results = array_merge($results, $response);
        }

        return $results;
    }
}
\\\`\\\`\\\`

## Fee Type Registry / Rule Engine Pattern

When an addon applies different logic based on entity types, use a registry pattern:

\\\`\\\`\\\`php
// Base class defines the template
abstract class AbstractFeeType
{
    abstract public function getHookEvents(): array;
    abstract public function applies(array $entity, FeeRule $rule): bool;
    abstract public function calculate(array $entity, FeeRule $rule): float;

    // Template method — subclasses only override what varies
    public function process(array $entity, FeeRule $rule): void
    {
        if (!$this->applies($entity, $rule)) return;
        $amount = $this->calculate($entity, $rule);
        $this->applyFee($entity, $amount);
    }
}

class ServiceActivationFee extends AbstractFeeType
{
    public function getHookEvents(): array {
        return ['internet_service/create', 'voice_service/create'];
    }

    public function applies(array $entity, FeeRule $rule): bool {
        return $entity['status'] === 'active';
    }

    public function calculate(array $entity, FeeRule $rule): float {
        return $rule->amount; // Fixed fee
    }
}

// Registry drives hook registration
class FeeTypeRegistry
{
    private array $types = [];

    public function register(AbstractFeeType $type): void {
        foreach ($type->getHookEvents() as $event) {
            $this->types[$event][] = $type;
        }
    }

    public function getTypesForEvent(string $event): array {
        return $this->types[$event] ?? [];
    }
}
\\\`\\\`\\\`

InstallController registers hooks dynamically based on which fee types are active. New fee types = new hook events, no controller changes.

## Bank Statement Import (PULL Pattern)

Unlike payment gateways (PUSH — customers trigger payments), bank integrations PULL transaction data from external sources and match to customers.

### Architecture
1. **Cron job** fetches new bank statements periodically
2. **Staging table** stores raw transactions (SQLite)
3. **Pairing engine** matches transactions to Splynx customers
4. **Import phase** creates Splynx payments via API

\\\`\\\`\\\`php
// Phase 1: Search — fetch from bank API
class SearchAction implements ActionInterface {
    public function run(): void {
        $statements = $this->bankApi->getStatements($this->getDateRange());
        foreach ($statements as $stmt) {
            StagingRecord::createFromBankData($stmt);
        }
    }
}

// Phase 2: Preview — match to customers
class PreviewAction implements ActionInterface {
    public function run(): void {
        $unmatched = StagingRecord::findUnmatched();
        foreach ($unmatched as $record) {
            $customer = $this->pairingEngine->findMatch($record);
            if ($customer) {
                $record->customer_id = $customer['id'];
                $record->status = 'matched';
                $record->save();
            }
        }
    }
}

// Phase 3: Import — create payments in Splynx
class ImportAction implements ActionInterface {
    public function run(): void {
        $matched = StagingRecord::findMatched();
        foreach ($matched as $record) {
            $this->splynxApi->createPayment($record->customer_id, [
                'amount' => $record->amount,
                'date' => $record->date,
                'note' => $record->reference,
            ]);
            $record->status = 'imported';
            $record->save();
        }
    }
}
\\\`\\\`\\\`

### Customer Pairing Strategies
- Match by reference number / customer ID in transaction text
- Match by customer name
- Match by exact amount + date range
- Manual pairing UI for unmatched transactions

## Cron-Driven Background Pipelines

For long-running operations, use Splynx's cron system with multi-phase processing:

\\\`\\\`\\\`php
// InstallController
public function getCrons(): array
{
    return [
        [
            'type' => 'console_command',
            'path' => '/var/www/splynx/addons/my-addon/yii cron/run',
            'description' => 'Main processing pipeline',
            'frequency' => '*/15 * * * *', // Every 15 minutes
            'enabled' => true,
        ],
    ];
}

// CronController
class CronController extends Controller
{
    public function actionRun(): void
    {
        // Phase-based execution
        (new SearchAction($this->api, $this->db))->run();
        (new PreviewAction($this->api, $this->db))->run();
        (new ImportAction($this->api, $this->db))->run();
    }
}
\\\`\\\`\\\`

Configurable scheduling: some addons let admins set cron frequency via config.json, or choose between "auto" (cron only) and "hybrid" (cron + hooks) modes.

## Cross-Module Additional Fields

Addons can register additional fields on Splynx entities from OTHER modules — not just their own domain:

\\\`\\\`\\\`php
// InstallController
public function getAdditionalFields(): array
{
    return [
        // Field on customer entity
        ['module' => 'customers', 'name' => 'my_addon_tier', 'title' => 'Addon Tier'],
        // Field on internet service entity (cross-module!)
        ['module' => 'internet_services', 'name' => 'my_addon_profile', 'title' => 'Profile Override'],
        // Field on invoice entity
        ['module' => 'invoices', 'name' => 'my_addon_ref', 'title' => 'External Reference', 'readonly' => true],
    ];
}
\\\`\\\`\\\`

These fields appear in Splynx forms and are accessible via API. Useful for storing addon-specific metadata on standard Splynx entities without modifying the main database schema.

### Per-Partner Conditional Fields
Some addons show different additional fields based on the customer's partner:

\\\`\\\`\\\`php
// Config-driven field visibility
public function getAdditionalFields(): array
{
    $fields = [
        ['module' => 'customers', 'name' => 'hotspot_enabled', 'title' => 'Hotspot Enabled'],
    ];

    // Additional fields only for partners that have the feature enabled
    if ($this->config->get('per_partner_fields')) {
        $fields[] = ['module' => 'internet_services', 'name' => 'bandwidth_profile', 'title' => 'Bandwidth Profile'];
    }

    return $fields;
}
\\\`\\\`\\\`

## Custom Dataset via Splynx Module API

For entities that should live in Splynx's own module system (not addon's SQLite), use the Module API to register custom datasets:

\\\`\\\`\\\`php
// InstallController
public function getCustomDatasets(): array
{
    return [
        [
            'name' => 'reseller_commissions',
            'title' => 'Reseller Commissions',
            'fields' => [
                ['name' => 'reseller_id', 'type' => 'integer', 'title' => 'Reseller'],
                ['name' => 'type', 'type' => 'enum', 'title' => 'Type', 'values' => ['percentage', 'fixed', 'new_customer']],
                ['name' => 'amount', 'type' => 'decimal', 'title' => 'Amount'],
                ['name' => 'clawback_days', 'type' => 'integer', 'title' => 'Clawback Period (days)'],
            ],
        ],
    ];
}
\\\`\\\`\\\`

Data lives in Splynx's database, accessible via standard Splynx API CRUD endpoints. The addon queries it via API, not direct DB access. Use this when the data conceptually belongs to Splynx (visible in admin UI, subject to Splynx permissions).

## Partner-Aware Configuration

Multi-partner Splynx installations require partner-specific addon configuration:

\\\`\\\`\\\`json
// config.json — per-partner options block
{
    "settings": {
        "api_key": {"type": "string", "title": "Default API Key"},
        "per_partner_options": {
            "type": "object",
            "title": "Per-Partner Settings",
            "properties": {
                "api_key": {"type": "string", "title": "Partner API Key"},
                "enabled": {"type": "boolean", "title": "Enabled for Partner"}
            }
        }
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`php
// Resolving partner-specific config at runtime
class ConfigResolver
{
    public function getApiKey(int $partnerId): string
    {
        $partnerConfig = $this->config->get("per_partner_options.$partnerId");
        if ($partnerConfig && !empty($partnerConfig['api_key'])) {
            return $partnerConfig['api_key'];
        }
        return $this->config->get('api_key'); // Fallback to default
    }
}
\\\`\\\`\\\`

## Commission Engine Pattern

For addons that compute commissions or rewards:

\\\`\\\`\\\`php
abstract class AbstractCommissionType
{
    abstract public function calculate(array $context): float;
    abstract public function supportsClawback(): bool;
}

class PercentageCommission extends AbstractCommissionType {
    public function calculate(array $context): float {
        return $context['invoice_total'] * ($context['rate'] / 100);
    }
    public function supportsClawback(): bool { return true; }
}

class FixedCommission extends AbstractCommissionType {
    public function calculate(array $context): float {
        return $context['fixed_amount'];
    }
    public function supportsClawback(): bool { return false; }
}

class NewCustomerCommission extends AbstractCommissionType {
    public function calculate(array $context): float {
        return $context['bonus_amount'];
    }
    public function supportsClawback(): bool { return true; }

    // Clawback: if customer cancels within N days, reverse commission
    public function shouldClawback(array $commission, int $daysSinceCreation): bool {
        return $daysSinceCreation <= $commission['clawback_days'];
    }
}
\\\`\\\`\\\`

## DataTables AJAX Pattern

For admin UI pages with server-side paginated tables:

\\\`\\\`\\\`php
class SiteController extends Controller
{
    // Serves both HTML page and AJAX data from same action
    public function actionIndex(): mixed
    {
        if (\\Yii::\\$app->request->isAjax) {
            return $this->asJson($this->getDataTablesResponse());
        }
        return $this->render('index');
    }

    private function getDataTablesResponse(): array
    {
        $query = MyModel::find();

        // Apply DataTables search/sort/pagination
        $search = \\Yii::\\$app->request->get('search')['value'] ?? '';
        if ($search) {
            $query->andFilterWhere(['like', 'name', $search]);
        }

        $total = $query->count();
        $start = \\Yii::\\$app->request->get('start', 0);
        $length = \\Yii::\\$app->request->get('length', 25);
        $records = $query->offset($start)->limit($length)->all();

        return [
            'draw' => (int)\\Yii::\\$app->request->get('draw'),
            'recordsTotal' => $total,
            'recordsFiltered' => $total,
            'data' => array_map(fn($r) => $r->toArray(), $records),
        ];
    }
}
\\\`\\\`\\\`

## Console Output for Long-Running Commands

For CLI commands that process large datasets, provide progress feedback:

\\\`\\\`\\\`php
interface ConsoleOutputInterface
{
    public function info(string $message): void;
    public function error(string $message): void;
    public function progress(int $current, int $total): void;
}

trait ConsoleOutputTrait
{
    public function info(string $message): void
    {
        $this->stdout("[INFO] $message\\n");
    }

    public function error(string $message): void
    {
        $this->stderr("[ERROR] $message\\n");
    }

    public function progress(int $current, int $total): void
    {
        $pct = $total > 0 ? round($current / $total * 100) : 0;
        $this->stdout("\\r[$pct%] $current / $total");
    }
}
\\\`\\\`\\\`

## Sensitive Data Logging

When logging API requests that may contain credentials:

\\\`\\\`\\\`php
class HidingFieldsForLogs
{
    private const SENSITIVE_FIELDS = ['password', 'api_key', 'token', 'secret', 'certificate'];

    public static function mask(array $data): array
    {
        foreach ($data as $key => &$value) {
            if (is_array($value)) {
                $value = self::mask($value);
            } elseif (self::isSensitive($key)) {
                $value = '***HIDDEN***';
            }
        }
        return $data;
    }

    private static function isSensitive(string $key): bool
    {
        foreach (self::SENSITIVE_FIELDS as $field) {
            if (stripos($key, $field) !== false) return true;
        }
        return false;
    }
}

// Usage in logging
Yii::info(json_encode(HidingFieldsForLogs::mask($requestData)), 'api_request');
\\\`\\\`\\\`

## API Request Rate Limiting Awareness

When integrating with external APIs that have rate limits:

\\\`\\\`\\\`php
class ApiRequestCounter
{
    private int $count = 0;
    private int $limit;
    private float $windowStart;

    public function __construct(int $limitPerMinute = 60)
    {
        $this->limit = $limitPerMinute;
        $this->windowStart = microtime(true);
    }

    public function canRequest(): bool
    {
        $elapsed = microtime(true) - $this->windowStart;
        if ($elapsed >= 60) {
            $this->count = 0;
            $this->windowStart = microtime(true);
        }
        return $this->count < $this->limit;
    }

    public function recordRequest(): void
    {
        $this->count++;
    }

    public function waitIfNeeded(): void
    {
        if (!$this->canRequest()) {
            $remaining = 60 - (microtime(true) - $this->windowStart);
            if ($remaining > 0) usleep((int)($remaining * 1_000_000));
            $this->count = 0;
            $this->windowStart = microtime(true);
        }
    }
}
\\\`\\\`\\\`
`;
