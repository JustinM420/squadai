import prismadb from "@/lib/prismadb";
import { AgentForm } from "./components/AgentForm";

interface AgentsIdPageProps {
    params: {
        agentsId: string;
    };
}

const AgentsIdPage = async ({
    params
}: AgentsIdPageProps) => {
    // TODO: Check Subscription

    const agent = await prismadb.agents.findUnique({
        where: {
            id: params.agentsId,
        }
    });

    const categories = await prismadb.category.findMany();

    return (
        <AgentForm
        initialData={agent}
        categories={categories}
        />
    );
}

export default AgentsIdPage;