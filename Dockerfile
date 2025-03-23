ARG NGINX_VERSION=latest
FROM nginx:${NGINX_VERSION}
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssh-server && \
    echo "root:Docker!" | chpasswd && \
    mkdir -p /run/sshd
COPY sshd_config /etc/ssh
COPY monitor-nginx-config.sh /usr/local/bin
COPY 00-setup.sh /docker-entrypoint.d
COPY njs /etc/nginx/njs
RUN sed -i \
    -e '1i load_module modules/ngx_http_js_module.so;' \
    -e '/^http {/a \    js_path       /etc/nginx/njs;' \
    /etc/nginx/nginx.conf
EXPOSE 2222
