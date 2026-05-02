// lib/github.ts
// Server-only octokit wrapper for reading and committing files to the repo.
// Used by admin API route handlers to commit JSON content changes back to GitHub.
// NEVER import this from client components.
import 'server-only'
import { Octokit } from '@octokit/rest'

const REPO_OWNER = 'Hierophantra'
const REPO_NAME = 'agewish-curry_family'
const BRANCH = 'main'

/**
 * Fetch the current contents of a file in the repo, plus its SHA (required for updates).
 * Returns null if the file does not exist.
 *
 * The SHA is a required parameter when calling createOrUpdateFileContents to update
 * an existing file — GitHub uses it to detect concurrent edits.
 */
export async function getFileContent(
  accessToken: string,
  path: string
): Promise<{ content: string; sha: string } | null> {
  const octokit = new Octokit({ auth: accessToken })
  try {
    const res = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      ref: BRANCH,
    })
    if (Array.isArray(res.data) || res.data.type !== 'file') {
      throw new Error(`Path is not a file: ${path}`)
    }
    const content = Buffer.from(res.data.content, 'base64').toString('utf8')
    return { content, sha: res.data.sha }
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      return null
    }
    throw err
  }
}

/**
 * Commit a file change to the repo via the GitHub Contents API.
 *
 * - newContent: the full new file contents (UTF-8 string); base64-encoded internally
 * - sha: required when updating an existing file (from getFileContent); omit for new files
 * - message: git commit message
 * - committerName / committerEmail: who the commit is attributed to
 *   (use the admin's GitHub identity: login + noreply email)
 */
export async function commitFile(args: {
  accessToken: string
  path: string
  newContent: string
  sha?: string
  message: string
  committerName: string
  committerEmail: string
}): Promise<void> {
  const octokit = new Octokit({ auth: args.accessToken })
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: args.path,
    branch: BRANCH,
    message: args.message,
    content: Buffer.from(args.newContent, 'utf8').toString('base64'),
    sha: args.sha,
    committer: {
      name: args.committerName,
      email: args.committerEmail,
    },
    author: {
      name: args.committerName,
      email: args.committerEmail,
    },
  })
}
