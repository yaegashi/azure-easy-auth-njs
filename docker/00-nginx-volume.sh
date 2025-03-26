#!/bin/bash

if test -d /nginx; then
	echo "I: /nginx is detected, using it as the persistent volume"
	mkdir -p /nginx/templates /nginx/sites/default /nginx/njs /nginx/logs
	rm -rf /etc/nginx/templates
	ln -sf /nginx/templates /etc/nginx/templates
	if ! test -r /nginx/templates/default.conf.template; then
		echo "I: Creating default.conf.template in /nginx/templates"
		cp /docker/default.conf.template /nginx/templates/default.conf.template
	fi
	if ! test -r /nginx/sites/default/index.html; then
		echo "I: Creating default index.html in /nginx/sites/default"
		cp /usr/share/nginx/html/index.html /nginx/sites/default/index.html
	fi
	echo "I: Monitoring /etc/nginx/templates for changes"
	/docker/monitor-nginx-config.sh /etc/nginx/templates &
fi

if test -n "$WEBSITE_SITE_NAME"; then
	echo "I: Running in Azure App Service, starting SSH server."
	cp /docker/sshd_config /etc/ssh/sshd_config
	/usr/sbin/sshd
fi
