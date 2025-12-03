import axiosInstance from "../axiosInstance";

function base(userType) {
  // axiosInstance already has baseURL ending with /api
  return userType === "company" ? "/company/chat" : "/chat";
}

export async function listConversations(userType) {
  const { data } = await axiosInstance.get(`${base(userType)}/conversations`);
  return data.conversations || [];
}

export async function startConversation(userType, payload) {
  const { data } = await axiosInstance.post(`${base(userType)}/start`, payload);
  return data.conversation;
}

export async function listMessages(userType, conversationId, cursor) {
  const url = new URL(`${base(userType)}/${conversationId}/messages`, window.location.origin);
  if (cursor) url.searchParams.set("cursor", cursor);
  const { data } = await axiosInstance.get(url.pathname + url.search);
  return data;
}

export async function sendMessage(userType, conversationId, text) {
  const { data } = await axiosInstance.post(`${base(userType)}/${conversationId}/messages`, { text });
  return data.message;
}

export async function markRead(userType, conversationId) {
  await axiosInstance.post(`${base(userType)}/${conversationId}/read`, {});
}

export async function sendAttachment(userType, conversationId, file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosInstance.post(`${base(userType)}/${conversationId}/messages`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data.message;
}


