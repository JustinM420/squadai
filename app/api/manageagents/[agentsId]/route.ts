// api/manageagents/[agentsId]

import prismadb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { agentsId: string }}
    ) {
    try {
        const body = await req.json();
        const user = await currentUser();
        const { src, name, description, instructions, seed, categoryId } = body;

        if (!params.agentsId) {
            return new NextResponse("AgentsId is Required", { status: 400 });
        }

        if (!user || !user.id || !user.firstName) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        if (!src || !name || !description || !instructions || !seed || !categoryId)
        return new NextResponse("Missing Required Fields", {status: 400});

        // TODO: Check for subscription

        const agent = await prismadb.agents.update({
            where: {
                id: params.agentsId,
                userId: user.id,
            },
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
        console.log("Agent PATCH", error);
        return new NextResponse("Internal Error", {status: 500});
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { agentsId: string }}
) {
    try {
        const {userId} = auth();

        if(!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        const agent = await prismadb.agents.delete({
            where: {
                userId,
                id: params.agentsId,
            }
        });

        return NextResponse.json(agent);

    } catch (error) {
        console.log("AGENT DELETE", error);
        return new NextResponse("Internal Error", {status: 500});
    }
}
