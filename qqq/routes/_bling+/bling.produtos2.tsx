import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getUserTokens, refreshAccessToken } from '#app/utils/bling.server.ts'; // Lógica de tokens via Prisma

// Função para buscar os pedidos da API do Bling com gerenciamento de token
const fetchPedidos = async (accessToken: string, refreshToken: string, userId: string) => {
    const url = "https://api.bling.com.br/Api/v3/produtos?limite=100&idContato=15857539210&dataInicial=2024-10-01&dataFinal=2024-10-01"
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) { // Token inválido ou expirado
                console.log("Token expirado ou inválido. Tentando renovar o token...");

                // Tentativa de renovação do token
                const newAccessToken = await refreshAccessToken(refreshToken, userId);
                console.log("Novo accessToken gerado:", newAccessToken);

                // Após renovar o token, tenta novamente buscar os dados
                const retryResponse = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                });

                if (!retryResponse.ok) {
                    console.error("Erro ao buscar dados após renovar o token:", retryResponse.statusText);
                    throw new Error(`Erro ao buscar dados após renovar o token: ${retryResponse.statusText}`);
                }

                return await retryResponse.json(); // Retorna os dados na segunda tentativa com o novo accessToken
            } else {
                console.error("Erro ao buscar dados:", response.statusText);
                throw new Error(`Erro ao buscar dados: ${response.statusText}`);
            }
        }

        return await response.json(); // Retorna os dados se a primeira requisição for bem-sucedida
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        throw error;
    }
};

// Loader para buscar os pedidos no lado do servidor
export const loader = async ({ request }) => {
    const userId = "Walter123"; // Pegar o userId real, por exemplo, da sessão
    console.log("Buscando tokens para o userId:", userId);

    const userTokens = await getUserTokens(userId);

    if (!userTokens || !userTokens.access_token || !userTokens.refresh_token) {
        console.error("Usuário não encontrado ou sem tokens cadastrados.");
        throw new Error("Usuário não encontrado ou sem tokens cadastrados.");
    }

    const { access_token: accessToken, refresh_token: refreshToken } = userTokens;

    try {
        // Tenta buscar os pedidos com o accessToken existente
        const pedidos = await fetchPedidos(accessToken, refreshToken, userId);
        return json(pedidos); // Retorna os pedidos se tudo funcionar corretamente
    } catch (error) {
        console.error("Erro no loader ao buscar pedidos:", error);
        return json({ error: (error as Error).message }, { status: 500 });
    }
};

// Componente de visualização dos pedidos
export default function Pedidos() {
    const data = useLoaderData();

    // Se houver erro, exibe a mensagem
    if ('error' in data && data.error) {
        return <div>Erro ao carregar pedidos: {data.error}</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Lista de Pedidos</h1>
            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}

            {data.data.map((item: { id: number }) =>

                <p key={item.id}>{item.id}</p>

            )}

        </div>
    );
}
