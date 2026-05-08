import { z } from "zod";

const latestCommitSchema = z.object({
  sha: z.string(),
  html_url: z.string().url()
});

export interface LatestCommit {
  shortSha: string;
  url: string;
}

export async function fetchLatestMainCommit(signal?: AbortSignal): Promise<LatestCommit | null> {
  try {
    const init: RequestInit = {
      headers: {
        accept: "application/vnd.github+json"
      }
    };

    if (signal) {
      init.signal = signal;
    }

    const response = await fetch(
      "https://api.github.com/repos/baditaflorin/film-color-script-generator/commits/main",
      init
    );

    if (!response.ok) {
      return null;
    }

    const commit = latestCommitSchema.parse(await response.json());
    return {
      shortSha: commit.sha.slice(0, 12),
      url: commit.html_url
    };
  } catch {
    return null;
  }
}
