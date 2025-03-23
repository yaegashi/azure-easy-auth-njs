# Azure Easy Auth NJS Module

## Introduction

This project provides an [NJS (NGINX JavaScript)](https://nginx.org/en/docs/njs/) module for decoding and utilizing Azure Easy Auth headers in NGINX configurations.

It enables NGINX to interpret and leverage the authentication information provided by
[Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization) or
[Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/authentication) built-in authentication.

## Features

The NJS module is located in the [njs](njs) folder and provides:

- Decoding of the base64-encoded `X-MS-CLIENT-PRINCIPAL` header
- Extraction of individual claims from the authentication token
- Helper functions for common claim types:
  - Email address
  - User name
  - Object ID
  - Group memberships
  - Custom claims

Azure Easy Auth provides authentication information through the following headers as documented in
[Microsoft Learn](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities):

- `X-MS-CLIENT-PRINCIPAL`: Base64-encoded JSON containing all claims
- `X-MS-CLIENT-PRINCIPAL-ID`: User's unique identifier
- `X-MS-CLIENT-PRINCIPAL-NAME`: User's name/username
- `X-MS-CLIENT-PRINCIPAL-IDP`: Identity provider used (e.g., "aad" for Microsoft Entra ID)

## Docker Images

This project publishes customized Docker images based on [the official NGINX images](https://hub.docker.com/_/nginx):

```
ghcr.io/yaegashi/azure-easy-auth-njs/nginx:VERSION
```

where `VERSION` corresponds to the base version such as `1.27.4` or `latest`.

These images are designed to support the following projects:

- [yaegashi/azdops-nginx-aas](https://github.com/yaegashi/azdops-nginx-aas) (for Azure App Service)
- [yaegashi/azdops-nginx-aca](https://github.com/yaegashi/azdops-nginx-aca) (for Azure Container Apps)

The Docker image includes the following features:

- The [njs](njs) folder content is copied to `/etc/nginx/njs`.
- The following directives are added to `/etc/nginx/nginx.conf`:
    ```
    load_module modules/ngx_http_js_module.so;
    js_path /etc/nginx/njs;
    ```
- You can mount a persistent volume such as Azure Files share at `/nginx` in the container.
When `/nginx` exists, the following persistent directories and symbolic links will be created:
    |Persistent Directory|Symbolic Link Destination|
    |-|-|
    |`/nginx/templates`|`/etc/nginx/templates`|
    |`/nginx/data`|`/data`|

    and it monitors `/etc/nginx/templates` and reloads the NGINX server when content changes are detected.
- It launches an OpenSSH server (sshd) when the container runs on Azure App Service.
