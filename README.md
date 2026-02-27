# Splynx Addons MCP Server

An MCP (Model Context Protocol) server that provides comprehensive tools, documentation, and guided workflows for developing Splynx addons. When connected to Claude Code (or any MCP client), it enables AI-assisted Splynx addon development with full knowledge of the platform's architecture, API, and conventions.

## Features

### Resources (16 documentation topics)
Complete Splynx addon development reference embedded directly in the server:
- **Addon Architecture** - Directory structure, key concepts, lifecycle
- **InstallController** - API permissions, entry points, hooks, additional fields
- **Config File** - Settings UI definition with blocks, items, field types
- **Entry Points** - Menu links, code injection, action links, tabs
- **Hooks** - Event system with 800+ available events
- **Database** - MySQL and SQLite configuration
- **Models** - BaseCustomer, BaseActiveApi, ActiveRecord patterns
- **Controllers** - Access control, error handling, multi-auth
- **Views** - Twig templates, layouts, Bootstrap UI
- **Web Config** - Yii2 application configuration
- **Payment Addon** - Payment gateway integration guide
- **Datasets** - Custom entity/module creation
- **Browser Communication** - Notifications, WebSocket, Redis
- **User Authorization** - Admin, customer, and multi-identity auth
- **Splynx API** - REST API v2.0 reference (authentication, endpoints, filtering)
- **Splynx Platform** - Complete platform overview (all modules)

### Tools (9 code generators)
- **scaffold_addon** - Generate a complete addon skeleton with all files
- **generate_install_controller** - Generate InstallController.php
- **generate_config_json** - Generate config.json settings definition
- **generate_controller** - Generate Yii2 controllers with access control
- **generate_model** - Generate models (API, ActiveRecord, SQLite, Dataset)
- **generate_view** - Generate Twig views (tables, forms, dashboards)
- **generate_hook_controller** - Generate HookController for event processing
- **generate_web_config** - Generate config/web.php
- **generate_migration** - Generate database migrations

### Prompts (7 guided workflows)
- **create_addon** - Full addon creation from scratch
- **add_hook_handler** - Add event handling to existing addon
- **add_payment_gateway** - Integrate a payment gateway
- **add_custom_dataset** - Create new entity types
- **add_entry_point** - Add UI integration points
- **explain_splynx_api** - Deep-dive into API endpoints
- **debug_addon** - Diagnose common addon issues

## Installation

```bash
# Clone and build
git clone <repo-url>
cd splynx-addons-mcp-server
npm install
npm run build
```

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/claude_desktop_config.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "splynx-addons": {
      "command": "node",
      "args": ["/path/to/splynx-addons-mcp-server/dist/index.js"]
    }
  }
}
```

Then in Claude Code you can:
- Ask to create a new Splynx addon and the AI will use the scaffold tool
- Ask about any Splynx topic and the AI will reference the embedded docs
- Use prompts like "create_addon" for guided workflows

## Quick Start Example

```
> Create a Splynx addon called "SMS Notifications" that sends SMS when
> customers are created or invoices are generated
```

Claude will automatically:
1. Read the addon architecture documentation
2. Generate a complete addon scaffold with hooks enabled
3. Configure the InstallController with the right API permissions and hook events
4. Create the HookController to process customer/create and invoice/create events
5. Set up config.json for SMS gateway credentials
6. Write all files to your project

## Splynx Documentation References

- [Addon Howto](https://bitbucket.org/splynx/splynx-addon-howto/src/master/) - Official development guide
- [Addon Skeleton](https://bitbucket.org/splynx/splynx-addon-skeleton/) - Starter template
- [Splynx API v2.0](https://splynx.docs.apiary.io) - REST API documentation
- [Splynx Wiki](https://wiki.splynx.com) - Platform documentation
