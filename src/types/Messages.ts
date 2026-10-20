
export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_status: boolean;
  created_at: string;
};