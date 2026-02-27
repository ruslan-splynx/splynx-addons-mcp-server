import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateAddonScaffold } from "./generators/scaffold.js";
import { generateInstallController } from "./generators/install-controller.js";
import { generateConfigJson } from "./generators/config-json.js";
import { generateController } from "./generators/controller.js";
import { generateModel } from "./generators/model.js";
import { generateView } from "./generators/view.js";
import { generateHookController } from "./generators/hook-controller.js";
import { generateWebConfig } from "./generators/web-config.js";
import { generateMigration } from "./generators/migration.js";

export function registerTools(server: McpServer): void {
  server.tool(
    "scaffold_addon",
    "Generate a complete Splynx addon project skeleton with all required files. " +
      "Returns the full directory tree with file contents ready to be written to disk.",
    {
      addon_name: z
        .string()
        .describe(
          'Human-readable addon title, max 64 chars (e.g., "My Custom Integration")'
        ),
      module_name: z
        .string()
        .describe(
          'Internal module identifier, max 32 chars, lowercase_underscore (e.g., "splynx_my_integration")'
        ),
      description: z.string().describe("Short description of the addon"),
      author_name: z.string().default("Developer").describe("Author name"),
      author_email: z
        .string()
        .default("developer@example.com")
        .describe("Author email"),
      min_splynx_version: z
        .string()
        .default("3.1")
        .describe("Minimum required Splynx version"),
      base_url: z
        .string()
        .describe(
          'URL path for the addon web interface (e.g., "/my-integration")'
        ),
      features: z
        .object({
          hooks: z
            .boolean()
            .default(false)
            .describe("Include hook event handling"),
          entry_points: z
            .boolean()
            .default(true)
            .describe("Include admin menu entry point"),
          additional_fields: z
            .boolean()
            .default(false)
            .describe("Include additional fields on Splynx entities"),
          mysql: z
            .boolean()
            .default(false)
            .describe("Include MySQL database connection"),
          sqlite: z
            .boolean()
            .default(false)
            .describe("Include SQLite local database"),
          redis: z.boolean().default(false).describe("Include Redis support"),
          payment: z
            .boolean()
            .default(false)
            .describe(
              "Include payment gateway integration (accounts, callbacks)"
            ),
          portal: z
            .boolean()
            .default(false)
            .describe("Include customer portal integration"),
          dataset: z
            .boolean()
            .default(false)
            .describe("Include custom dataset/module creation"),
        })
        .optional(),
    },
    async (params) => {
      const withDefaults = {
        ...params,
        features: {
          hooks: false,
          entry_points: true,
          additional_fields: false,
          mysql: false,
          sqlite: false,
          redis: false,
          payment: false,
          portal: false,
          dataset: false,
          ...params.features,
        },
      };
      const result = generateAddonScaffold(withDefaults);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_install_controller",
    "Generate an InstallController.php file with specified API permissions, entry points, hooks, additional fields, and payment accounts.",
    {
      addon_name: z.string().describe("Addon display title (max 64 chars)"),
      module_name: z
        .string()
        .describe("Internal module identifier (max 32 chars)"),
      min_splynx_version: z.string().default("3.1"),
      api_permissions: z
        .array(
          z.object({
            controller: z
              .string()
              .describe(
                'Full controller path (e.g., "api\\\\admin\\\\customers\\\\Customer")'
              ),
            actions: z
              .array(z.string())
              .optional()
              .describe(
                "Specific actions to allow, omit for all"
              ),
          })
        )
        .optional()
        .describe("API controllers and actions the addon needs access to"),
      entry_points: z
        .array(
          z.object({
            name: z.string().describe("Unique entry point identifier"),
            title: z.string().describe("Display title"),
            root: z.string().describe("Root controller"),
            place: z.enum(["admin", "portal"]).optional(),
            type: z
              .enum(["menu_link", "code", "action_link", "tab"])
              .optional(),
            url: z.string().describe("URL-encoded path"),
            icon: z.string().optional(),
          })
        )
        .optional(),
      hook_events: z
        .array(z.string())
        .optional()
        .describe('Hook events to listen for'),
      additional_fields: z
        .array(
          z.object({
            main_module: z.string().describe('Module to add field to'),
            name: z.string().describe("Field name"),
            title: z.string().describe("Display title"),
            type: z.string().optional(),
            required: z.boolean().optional(),
          })
        )
        .optional(),
      include_payment_accounts: z.boolean().default(false),
    },
    async (params) => {
      const normalized = {
        ...params,
        api_permissions: params.api_permissions || [],
        entry_points: (params.entry_points || []).map((ep) => ({
          ...ep,
          place: ep.place || "admin",
          type: ep.type || "menu_link",
          icon: ep.icon || "fa-puzzle-piece",
        })),
        hook_events: params.hook_events || [],
        additional_fields: (params.additional_fields || []).map((f) => ({
          ...f,
          type: f.type || "string",
          required: f.required || false,
        })),
      };
      const result = generateInstallController(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_config_json",
    "Generate a config.json file defining the addon's settings UI in Splynx admin panel.",
    {
      module_name: z.string().describe("Module identifier (path)"),
      blocks: z
        .array(
          z.object({
            name: z.string().describe("Block display name"),
            key: z.string().describe("Block key (snake_case)"),
            items: z.array(
              z.object({
                key: z.string().describe("Setting key"),
                title: z.string().describe("Setting display title"),
                type: z.string().optional().describe("Field type"),
                default_value: z.string().optional(),
                description: z.string().optional(),
                relation: z.string().optional(),
                options: z.record(z.string(), z.string()).optional(),
              })
            ),
          })
        )
        .describe("Configuration blocks with their items"),
      per_partner: z.boolean().default(false),
    },
    async (params) => {
      const result = generateConfigJson(params as Parameters<typeof generateConfigJson>[0]);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_controller",
    "Generate a Yii2 controller PHP file for a Splynx addon with access control and actions.",
    {
      name: z.string().describe('Controller class name'),
      namespace: z.string().default("app\\controllers"),
      actions: z
        .array(
          z.object({
            name: z.string().describe('Action method name'),
            renders_view: z.boolean().optional(),
            view_name: z.string().optional(),
            params: z
              .array(z.object({ name: z.string(), type: z.string().optional() }))
              .optional(),
          })
        )
        .optional(),
      auth_required: z.boolean().default(true),
      public_actions: z.array(z.string()).optional(),
      user_component: z.string().optional(),
      models: z.array(z.string()).optional(),
      page_title: z.string().optional(),
    },
    async (params) => {
      const normalized = {
        ...params,
        actions: (params.actions || [{ name: "index" }]).map((a) => ({
          ...a,
          renders_view: a.renders_view !== false,
          params: (a.params || []).map((p) => ({ ...p, type: p.type || "string" })),
        })),
        public_actions: params.public_actions || [],
        models: params.models || [],
      };
      const result = generateController(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_model",
    "Generate a PHP model class for a Splynx addon (API model, ActiveRecord, or custom).",
    {
      name: z.string().describe('Model class name'),
      namespace: z.string().default("app\\models"),
      type: z.enum(["api", "activerecord", "sqlite", "dataset"]).describe("Model type"),
      base_class: z.string().optional(),
      table_name: z.string().optional(),
      module_name: z.string().optional(),
      attributes: z
        .array(
          z.object({
            name: z.string(),
            type: z.string().optional(),
            required: z.boolean().optional(),
          })
        )
        .optional(),
      methods: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
            return_type: z.string().optional(),
          })
        )
        .optional(),
    },
    async (params) => {
      const normalized = {
        ...params,
        attributes: (params.attributes || []).map((a) => ({
          ...a,
          type: a.type || "string",
          required: a.required || false,
        })),
        methods: (params.methods || []).map((m) => ({
          ...m,
          return_type: m.return_type || "void",
        })),
      };
      const result = generateModel(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_view",
    "Generate a Twig template view file for a Splynx addon page.",
    {
      type: z
        .enum(["table", "form", "detail", "dashboard", "custom"])
        .describe("View type"),
      title: z.string().describe("Page title"),
      columns: z
        .array(z.object({ key: z.string(), label: z.string() }))
        .optional(),
      form_fields: z
        .array(
          z.object({
            name: z.string(),
            label: z.string(),
            type: z.string().optional(),
            options: z.record(z.string(), z.string()).optional(),
          })
        )
        .optional(),
      data_variable: z.string().default("model"),
      submit_url: z.string().optional(),
      include_csrf: z.boolean().default(true),
    },
    async (params) => {
      const normalized = {
        ...params,
        columns: params.columns || [],
        form_fields: (params.form_fields || []).map((f) => ({
          ...f,
          type: f.type || "text",
          options: f.options as Record<string, string> | undefined,
        })),
      };
      const result = generateView(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_hook_controller",
    "Generate a HookController.php for processing Splynx event hooks via STDIN.",
    {
      events: z
        .array(
          z.object({
            event: z.string().describe('Event pattern'),
            handler_description: z.string().describe("What should happen"),
          })
        )
        .describe("Events to handle"),
      addon_path: z.string().describe('Addon installation path'),
    },
    async (params) => {
      const result = generateHookController(params);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_web_config",
    "Generate config/web.php for a Splynx addon with specified components.",
    {
      base_url: z.string().describe('Addon base URL path'),
      auth_type: z
        .enum(["admin", "customer", "both", "none"])
        .default("admin"),
      include_redis: z.boolean().default(false),
      include_mysql: z.boolean().default(false),
      additional_components: z.record(z.string(), z.string()).optional(),
    },
    async (params) => {
      const normalized = {
        ...params,
        additional_components: (params.additional_components || {}) as Record<string, string>,
      };
      const result = generateWebConfig(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );

  server.tool(
    "generate_migration",
    "Generate a Yii2 database migration file for creating or modifying tables.",
    {
      name: z.string().describe('Migration name'),
      type: z
        .enum(["create_table", "add_column", "drop_table", "custom"])
        .default("create_table"),
      table_name: z.string().describe("Target table name"),
      columns: z
        .array(
          z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean().optional(),
            unique: z.boolean().optional(),
            default_value: z.string().optional(),
          })
        )
        .optional(),
      indexes: z
        .array(
          z.object({
            name: z.string(),
            columns: z.array(z.string()),
            unique: z.boolean().optional(),
          })
        )
        .optional(),
    },
    async (params) => {
      const normalized = {
        ...params,
        columns: (params.columns || []).map((c) => ({
          ...c,
          nullable: c.nullable !== false,
          unique: c.unique || false,
        })),
        indexes: (params.indexes || []).map((i) => ({
          ...i,
          unique: i.unique || false,
        })),
      };
      const result = generateMigration(normalized);
      return {
        content: [{ type: "text" as const, text: result }],
      };
    }
  );
}
