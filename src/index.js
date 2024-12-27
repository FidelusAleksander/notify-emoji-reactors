const core = require('@actions/core');
const github = require('@actions/github');

async function tagUsersByReactionForIssueOrPullRequest(octokit, context, emoji, message) {
    const issueNumber = context.issue ? context.issue.number : context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // Fetch reactions for the issue or pull request
    const { data: reactions } = await octokit.rest.reactions.listForIssue({
        owner,
        repo,
        issue_number: issueNumber,
    });

    // Log the count of all reactions
    console.log(`Total reactions: ${reactions.length}`);

    // Create the comment body
    const commentBody = createCommentBody(reactions, emoji, message);

    if (commentBody) {
        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: commentBody,
        });
    } else {
        console.log('No users reacted with the specified emoji.');
    }
}

async function tagUsersByReactionForDiscussion(octokit, context, emoji, message) {
    const discussionNumber = context.payload.discussion.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // Fetch reactions for the discussion
    const { data: reactions } = await octokit.rest.reactions.listForDiscussion({
        owner,
        repo,
        discussion_number: discussionNumber,
    });

    // Log the count of all reactions
    console.log(`Total reactions: ${reactions.length}`);

    // Create the comment body
    const commentBody = createCommentBody(reactions, emoji, message);

    if (commentBody) {
        await octokit.rest.teams.createDiscussionCommentInOrg({
            org: owner,
            team_slug: repo,
            discussion_number: discussionNumber,
            body: commentBody,
        });
    } else {
        console.log('No users reacted with the specified emoji.');
    }
}

function createCommentBody(reactions, emoji, message) {
    // Find users who reacted with the specified emoji
    const usersToTag = reactions
        .filter(reaction => reaction.content === emoji)
        .map(reaction => `@${reaction.user.login}`);

    if (usersToTag.length > 0) {
        return message ? `${message}\n${usersToTag.join(' ')}` : usersToTag.join(' ');
    } else {
        return null;
    }
}

async function run() {
    try {
        const context = github.context;
        const emoji = core.getInput('emoji');
        const message = core.getInput('message');
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

        if (context.issue || context.payload.pull_request) {
            await tagUsersByReactionForIssueOrPullRequest(octokit, context, emoji, message);
        } else if (context.payload.discussion) {
            await tagUsersByReactionForDiscussion(octokit, context, emoji, message);
        } else {
            throw new Error('This action can only be used with issues, pull requests, or discussions.');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

module.exports = { tagUsersByReactionForIssueOrPullRequest, tagUsersByReactionForDiscussion, createCommentBody };