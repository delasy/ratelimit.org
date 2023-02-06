#!/bin/sh

domain="ratelimit.org"

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash
sudo apt-get update -y
sudo apt-get install -y build-essential certbot nginx nodejs python3-certbot-nginx redis-server

sudo mkdir -p /app
sudo chown -R ubuntu:ubuntu /app
sudo npm install -g pm2
sudo pm2 startup -u ubuntu --hp /home/ubuntu
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 1G
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 * * * *'

sudo sed -e 's/^supervised .*/supervised systemd/' -i /etc/redis/redis.conf
sudo systemctl restart redis

sudo tee /etc/nginx/sites-available/$domain > /dev/null << EOF
server {
  listen 80;
  listen [::]:80;
  root /var/www/html;
  index index.html index.htm index.nginx-debian.html;
  server_name $domain;
  location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_cache_bypass \$http_upgrade;
    proxy_redirect off;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$domain /etc/nginx/sites-enabled/
sudo sed -e 's/# server_tokens off;/server_tokens off;/' -i /etc/nginx/nginx.conf
sudo systemctl restart nginx
sudo certbot --nginx --agree-tos --redirect -d $domain -m support@$domain -n
