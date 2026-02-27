import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ADDON_ARCHITECTURE_OVERVIEW,
  INSTALL_CONTROLLER_GUIDE,
  CONFIG_FILE_GUIDE,
  ENTRY_POINTS_GUIDE,
  HOOKS_GUIDE,
  DATABASE_GUIDE,
  MODELS_GUIDE,
  CONTROLLERS_GUIDE,
  VIEWS_GUIDE,
  WEB_CONFIG_GUIDE,
  PAYMENT_ADDON_GUIDE,
  DATASET_GUIDE,
  BROWSER_COMMUNICATION_GUIDE,
  USER_AUTHORIZATION_GUIDE,
  SPLYNX_API_REFERENCE,
  SPLYNX_PLATFORM_OVERVIEW,
} from "./knowledge.js";

export function registerResources(server: McpServer): void {
  server.resource(
    "addon-architecture",
    "splynx://docs/addon-architecture",
    {
      description:
        "Complete Splynx addon architecture overview: directory structure, key concepts, lifecycle, naming rules",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/addon-architecture",
          text: ADDON_ARCHITECTURE_OVERVIEW,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "install-controller",
    "splynx://docs/install-controller",
    {
      description:
        "InstallController guide: the central file defining addon metadata, API permissions, entry points, hooks, additional fields, payment accounts",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/install-controller",
          text: INSTALL_CONTROLLER_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "config-file",
    "splynx://docs/config-file",
    {
      description:
        "config.json guide: defining addon settings UI with blocks, items, field types, relations, per-partner options",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/config-file",
          text: CONFIG_FILE_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "entry-points",
    "splynx://docs/entry-points",
    {
      description:
        "Entry points guide: menu_link, code, action_link, tab types; admin and portal placements; available root controllers",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/entry-points",
          text: ENTRY_POINTS_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "hooks",
    "splynx://docs/hooks",
    {
      description:
        "Hooks guide: event system, defining hooks in InstallController, processing hooks with HookController, complete events list (800+ events)",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/hooks",
          text: HOOKS_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "database",
    "splynx://docs/database",
    {
      description:
        "Database guide: MySQL (main Splynx DB) and SQLite (local addon DB) configuration, migrations, ActiveRecord models",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/database",
          text: DATABASE_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "models",
    "splynx://docs/models",
    {
      description:
        "Models guide: BaseCustomer, BaseActiveApi, ActiveRecord; Customer model example, custom API models for datasets",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/models",
          text: MODELS_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "controllers",
    "splynx://docs/controllers",
    {
      description:
        "Controllers guide: SiteController template, access control behaviors, error handling, multiple user identities",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/controllers",
          text: CONTROLLERS_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "views",
    "splynx://docs/views",
    {
      description:
        "Views guide: Twig templates, PHP layouts, Bootstrap panels, forms, tables, asset bundles",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/views",
          text: VIEWS_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "web-config",
    "splynx://docs/web-config",
    {
      description:
        "Web configuration guide: web.php, console.php, URL rules, Redis, MySQL, multiple user identities",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/web-config",
          text: WEB_CONFIG_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "payment-addon",
    "splynx://docs/payment-addon",
    {
      description:
        "Payment addon guide: payment accounts, financial handlers, callback processing, portal integration",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/payment-addon",
          text: PAYMENT_ADDON_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "datasets",
    "splynx://docs/datasets",
    {
      description:
        "Custom datasets guide: creating new entity types in Splynx with API endpoints and UI integration",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/datasets",
          text: DATASET_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "browser-communication",
    "splynx://docs/browser-communication",
    {
      description:
        "Browser communication and Redis guide: admin notifications, WebSocket, Redis cache integration",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/browser-communication",
          text: BROWSER_COMMUNICATION_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "user-authorization",
    "splynx://docs/user-authorization",
    {
      description:
        "User authorization guide: single identity, multiple identities (admin+customer), custom identity, access control",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/user-authorization",
          text: USER_AUTHORIZATION_GUIDE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "splynx-api",
    "splynx://docs/splynx-api",
    {
      description:
        "Splynx REST API v2.0 reference: authentication, endpoints, CRUD operations, filtering, pagination, PHP client",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/splynx-api",
          text: SPLYNX_API_REFERENCE,
          mimeType: "text/markdown",
        },
      ],
    })
  );

  server.resource(
    "splynx-platform",
    "splynx://docs/splynx-platform",
    {
      description:
        "Splynx platform overview: all modules (customers, billing, networking, CRM, helpdesk, scheduling, inventory), technical stack",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "splynx://docs/splynx-platform",
          text: SPLYNX_PLATFORM_OVERVIEW,
          mimeType: "text/markdown",
        },
      ],
    })
  );
}
