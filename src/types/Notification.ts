
export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  resource_id: string | null;
  data: Record<string, unknown> | null;
  read_status: boolean;
  created_at: string;
};
