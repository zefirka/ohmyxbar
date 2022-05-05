import axios, {AxiosRequestConfig} from 'axios';

import {truncate, LogAll, LogItemobject, LogItem} from '../utils';

const statusColors = {
    open: '#ffa900',
    liked: '#00e400',
    changesRequested: '#ff1500',
};

export interface GithubConfig {
    host?: string;
    token: string;
    show?: 'all' | 'pulls' | 'issues';
    excludeProjects?: string[];
    groupDepth?: 'flat' | 'by-project' | 'by-repo' | 'by-project-repo' | 'by-project-type' | 'by-project-repo-type';
    useSeparators?: boolean;
    itemLength?: number;
}

interface GithubIssuesResponse {
    items: {
        title: string;
        html_url: string;
        state: string;
    }[];
}

interface IProjectData {
    title: string;
    href: string;
    repos: Record<
        string,
        {
            url: string;
            issues: GithubIssuesResponse['items'][0][];
            pulls: GithubIssuesResponse['items'][0][];
        }
    >;
}

export default async function GithubPlugin(cfg: GithubConfig): Promise<LogAll> {
    const config = Object.assign(
        {
            host: 'https://api.github.com',
            groupDepth: 'flat',
            show: 'all',
            excludeProjects: [],
            useSeparators: true,
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

        if (config.excludeProjects.includes(project)) {
            return acc;
        }

        acc[project] = acc[project] || {
            title: truncate(project, config.itemLength),
            href: `https://${host}/${project}`,
            repos: {},
        };

        const repoUrl = `https://${host}/${project}/${repo}`;
        acc[project].repos[repo] = acc[project].repos[repo] || {issues: [], pulls: [], url: repoUrl};
        if (url.includes('/pull')) {
            acc[project].repos[repo].pulls.push(i);
        } else {
            acc[project].repos[repo].issues.push(i);
        }
        return acc;
    }, {} as Record<string, IProjectData>);

    const result = config.groupDepth === 'flat' ? ([] as LogItem[]) : ([] as LogItemobject[]);

    const repoPad = {
        flat: 0,
        'by-repo': 0,
        'by-status': 0,
        'by-project': 2,
        'by-project-repo': 2,
        'by-project-repo-type': 2,
        'by-project-type': 2,
    }[config.groupDepth];

    const issuePullTitlePad = {
        flat: 0,
        'by-status': 0,
        'by-repo': 2,
        'by-project': 2,
        'by-project-repo': 4,
        'by-project-repo-type': 4,
        'by-project-type': 2,
    }[config.groupDepth];

    const issuePullPad = {
        flat: 0,
        'by-repo': 2,
        'by-status': 0,
        'by-project': 2,
        'by-project-repo': 4,
        'by-project-repo-type': 6,
        'by-project-type': 4,
    }[config.groupDepth];

    const shouldRenderType = config.show === 'all' && config.groupDepth.includes('type');
    const shoudSeparateProjects = config.useSeparators && !config.groupDepth.includes('project');
    const shoudSeparateRepos =
        config.useSeparators && (config.groupDepth === 'flat' || !config.groupDepth.includes('repo'));
    const shoudSeparateType =
        config.useSeparators && (config.groupDepth === 'flat' || !config.groupDepth.includes('type'));

    Object.values(byProject).forEach((byProjectData, pidx) => {
        const isLastProject = pidx === Object.values(byProject).length - 1;

        const renderEntries = () => {
            Object.entries(byProjectData.repos).forEach(([repo, data], idx) => {
                const isLastRepo = idx === Object.keys(byProjectData.repos).length - 1;

                result.push({
                    title: truncate(repo, config.itemLength),
                    href: data.url,
                    pad: repoPad,
                    size: 14,
                });

                if (data.issues.length && config.show !== 'pulls') {
                    const isLastType = data.pulls.length === 0;

                    shouldRenderType &&
                        result.push({
                            title: 'Issues',
                            pad: issuePullTitlePad,
                        });

                    data.issues.forEach((issue) => {
                        result.push({
                            title: truncate(issue.title, config.itemLength),
                            href: issue.html_url,
                            pad: issuePullPad,
                        });
                    });

                    shoudSeparateType && !isLastType && result.push({title: '---', pad: issuePullTitlePad});
                }

                if (data.pulls.length && config.show !== 'issues') {
                    const isLastType = data.issues.length === 0;

                    shouldRenderType &&
                        result.push({
                            title: 'Pulls',
                            pad: issuePullTitlePad,
                        });

                    data.pulls.forEach((issue) => {
                        result.push({
                            title: truncate(issue.title, config.itemLength),
                            href: issue.html_url,
                            pad: issuePullPad,
                        });
                    });

                    shoudSeparateType && !isLastType && result.push({title: '---', pad: issuePullTitlePad});
                }

                shoudSeparateRepos && !isLastRepo && result.push({title: '---', pad: repoPad});
            });
        };

        result.push({
            title: byProjectData.title,
            href: byProjectData.href,
            pad: 0,
            size: 16,
        });

        renderEntries();
        shoudSeparateProjects && !isLastProject && result.push({title: '---', pad: 0});
    });

    return result;
}
