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

> **Important — the trusted headers must reach the API, and visitors must not be able to
> forge them.**
>
> - **Gate `/admin` *and* `/api`.** The admin browser calls the API same-origin at `/api`
>   (the Next.js frontend forwards those requests — including `Remote-*` — to the API), so
>   the forward-auth proxy must cover both paths. The public site fetches its data
>   server-side over the internal network and serves files via presigned object-storage
>   URLs, so it never uses the browser `/api` route — gating `/api` does not affect public
>   visitors. (If you bypass the same-origin proxy with `NEXT_PUBLIC_API_URL`, protect that
>   API origin instead.)
> - **Strip inbound `Remote-*` headers.** Because the API trusts these headers in proxy
>   mode, the proxy must overwrite them on every request so a client can't spoof
>   `Remote-Email`. Authelia forward-auth does this for the headers listed in
>   `authResponseHeaders`; ensure all of `PROXY_AUTH_EMAIL_HEADER` / `PROXY_AUTH_GROUPS_HEADER`
>   are listed there.

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

Set `auth.mode: proxy` and hand the chart your forward-auth annotation via
`ingress.protectedAnnotations`. The chart then renders a **second Ingress** that guards only
the admin surface (`/admin` + `/api`) with that annotation, while the public site and the S3
host stay anonymous — so public visitors don't depend on the auth proxy at all.

```yaml
auth:
  mode: proxy
  proxy:
    # Optional extra in-app check on top of the proxy's own access rules.
    requiredGroup: openvitae-admins
ingress:
  enabled: true
  className: traefik
  host: cv.example.com
  s3Host: cv-s3.example.com
  # Applied to the generated /admin + /api Ingress only.
  protectedAnnotations:
    traefik.ingress.kubernetes.io/router.middlewares: apps-authelia-forwardauth@kubernetescrd
```

No `NEXT_PUBLIC_API_URL` override is needed: the browser stays same-origin, the gated `/api`
route carries `Remote-*` through the frontend to the API.

## Example: Traefik + Authelia

A reusable forward-auth `Middleware` (here in the `apps` namespace; reference it as
`apps-authelia-forwardauth@kubernetescrd`):

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: authelia-forwardauth
  namespace: apps
spec:
  forwardAuth:
    address: http://authelia.apps.svc.cluster.local/api/authz/forward-auth
    trustForwardHeader: true
    authResponseHeaders:
      - Remote-User
      - Remote-Name
      - Remote-Email
      - Remote-Groups
```

Because the chart only routes `/admin` + `/api` through this middleware, Authelia's
`access_control` needs a single rule for the site host — no per-path bypass entries:

```yaml
access_control:
  default_policy: deny
  rules:
    - domain: cv.example.com
      policy: one_factor
      # Restrict to the CV owner (or use a group with PROXY_AUTH_REQUIRED_GROUP).
      subject:
        - user:you
```

`PROXY_AUTH_REQUIRED_GROUP` is an optional extra in-app check on top of this.
