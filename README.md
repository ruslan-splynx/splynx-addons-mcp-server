# Splynx Addons MCP Server

An MCP (Model Context Protocol) server that provides comprehensive tools, documentation, and guided workflows for developing Splynx addons. When connected to Claude Code (or any MCP client), it enables AI-assisted Splynx addon development with full knowledge of the platform's architecture, API, and conventions.

## Features

### Resources (19 documentation topics)
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
- **Accounting Addon** - OAuth2 sync engine, entity pairing, rate limiting, PID locking (QuickBooks/Xero patterns)
- **E-Invoicing Addon** - Government tax authority submission, tracker pattern, XML generation, hash chaining, QR codes (AADE/Verifactu patterns)
- **Advanced Patterns** - Console-only addons, ActionInterface, dual DB, repository caching, bank import, fee registry, cron pipelines, commission engines

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

### Prompts (9 guided workflows)
- **create_addon** - Full addon creation from scratch (general, payment, monitoring, integration, accounting, e-invoicing, reporting, notification)
- **create_accounting_addon** - Guided accounting/ERP integration (OAuth2, sync engine, entity pairing)
- **create_einvoicing_addon** - Guided e-invoicing addon (government API, XML, certificates)
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

## Usage

### Option 1: Local (stdio mode)

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

### Option 2: Remote HTTP Server

Run the server in HTTP mode so clients can connect via URL:

```bash
node dist/index.js --http --port=3000 --host=0.0.0.0
```

Clients connect using the remote URL in their MCP config:

```json
{
  "mcpServers": {
    "splynx-addons": {
      "type": "url",
      "url": "https://mcp-addons.splynx.com/mcp"
    }
  }
}
```

### Option 3: Docker Deployment

```bash
# Build
docker build -t splynx-addons-mcp .

# Run
docker run -d --name splynx-mcp --restart always -p 3000:3000 splynx-addons-mcp
```

### Deploying to mcp-addons.splynx.com

Nginx reverse proxy config:

```nginx
server {
    listen 443 ssl;
    server_name mcp-addons.splynx.com;

    ssl_certificate     /etc/letsencrypt/live/mcp-addons.splynx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp-addons.splynx.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

### Health Check

```bash
curl https://mcp-addons.splynx.com/health
# {"status":"ok","server":"splynx-addons-mcp","version":"1.0.0"}
```

---

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
