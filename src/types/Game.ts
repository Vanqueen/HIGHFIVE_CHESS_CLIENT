
export type Game = {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  status: string;
  result: string | null;
  winner: string | null;
  fen: string;
  pgn: string;
  turn: string;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
};

export type Move = {
  id: string;
  game_id: string;
  player_id: string | null;
  move_number: number;
  from_sq: string;
  to_sq: string;
  promotion: string | null;
  san: string | null;
  fen: string | null;
  created_at: string;
};
