export interface LoginResponseType {
  status: string;
  token: string;
  data: LoginResponseTypeData;
}

export interface LoginResponseTypeData {
  _id: string;
  email: string;
}
//

export interface ProfileResponseType {
  status: string;
  data: ProfileResponseTypeData;
}
export interface ProfileResponseTypeData {
  user: ProfileType;
}

export interface ProfileType {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  profilePicture: string;
  bio: string;
  dateOfBirth: string;
  phoneNumber: string;
  nationality: string;
  language: string;
  __v: number;

  oldPassword?: string;
  password?: string;
}
