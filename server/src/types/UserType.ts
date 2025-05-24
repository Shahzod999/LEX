export interface UserType {
  _id?: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  profilePicture: string;
  bio: string;
  dateOfBirth: Date;
  phoneNumber: string;
  nationality: string;
  language: string;
}

export interface UserRequest {
  _id?: string;
  name: string;
  email: string;
  isAdmin: boolean;
  language: string;
}
