ARG NGINX_VERSION=latest
FROM nginx:${NGINX_VERSION}
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssh-server && \
    echo "root:Docker!" | chpasswd && \
    mkdir -p /run/sshd
COPY njs /etc/nginx/njs
COPY docker /docker
RUN /docker/setup.sh
ENV NGINX_PORT 80
ENV NGINX_HOST _
EXPOSE 2222
