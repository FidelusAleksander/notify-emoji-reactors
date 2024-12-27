const { tagUsersByReactionForIssueOrPullRequest, tagUsersByReactionForDiscussion, createCommentBody } = require('../src/index');
const core = require('@actions/core');
const github = require('@actions/github');

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('tagUsersByReaction', () => {
    let octokit;
    let context;

    beforeEach(() => {
        octokit = {
            rest: {
                reactions: {
                    listForIssue: jest.fn(),
                    listForDiscussion: jest.fn(),
                },
                issues: {
                    createComment: jest.fn(),
                },
                teams: {
                    createDiscussionCommentInOrg: jest.fn(),
                },
            },
        };

        context = {
            issue: { number: 1 },
            repo: { owner: 'owner', repo: 'repo' },
            payload: {
                discussion: { number: 1 },
                pull_request: { number: 1 },
            },
        };
    });

    test('tags users who reacted with the specified emoji and includes a custom message for issues', async () => {
        octokit.rest.reactions.listForIssue.mockResolvedValue({
            data: [
                { content: '👍', user: { login: 'user1' } },
                { content: '👀', user: { login: 'user2' } },
                { content: '👍', user: { login: 'user3' } },
            ],
        });

        const emoji = '👍';
        const message = 'Custom message';
        await tagUsersByReactionForIssueOrPullRequest(octokit, context, emoji, message);

        expect(octokit.rest.reactions.listForIssue).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
        });

        expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
            body: 'Custom message\n@user1 @user3',
        });
    });

    test('tags users who reacted with the specified emoji and includes a custom message for discussions', async () => {
        context.issue = undefined; // Simulate a discussion event
        octokit.rest.reactions.listForDiscussion.mockResolvedValue({
            data: [
                { content: '👍', user: { login: 'user1' } },
                { content: '👀', user: { login: 'user2' } },
                { content: '👍', user: { login: 'user3' } },
            ],
        });

        const emoji = '👍';
        const message = 'Custom message';
        await tagUsersByReactionForDiscussion(octokit, context, emoji, message);

        expect(octokit.rest.reactions.listForDiscussion).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            discussion_number: 1,
        });

        expect(octokit.rest.teams.createDiscussionCommentInOrg).toHaveBeenCalledWith({
            org: 'owner',
            team_slug: 'repo',
            discussion_number: 1,
            body: 'Custom message\n@user1 @user3',
        });
    });

    test('tags users who reacted with the specified emoji without a custom message for issues', async () => {
        octokit.rest.reactions.listForIssue.mockResolvedValue({
            data: [
                { content: '👍', user: { login: 'user1' } },
                { content: '👀', user: { login: 'user2' } },
                { content: '👍', user: { login: 'user3' } },
            ],
        });

        const emoji = '👍';
        await tagUsersByReactionForIssueOrPullRequest(octokit, context, emoji);

        expect(octokit.rest.reactions.listForIssue).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
        });

        expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
            body: '@user1 @user3',
        });
    });

    test('does not tag users if no reactions match the specified emoji for issues', async () => {
        octokit.rest.reactions.listForIssue.mockResolvedValue({
            data: [
                { content: '👀', user: { login: 'user2' } },
            ],
        });

        const emoji = '👍';
        await tagUsersByReactionForIssueOrPullRequest(octokit, context, emoji);

        expect(octokit.rest.reactions.listForIssue).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
        });

        expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });

    test('does not tag users if no reactions match the specified emoji for discussions', async () => {
        context.issue = undefined; // Simulate a discussion event
        octokit.rest.reactions.listForDiscussion.mockResolvedValue({
            data: [
                { content: '👀', user: { login: 'user2' } },
            ],
        });

        const emoji = '👍';
        await tagUsersByReactionForDiscussion(octokit, context, emoji);

        expect(octokit.rest.reactions.listForDiscussion).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            discussion_number: 1,
        });

        expect(octokit.rest.teams.createDiscussionCommentInOrg).not.toHaveBeenCalled();
    });
});

describe('createCommentBody', () => {
    test('creates a comment body with a custom message', () => {
        const reactions = [
            { content: '👍', user: { login: 'user1' } },
            { content: '👍', user: { login: 'user2' } },
        ];
        const emoji = '👍';
        const message = 'Custom message';

        const result = createCommentBody(reactions, emoji, message);
        expect(result).toBe('Custom message\n@user1 @user2');
    });

    test('creates a comment body without a custom message', () => {
        const reactions = [
            { content: '👍', user: { login: 'user1' } },
            { content: '👍', user: { login: 'user2' } },
        ];
        const emoji = '👍';

        const result = createCommentBody(reactions, emoji);
        expect(result).toBe('@user1 @user2');
    });

    test('returns null if no reactions match the specified emoji', () => {
        const reactions = [
            { content: '👀', user: { login: 'user1' } },
            { content: '👀', user: { login: 'user2' } },
        ];
        const emoji = '👍';
        const message = 'Custom message';

        const result = createCommentBody(reactions, emoji, message);
        expect(result).toBeNull();
    });
});