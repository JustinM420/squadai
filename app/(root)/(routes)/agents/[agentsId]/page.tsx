import prismadb from "@/lib/prismadb";
import { AgentForm } from "./components/AgentForm";
import { auth, redirectToSignIn } from "@clerk/nextjs";

interface AgentsIdPageProps {
    params: {
        agentsId: string;
    };
}

const AgentsIdPage = async ({
    params
}: AgentsIdPageProps) => {
    const { userId } = auth();
    // TODO: Check Subscription

    if (!userId) {
        return redirectToSignIn();
    }

    const agent = await prismadb.agents.findUnique({
        where: {
            id: params.agentsId,
            userId,
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