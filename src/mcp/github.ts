export interface Commit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  files_changed: string[];
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  merged_at: string;
  sha: string;
  files: string[];
  description: string;
}

const GITHUB_BASE = 'https://api.github.com';

async function githubFetch<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`${GITHUB_BASE}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res.json();
}

// Falls back to mock data if no GITHUB_TOKEN or repo configured.
export async function fetchRecentCommits(service: string, since: string): Promise<Commit[]> {
  const repo = process.env.GITHUB_REPO;
  if (repo && process.env.GITHUB_TOKEN) {
    try {
      const raw = await githubFetch<Array<{ sha: string; commit: { message: string; author: { name: string; date: string } }; files?: Array<{ filename: string }> }>>(
        `/repos/${repo}/commits?since=${since}&per_page=20`,
      );
      return raw.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        timestamp: c.commit.author.date,
        files_changed: c.files?.map((f) => f.filename) ?? [],
      }));
    } catch {
      // fall through to mock
    }
  }

  return [
    {
      sha: 'a3f2c91',
      message: 'fix: validate payment amount before Stripe call\n\nRemoves the zero-check guard accidentally dropped in #412',
      author: 'jsmith',
      timestamp: '2026-06-13T05:44:10Z',
      files_changed: ['src/payments/charge.ts', 'src/payments/validators.ts'],
    },
    {
      sha: 'b8e1d04',
      message: 'chore: bump Stripe SDK 13.0.0 → 14.0.0',
      author: 'dependabot',
      timestamp: '2026-06-13T04:30:00Z',
      files_changed: ['package.json', 'package-lock.json'],
    },
  ];
}

export async function fetchPullRequest(service: string): Promise<PullRequest[]> {
  return [
    {
      number: 412,
      title: 'refactor: simplify payment validation middleware',
      author: 'jsmith',
      merged_at: '2026-06-13T05:44:00Z',
      sha: 'a3f2c91',
      files: ['src/payments/charge.ts', 'src/payments/validators.ts'],
      description:
        'Simplified the validation chain. Removed redundant checks. ' +
        'NOTE: accidentally removed the amount > 0 guard in validators.ts.',
    },
  ];
}
