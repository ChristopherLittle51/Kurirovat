import { GithubProject } from '../types';

export const fetchGithubRepos = async (username: string): Promise<GithubProject[]> => {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('User not found');
            }
            throw new Error('Failed to fetch repositories');
        }

        const data = await response.json();

        // Map to our simplified interface
        return data.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            html_url: repo.html_url,
            language: repo.language,
            stargazers_count: repo.stargazers_count
        }));

    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        return [];
    }
};
