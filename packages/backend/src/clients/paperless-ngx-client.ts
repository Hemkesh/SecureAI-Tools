import {
  DataSourceConnectionDocumentResponse,
  removeTrailingSlash,
  MimeType,
  DataSourceConnectionDocumentLink,
  DataSourceConnectionTypes,
} from "@repo/core";

import {
  ClientResponse,
  toClientResponse,
  toClientResponseBlob,
} from "./client-response";

export class PaperlessNgxClient {
  private baseUrl: string;
  private authToken: string;

  constructor(url: string, token: string) {
    this.baseUrl = removeTrailingSlash(url)!;
    this.authToken = token;
  }

  async getDocuments({
    query,
    page,
    pageSize,
  }: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ClientResponse<DocumentsResponse>> {
    const url = new URL(`${this.baseUrl}/api/documents/`);
    if (query) {
      url.searchParams.set("query", query);
    }
    if (page) {
      url.searchParams.set("page", page.toString());
    }
    if (pageSize) {
      url.searchParams.set("page_size", pageSize.toString());
    }

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<DocumentsResponse>(resp);
  }

  async getDocument(
    id: number | string,
  ): Promise<ClientResponse<DocumentResult>> {
    const url = new URL(`${this.baseUrl}/api/documents/${id}/`);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<DocumentResult>(resp);
  }

  async getLinks(
    id: number | string,
  ): Promise<ClientResponse<DataSourceConnectionDocumentLink[]>> {
    const url = new URL(`${this.baseUrl}/api/documents/${id}/share_links/`);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<DataSourceConnectionDocumentLink[]>(resp);
  }

  async getHOAs(
    page: number,
    pageSize: number,
  ): Promise<ClientResponse<TypesResponse>> {
    const url = new URL(`${this.baseUrl}/api/storage_paths/`);

    if (page) {
      url.searchParams.set("page", page.toString());
    }
    if (pageSize) {
      url.searchParams.set("page_size", pageSize.toString());
    }

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<TypesResponse>(resp);
  }

  async getDocTypes(
    page: number,
    pageSize: number,
  ): Promise<ClientResponse<TypesResponse>> {
    const url = new URL(`${this.baseUrl}/api/document_types/`);

    if (page) {
      url.searchParams.set("page", page.toString());
    }
    if (pageSize) {
      url.searchParams.set("page_size", pageSize.toString());
    }

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<TypesResponse>(resp);
  }

  async downloadDocument(id: number | string): Promise<ClientResponse<Blob>> {
    const url = new URL(`${this.baseUrl}/api/documents/${id}/download/`);

    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponseBlob(resp);
  }
}

// TODO: Should these go into own namespace perhaps?
interface DocumentsResponse {
  count: number;
  results: DocumentResult[];
}

interface TypesResponse {
  count: number;
  results: DataSourceConnectionTypes[];
}

interface DocumentResult {
  id: number;
  title: string;
  created: string;
  original_file_name: string;
  archived_file_name: string;
}

export function toDataSourceConnectionDocumentResponse(
  dr: DocumentResult,
): DataSourceConnectionDocumentResponse {
  return {
    externalId: dr.id.toString(),
    name: dr.title,
    createdAt: new Date(dr.created).getTime(),
    mimeType: MimeType.PDF,
    metadata: {
      ...dr,
    },
  };
}