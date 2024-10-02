import { json, useLoaderData } from "@remix-run/react";
import { getUserTokens, refreshAccessToken } from "#app/utils/bling.server.js";
import { prisma } from "#app/utils/db.server.js";

// Função utilitária para adicionar um atraso entre requisições
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para buscar todos os pedidos da API do Bling com gerenciamento de token e paginação
const fetchAllPedidos = async (accessToken: string, refreshToken: string, userId: string) => {
    let allPedidos = [];
    let page = 1; // Começar da primeira página
    const limite = 100; // Limite de 100 registros por página
    let hasMorePages = true;

    while (hasMorePages) {
        // const url = `https://api.bling.com.br/Api/v3/produtos?limite=${limite}&page=${page}&idContato=15857539210&dataInicial=2024-10-01&dataFinal=2024-10-01`;
        const url = `https://api.bling.com.br/Api/v3/produtos?limite=${limite}&pagina=${page}`;

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

                    // Atualiza o token para continuar com as próximas requisições
                    accessToken = newAccessToken;
                    continue; // Continua no próximo loop
                } else if (response.status === 429) { // Rate limit excedido
                    console.error("Rate limit excedido. Aguardando antes de tentar novamente...");
                    await delay(40000); // Aguardar 1 minuto completo antes de tentar novamente
                    continue; // Tentar novamente após o delay
                } else {
                    console.error("Erro ao buscar dados:", response.statusText);
                    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
                }
            }

            const data = await response.json();
            console.log(data.data.length);


            // Se o array de dados estiver vazio, não há mais páginas
            if (data.data.length === 0) {
                console.log("Nenhum dado restante, todas as páginas foram recuperadas.");
                hasMorePages = false; // Para o loop
                break;
            }


            // Acumular os resultados da página atual
            allPedidos.push(...data.data);

            // Incrementa para pegar a próxima página
            page++;

            // Adiciona um delay de 6 segundos entre as requisições para respeitar o limite de 10 por minuto
            await delay(2000); // Aguardar 6 segundos antes de fazer a próxima requisição

        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            throw error;
        }
    }

    return allPedidos; // Retorna todos os pedidos acumulados
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
        const pedidos = await fetchAllPedidos(accessToken, refreshToken, userId);
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
            {data.map((item: { id: number }) => (
                <p key={item.id}>{item.id}</p>
            ))}
        </div>
    );
}
