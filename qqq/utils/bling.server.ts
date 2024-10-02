import base64 from "base-64";
import { prisma } from "./db.server";

export async function exchangeAuthorizationCode(code: string) {
  const clientId = process.env.BLING_CLIENT_ID!;
  const clientSecret = process.env.BLING_CLIENT_SECRET!;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = base64.encode(credentials); // Aqui apenas base64.encode

  console.log("Credenciais (clientId:clientSecret):", credentials);
  console.log("Credenciais codificadas:", encodedCredentials);

  const tokenUrl = "https://api.bling.com.br/Api/v3/oauth/token";

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: params.toString(),
    });

    const responseBody = await response.text();
    console.log("Resposta da API do Bling:", responseBody);

    if (!response.ok) {
      const errorData = JSON.parse(responseBody) as { error_description?: string };
      throw new Error(
        `Erro ao trocar o código de autorização: ${
          errorData.error_description || response.statusText
        }`
      );
    }

    // Obter apenas o valor de `state` do banco de dados
    const result = await prisma.tokensBling.findUnique({
      select: { state: true , userId: true },
      where: { id: 'cm1r065i20001vbdvf8hky7rl' },  // ID correto
    });

    const state = result?.state || '';  // Verifica se `state` existe, caso contrário usa string vazia
    const userId = result?.userId || '';  // Verifica se `state` existe, caso contrário usa string vazia

    const data = JSON.parse(responseBody);
    
    // const userId = 'Walter123';
    const upsertToken = await prisma.tokensBling.upsert({
      where: {
        id: 'cm1r065i20001vbdvf8hky7rl',  // Usando o campo `id` como identificador
      },
      update: {
        token: 'newToken',  // Atualiza o campo `token`
        state: state,  // Agora `state` é uma string
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        updatedAt: new Date(),  // Atualiza `updatedAt`
      },
      create: {
        userId: userId,  // Cria um novo registro com `userId`
        token: 'newToken',  // Define o novo `token`
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        state: state,  // Define `state`
      },
    });

    // const data = JSON.parse(responseBody);
    console.log("Tokens recebidos:", data);
    return data;
  } catch (error) {
    console.error("Erro na troca do código por tokens:", error);
    throw new Error(
      `Falha ao trocar o código de autorização por tokens: ${error.message}`
    );
  }
}


interface BlingTokenResponse {
  access_token: string;
  refresh_token?: string;
  message?: string;
}

export const refreshAccessToken = async (refreshToken: string, userId: string) => {
  const response = await fetch("https://api.bling.com.br/Api/v3/auth/refresh_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  // Garantimos que o 'data' tenha o tipo 'BlingTokenResponse'
  const data: BlingTokenResponse = await response.json();

  if (response.ok) {
    // Agora o TypeScript sabe que 'access_token' existe e 'refresh_token' é opcional
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token || refreshToken; // Se não houver um novo refresh_token, usamos o atual

    // Atualiza os tokens no banco de dados
    // await updateUserTokens(userId, newAccessToken, newRefreshToken);

    return newAccessToken;
  } else {
    throw new Error(`Erro ao renovar o token: ${data.message}`);
  }
};

// Função para verificar e retornar os tokens do usuário
export const getUserTokens = async (userId: string) => {
  return await prisma.tokensBling.findUnique({
    where: { userId }, // Encontra os tokens relacionados ao userId
  });
};