"use client";

import { useEffect, useState } from "react";
import { tw } from "twind";
import { Spinner } from "flowbite-react";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import useSWR from "swr";
import { DataSource, DataSourceConnectionResponse, Id, PAGINATION_STARTING_PAGE_NUMBER } from "@repo/core";
import { useSession } from "next-auth/react";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";
import { TokenUser } from "lib/types/core/token-user";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { DocsList } from "lib/fe/components/docs-list";
import { DataSourceRecord, getDataSourceRecords } from "lib/fe/data-source-utils";
import { getDataSourcesApiPath, getOrganizationsIdOrSlugDataSourceConnectionsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";

export function DocumentsListPage({ orgSlug }: { orgSlug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [dataSourceRecords, setDataSourceRecords] = useState<
    DataSourceRecord[] | undefined
  >(undefined);

  const shouldFetchDataSources =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourcesResponse,
    error: dataSourcesFetchError,
  } = useSWR(
    shouldFetchDataSources
      ? getDataSourcesApiPath()
      : null,
    createFetcher<DataSourcesResponse>(),
  );

  // Fetch ALL connections
  const shouldFetchDataSourceConnections =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourceConnectionsResponse,
    error: dataSourceConnectionsFetchError,
  } = useSWR(
    shouldFetchDataSourceConnections
      ? getOrganizationsIdOrSlugDataSourceConnectionsApiPath({
        orgIdOrSlug: orgSlug,
        userId: Id.from((session.user as TokenUser).id),
        ordering: {
          orderBy: "createdAt",
          order: "desc",
        },
        pagination: {
          page: PAGINATION_STARTING_PAGE_NUMBER,
          // Hackity hack: It'll be a while before exceeding 1024 active connections per org-membership! ;)
          pageSize: 1024,
        },
      })
      : null,
    createFetcher<DataSourceConnectionResponse[]>(),
  );

  useEffect(() => {
    if (!dataSourceConnectionsResponse || !dataSourcesResponse) {
      return;
    }

    const newDataSourceRecords = getDataSourceRecords(
      dataSourceConnectionsResponse.response,
      dataSourcesResponse.response,
    );
    setDataSourceRecords([...newDataSourceRecords]);
  }, [dataSourceConnectionsResponse, dataSourcesResponse]);

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} activeItem="document-collections" />
        <div
          className={tw(
            "flex flex-col w-full p-8 max-h-screen overflow-scroll",
          )}
        >
          <div className={tw("flow-root w-full align-middle")}>
            <div className={tw("float-left h-full align-middle")}>
              <PageTitle>HOA Documents</PageTitle>
            </div>
          </div>

          <div className={tw("flex flex-wrap")}>
            {dataSourceRecords ? (
              dataSourceRecords.map((dsr) => {
                return dsr.dataSource == DataSource.PAPERLESS_NGX ? (
                  < DocsList
                    key={dsr.dataSource}
                    dataSourceRecord={dsr}
                  />
                ) : null;
              })
            ) : (
              <div className={tw("flex w-full flex-col items-center")}>
                <Spinner size="xl" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
}


export default DocumentsListPage;
