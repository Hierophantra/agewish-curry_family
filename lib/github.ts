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
 * an existing file - GitHub uses it to detect concurrent edits.
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
  try {
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
  } catch (err: unknown) {
    // 409 (conflict) / 422 (stale or missing sha) → someone/something committed
    // since this client loaded the file. Surface a friendly, actionable message
    // (all admin routes pass the thrown text through to the editor UI).
    const status = (typeof err === 'object' && err !== null && 'status' in err) ? (err as { status: number }).status : 0
    if (status === 409 || status === 422) {
      throw new Error('This file changed on the server since you loaded it. Reload the page to get the latest version, then reapply your change.')
    }
    throw err
  }
}

/**
 * List the most recent commits that touched a file (for in-app revert).
 * Returns newest-first with the short sha, message, ISO date, and author.
 */
export async function getFileHistory(
  accessToken: string,
  path: string,
  limit = 10,
): Promise<Array<{ sha: string; message: string; date: string; author: string }>> {
  const octokit = new Octokit({ auth: accessToken })
  const res = await octokit.repos.listCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    sha: BRANCH,
    path,
    per_page: limit,
  })
  return res.data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    date: c.commit.committer?.date ?? c.commit.author?.date ?? '',
    author: c.commit.author?.name ?? c.author?.login ?? 'unknown',
  }))
}

/**
 * Read a file's contents at a specific commit ref (for restore). Returns null
 * if the file did not exist at that ref.
 */
export async function getFileContentAtRef(
  accessToken: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const octokit = new Octokit({ auth: accessToken })
  try {
    const res = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path, ref })
    if (Array.isArray(res.data) || res.data.type !== 'file') return null
    return Buffer.from(res.data.content, 'base64').toString('utf8')
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}
