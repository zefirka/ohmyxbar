export type TLogItemobject<T extends LogItem> = {
    pad?: number;
    title?: string;
    items?: T[];
    size?: number;
    href?: string;
    color?: string;
    image?: string;
};
export type LogItemobject = {
    title?: string;
    items?: LogItem[];
    size?: number;
    href?: string;
    color?: string;
    pad?: number;
    image?: string;
};
export type LogItem = string | LogItemobject;
export type LogObject<T extends LogItem = LogItem> = {pad?: number; items?: LogItem[]} & Record<string, T>;
export type LogArr = LogObject[] | LogItemobject[];
export type LogAll = LogObject | LogArr | LogItem[] | LogItemobject | string;

export interface IRecord<T = {}> {
    title: string;
    href?: string;
    color?: string;
    items?: T[];
}

export const truncate = (s: string, n: number) => (s.length > n ? s.substr(0, n - 1) + '...' : s);

export type Plugin<T> = {
    title?: string;
    itemLength?: number;
} & T;

interface ILog {
    (s: string): void;
    pad?: number;
}
let log: ILog = (s: string) => console.log(s);
log.pad = 0;

const pad = (n: number) => {
    log = (s) => console.log(`${'-'.repeat(n)}${s}`);
    log.pad = n;
};

const withPad = (n: number, fn: Function) => {
    let pPad = log.pad;
    pad(n);
    fn();
    pad(pPad || 0);
};

export const logObject = (o: LogAll, pad = 0): any => {
    if (Array.isArray(o) && o.length) {
        o.forEach((val) => {
            if (typeof val === 'string') {
                withPad(pad + 2, () => logObject(val, pad + 2));
            } else {
                withPad(val.pad !== undefined ? val.pad : pad + 2, () => logObject(val, pad + 2));
            }
        });
        return;
    }

    if (typeof o === 'object' && !Array.isArray(o)) {
        if (o.title) {
            const sub = `${o.color ? `color=${o.color}` : ''} ${o.href ? `href=${o.href}` : ''} ${
                o.size ? `size=${o.size}` : ''
            } ${o.image ? `templateImage=${o.image}` : ''}`.trim();

            log(`${o.title} ${sub ? '|' : ''} ${sub}`);
            if (o.items && o.items.length) {
                return logObject(o.items, o.pad !== undefined ? o.pad : pad);
            }
            return;
        }

        Object.entries(o).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                log(key);
                logObject(value, pad);
            } else if (typeof value === 'object') {
                log(`${key}`);
                value && withPad(value.pad !== undefined ? value.pad : pad + 2, () => logObject(value, pad + 2));
            } else {
                log(`${key} | href=${value}`);
            }
        });
        return;
    }

    log(`${o}`);
};

export function GenericPlugin<T extends Plugin<{}>>(
    defaults: Partial<T>,
    fn: (cfg: Required<Plugin<T>>) => Promise<(LogItem | LogObject)[]>,
) {
    return async function (cfg: Partial<T> = {}) {
        const config = Object.assign(defaults, cfg) as Required<Plugin<T>>;
        const result = [];

        if (config.title) {
            result.push({title: config.title, pad: 0});
        }

        result.push(...(await fn(config)));

        return result;
    };
}
