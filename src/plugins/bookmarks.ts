import axios from 'axios';
import fs from 'fs';
import {truncate, LogItem, Plugin, LogObject, GenericPlugin} from '../utils';

export type BookmarksConfig = Plugin<{
    file: string;
    bar: boolean;
    other: boolean; // @todo
    folders: string[]; // @todo
}>;

interface IBookmarks {
    roots: {
        bookmark_bar: {
            children: {
                date_added: number;
                name: string;
                type: 'url' | string;
                url?: string;
            }[];
        };
    };
}

export default GenericPlugin<BookmarksConfig>(
    {
        bar: true,
    },
    async function GithubPlugin(config) {
        const bookmarks: IBookmarks = JSON.parse(fs.readFileSync(config.file, 'utf8'));

        const result: LogItem[] = [];

        if (config.bar) {
            const all: Promise<LogObject>[] = [];
            for (const bookmark of bookmarks?.roots?.bookmark_bar?.children || []) {
                if (bookmark.type !== 'url' || !bookmark.url) {
                    continue;
                }

                all.push(
                    new Promise(async (resolve) => {
                        let name = bookmark.name;

                        if (!name) {
                            try {
                                const {data, request} = await axios.get(bookmark.url as string);
                                if (request.res.responseUrl === bookmark.url) {
                                    const m = data.match(/<title>(.*)<\/title>/);

                                    if (m) {
                                        name = m[1];
                                    }
                                }
                            } catch (e: any) {}
                        }

                        resolve({
                            title: truncate(
                                (name ||
                                    bookmark.url?.replace(/^https\:\/\//, '').replace(/^http\:\/\//, '')) as string,
                                config.itemLength,
                            ),
                            href: bookmark.url as string,
                        });
                    }),
                );
            }

            const d = await Promise.all(all);
            d.forEach((k) => result.push(k));
        }

        return result;
    },
);
