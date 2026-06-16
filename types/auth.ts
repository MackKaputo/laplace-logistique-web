export type UserRole = "enterprise" | "personal" | "hospital" | "admin" | "driver"

export interface User {
  id: string
  user_id?: string // Add this to handle API responses that use user_id
  first_name: string
  last_name: string
  name?: string // Keep for backward compatibility
  email: string
  role?: UserRole // Keep for backward compatibility
  account_type: UserRole // Primary field for role/type
  organizationName: string
  organizationId?: string
  avatar?: string
  createdAt?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}
//deploy 12
