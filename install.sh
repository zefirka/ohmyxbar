exitMsg () {
    echo "$*"
    rm -rf xbar*
    cd $HERE
    exit 0
}

as_error () {
    echo -e "\033[1;31mError: $* \033[0m"
}

as_warning () {
    echo -e "\033[1;33mWarning: $* \033[0m"
}

HERE=$(pwd)
cd /tmp

echo "Updating/Installing xBar"

rm xbar*.zip
XBAR_LATEST=$(curl -s https://api.github.com/repos/matryer/xbar/releases/latest | grep "browser_download_url.*zip" | cut -d : -f 2,3 | tr -d \")
curl ${XBAR_LATEST} -LO || exitMsg 'Cant install xBar'

unzip xbar*.zip

killall xbar || echo "xBar not started"
rm -rf /Applications/xbar.app || echo "xBar not installed, installing" 
mv xbar.app /Applications/ || exit 1

PLUGIN_FILE=~/Library/Application\ Support/xbar/plugins/ohmyxbar.sh

mkdir -p ~/Library/Application\ Support/xbar
mkdir -p ~/Library/Application\ Support/xbar/plugins

if [ -f "${PLUGIN_FILE}" ]; then
    read -p "OhMyXbar plugin is already exists, do you want to overwrite it? [y/N]: " OVERWRITE </dev/tty

    if [ "$OVERWRITE" == "y" ]; then
        as_warning "Overwriting plugin config"
    else
        exitMsg "Sorry. But updates only manual. See https://github.com/zefirka/ohmyxbar"
    fi
fi


touch "${PLUGIN_FILE}"
chmod 777 "${PLUGIN_FILE}"

echo "#!/bin/sh" > "${PLUGIN_FILE}"
echo "" >> "${PLUGIN_FILE}"
echo 'export PATH="$PATH:"/usr/local/bin/' >> "${PLUGIN_FILE}"

echo "Configuring OhMyXbar plugin"

read -p "[1]: Config file (default ~/.ohmyxbar.js): " CFG_FILE </dev/tty

if [ "$CFG_FILE" == "" ]; then
    CFG_FILE=~/.ohmyxbar.js
fi

echo "[2]: Config file is set to: ${CFG_FILE}"

if [ -f "${CFG_FILE}" ]; then
    read -p "Config file (${CFG_FILE}) is already exists, do you want to overwrite it? [y/N]: " OVERWRITE </dev/tty

    if [ "$OVERWRITE" == "y" ]; then
        as_warning "Overwriting config file"
        echo "" > "${CFG_FILE}"
    else
        exitMsg "Sorry. But updates only manual. See https://github.com/zefirka/ohmyxbar"
    fi
fi

touch "${CFG_FILE}"

i=2

echo "module.exports = {" >> "${CFG_FILE}"
echo "  plugins: {" >> "${CFG_FILE}"

configure_jira() {
    while true; do
        read -p "[$i]: Insert Jira token (see https://id.atlassian.com/manage-profile/security/api-tokens): " JIRA_TOKEN </dev/tty
        if [ "$JIRA_TOKEN" == "" ]; then
            as_error "Jira token is required"
        else
            break
        fi
    done
    
    i=$((i+1))

    while true; do
        read -p "[$i]: Set your Jira email: " JIRA_EMAIL </dev/tty
        if [ "$JIRA_EMAIL" == "" ]; then
            as_error "Jira email is required"
        else
            break
        fi
    done

    i=$((i+1))

    while true; do
        read -p "[$i]: Set your Jira host (e.g. my-project.atlassian.net): " JIRA_HOST </dev/tty
        if [ "$JIRA_HOST" == "" ]; then
            as_error "Jira host is required"
        else
            break
        fi
    done

    echo "    jira: {" >> "${CFG_FILE}"
    echo "      token: '${JIRA_TOKEN}'," >> "${CFG_FILE}"
    echo "      email: '${JIRA_EMAIL}'," >> "${CFG_FILE}"
    echo "      host: '${JIRA_HOST}'" >> "${CFG_FILE}"
    echo "    }," >> "${CFG_FILE}"
}

configure_github() {
    while true; do
        read -p "[$i]: Insert Github Personal Access token (see https://github.com/settings/tokens): " GITHUB_TOKEN </dev/tty
        if [ "$GITHUB_TOKEN" == "" ]; then
            as_error "Github token is required"
        else
            break
        fi
    done

    i=$((i+1))

    read -p "[$i]: Set your Github API host (default: api.github.com): " GITHUB_HOST </dev/tty

    if [ "$GITHUB_HOST" == "" ]; then
        GITHUB_HOST="https://api.github.com"
    fi

    i=$((i+1))

    echo "    github: {" >> "${CFG_FILE}"
    echo "      token: '${GITHUB_TOKEN}'," >> "${CFG_FILE}"
    echo "      host: '${GITHUB_HOST}'" >> "${CFG_FILE}"
    echo "    }," >> "${CFG_FILE}"
}

i=$((i+1))
read -p "[$i]: Use Jira plugin? (Y/n): " USE_JIRA </dev/tty

if [ ! "$USE_JIRA" == "n" ]; then
    configure_jira
fi

i=$((i+1))
read -p "[$i]: Use Github plugin? (Y/n): " USE_GITHUB </dev/tty

if [ ! "$USE_GITHUB" == "n" ]; then
    configure_github
fi

echo "  }" >> "${CFG_FILE}"
echo "}" >> "${CFG_FILE}"

echo "npx ohmyxbar@latest --config=${CFG_FILE}" >> ~/Library/Application\ Support/xbar/plugins/ohmyxbar.sh

sleep 1;
open /Applications/xbar.app

rm -rf xbar*
cd $HERE

echo "OhMyXbar plugin is set up. You always can configure it in: "
echo " -- Configuration file: ${CFG_FILE}"
echo " -- XBar plugin file: ${PLUGIN_FILE}"
