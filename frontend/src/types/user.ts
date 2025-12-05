export interface User {
  id: string;
  email: string;
  name: string;
  merchantId?: string;
  isAdmin: boolean;
}
