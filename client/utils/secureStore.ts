import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken";

export async function saveTokenToSecureStore(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getTokenFromSecureStore(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeTokenFromSecureStore() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
