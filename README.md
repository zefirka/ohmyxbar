# Oh My Xbar

OhMyXbar is a all-in-one plugin for xBar which allows to show your tickets from Jira, activity in Github and custom links directly on Mac's menu bar. 

### Requirements

- OSX >= 13
- [npx](https://www.npmjs.com/package/npx)

### Install

```bash
curl https://raw.githubusercontent.com/zefirka/ohmyxbar/master/install.sh | bash
```

### Configuration

Configuration by default stored in `~/.ohmyxbar.js`

- `header` - symbol to draw in header (🤔 by default)
- `quickLinks` - nested map of links, where key is title, value is link or other map
- `plugins` - plugins configs

#### Jira config

```ts
{
    host: "jira-host.atlassian.net",
    email: "your-email@example.com",
    token: "jira token",
    // custom user id, by default: currentUser()
    userId?: "1234-20-32-30",
    // custom JQL to grab tickets
    jql?: "asignee = currentUser() and priority = High",
    // order key
    order?: "key",
    // list of statuses to exclude
    excludeStatuses?: ["closed"],
    // statuses map
    statuses?: {
        groupTitle: string;
        statuses: string[];
        color: string;
    }[] | [status: string, color: string][];

    // make projects as links to project jql
    linkToProjectFilter?: boolean;
    // make statuses header as links to project jql
    linkToStatusFilter?: boolean;
    // count of tickets by status (by default: 10)
    ticketsByStatus?: number;
    // draw separators between groups (applicable only in flat mode)
    useSeparators?: boolean;
    // how to group tickets
    groupDepth?: 'flat' | 'by-project' | 'by-status';
}
```
