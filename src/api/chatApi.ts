import axiosInstance from "../axios";

export interface ChatContact {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  deleted?: boolean
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  sender_login: string;
  recipient_login: string;
  message: string;
  deleted?: boolean
  deletedAt?: string;
  deletedBy?: string;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const chatApi = {
  async getContacts(): Promise<ChatContact[]> {
    const { data } = await axiosInstance.get<{ users: ChatContact[] }>("/users");
    return data.users ?? [];
  },

  async getMessages(): Promise<ChatMessage[]> {
    const { data } = await axiosInstance.post<{ msg: ChatMessage[] }>("/chat/getMsgs");
    return data.msg ?? [];
  },

  async getConversation(receiver: string): Promise<ChatMessage[]> {
    const { data } = await axiosInstance.post<{ msg: ChatMessage[] }>("/chat/getMsg", { receiver });
    return data.msg ?? [];
  },

  async sendMessage(receiver: string, message: string): Promise<ChatMessage> {
    const { data } = await axiosInstance.post<{ msg: ChatMessage }>("/chat/sendMsg", { receiver, message });
    return data.msg;
  },

  async updateMessage(id: string, message: string): Promise<void> {
    await axiosInstance.put(`/chat/updateMsg/${id}`, { message });
  },

  async deleteMessage(id: string): Promise<void> {
    await axiosInstance.delete(`/chat/deleteMsg/${id}`);
  },

  async restoreMessage(id: string): Promise<void> {
    await axiosInstance.put(`/chat/restoreMsg/${id}`);
  },
};

export default chatApi;
