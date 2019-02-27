export class RepoIssue {

    url: string;
    repository_url: string;
    labels_url: string;
    comments_url: string;
    events_url: string;
    html_url: string;
    id: number;
    node_id: string;
    number: string;
    title: string;
    user: any;
    labels: [any];
    state: string;
    locked: boolean;
    assignee: any;
    assignees: [any];
    milestone: any;
    comments: [any];
    created_at: Date;
    updated_at: Date;
    closed_at: Date;
    author_association: string;
    pull_request: any;
    body: string;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}
