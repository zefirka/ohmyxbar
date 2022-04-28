import axios, {AxiosRequestConfig} from 'axios';

import {truncate, LogAll, LogItemobject, LogObject, LogItem, TLogItemobject} from '../utils';

type StatusGroup = {
    groupTitle: string;
    statuses: string[];
    color: string;
};

export interface GithubConfig {
    host?: string;
    token: string;
    groupDepth?: 'flat' | 'by-project' | 'by-project-status' | 'by-status';
}

interface GithubIssuesResponse {
    items: {
        html_url: string;
    }[];
}

interface IProjectData {
    title: string;
    href: string;
    repos: Record<string, GithubIssuesResponse['items'][0]>;
}

export default async function GithubPlugin(cfg: GithubConfig): Promise<LogAll> {
    const config = Object.assign(
        {
            host: 'https://api.github.com',
            groupDepth: 'flat',
        },
        cfg,
    ) as Required<GithubConfig>;

    function call<T>(url: string, opts: AxiosRequestConfig<T> = {}) {
        opts.headers = opts.headers || {};
        opts.headers['Content-Type'] = 'application/json';
        opts.headers['Authorization'] = `token ${config.token}`;
        return axios.get<T>(url, opts);
    }
    const {
        data: {login},
    } = await call<{login: string}>(`${config.host}/user`);

    const query = `is:open author:${login}`;

    const {data: issues} = await axios.get<GithubIssuesResponse>(`${config.host}/search/issues?q=${query}`);

    const byProject = issues.items.reduce((acc, i) => {
        const url = i.html_url;
        const [host, project, repo] = url.replace('https://', '').split('/');

        acc[project] = acc[project] || {
            title: project,
            href: `https://${host}/${project}`,
            repos: {},
        };

        acc[project].repos[repo] = i;
        return acc;
    }, {} as Record<string, IProjectData>);

    const result = config.groupDepth === 'flat' ? ([] as LogItem[]) : ([] as LogItemobject[]);

    Object.values(byProject).forEach((byProjectData) => {
        if (config.groupDepth === 'flat') {
            result.push({
                title: byProjectData.title,
                href: byProjectData.href,
                pad: 0,
                size: 32,
            });

            Object.entries(byProjectData.repos).forEach(([repo, data]) => {
                result.push({
                    title: repo,
                    href: data.html_url,
                    pad: 0,
                });
            });

            result.push('-');
        } else if (config.groupDepth === 'by-project') {
            result.push({
                title: byProjectData.title,
                href: byProjectData.href,
                pad: 0,
            });

            Object.entries(byProjectData.repos).forEach(([repo, data]) => {
                result.push({
                    title: repo,
                    href: data.html_url,
                    pad: 2,
                });
            });
        }
    });

    return result;
}
