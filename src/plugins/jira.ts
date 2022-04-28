import axios from 'axios';

import {truncate, LogAll, LogItemobject, LogItem, TLogItemobject, IRecord} from '../utils';

type StatusGroup = {
    groupTitle: string;
    statuses: string[];
    color: string;
};

export interface JiraConfig {
    host: string;
    email: string;
    token: string;

    userId?: string;
    jql?: string;
    order?: string;
    excludeStatuses?: string[];
    statuses?: (StatusGroup | [status: string, color: string])[];

    linkToProjectFilter?: boolean;
    linkToStatusFilter?: boolean;
    ticketsByStatus?: number;
    useSeparators?: boolean;
    groupDepth?: 'flat' | 'by-project' | 'by-project-status' | 'by-status';
}

interface IByStatus extends IRecord<IRecord> {
    status: string;
    ticket: JiraApiResponse['issues'][number];
}

interface IByProject {
    [project: string]: {
        title: string;
        href?: string;
        byStatus: {
            [status: string]: IByStatus[];
        };
    };
}

interface JiraApiResponse {
    issues: {
        key: string;
        fields: {
            status: {
                name: string;
            };
            summary: string;
            project: {
                key: string;
                name: string;
            };
        };
    }[];
}

function orderByStatuses(map: StatusMap, tickets: IByProject[string]['byStatus']) {
    return Object.entries(tickets).sort(([a], [b]) => {
        if (!map[a] || !map[b]) {
            return 0;
        }
        const aIdx = map[a].idx;
        const bIdx = map[b].idx;

        return bIdx - aIdx;
    });
}

type StatusMap = Record<
    string,
    {
        color: string;
        group: string;
        idx: number;
    }
>;

export default async function JiraPlugin(cfg: JiraConfig): Promise<LogAll> {
    const config = Object.assign(
        {
            order: 'key',
            excludeStatuses: ['Done', 'Canceled', 'Closed'],
            userId: 'currentUser()',
            statuses: [
                ['Blocked', '#ff0000'],
                ['In progress', '#3aff00'],
                ['Code review', '#fec300'],
                ['Merged', '#ff6946'],
                ['Draft', '#cccccc'],
                ['Estimate', '#3f81cc'],
                ['Review', '#90b000'],
                ['On Hold', '#c0b389'],
                ['To Do', '#1f77ff'],
            ],
            linkToProjectFilter: true,
            linkToStatusFilter: true,
            ticketsByStatus: 10,
            group: false,
        },
        cfg,
    ) as Omit<Required<JiraConfig>, 'jql'> & {jql?: string};

    const jqlLink = (jql: string) => `${config.host}/issues/?jql=${encodeURIComponent(jql)}`;
    const basicAuthToken = Buffer.from(`${config.email}:${config.token}`).toString('base64');

    const statusMap = config.statuses.reduce((acc, obj, idx) => {
        if (Array.isArray(obj)) {
            const [status, color] = obj;
            acc[status.toLowerCase()] = {
                color,
                group: status,
                idx,
            };
        } else {
            const {groupTitle, statuses, color} = obj;
            statuses.forEach((status) => {
                acc[status.toLowerCase()] = {
                    color,
                    group: groupTitle,
                    idx,
                };
            });
        }

        return acc;
    }, {} as {[status: string]: {color: string; group: string; idx: number}});

    const jql =
        config.jql ||
        `assignee in (${config.userId}) and status not in (${config.excludeStatuses.join(', ')}) order by ${
            config.order
        } DESC`;

    const {data: tickets} = await axios.get<JiraApiResponse>(`${config.host}/rest/api/3/search?jql=${jql}`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuthToken}`,
        },
    });

    const byProject: IByProject = {};

    tickets.issues.forEach((ticket) => {
        const {key, name} = ticket.fields.project;

        byProject[key] = byProject[key] || {
            title: `${key} (${name})`,
            href: config.linkToProjectFilter ? jqlLink(`project = ${key} order by key DESC`) : undefined,
            byStatus: {},
        };

        const projectData = byProject[key];

        const status = ticket.fields.status.name.toLocaleLowerCase();

        projectData.byStatus[status] = projectData.byStatus[status] || [];

        projectData.byStatus[status].push({
            title: truncate(`${ticket.key} - ${ticket.fields.summary}`, 40),
            status: ticket.fields.status.name.toLocaleLowerCase(),
            href: `${config.host}/browse/${ticket.key}`,
            ticket,
        });
    });

    const result = config.groupDepth === 'flat' ? ([] as LogItem[]) : ([] as LogItemobject[]);
    Object.values(byProject).forEach((byProjectData) => {
        const {title, href, byStatus} = byProjectData;
        const statusEntries = orderByStatuses(statusMap, byStatus);

        if (config.groupDepth === 'flat') {
            const res = result as LogItem[];

            res.push({
                title,
                href,
                pad: 0,
                size: 32,
            });

            statusEntries.forEach(([status, byStatusArr]) => {
                const statusData = statusMap[status];

                if (!statusData) {
                    return;
                }

                res.push({
                    title: statusData.group,
                    pad: 0,
                    color: statusData.color,
                    href: config.linkToStatusFilter
                        ? jqlLink(`status = "${status}" order by ${config.order} DESC`)
                        : undefined,
                });

                byStatusArr.forEach((ticket) => {
                    res.push({
                        pad: 0,
                        title: ticket.title,
                        color: statusData.color,
                        href: ticket.href,
                    });
                });

                config.useSeparators && res.push('---');
            });
        } else if (config.groupDepth === 'by-project') {
            const res = result as LogItemobject[];

            const proj = {
                pad: 0,
                title,
                href,
                items: [] as LogItem[],
            };

            statusEntries.forEach(([status, byStatusArr]) => {
                const statusData = statusMap[status];

                if (!statusData) {
                    return;
                }

                proj.items.push({
                    pad: 2,
                    title: statusData.group,
                    color: statusData.color,
                    items: [],
                });

                byStatusArr.forEach((ticket) => {
                    proj.items.push({
                        pad: 2,
                        title: ticket.title,
                        color: statusData.color,
                        href: ticket.href,
                    });
                });

                config.useSeparators && proj.items.push('---');
            });
            res.push(proj);
        } else if (config.groupDepth === 'by-status') {
            const res = result as LogItemobject[];

            const proj = {
                pad: 0,
                title,
                href,
                items: [] as LogItem[],
            };

            res.push(proj);

            statusEntries.forEach(([status, byStatusArr]) => {
                const statusData = statusMap[status];

                if (!statusData) {
                    return;
                }

                const projStatus = {
                    pad: 0,
                    title: statusData.group,
                    color: statusData.color,
                    items: [] as LogItem[],
                };

                byStatusArr.forEach((ticket) => {
                    projStatus.items.push({
                        pad: 2,
                        title: ticket.title,
                        color: statusData.color,
                        href: ticket.href,
                    });
                });

                res.push(projStatus);
            });
        } else {
            const res = result as LogItemobject[];
            const proj = {
                pad: 0,
                title,
                href,
                items: [] as LogItem[],
            };

            statusEntries.forEach(([status, byStatusArr]) => {
                const statusData = statusMap[status];

                if (!statusData) {
                    return;
                }

                const statusGroup: TLogItemobject<LogItemobject> = {
                    pad: 2,
                    title: statusData.group,
                    color: statusData.color,
                    items: [],
                };

                proj.items.push(statusGroup);

                byStatusArr.forEach((ticket) => {
                    statusGroup.items?.push({
                        pad: 4,
                        title: ticket.title,
                        color: statusData.color,
                        href: ticket.href,
                    });
                });
            });
            res.push(proj);
        }
    });

    return result;
}
