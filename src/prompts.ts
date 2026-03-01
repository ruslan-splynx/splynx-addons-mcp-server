import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "create_addon",
    "Step-by-step guided workflow for creating a new Splynx addon from scratch",
    {
      addon_name: z
        .string()
        .describe("Human-readable addon name (max 64 chars)"),
      addon_type: z
        .enum([
          "general",
          "payment_gateway",
          "monitoring",
          "integration",
          "accounting",
          "e_invoicing",
          "reporting",
          "notification",
        ])
        .describe("Type of addon to create"),
      description: z.string().describe("What the addon does"),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to create a new Splynx addon: "${params.addon_name}"
Type: ${params.addon_type}
Description: ${params.description}

Please help me build this addon step by step. Use the splynx-addons MCP server tools and resources.

## Instructions

1. First, read the "addon-architecture" resource to understand the structure.
2. Use the "scaffold_addon" tool to generate the complete addon skeleton with appropriate features enabled based on the addon type:
   - general: entry_points
   - payment_gateway: entry_points, payment, portal, hooks
   - monitoring: entry_points, hooks, redis
   - integration: entry_points, hooks, mysql or sqlite
   - accounting: entry_points, hooks, mysql, sqlite, redis (read "accounting-addon" resource)
   - e_invoicing: entry_points, hooks, sqlite, redis (read "e-invoicing-addon" resource)
   - reporting: entry_points, mysql
   - notification: hooks, redis, browser communication
3. Write all generated files to disk.
4. Then customize:
   - InstallController with correct API permissions for the addon's needs
   - config.json with the right settings
   - Controllers, models, and views for the addon's specific functionality
5. Read relevant resources as needed:
   - "install-controller" for API permissions and entry points
   - "hooks" for event handling
   - "config-file" for settings
   - "splynx-api" for API endpoint references
   - "payment-addon" for payment gateway specifics
   - "database" for MySQL/SQLite
   - "views" for Twig templates
   - "e-invoicing-addon" for government tax authority submission
   - "advanced-patterns" for ActionInterface, dual DB, cron pipelines, bank import, fee registries, console-only addons

Generate the module_name from the addon_name (lowercase, underscores, prefixed with "splynx_", max 32 chars).
Generate the base_url from the module_name (replace underscores with hyphens, prefix with "/").

Naming rules:
- Addon title: max 64 chars
- Module name: max 32 chars, lowercase_underscore format
- Module name must start with "splynx_"`,
          },
        },
      ],
    })
  );

  server.prompt(
    "add_hook_handler",
    "Add event hook handling to an existing Splynx addon",
    {
      events: z
        .string()
        .describe(
          'Comma-separated list of events to handle (e.g., "customer/create,invoice/pay")'
        ),
      addon_path: z
        .string()
        .describe(
          'Addon installation path (e.g., "/var/www/splynx/addons/my-addon")'
        ),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to add hook event handling to my Splynx addon.

Events to handle: ${params.events}
Addon path: ${params.addon_path}

Please:
1. Read the "hooks" resource for the full events reference.
2. Use the "generate_hook_controller" tool to create HookController.php with handlers for these events.
3. Update InstallController.php to register the hooks via getHooks().
4. Write all files to disk.

Each event handler should have a clear TODO comment describing what needs to be implemented.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "add_payment_gateway",
    "Add payment gateway integration to a Splynx addon",
    {
      gateway_name: z.string().describe("Payment gateway name (e.g., Stripe)"),
      addon_name: z.string().describe("Existing addon name"),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to add ${params.gateway_name} payment gateway integration to my "${params.addon_name}" Splynx addon.

Please:
1. Read the "payment-addon" resource for the complete payment integration guide.
2. Read the "install-controller" resource for payment accounts setup.
3. Update InstallController.php:
   - Add getPaymentAccounts() for storing payment tokens
   - Add entry points for admin config and portal payment pages
   - Add API permissions for finance endpoints (Invoices, Payments, BankStatements, CustomerPaymentAccounts)
4. Create a callback controller for processing payment webhooks (with public access for the callback action).
5. Update config.json with payment gateway API credentials (use encrypted type for keys/secrets).
6. Create portal views for the payment flow.
7. Explain the financial handler setup at /var/www/splynx/system/external_handlers/finance/charge/.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "create_accounting_addon",
    "Step-by-step guided workflow for creating an accounting integration addon (like QuickBooks or Xero)",
    {
      addon_name: z
        .string()
        .describe(
          'Human-readable addon name (e.g., "Splynx QuickBooks")'
        ),
      provider_name: z
        .string()
        .describe(
          'External accounting provider name (e.g., "QuickBooks", "Xero", "SageOne")'
        ),
      description: z.string().describe("What the addon does"),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to create an accounting integration addon: "${params.addon_name}"
Provider: ${params.provider_name}
Description: ${params.description}

Please help me build this accounting addon step by step. Use the splynx-addons MCP server tools and resources.

## Instructions

1. First, read the "accounting-addon" resource for the complete accounting addon architecture guide.
2. Also read "addon-architecture", "install-controller", and "hooks" resources.
3. Use the "scaffold_addon" tool to generate the base skeleton with features: entry_points, hooks, mysql, sqlite, redis.
4. Then create the accounting-specific structure:

### OAuth2 Authentication
- components/${params.provider_name.toLowerCase()}/oauth2/AuthService.php - token management
- components/${params.provider_name.toLowerCase()}/oauth2/AccessToken.php - token value object
- components/${params.provider_name.toLowerCase()}/AccountingApiCaller.php - API proxy with rate limiting
- components/${params.provider_name.toLowerCase()}/exceptions/ - ApiAuthException, ApiCallException, ApiCallLimitException
- controllers/AuthController.php - OAuth connect/disconnect flow
- helpers/AuthTokenHelper.php - Redis token storage

### Sync Engine
- models/SyncService.php - central sync orchestrator
- commands/SyncController.php - cron-driven sync commands
- commands/ToolsController.php - manual sync/reset tools
- commands/BaseCommandController.php - shared base

### Three-Layer Data Model
- models/accounting/ - BaseAccounting, BaseAccountingMapping, AccountingCustomers/Invoices/Payments/CreditNotes/Categories/TaxRates/BankAccounts
- models/pair/ - BasePair, PairCustomer, PairInvoice, PairPayment, PairCreditNote, PairCollection, CustomersManualPairing
- models/splynx/ - Customer, Invoice, Payment, CreditNote wrappers

### Rate Limiting & Process Control
- models/limit/ - ApiLimitInterface, ApiLimit, ApiLimitCounter, ApiLimitService
- models/PidRestriction.php - process locking

### Bootstrap & Config
- base/Bootstrap.php - DI container wiring (BootstrapInterface)
- config/common.php - shared config with Bootstrap registration and multi-log targets
- config/config.json - 4 blocks: api, accounting_api, synchronization, cron
- components/ValidateConfig.php - pre-sync validation
- components/LicenseChecker.php - ionCube license check

### Views & Entry Points
- views/auth/ - OAuth form and result
- views/config/ - category/tax/bank mapping
- views/entry-point/ - JS injection into Splynx Finance config pages
- views/manual-pairing-customers/ - manual customer pairing UI
- views/site/ - dashboard with sync status and log tailing
- controllers/ManualPairingCustomersController.php
- controllers/ConfigController.php

### Cron & Build
- defaults/etc/cron.d/ - cron job definition
- build/config.php - ionCube, web symlink, package conflicts

5. InstallController should:
   - Create splynx-accounting marker file
   - Initialize accounting tables for customers, invoices, credit notes, payments
   - Create "${params.provider_name}" payment method
   - Set random cron launch time
   - Register API permissions for: Customer, CustomerInfo, CustomerBilling, Invoices, Payments, Transactions, BankStatements, CreditNotes
   - Register entry points: categories config, bank accounts config, tax rates config, finance menu, dashboard notifications

6. Generate migrations for: customer, invoice, credit_note (pair tables), pid_restriction, api_limit, api_limit_counter, customers_manual_pairing

Generate the module_name from addon_name (lowercase, underscores, prefixed with "splynx_", max 32 chars).`,
          },
        },
      ],
    })
  );

  server.prompt(
    "create_einvoicing_addon",
    "Step-by-step guided workflow for creating an e-invoicing addon that submits documents to a government tax authority",
    {
      addon_name: z
        .string()
        .describe(
          'Human-readable addon name (e.g., "Splynx AADE myDATA")'
        ),
      country_name: z
        .string()
        .describe(
          'Country name (e.g., "Greece", "Spain")'
        ),
      authority_name: z
        .string()
        .describe(
          'Government tax authority name (e.g., "AADE myDATA", "AEAT Verifactu")'
        ),
      auth_type: z
        .enum(["api_key", "certificate"])
        .describe("Authentication type: api_key (header-based) or certificate (mutual TLS/SOAP)"),
      api_type: z
        .enum(["rest_xml", "soap"])
        .describe("API type: rest_xml (REST with XML body) or soap (SOAP with WSDL)"),
      description: z.string().describe("What the addon does"),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to create an e-invoicing addon: "${params.addon_name}"
Country: ${params.country_name}
Authority: ${params.authority_name}
Auth type: ${params.auth_type}
API type: ${params.api_type}
Description: ${params.description}

Please help me build this e-invoicing addon step by step. Use the splynx-addons MCP server tools and resources.

## Instructions

1. First, read the "e-invoicing-addon" resource for the complete e-invoicing architecture guide.
2. Also read "addon-architecture", "install-controller", and "hooks" resources.
3. Use the "scaffold_addon" tool to generate the base skeleton with features: entry_points, hooks, sqlite, redis.
4. Then create the e-invoicing-specific structure:

### Government API Integration
- components/<provider>/ with API client, XML service, error registry
- Auth: ${params.auth_type === 'api_key' ? 'API key headers on every request' : 'Digital certificate (PFX/PEM) with SOAP mutual TLS'}
- API: ${params.api_type === 'rest_xml' ? 'REST with XML body (use Sabre XML library)' : 'SOAP with WSDL (use DOMDocument + xmlseclibs for signing)'}
- ValidateConfig.php for pre-sync validation
- Mappings.php for government tax/type codes

### Tracker System
- models/trackers/ with Trackable interface, BaseTracker, InvoiceTracker, CreditNoteTracker
- SHA-256 hash-based change detection on invoice items

### Manager Pattern
- models/managers/ with BaseManager, InvoiceManager, CreditNoteManager
- Document lifecycle: add (submit XML) -> update (re-submit or cancel+resubmit) -> cancel

### EInvoicing Records & Mappings
- models/einvoicing/ for DB records and mapping tables
- config/InvoiceTypeMap.php for dual mapping (company vs. private person)

### Sync Engine
- models/SyncService.php orchestrating 6 phases: add/update/cancel for invoices + credit notes
- Background task processing with progress tracking
- Cron-driven sync every 2-4 hours

### Views
- Manual sync dashboard with progress bar and log tailing
- Invoice type mapping config (company vs. private person)
- Dashboard notifications for errors and incomplete mappings

5. InstallController should:
   - Create splynx-eInvoicing marker file
   - Initialize einvoicing tables for invoices and credit notes
   - Register API permissions for Customer, Invoices (with update for QR), CreditNotes (with update)
   - Register additional fields: country on customers, qr_code_url (readonly) on invoices and credit_notes
   - Register entry points: Finance menu link, dashboard notification
   - afterAction triggers einvoicing setup: tables, tax rates, payment methods, categories

6. Generate migrations for: background, invoice_tracker, credit_note_tracker, invoice_type_map

Generate the module_name from addon_name (lowercase, underscores, prefixed with "splynx_", max 32 chars).`,
          },
        },
      ],
    })
  );

  server.prompt(
    "add_custom_dataset",
    "Create a custom data module/entity in Splynx via addon",
    {
      entity_name: z
        .string()
        .describe('Name of the new entity (e.g., "Agent", "Device")'),
      fields: z
        .string()
        .describe(
          'Comma-separated list of fields with types (e.g., "name:string,email:string,commission:decimal")'
        ),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to create a custom dataset (new entity type) called "${params.entity_name}" in my Splynx addon.

Fields: ${params.fields}

Please:
1. Read the "datasets" resource for the complete custom datasets guide.
2. Read the "install-controller" resource for additional fields and module config.
3. Update InstallController.php:
   - Add getSimpleModuleName() returning the module identifier
   - Add getAdditionalFields() defining each field with correct types
   - Add getNewModulesConfig() to register the new module
   - Add getApiPermissions() for the module controller
4. Use the "generate_model" tool with type "dataset" to create the entity model.
5. Create a controller for managing the dataset entities.
6. Create views for listing and editing entities.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "add_entry_point",
    "Add a new UI integration point to a Splynx addon",
    {
      entry_type: z
        .enum(["menu_link", "code", "action_link", "tab"])
        .describe("Type of entry point"),
      placement: z.enum(["admin", "portal"]).describe("Where to place it"),
      target_area: z
        .string()
        .describe(
          'Which section to integrate with (e.g., "Customers", "Finance", "Networking")'
        ),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to add a ${params.entry_type} entry point to the ${params.placement} area, targeting the ${params.target_area} section.

Please:
1. Read the "entry-points" resource for the complete entry points reference, including all available root controllers.
2. Find the correct root controller for the "${params.target_area}" section in the ${params.placement} area.
3. Generate the entry point configuration for InstallController.php.
4. If needed, create the corresponding controller and views.
5. Update config/web.php if URL routing changes are needed.
6. Update config/url_rules.php if new routes are needed.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "explain_splynx_api",
    "Get detailed information about Splynx API endpoints for a specific area",
    {
      area: z
        .string()
        .describe(
          'API area to learn about (e.g., "customers", "invoices", "services", "tickets", "networking")'
        ),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need detailed information about the Splynx API endpoints related to "${params.area}".

Please:
1. Read the "splynx-api" resource for the full API reference.
2. Explain all available endpoints for the "${params.area}" area:
   - HTTP methods (GET, POST, PUT, DELETE)
   - URL paths
   - Request parameters and body format
   - Response format
   - Common filtering and pagination options
3. Show PHP code examples for common operations:
   - Using the Splynx internal API (BaseActiveApi models within addons)
   - Using the external REST API (SplynxApi client)
4. Explain related API permissions needed in InstallController.php.

Full API docs: https://splynx.docs.apiary.io
Wiki docs: https://wiki.splynx.com`,
          },
        },
      ],
    })
  );

  server.prompt(
    "debug_addon",
    "Help diagnose and fix common Splynx addon development issues",
    {
      issue: z
        .string()
        .describe(
          'Description of the problem (e.g., "addon not showing in menu", "API permission denied", "hook not firing")'
        ),
    },
    async (params) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I'm having an issue with my Splynx addon: "${params.issue}"

Please help me diagnose and fix this. Check these common areas:

1. **InstallController issues**: Read "install-controller" resource
   - Module name not matching config.json path
   - Missing API permissions for the endpoints being accessed
   - Entry points with wrong root controller
   - Hook paths pointing to wrong location

2. **Configuration issues**: Read "config-file" and "web-config" resources
   - config.json path must match getModuleName()
   - web.php baseUrl must match the nginx location and symlink
   - URL rules not matching controller actions

3. **Authentication issues**: Read "user-authorization" resource
   - identityClass must be correct for admin vs customer
   - loginUrl must include proper return path
   - Access control behaviors must allow the right roles

4. **View rendering issues**: Read "views" resource
   - Twig templates must be in views/<controller>/<action>.twig
   - Layout must register AppAsset
   - CSRF tokens required in forms

5. **Hook issues**: Read "hooks" resource
   - Hook path must be absolute and executable
   - STDIN reading must use fgets() not file_get_contents()
   - JSON decode the input

6. **API issues**: Read "splynx-api" resource
   - Verify API permissions include the controller and actions
   - Check authentication method

7. **Installation issues**:
   - Symlink: ln -s /var/www/splynx/addons/<addon>/web/ /var/www/splynx/web/<url>
   - Nginx config must have try_files directive
   - Run: php yii install/index
   - Restart nginx after config changes`,
          },
        },
      ],
    })
  );
}
