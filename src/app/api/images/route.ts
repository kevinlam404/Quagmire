import {NextResponse} from 'next/server';
import {fetchWikipediaImages} from '@/lib/images/wikipedia';

export async function POST(request: Request){
    try{
        const body = await request.json();
        const {labels} = body as {labels: string[]};

        if(!Array.isArray(labels) || labels.length === 0){
            return NextResponse.json({images: {}}, {status: 400});
        }

        //Capped at 20 labels per request to prevent overload
        const capped = labels.slice(0, 20);
        const images = await fetchWikipediaImages(capped);

        return NextResponse.json({images}, {status: 200});
    } catch (error) {
        return NextResponse.json({images: {}}, {status: 500});
    }
}