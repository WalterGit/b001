
import { type LoaderFunctionArgs, json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import { exchangeAuthorizationCode } from "#app/utils/bling.server.js";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    if (error) {
        throw new Error(`Error from Bling: ${error}`);
    }


    const tokens = await exchangeAuthorizationCode(code ?? '');
    console.log('Tokens obtidos:', tokens);

    return json({ code, state, error });
}

export default function BlgCallback() {
    const data = useLoaderData<typeof loader>()
    return (
        <div>
            <h1>Unknown Route</h1>
            <pre>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}