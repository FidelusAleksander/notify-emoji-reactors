# Tag Users by Reaction

This GitHub Action tags users who reacted with a specific emoji on GitHub Issues or Pull Requests. It can be used to notify users who have shown interest in a particular issue or PR by reacting with an emoji.

## Inputs

- `emoji`: **(required)** The emoji to look for in reactions (omit `:` around emojis). 
- `message`: **(optional)** The customizable message to include at the beginning of the comment.


## Usage

### Example Workflow for Feature Requests

```yaml
name: Notify Feature Request Closed

on:
  issues:
    types: [closed]

permissions:
  issues: write
  contents: read

jobs:
  notify:
    runs-on: ubuntu-latest

    steps:
    - uses: FidelusAleksander/notify-emoji-reactors@master
      if: contains(github.event.issue.labels.*.name, 'feature')
      with:
        emoji: 'eyes'
        message: 'Feature has been implemented! :tada:'
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
![image](https://github.com/user-attachments/assets/2bbcdaa5-7a0d-4b34-9030-916de31f663e)
