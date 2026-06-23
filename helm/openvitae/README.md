# OpenVitae Helm chart

Deploys OpenVitae (FastAPI **api** + Next.js **frontend**) to Kubernetes, with an
optional in-cluster **PostgreSQL** and **MinIO** that mirror the Docker Compose
stack. Postgres and MinIO run as StatefulSets backed by PersistentVolumeClaims,
so **their data survives pod restarts and `helm upgrade`.**

## Quick start

Install from the OCI registry (published on `v*` tags), or from a local checkout:

```sh
# From GHCR (OCI)
helm install openvitae oci://ghcr.io/isaiah-harville/charts/openvitae --version 0.1.0 \
  --namespace openvitae --create-namespace \
  --set auth.jwtSecret=$(openssl rand -hex 32) \
  --set auth.admin.password='a-strong-password'

# Or from this repo
helm install openvitae ./helm/openvitae \
  --namespace openvitae --create-namespace \
  --set auth.jwtSecret=$(openssl rand -hex 32) \
  --set auth.admin.password='a-strong-password'
```

Then port-forward the frontend (or enable an ingress):

```sh
kubectl -n openvitae port-forward svc/openvitae-frontend 3000:3000
```

## Data persistence — what survives what

| Action | Postgres / MinIO data |
| --- | --- |
| Pod crash / reschedule | **Kept** (PVC reattaches) |
| `kubectl rollout restart` / image update | **Kept** |
| `helm upgrade` | **Kept** |
| `helm uninstall` | **Kept** — StatefulSet PVCs are *not* auto-deleted; remove them manually if you really want the data gone |

The app never wipes data on boot: schema changes are applied with Alembic
(`upgrade head`, additive only) and seeding only inserts the admin user / default
config when they are absent. The only destructive path is the admin-initiated
**Restore**.

> Production: use real backups (the admin **Backup** export, or volume snapshots).
> A PVC is not a backup.

## Storage classes / Longhorn

Every PVC honors a storage class. Set one globally or per component:

```sh
# Put everything on Longhorn
helm install openvitae ./helm/openvitae --set global.storageClass=longhorn

# Or per component
helm install openvitae ./helm/openvitae \
  --set postgres.persistence.storageClass=longhorn \
  --set minio.persistence.storageClass=longhorn
```

Longhorn notes (the defaults are already compatible):

- Volumes are **ReadWriteOnce** and each stateful component runs a **single
  replica**, which is what Longhorn block volumes expect.
- Postgres stores data under a `PGDATA` subdirectory, so Longhorn's `lost+found`
  doesn't trip Postgres' "data directory not empty" check.
- Size the volumes via `postgres.persistence.size` / `minio.persistence.size`;
  Longhorn's own replica count/locality is configured in the StorageClass.

## External database / object storage

Disable the bundled services to use managed ones:

```sh
helm install openvitae ./helm/openvitae \
  --set postgres.enabled=false \
  --set externalDatabase.url='postgresql+psycopg2://user:pass@host:5432/openvitae' \
  --set minio.enabled=false \
  --set externalS3.endpointUrl=https://s3.amazonaws.com \
  --set externalS3.accessKey=... --set externalS3.secretKey=... \
  --set externalS3.bucket=my-bucket --set externalS3.region=us-east-1 \
  --set publicS3Url=https://my-bucket.s3.amazonaws.com
```

## Ingress and the object-storage URL (important)

Headshots and PDFs are served via **presigned URLs the browser opens directly**,
so the object-storage endpoint must be reachable from clients — not just from
inside the cluster. Set `publicS3Url`, or give MinIO its own ingress host:

```sh
helm install openvitae ./helm/openvitae \
  --set ingress.enabled=true \
  --set ingress.host=cv.example.com \
  --set ingress.s3Host=s3.example.com \
  --set ingress.tls.enabled=true
```

With `ingress.s3Host` set, `publicS3Url` defaults to that host automatically.

## Environment / `.env`

Every variable from the app's `.env` is configurable. The common ones have
dedicated values (`auth.*`, `corsOrigins`, the `postgres`/`minio`/`externalS3`
blocks, ingress-derived `S3_*`/`CORS_ORIGINS`). Anything else — or any future
key — goes through `extraEnv`, which is merged into the API config and overrides
the chart-derived values on a key clash:

```yaml
extraEnv:
  ENVIRONMENT: production
  PRESIGNED_URL_EXPIRE_SECONDS: "3600"
  APP_NAME: "Jane Doe — CV"

frontend:
  extraEnv:
    NEXT_PUBLIC_API_URL: https://api.example.com   # bypass the /api proxy
```

Non-secret env lands in a ConfigMap; secret env (`JWT_SECRET`, `ADMIN_PASSWORD`,
`DATABASE_URL`, S3 keys) lands in a Secret — supply those via `existingSecret`
or, under Flux, `valuesFrom` (so nothing sensitive sits in plaintext values).

## Secrets

Sensitive env (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, S3 keys) is
rendered into a Secret. To manage it yourself, create a Secret with those keys
and set `existingSecret=<name>`.

See [values.yaml](values.yaml) for all options.
