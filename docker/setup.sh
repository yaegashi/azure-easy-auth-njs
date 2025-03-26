#!/bin/bash

set -x

ln -s /docker/00-nginx-volume.sh /docker-entrypoint.d

sed -i \
    -e '1i load_module modules/ngx_http_js_module.so;' \
    -e '/^http {/a \    js_path       /etc/nginx/njs;' \
    /etc/nginx/nginx.conf
