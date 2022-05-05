export type TLogItemobject<T extends LogItem> = {
    pad?: number;
    title?: string;
    items?: T[];
    size?: number;
    href?: string;
    color?: string;
};
export type LogItemobject = {
    title?: string;
    items?: LogItem[];
    size?: number;
    href?: string;
    color?: string;
    pad?: number;
};
export type LogItemString = string;
export type LogItem = LogItemString | LogItemobject;
export type LogObject<T extends LogItem = LogItem> = Record<string, T>;
export type LogArr = LogObject[] | LogItemobject[];
export type LogAll = LogObject | LogArr | LogItem[] | LogItemobject | string;

export interface IRecord<T = {}> {
    title: string;
    href?: string;
    color?: string;
    items?: T[];
}

export const truncate = (s: string, n: number) => (s.length > n ? s.substr(0, n - 1) + '...' : s);

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

export const logObject = (o: any, pad = 0, usePad = true): any => {
    if (Array.isArray(o) && o.length) {
        o.forEach((val) => {
            usePad
                ? withPad(val.pad !== undefined ? val.pad : pad + 2, () => logObject(val, pad + 2))
                : logObject(val, pad, usePad);
        });
        return;
    }

    if (typeof o === 'object') {
        if (o.title) {
            const sub = `${o.color ? `color=${o.color}` : ''} ${o.href ? `href=${o.href}` : ''} ${
                o.size ? `size=${o.size}` : ''
            }`.trim();

            log(`${o.title} ${sub ? '|' : ''} ${sub}`);
            if (o.items && o.items.length) {
                return logObject(o.items, o.pad !== undefined ? o.pad : pad, usePad);
            }
            return;
        }

        Object.entries(o).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                log(key);
                logObject(value, pad, usePad);
            } else if (typeof value === 'object') {
                log(`${key}`);
                if (usePad) {
                    // @ts-ignore
                    value && withPad(value.pad !== undefined ? value.pad : pad + 2, () => logObject(value, pad + 2));
                } else {
                    logObject(value, pad, usePad);
                }
            } else {
                log(`${key} | href=${value}`);
            }
        });
        return;
    }

    log(`${o}`);
};
