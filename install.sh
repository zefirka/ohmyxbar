exitMsg () {
    
    echo "$*"
    exit 0
}

HERE=$(pwd)
cd /tmp

echo "Updating/Installing xBar"
curl -s https://api.github.com/repos/matryer/xbar/releases/latest \
| grep "browser_download_url.*zip" \
| cut -d : -f 2,3 \
| tr -d \" \
| wget -qi - || exitMsg 'Cant install xBar'

unzip xbar*.zip

killall || echo "xBar not started"
rm -rf /Applications/xbar.app || echo "xBar not installed, installing" 
mv xbar.app /Applications/ || exit 1

mkdir -p ~/Library/Application\ Support/xbar
mkdir -p ~/Library/Application\ Support/xbar/plugins


touch ~/Library/Application\ Support/xbar/plugins/ohmyxbar.sh
chmod 777 ~/Library/Application\ Support/xbar/plugins/ohmyxbar.sh

echo "#!/bin/sh" >> $PLUGIN_FILE
echo 'export PATH="$PATH:"/usr/local/bin/' >> $PLUGIN_FILE

echo "Configuring Yabar plugin"

read -p "[1]: Insert Jira token (see https://id.atlassian.com/manage-profile/security/api-tokens" ): " JIRA_TOKEN </dev/tty

if [ "$JIRA_TOKEN" == "" ]; then
    exitMsg "Token is required"
fi

read -p "[2]: Set your Jira email: " JIRA_EMAIL </dev/tty

if [ "$JIRA_EMAIL" == "" ]; then
    exitMsg "Email is required"
fi

read -p "[3]: Set your Jira host (e.g. my-project.atlassian.net): " JIRA_HOST </dev/tty

if [ "$JIRA_HOST" == "" ]; then
    exitMsg "Jira Host is required"
fi

read -p "[3]: Config file (default ~/.ohmyxbar.js): " CFG_FILE </dev/tty

if [ "$CFG_FILE" == "" ]; then
    CFG_FILE=~/.ohmyxbar.js
fi

echo "[4]: Config file is set to: ${CFG_FILE}"

touch $CFG_FILE
echo "" > $CFG_FILE
printf "module.exports = {\n\
    plugins: {\n\
        jira: {\n\
          token: '$JIRA_TOKEN',\n\
          emai: '$JIRA_EMAIL',\n\
          host: '$JIRA_HOST',\n\
        },\n\
    },\n\
}\n" >> $CFG_FILE

echo "npx ohmyxbar ${CFG_FILE}" >> ~/Library/Application\ Support/xbar/plugins/ohmyxbar.sh

open /Applications/xbar.app

rm -rf xbar*
cd $HERE
