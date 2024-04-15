##!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

echo "content-type: text/plain\r\n"

DEPLOY_EPOCH=$(date +%Y_%m_%d_%H_%M_%S)

echo "--[ Starting deploy ]----------------------------------------------------------"
echo "Deploying $DEPLOY_EPOCH"
echo "-------------------------------------------------------------------------------"
echo


echo "--[ Updating code from GitHub ]------------------------------------------------"
cd /opt/vigrid-server-listing
git pull origin
echo "-------------------------------------------------------------------------------"
echo

echo "--[ Building web app ]---------------------------------------------------------"
cd /opt/vigrid-server-listing/web
npm install
npm run build
echo "-------------------------------------------------------------------------------"
echo

echo "--[ Deploying web app ]--------------------------------------------------------"
mkdir "/var/www/$DEPLOY_EPOCH"
cp -r dist/* "/var/www/$DEPLOY_EPOCH"
if [ -f /var/www/current/servers.json ]; then
	cp /var/www/current/servers.json "/var/www/$DEPLOY_EPOCH/"
else
	echo "{}" > "/var/www/$DEPLOY_EPOCH/servers.json"
fi
cp /var/www/current/report.html "/var/www/$DEPLOY_EPOCH/" || true
chmod a+r "/var/www/$DEPLOY_EPOCH/servers.json"
unlink /var/www/current
ln -s "/var/www/$DEPLOY_EPOCH" /var/www/current
echo "-------------------------------------------------------------------------------"
echo

echo "--[ Building poller ]----------------------------------------------------------"
cd /opt/vigrid-server-listing/poller
make test
go build -o poller .
echo "-------------------------------------------------------------------------------"
echo

echo "--[ Deploying poller ]---------------------------------------------------------"
cp /opt/vigrid-server-listing/poller/poller "/opt/poller/poller.$DEPLOY_EPOCH"
unlink /opt/poller/poller
ln -s "/opt/poller/poller.$DEPLOY_EPOCH" /opt/poller/poller
supervisorctl restart poller
echo "-------------------------------------------------------------------------------"
echo

# TODO: Clean up old versions

