interface ViewParams {
  type: "table" | "form" | "detail" | "dashboard" | "custom";
  title: string;
  columns: Array<{ key: string; label: string }>;
  form_fields: Array<{
    name: string;
    label: string;
    type?: string;
    options?: Record<string, string>;
  }>;
  data_variable: string;
  submit_url?: string;
  include_csrf: boolean;
}

export function generateView(params: ViewParams): string {
  let twig = "";

  switch (params.type) {
    case "table":
      twig = generateTableView(params);
      break;
    case "form":
      twig = generateFormView(params);
      break;
    case "detail":
      twig = generateDetailView(params);
      break;
    case "dashboard":
      twig = generateDashboardView(params);
      break;
    case "custom":
      twig = generateCustomView(params);
      break;
  }

  return `# Generated Twig View (${params.type})\n\nFile: \`views/site/${params.type}.twig\`\n\n\`\`\`twig\n${twig}\`\`\``;
}

function generateTableView(params: ViewParams): string {
  const cols = params.columns.length > 0
    ? params.columns
    : [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
      ];

  let twig = `<div class="panel panel-default">
    <div class="panel-heading">
        <h3>${params.title}</h3>
    </div>
    <div class="panel-body">
        <div class="table-scroll-wrapper">
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
`;
  for (const col of cols) {
    twig += `                        <th>${col.label}</th>\n`;
  }
  twig += `                    </tr>
                </thead>
                <tbody>
                    {% for item in ${params.data_variable} %}
                        <tr>
`;
  for (const col of cols) {
    twig += `                            <td>{{ item.${col.key} }}</td>\n`;
  }
  twig += `                        </tr>
                    {% else %}
                        <tr>
                            <td colspan="${cols.length}" class="text-center">No data found</td>
                        </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
</div>
`;
  return twig;
}

function generateFormView(params: ViewParams): string {
  const fields = params.form_fields.length > 0
    ? params.form_fields
    : [
        { name: "name", label: "Name", type: "text" },
        { name: "email", label: "Email", type: "email" },
      ];

  let twig = `<div class="panel panel-default">
    <div class="panel-heading">
        <h3>${params.title}</h3>
    </div>
    <div class="panel-body">
        <form method="post"${params.submit_url ? ` action="{{ Url.to(['${params.submit_url}']) }}"` : ""}>
`;

  if (params.include_csrf) {
    twig += `            {{ Html.hiddenInput(app.request.csrfParam, app.request.csrfToken) | raw }}\n\n`;
  }

  for (const field of fields) {
    const type = field.type || "text";

    if (type === "textarea") {
      twig += `            <div class="form-group">
                <label for="${field.name}">${field.label}</label>
                <textarea class="form-control" id="${field.name}" name="${field.name}" rows="4">{{ ${params.data_variable}.${field.name} }}</textarea>
            </div>

`;
    } else if (type === "select" && field.options) {
      twig += `            <div class="form-group">
                <label for="${field.name}">${field.label}</label>
                <select class="form-control" id="${field.name}" name="${field.name}">
`;
      for (const [value, label] of Object.entries(field.options)) {
        twig += `                    <option value="${value}"{% if ${params.data_variable}.${field.name} == '${value}' %} selected{% endif %}>${label}</option>\n`;
      }
      twig += `                </select>
            </div>

`;
    } else if (type === "checkbox") {
      twig += `            <div class="form-group">
                <label>
                    <input type="checkbox" name="${field.name}" value="1"{% if ${params.data_variable}.${field.name} %} checked{% endif %}>
                    ${field.label}
                </label>
            </div>

`;
    } else {
      twig += `            <div class="form-group">
                <label for="${field.name}">${field.label}</label>
                <input type="${type}" class="form-control" id="${field.name}" name="${field.name}"
                       value="{{ ${params.data_variable}.${field.name} }}">
            </div>

`;
    }
  }

  twig += `            <button type="submit" class="btn btn-primary">Save</button>
            <a href="{{ Url.to(['site/index']) }}" class="btn btn-default">Cancel</a>
        </form>
    </div>
</div>
`;
  return twig;
}

function generateDetailView(params: ViewParams): string {
  const cols = params.columns.length > 0
    ? params.columns
    : [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
      ];

  let twig = `<div class="panel panel-default">
    <div class="panel-heading">
        <h3>${params.title}</h3>
    </div>
    <div class="panel-body">
        <table class="table table-bordered">
            <tbody>
`;
  for (const col of cols) {
    twig += `                <tr>
                    <th style="width: 200px;">${col.label}</th>
                    <td>{{ ${params.data_variable}.${col.key} }}</td>
                </tr>
`;
  }
  twig += `            </tbody>
        </table>

        <a href="{{ Url.to(['site/index']) }}" class="btn btn-default">Back to list</a>
    </div>
</div>
`;
  return twig;
}

function generateDashboardView(params: ViewParams): string {
  return `<div class="row">
    <div class="col-md-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3>${params.title}</h3>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="panel panel-info">
                            <div class="panel-heading">Summary</div>
                            <div class="panel-body">
                                <p>Total items: {{ ${params.data_variable}.totalCount }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-success">
                            <div class="panel-heading">Active</div>
                            <div class="panel-body">
                                <p>Active items: {{ ${params.data_variable}.activeCount }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-warning">
                            <div class="panel-heading">Pending</div>
                            <div class="panel-body">
                                <p>Pending items: {{ ${params.data_variable}.pendingCount }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
}

function generateCustomView(params: ViewParams): string {
  return `<div class="panel panel-default">
    <div class="panel-heading">
        <h3>${params.title}</h3>
    </div>
    <div class="panel-body">
        {# Add your custom content here #}
    </div>
</div>
`;
}
