import JiraPlugin, {JiraConfig} from './plugins/jira';
import GithubPlugin, {GithubConfig} from './plugins/github';

import {logObject} from './utils';

const PLUGINS: Record<string, Function> = {
    jira: JiraPlugin,
    github: GithubPlugin,
};

export interface OhMyXbarConfig {
    header?: string;
    quickLinks: any;
    plugins?: {
        jira?: JiraConfig;
        github?: GithubConfig;
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
            try {
                logObject(await PLUGINS[name](pluginConfig));
            } catch (e) {
                console.log('e', e); // eslint-disable-line
            }
        }
    }
};
