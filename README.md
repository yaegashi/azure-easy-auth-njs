# Azure Easy Auth NJS Module

## Introduction

This project provides an [NJS (NGINX JavaScript)](https://nginx.org/en/docs/njs/) module for decoding and utilizing Azure Easy Auth headers in NGINX configurations.

It enables NGINX to interpret and leverage authentication information provided by
[Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization) or
[Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/authentication) built-in authentication.

## Features

The NJS module, located in the [njs](njs) folder, offers the following capabilities:

- Decoding the base64-encoded `X-MS-CLIENT-PRINCIPAL` header
- Extracting individual claims from the authentication token
- Providing helper functions for common claim types:
  - Email address
  - Username
  - Object ID
  - Group memberships
  - Custom claims

Azure Easy Auth provides authentication information through the following headers, as documented in
[Microsoft Learn](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities):

- `X-MS-CLIENT-PRINCIPAL`: Base64-encoded JSON containing all claims
- `X-MS-CLIENT-PRINCIPAL-ID`: The user's unique identifier
- `X-MS-CLIENT-PRINCIPAL-NAME`: The user's name or username
- `X-MS-CLIENT-PRINCIPAL-IDP`: The identity provider used (e.g., "aad" for Microsoft Entra ID)

## Docker Images

This project publishes customized Docker images based on [the official NGINX images](https://hub.docker.com/_/nginx):

```
ghcr.io/yaegashi/azure-easy-auth-njs/nginx:VERSION
```

Here, `VERSION` corresponds to the base version, such as `1.27.4` or `latest`.

These images are designed to support the following projects:

- [yaegashi/azdops-nginx-aas](https://github.com/yaegashi/azdops-nginx-aas) (for Azure App Service)
- [yaegashi/azdops-nginx-aca](https://github.com/yaegashi/azdops-nginx-aca) (for Azure Container Apps)

The Docker image includes the following features:

- The content of the [njs](njs) folder is copied to `/etc/nginx/njs`.
- The following directives are added to `/etc/nginx/nginx.conf`:
    ```
    load_module modules/ngx_http_js_module.so;
    js_path /etc/nginx/njs;
    ```
- You can mount a persistent volume, such as an Azure Files share, at `/nginx` in the container.
When `/nginx` exists, the following persistent folders will be created:
    | Persistent Folder       | Description                                                                 |
    |-------------------------|-----------------------------------------------------------------------------|
    | `/nginx/templates`      | Configuration template folder. Symlinked to `/etc/nginx/templates`. The default `default.conf.template` will be placed if empty. |
    | `/nginx/sites/default`  | Default document root folder. The default `index.html` will be placed if empty. |
    | `/nginx/njs`            | NJS module folder. Included in the NJS search paths via `js_path`.          |
    | `/nginx/logs`           | Log output folder.                                                         |

    Additionally, it monitors `/etc/nginx/templates` and reloads the NGINX server when content changes are detected.
- It launches an OpenSSH server (sshd) when the container runs on Azure App Service.

You can customize NGINX using `/nginx/templates/default.conf.template` in the persistent folder.

`${NGINX_HOST}` and `${NGINX_PORT}` in template files will be replaced with the corresponding environment variables using `envsubst`.

### Default Template Configuration

It's [docker/default.conf.template](docker/default.conf.template) and copied to `/nginx/templates/default.conf.template` if not exists.

```
server {
    listen ${NGINX_PORT} default_server;
    server_name _;

    root /nginx/sites/default;
}
```

### Secure Path Configuration

Put the following in `/nginx/template/default.conf.template`:

```
server {
    listen ${NGINX_PORT};
    server_name _;

    root /nginx/sites/default;

    js_import auth from azure_easy_auth.js;
    js_set $is_authorized auth.isAuthorizedPrincipals;

    location ~ ^/secure/ {
        set $authorized_principals "98a7b6c5-d4e3-21f0-9g8h-765432109876";
        if ($is_authorized = "0") {
            return 403 "Forbidden";
        }
    }
}
```

This configuration secures paths beginning with `/secure/` using the `isAuthorizedPrincipals` function. The function takes the `$authorized_principals` NGINX variable as input, which can contain multiple comma-separated GUIDs. The function returns `"1"` if any of these GUIDs match the authenticated user's object ID or group claims, or `"0"` if no match is found. Access is denied with a 403 response when the function returns `"0"`.

### Dynamic Secure Path Configuration

```
server {
    listen ${NGINX_PORT};
    server_name _;

    root /nginx/sites/default;

    js_import auth from azure_easy_auth.js;
    js_set $is_authorized auth.isAuthorizedPrincipals;
    set $super_principal "123e4567-e89b-12d3-a456-426614174000";

    location ~ ^/secure/(?<secured_principal>[^/]+) {
        set $authorized_principals "$secured_principal,$super_principal";
        if ($is_authorized = "0") {
            return 403 "Forbidden";
        }
    }
}
```

This configuration demonstrates dynamic permission setting based on the request path. It extracts a `$secured_principal` (GUID) from paths like `/secure/{GUID}/...` and combines it with an always-authorized `$super_principal` to create the `$authorized_principals` variable.
Access is granted only if the user's object ID or group claims match either the `$secured_principal` or the `$super_principal`.

### Multiple Subdomain Configuration

```
map $host $site_name {
    default default;
    ~*^${NGINX_HOST}$ default;
    ~*^(.+)\.${NGINX_HOST}$ $1;
}

server {
    listen ${NGINX_PORT};
    server_name .${NGINX_HOST};

    root /nginx/sites/$site_name;

    js_import auth from azure_easy_auth.js;
    js_set $is_authorized auth.isAuthorizedPrincipals;

    if ($site_name ~* ^pr-review-) {
        # Set PR reviewer's group principal
        set $authorized_principals "85b93f9c-7d2e-4a80-b71c-425ae32f1cc1";
        if ($is_authorized = "0") {
            return 403 "Forbidden";
        }
    }
}

server {
    listen ${NGINX_PORT} default_server;
    server_name _;
    return 404 "Not Found";
}
```

This configuration serves different content based on subdomains. When `NGINX_HOST=example.com`, it behaves as follows:

- Access to the main domain (`example.com`) serves content from `/nginx/sites/default`
- Regular subdomains (e.g., `blog.example.com`) serve content from their corresponding subdirectories (`/nginx/sites/blog`)
- Pull request review subdomains (e.g., `pr-review-123.example.com`) are protected and only accessible by authenticated users in the group `85b93f9c-7d2e-4a80-b71c-425ae32f1cc1`
- Access to any undefined domain (e.g., `example.net`) returns a 404 error

This pattern is particularly useful in team development environments where you might create dedicated preview environments for each pull request, accessible only to specific reviewers.
