import JiraPlugin, {JiraConfig} from './plugins/jira';
import {logObject} from './utils';

const PLUGINS: Record<string, Function> = {
    jira: JiraPlugin,
};

export interface OhMyXbarConfig {
    header?: string;
    quickLinks: any;
    plugins?: {
        jira?: JiraConfig;
    };
}

export default async (config: OhMyXbarConfig) => {
    console.log(config.header || '🤔');
    console.log('---');

    if (config.quickLinks) {
        logObject(config.quickLinks);
        console.log('---');
    }

    for (const [name, pluginConfig] of Object.entries(config.plugins || {})) {
        if (PLUGINS[name]) {
            logObject(await PLUGINS[name](pluginConfig));
        }
    }
};
