import prismadb from "@/lib/prismadb";
import {auth, redirectToSignIn} from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ChatClient } from "./components/Client";


interface ChatIdPageProps {
    params: {
        chatId: string;
    }
}


const ChatIdPage = async ({
    params
}: ChatIdPageProps) => {
    const { userId } = auth();

    if (!userId) {
        return redirectToSignIn();
    }

    const agent = await prismadb.agents.findUnique({
        where: {
            id: params.chatId
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc",
                },
                where: {
                    userId,
                }
            },
            _count: {
                select: {
                    messages: true
                }
            }
        }
    });

    if (!agent) {
        return redirect("/");
    }


    return (
        <ChatClient agent={agent} />
    )
}

export default ChatIdPage;