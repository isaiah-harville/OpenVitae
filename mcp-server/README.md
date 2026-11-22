# OpenVitae MCP server

An [MCP](https://modelcontextprotocol.io) server that lets an LLM client — Claude
Code, Claude Desktop, or any other MCP client — read and edit an OpenVitae site:
profile, theme, feature toggles, pages, projects and their screenshots, skills, tags,
publications, talks, and blog posts.

It calls the same REST API the `/admin` dashboard uses, so every change is validated
by the backend and goes live immediately.

## Authentication

Create an API token and give it to the backend as `API_TOKEN`:

```bash
openssl rand -hex 32
```

- **Docker Compose:** put it in `.env` as `API_TOKEN=...` and restart the `api`.
- **Helm:** set `auth.apiToken` (or add `API_TOKEN` to your `existingSecret`).

The server then sends it as `Authorization: Bearer <token>`. The backend accepts that
token in both `jwt` and `proxy` auth modes and treats it as the first admin user.

On a site in `jwt` mode, you can use the admin email and password instead of a token
(`OPENVITAE_EMAIL` / `OPENVITAE_PASSWORD`).

## Configuration

| Variable | Meaning |
| --- | --- |
| `OPENVITAE_URL` | The site or API origin, without `/api`. Default `http://localhost:8000`. |
| `OPENVITAE_API_TOKEN` | The backend's `API_TOKEN`. |
| `OPENVITAE_EMAIL`, `OPENVITAE_PASSWORD` | Password login instead of a token (`jwt` mode only). |
| `OPENVITAE_HEADERS` | Optional JSON object of extra request headers, for access proxies that accept service tokens. |

**Behind a forward-auth proxy** (Authentik, Authelia), the ingress sends anything
without a browser session to the login page, so the token never reaches the API. Point
`OPENVITAE_URL` at the API directly, for example:

```bash
kubectl -n openvitae port-forward svc/openvitae-api 8000:8000
```

## Adding it to a client

Claude Code, from the OpenVitae checkout:

```bash
claude mcp add openvitae \
  -e OPENVITAE_URL=http://localhost:8000 \
  -e OPENVITAE_API_TOKEN=your-token \
  -- uv run --directory mcp-server openvitae-mcp
```

Claude Desktop or any client with a JSON config:

```json
{
  "mcpServers": {
    "openvitae": {
      "command": "uv",
      "args": ["run", "--directory", "/path/to/OpenVitae/mcp-server", "openvitae-mcp"],
      "env": {
        "OPENVITAE_URL": "http://localhost:8000",
        "OPENVITAE_API_TOKEN": "your-token"
      }
    }
  }
}
```

`openvitae-mcp --transport streamable-http` serves it over HTTP instead of stdio.

## Tools

| Area | Tools |
| --- | --- |
| Site config | `get_site_config`, `update_profile`, `update_theme`, `update_features`, `set_pages`, `upload_headshot` |
| Projects | `list_projects`, `get_project`, `create_project`, `update_project`, `reorder_projects`, `delete_project`, `add_project_screenshot`, `remove_project_screenshot` |
| Skills, tags | `list_skills`, `create_skill`, `update_skill`, `delete_skill`, `list_tags`, `create_tag`, `delete_tag` |
| Publications | `list_publications`, `create_publication`, `update_publication`, `delete_publication`, `import_publication_by_doi`, `import_publications_bibtex` |
| Talks | `list_talks`, `create_talk`, `update_talk`, `delete_talk` |
| Blog | `list_blog_posts`, `create_blog_post`, `update_blog_post`, `delete_blog_post` |

The `update_profile`, `update_theme`, and `update_features` tools merge keys into
what is saved; pass `replace: true` to overwrite the whole object. Screenshots and
headshots upload from a local path or an `http(s)` image URL. Destructive tools are
marked with MCP's `destructiveHint` so clients can ask before running them.

## Development

```bash
cd mcp-server
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check .
```
