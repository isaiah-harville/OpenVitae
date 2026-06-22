{{/* Chart base name */}}
{{- define "openvitae.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Fully qualified release name */}}
{{- define "openvitae.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "openvitae.api.fullname" -}}{{ include "openvitae.fullname" . }}-api{{- end -}}
{{- define "openvitae.frontend.fullname" -}}{{ include "openvitae.fullname" . }}-frontend{{- end -}}
{{- define "openvitae.postgres.fullname" -}}{{ include "openvitae.fullname" . }}-postgres{{- end -}}
{{- define "openvitae.minio.fullname" -}}{{ include "openvitae.fullname" . }}-minio{{- end -}}
{{- define "openvitae.secretName" -}}
{{- if .Values.existingSecret -}}{{ .Values.existingSecret }}{{- else -}}{{ include "openvitae.fullname" . }}{{- end -}}
{{- end -}}

{{/* Common labels */}}
{{- define "openvitae.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ include "openvitae.name" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end -}}

{{/* Per-component selector labels. Call with (dict "ctx" . "component" "api") */}}
{{- define "openvitae.selectorLabels" -}}
app.kubernetes.io/name: {{ include "openvitae.name" .ctx }}
app.kubernetes.io/instance: {{ .ctx.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{/* Resolve a StorageClass: component value -> global -> omit (cluster default).
     Call with (dict "ctx" . "sc" .Values.postgres.persistence.storageClass) */}}
{{- define "openvitae.storageClass" -}}
{{- $sc := .sc | default .ctx.Values.global.storageClass -}}
{{- if $sc }}
storageClassName: {{ $sc | quote }}
{{- end }}
{{- end -}}

{{/* Image ref with appVersion fallback. Call with (dict "ctx" . "img" .Values.api.image) */}}
{{- define "openvitae.image" -}}
{{- $tag := .img.tag | default .ctx.Chart.AppVersion -}}
{{- printf "%s:%s" .img.repository $tag -}}
{{- end -}}

{{/* Internal API URL (frontend SSR/proxy target) */}}
{{- define "openvitae.apiInternalUrl" -}}
http://{{ include "openvitae.api.fullname" . }}:{{ .Values.api.service.port }}
{{- end -}}

{{/* Internal S3 endpoint (api -> minio) */}}
{{- define "openvitae.s3Endpoint" -}}
{{- if .Values.minio.enabled -}}
http://{{ include "openvitae.minio.fullname" . }}:9000
{{- else -}}
{{ required "externalS3.endpointUrl is required when minio.enabled=false" .Values.externalS3.endpointUrl }}
{{- end -}}
{{- end -}}

{{/* Browser-reachable S3 URL for presigned links */}}
{{- define "openvitae.s3PublicUrl" -}}
{{- if .Values.publicS3Url -}}
{{ .Values.publicS3Url }}
{{- else if and .Values.ingress.enabled .Values.ingress.s3Host -}}
{{ if .Values.ingress.tls.enabled }}https{{ else }}http{{ end }}://{{ .Values.ingress.s3Host }}
{{- else -}}
{{ include "openvitae.s3Endpoint" . }}
{{- end -}}
{{- end -}}

{{/* S3 bucket / region (in-cluster minio or external) */}}
{{- define "openvitae.s3Bucket" -}}
{{- if .Values.minio.enabled -}}{{ .Values.minio.bucket }}{{- else -}}{{ .Values.externalS3.bucket }}{{- end -}}
{{- end -}}
{{- define "openvitae.s3Region" -}}
{{- if .Values.minio.enabled -}}{{ .Values.minio.region }}{{- else -}}{{ .Values.externalS3.region }}{{- end -}}
{{- end -}}

{{/* CORS origins: explicit value, else derive from ingress host */}}
{{- define "openvitae.corsOrigins" -}}
{{- if .Values.corsOrigins -}}
{{ .Values.corsOrigins }}
{{- else if .Values.ingress.enabled -}}
{{ if .Values.ingress.tls.enabled }}https{{ else }}http{{ end }}://{{ .Values.ingress.host }}
{{- else -}}
http://localhost:3000
{{- end -}}
{{- end -}}
