export type Advisor = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  online?: boolean;
};

export type Message = {
  id: string;
  advisorId: string;
  author: 'user' | 'advisor';
  text: string;
  createdAt: string;
};

