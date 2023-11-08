// api/manageagents/ 

import prismadb from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const user = await currentUser();
        const { src, name, description, instructions, seed, categoryId } = body;

        if (!user || !user.id || !user.firstName) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        if (!src || !name || !description || !instructions || !seed || !categoryId)
        return new NextResponse("Missing Required Fields", {status: 400});

        // TODO: Check for subscription

        const agent = await prismadb.agents.create({
            data: {
                categoryId,
                userId: user.id,
                userName: user.firstName,
                src,
                name,
                description,
                instructions,
                seed
            }
        });

        return NextResponse.json(agent);

    } catch (error) {
        console.log("Agent POST", error);
        return new NextResponse("Internal Error", {status: 500});
    }
}
