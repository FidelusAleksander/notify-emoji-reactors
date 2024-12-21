const core = require('@actions/core');
const github = require('@actions/github');

async function tagUsersByReaction(octokit, context, emoji) {
    const issueNumber = context.issue.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // Fetch reactions for the issue or pull request
    const { data: reactions } = await octokit.rest.reactions.listForIssue({
        owner,
        repo,
        issue_number: issueNumber,
    });

    // Find users who reacted with the specified emoji
    const usersToTag = reactions
        .filter(reaction => reaction.content === emoji)
        .map(reaction => `@${reaction.user.login}`);

    if (usersToTag.length > 0) {
        const commentBody = `Thanks for your reaction! Tagging you: ${usersToTag.join(', ')}`;
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

async function run() {
    try {
        const context = github.context;
        const emoji = core.getInput('emoji');
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

        await tagUsersByReaction(octokit, context, emoji);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

module.exports = { tagUsersByReaction };