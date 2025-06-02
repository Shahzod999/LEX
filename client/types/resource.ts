export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "legal" | "immigration" | "housing" | "hotlines" | "all";
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  languages: string[];
  nationality?: string;
  hours?: string;
  services: string[];
  rating?: number;
  verified: boolean;
}

export interface ResourcesResponse {
  success: boolean;
  data: Resource[];
}
