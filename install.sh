exitMsg () {
    echo "$*"
    exit 0
}

HERE=$(pwd)
cd /tmp

echo "Installing xBar"
curl -s https://api.github.com/repos/matryer/xbar/releases/latest \
| grep "browser_download_url.*zip" \
| cut -d : -f 2,3 \
| tr -d \" \
| wget -qi - || exitMsg 'Cant install xBar'

unzip xbar*.zip
mv xbar.app /Applications/ || exit 1


mkdir -p ~/Library/Application Support/xbar
mkdir -p ~/Library/Application Support/xbar/plugins

PLUGIN_FILE=~/Library/Application Support/xbar/plugins/ohmyxbar.sh

rm -f $PLUGIN_FILE
touch $PLUGIN_FILE
chmod 777 $PLUGIN_FILE

echo "#!/bin/sh" >> $PLUGIN_FILE
echo 'export PATH="$PATH:"/usr/local/bin/' >> $PLUGIN_FILE

echo "Configuring Yabar plugin"

read -p "[1]: Insert Jira token (see https://id.atlassian.com ): " JIRA_TOKEN </dev/tty

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

echo "npx ohmyxbar ${CFG_FILE}" >> $PLUGIN_FILE

open /Applications/xbar.app

rm -rf xbar*
cd $HERE
