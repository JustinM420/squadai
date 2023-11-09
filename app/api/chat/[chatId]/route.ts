import { StreamingTextResponse, LangChainStream } from "ai";
import { auth, currentUser } from "@clerk/nextjs";
import { CallbackManager } from "langchain/callbacks";
import { Replicate } from "langchain/llms/replicate";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";


export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const { prompt } = await request.json();
        const user = await currentUser();

        if(!user || !user.firstName || !user.id) {
            return new NextResponse("Unautherized", { status: 401});
        }

        const identifier = request.url + "-" + user.id;
        const { success } = await rateLimit(identifier);

        if (!success) {
            return new NextResponse("Rate limit exceeded", { status: 429 });
        }

        const agent = await prismadb.agents.update({
            where: {
                id: params.chatId,
            },
            data: {
                messages: {
                    create: {
                        content: prompt,
                        role: "user",
                        userId: user.id,
                    }
                }
            }
        });

        if (!agent) {
            return new NextResponse("Agent not found", { status: 404 });
        }

        const name = agent.id;
        const agent_file_name = name + ".txt";

        const agentKey = {
            AgentName: name,
            userId: user.id,
            modelName: "llama2-13b",
        };

        const memoryManager = await MemoryManager.getInstance();

        const records = await memoryManager.readLatestHistory(agentKey);

        if (records.length === 0) {
            await memoryManager.seedChatHistory(agent.seed, "\n\n", agentKey);
        }

        await memoryManager.writeToHistory("User: " + prompt + "\n", agentKey);

        const recentChatHistory = await memoryManager.readLatestHistory(agentKey);

        const similarDocs = await memoryManager.vectorSearch(
            recentChatHistory,
            agent_file_name,
        );

        let relevantHistory = "";

        if (!!similarDocs && similarDocs.length !== 0) {
            relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
        }

        const { handlers } = LangChainStream();

        const model = new Replicate({
            model:
                "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
            input: {
                max_length: 2048,
            },
            apiKey: process.env.REPLICATE_API_TOKEN,
            callbackManager: CallbackManager.fromHandlers(handlers),
        });

        model.verbose = true;

        const resp = String(
            await model
                .call(
                    `
                    ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${name}: prefix.

                    ${agent.instructions}

                    Below are the relevant details about ${name}'s past and the conversation you are in.
                    ${relevantHistory}

                    ${recentChatHistory}\n${name}:
                    `
                )
                .catch(console.error)
        );

        const cleaned = resp.replaceAll(",", "");
        const chunks = cleaned.split("\n");
        const response = chunks[0];

        await memoryManager.writeToHistory("" + response.trim(), agentKey);
        var Readable = require("stream").Readable;

        let s = new Readable();
        s.push(response);
        s.push(null);

        if (response !== undefined && response.length > 1) {
            memoryManager.writeToHistory("" + response.trim(), agentKey);

            await prismadb.agents.update({
                where: {
                    id: params.chatId,
                },
                data: {
                    messages: {
                        create: {
                            content: response.trim(),
                            role: "system",
                            userId: user.id
                        }
                    }
                }
            })
        };


        return new StreamingTextResponse(s);

    } catch (error) {
        console.log("[CHAT POST]", error);
        return new NextResponse("Internal Chat Creation error", {status: 500 });
    }
}