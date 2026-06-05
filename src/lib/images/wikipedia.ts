export interface WikipediaImage {
    url: string;
    width: number;
    height: number;
    description: string | null;
}

//Returns the thumbnail image for a given Wikipedia page title
export async function fetchWikipediaImage(label: string): Promise<WikipediaImage | null> {
    try{
        const encoded = encodeURIComponent(label.trim());
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Quagmire/1.0 (http://quagmire.app)",
            },
            next: {revalidate: 86400} // Cache for 1 day
        });

        if(!response.ok) return null;
        const data = await response.json();

        if(!data.thumbnail?.source) return null;

        return{
            url: data.thumbnail.source,
            width: data.thumbnail.width ?? 0,
            height: data.thumbnail.height ?? 0,
            description: data.description ?? null,
        };
    } catch {
        return null;
    }
}

//Returns a map of label -> image URL
export async function fetchWikipediaImages(labels: string[]): Promise<Record<string, string | null>> {
    const results = await Promise.allSettled(labels.map(async (label) => {
        const image = await fetchWikipediaImage(label);
        return {label, url: image?.url ?? null};
    }));
    return results.reduce((acc, result) => {
        if(result.status === "fulfilled"){
            acc[result.value.label] = result.value.url;
        }
        return acc;
    }, {} as Record<string, string | null>);
}