export interface ContentData {
  id: string;
  content_name: string;
  content_filename?: string;
  description?: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentDataFormData {
  content_name: string;
  content_filename?: string;
  description?: string;
  file_size?: number;
  file_type?: string;
}