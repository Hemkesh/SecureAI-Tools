import { MimeType } from "./mime-type";

export interface DataSourceConnectionDocumentLink {
  // Id in the DataSource
  id: string;
  // Name from DataSource
  created: string;
  expiration: string | null;
  slug: string;
}
