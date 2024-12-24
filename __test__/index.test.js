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
                },
                issues: {
                    createComment: jest.fn(),
                },
            },
        };

        context = {
            issue: { number: 1 },
            repo: { owner: 'owner', repo: 'repo' },
        };
    });

    test('tags users who reacted with the specified emoji and includes a custom message', async () => {
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