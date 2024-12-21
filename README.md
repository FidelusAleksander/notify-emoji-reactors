# My GitHub Action

This GitHub Action automatically tags users who reacted to an issue or pull request with a specific emoji. 

## Table of Contents

- [Usage](#usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Example](#example)
- [License](#license)

## Usage

To use this action in your GitHub workflow, include the following in your workflow YAML file:

```yaml
jobs:
  tag_reactors:
    runs-on: ubuntu-latest
    steps:
      - name: Tag Reactors
        uses: ./notify-emoji-reactors
        with:
          emoji: ':eyes:'
```

## Inputs

- `emoji`: The emoji to look for in reactions. This is a required input.

## Outputs

This action does not produce any outputs.

## Example

Here’s an example of how to set up the action in your workflow:

```yaml
name: Tag Reactors

on:
  issue_comment:
    types: [created]

jobs:
  tag_reactors:
    runs-on: ubuntu-latest
    steps:
      - name: Tag Reactors
        uses: ./notify-emoji-reactors
        with:
          emoji: ':thumbsup:'
```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.