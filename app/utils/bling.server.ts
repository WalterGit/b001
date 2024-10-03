import base64 from "base-64";
import { prisma } from "./db.server";

// MODIFICADOS

// Função para trocar o código de autorização por tokens
export async function exchangeAuthorizationCode(code: string) {
  const clientId = process.env.BLING_CLIENT_ID!;
  const clientSecret = process.env.BLING_CLIENT_SECRET!;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = base64.encode(credentials); // Codificando as credenciais em Base64

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

    // Obter apenas o valor de `state` e `userId` do banco de dados
    const result = await prisma.tokensBling.findUnique({
      select: { state: true, userId: true },
      where: { id: 'cm1r065i20001vbdvf8hky7rl' },  // ID correto
    });

    const state = result?.state || '';  // Verifica se `state` existe, caso contrário usa string vazia
    const userId = result?.userId || '';  // Verifica se `userId` existe, caso contrário usa string vazia

    const data = JSON.parse(responseBody);

    // Atualizando ou criando o token no banco de dados
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

// Função para atualizar o access token usando o refresh token
export const refreshAccessToken = async (refreshToken: string, userId: string) => {
  const clientId = process.env.BLING_CLIENT_ID!;
  const clientSecret = process.env.BLING_CLIENT_SECRET!;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = base64.encode(credentials);

  // Preparando os parâmetros da requisição no formato `x-www-form-urlencoded`
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  try {
    const response = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",  // Mudando para o formato correto
        "Authorization": `Basic ${encodedCredentials}`,
        "Accept": "application/json",
      },
      body: params.toString(),  // Enviando os parâmetros codificados como string
    });

    const data: BlingTokenResponse = await response.json();

    if (response.ok) {
      // Agora o TypeScript sabe que 'access_token' existe e 'refresh_token' é opcional
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token || refreshToken; // Se não houver um novo refresh_token, usamos o atual

      // Atualiza os tokens no banco de dados
      await prisma.tokensBling.update({
        where: { userId },
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          updatedAt: new Date(),
        },
      });

      return newAccessToken;
    } else {
      throw new Error(`Erro ao renovar o token: ${data.message}`);
    }
  } catch (error) {
    console.error("Erro ao renovar o token:", error);
    throw new Error(`Falha ao renovar o token: ${error.message}`);
  }
};

// Função para verificar e retornar os tokens do usuário
export const getUserTokens = async (userId: string) => {
  return await prisma.tokensBling.findUnique({
    where: { userId }, // Encontra os tokens relacionados ao userId
  });
};
