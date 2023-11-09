"use client";
import { useCompletion } from "ai/react";
import {Agents, Message} from "@prisma/client";
import { ChatHeader } from "@/components/ChatHeader";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import ChatForm from "@/components/chat-form";
import { ChatMessages } from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";

interface ChatClientProps {
    agent: Agents & {
        messages: Message[];
        _count: {
            messages: number;
        };
    };
};

export const ChatClient = ({
    agent
}: ChatClientProps) => {
const router = useRouter();
const [messages, setMessages] = useState<ChatMessageProps[]>(agent.messages);

const {
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setInput,
} = useCompletion({
    api: `/api/chat/${agent.id}`,
    onFinish(prompt, completion) {
        const systemMessage: ChatMessageProps = {
            role: "system",
            content: completion,
        };

        setMessages((current) => [...current, systemMessage]);
        setInput("");

        router.refresh();
    },
});


const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const userMessage: ChatMessageProps = {
        role: "user",
        content: input,
    };

    setMessages((current) => [...current, userMessage]);

    handleSubmit(e);
}

    return (
        <div className="flex flex-col h-full p-4 space-y-2"> 
            <ChatHeader agent ={agent} />
            <ChatMessages
            agent={agent}
            isLoading={isLoading}
            messages={messages}
            />
            <ChatForm 
             isLoading={isLoading} 
             input={input} 
             handleInputChange={handleInputChange} 
             onSubmit={onSubmit} 
            />
        </div>
    )
}