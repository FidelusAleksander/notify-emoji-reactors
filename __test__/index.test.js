const { tagUsersByReaction } = require('../src/index');
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
        await tagUsersByReaction(octokit, context, emoji, message);

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
        await tagUsersByReaction(octokit, context, emoji, message);

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

    test('tags users who reacted with the specified emoji without a custom message', async () => {
        octokit.rest.reactions.listForIssue.mockResolvedValue({
            data: [
                { content: '👍', user: { login: 'user1' } },
                { content: '👀', user: { login: 'user2' } },
                { content: '👍', user: { login: 'user3' } },
            ],
        });

        const emoji = '👍';
        await tagUsersByReaction(octokit, context, emoji);

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

    test('does not tag users if no reactions match the specified emoji', async () => {
        octokit.rest.reactions.listForIssue.mockResolvedValue({
            data: [
                { content: '👀', user: { login: 'user2' } },
            ],
        });

        const emoji = '👍';
        await tagUsersByReaction(octokit, context, emoji);

        expect(octokit.rest.reactions.listForIssue).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            issue_number: 1,
        });

        expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
});