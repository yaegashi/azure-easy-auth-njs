#!/bin/bash

if test -d /nginx; then
    echo "I: /nginx is detected, using it as the persistent volume"
    mkdir -p /nginx/data /nginx/templates
    rm -rf /data /etc/nginx/templates
    ln -sf /nginx/data /data
    ln -sf /nginx/templates /etc/nginx/templates
    echo "I: Monitoring /etc/nginx/templates for changes"
    monitor-nginx-config.sh /etc/nginx/templates &
fi

if test -n "$WEBSITE_SITE_NAME"; then
    echo "I: Running in Azure App Service, starting SSH server."
    /usr/sbin/sshd
fi
