const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
    try {
        await db.category.createMany({
            data: [
                { name: "Project Managers" },
                { name: "Personal Assistants" },
                { name: "Consultants" },
                { name: "Coaches" },
                { name: "Specialists" },
                { name: "Database Managers" },
                { name: "Schedule Managers" },
            ]
        })
    }  catch (error) {
        console.error("Error seeding default categories", error);
    } finally {
        await db.$disconnect();
    }
}

main();