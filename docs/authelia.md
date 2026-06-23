# Authelia / forward-auth (SSO)

OpenVitae can delegate admin authentication to a **forward-auth** reverse proxy such as
[Authelia](https://www.authelia.com/) or Authentik instead of its built-in password login.
When enabled, the proxy authenticates the visitor and injects their identity as trusted
request headers; OpenVitae reads those headers via the same `get_current_user` seam used by
the JWT flow, so nothing else changes.

The built-in JWT login remains the default — set `AUTH_MODE=proxy` to switch.

## How it works

1. The reverse proxy (Traefik / nginx / Caddy) protects the app with an Authelia
   `forward-auth` middleware.
2. After login, the proxy adds headers to each request: `Remote-Email`, `Remote-Name`,
   `Remote-Groups` (Authelia defaults).
3. OpenVitae trusts `Remote-Email` to identify the admin. The first time a new email
   appears it is auto-provisioned as an admin (disable with `PROXY_AUTH_AUTO_PROVISION=false`).
4. The admin UI hides its password form (it queries `GET /api/auth/mode`) and the
   `/api/auth/login` endpoint is disabled.

> **Important — route `/api` through the proxy.** The trusted headers must reach the API.
> Expose the **API** through the same Authelia-protected proxy and point the browser at it
> directly with `NEXT_PUBLIC_API_URL=https://your-host/api` (rather than the same-origin
> Next.js proxy). Make sure the proxy **strips inbound `Remote-*` headers** from clients so
> they can't be spoofed — only Authelia should set them.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `AUTH_MODE` | `jwt` | Set to `proxy` to enable forward-auth. |
| `PROXY_AUTH_EMAIL_HEADER` | `Remote-Email` | Header carrying the user's email. |
| `PROXY_AUTH_GROUPS_HEADER` | `Remote-Groups` | Header carrying the user's groups. |
| `PROXY_AUTH_REQUIRED_GROUP` | _(empty)_ | If set, the user must be in this group. |
| `PROXY_AUTH_AUTO_PROVISION` | `true` | Auto-create the admin row on first sight. |

### docker compose

```env
# .env
AUTH_MODE=proxy
PROXY_AUTH_REQUIRED_GROUP=openvitae-admins
NEXT_PUBLIC_API_URL=https://cv.example.com/api
```

### Helm

```yaml
auth:
  mode: proxy
  proxy:
    requiredGroup: openvitae-admins
frontend:
  extraEnv:
    NEXT_PUBLIC_API_URL: https://cv.example.com/api
```

## Example: Traefik + Authelia

```yaml
# Traefik dynamic config (middleware)
http:
  middlewares:
    authelia:
      forwardAuth:
        address: http://authelia:9091/api/authz/forward-auth
        trustForwardHeader: true
        authResponseHeaders:
          - Remote-User
          - Remote-Name
          - Remote-Email
          - Remote-Groups
```

Attach the `authelia` middleware to both the frontend and `/api` routers. Authelia's own
access-control rules decide who may reach the site; `PROXY_AUTH_REQUIRED_GROUP` is an extra
in-app check.
