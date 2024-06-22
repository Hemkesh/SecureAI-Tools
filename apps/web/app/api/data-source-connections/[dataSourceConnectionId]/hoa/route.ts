import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getWebLogger } from "lib/api/core/logger";

import {
  NextResponseErrors,
  API,
  DataSourceConnectionService,
  PaperlessNgxClient,
} from "@repo/backend";
import { DataSource, DataSourceConnectionDocumentLink, Id, IdType } from "@repo/core";
import { DataSourceConnection } from "@repo/database";

const permissionService = new PermissionService();
const dataSourceConnectionService = new DataSourceConnectionService();
const logger = getWebLogger();

const QUERY_PARAM = "query";

export async function GET(
  req: NextRequest,
  { params }: { params: { dataSourceConnectionId: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.dataSourceConnectionId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const { searchParams } = new URL(req.url);

  // Check permissions
  const dataSourceConnectionId = Id.from<IdType.DataSourceConnection>(
    params.dataSourceConnectionId,
  );
  const [hasPermissions, resp] =
    await permissionService.hasReadDocumentsFromDataSourceConnectionPermission(
      authUserId!,
      dataSourceConnectionId,
    );
  if (!hasPermissions) {
    return resp;
  }

  const dataSourceConnection = await dataSourceConnectionService.get(
    dataSourceConnectionId,
  );
  if (!dataSourceConnection) {
    return NextResponseErrors.notFound();
  }
  try {
    const updatedDataSourceConnection = await dataSourceConnectionService.refreshAccessTokenIfExpired(dataSourceConnection);

    return await getHOAs(updatedDataSourceConnection, searchParams);
  } catch (error) {
    console.log("error = ", error);
    logger.error(
      `could not fetch documents from ${dataSourceConnection.dataSource}`,
      {
        error: error,
        dataSourceConnectionId: dataSourceConnection.id,
      },
    );
    return NextResponseErrors.internalServerError(
      `could not get documents from ${dataSourceConnection.dataSource}`,
    );
  }

}


async function getHOAs(
  dataSourceConnection: DataSourceConnection,
  searchParams: URLSearchParams,
): Promise<Response> {
  const paginationParams = API.PaginationParams.from(searchParams);
  const paperlessNgxClient = new PaperlessNgxClient(
    dataSourceConnection.baseUrl!,
    dataSourceConnection.accessToken!,
  );
  const hoaResponse = await paperlessNgxClient.getHOAs(
    paginationParams.page,
    paginationParams.pageSize,
  );

  if (!hoaResponse.ok) {
    return NextResponseErrors.internalServerError(
      `could not search HOAs from ${dataSourceConnection.dataSource} at ${dataSourceConnection.baseUrl}. Received "${hoaResponse.statusText}" (${hoaResponse.status})`,
    );
  }

  return NextResponse.json(
    hoaResponse.data!.results
  );
}