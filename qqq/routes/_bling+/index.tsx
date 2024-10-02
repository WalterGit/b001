import { type LoaderFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react"
import { Button } from "#app/components/ui/button.js";
import { prisma } from "#app/utils/db.server.js";



export const loader: LoaderFunction = async ({ request }) => {
    const clientId = process.env.BLING_CLIENT_ID!;
    const userId = 'Walter123';
    // const state = process.env.BLING_STATE! // Implemente esta função
    const state = generateRandomState()
    const authorizationUrl = `https://bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=${state}`;

    console.log(authorizationUrl);


    const upsertToken = await prisma.tokensBling.upsert({
        where: {
            id: 'cm1r065i20001vbdvf8hky7rl',  // Use the correct field name for the unique identifier
        },
        update: {
            token: 'newToken',  // Atualiza o campo `token`
            state: state,  // Atualiza o campo `state`
            updatedAt: new Date(),  // Atualiza o campo `updatedAt` manualmente, embora isso seja feito automaticamente pelo Prisma
        },
        create: {
            userId: userId,   // Cria um novo registro com `userId`
            token: 'newToken',  // Define o novo `token`
            state: state,  // Define o novo `state`

        },
    });


    return json(authorizationUrl);
};

function generateRandomState() {
    return Math.random().toString(36).substring(2);
}



export default function Index() {
    const authorizationUrl = useLoaderData<string>() // Change the type of `authorizationUrl` to `string`
    return (
        <div className="container">
            <h1>Unknown Route</h1>
            <pre>
                {JSON.stringify(authorizationUrl, null, 2)}
            </pre>
            <Button asChild>
                <Link to={authorizationUrl} >Código de Autorização</Link>
            </Button>

        </div>
    )
}