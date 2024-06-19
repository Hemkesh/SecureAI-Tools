"use client";

import useSWR from "swr";
import { DataSourceRecord } from "../data-source-utils";
import { getDataSourceConnetionDocumentsApiPath } from "../api-paths";
import { DataSourceConnectionDocumentResponse, Id } from "@repo/core";
import { createFetcher } from "../api";
import FolderTree, { NodeData, testData } from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';
import 'styles/DocumentsList.css';

export const DocsList = ({
  dataSourceRecord,
  orgSlug,
}: {
  dataSourceRecord: DataSourceRecord;
  orgSlug: string;
}) => {

  const hoaIdToName = new Map<number, string>([
    [1, 'Amhurst'],
    [2, 'CreekHaven'],
    [3, 'Woodmont Townhomes'],
  ]);

  const docTypeToName = new Map<number, string>([
    [1, 'ByLaws'],
    [2, 'CC&Rs'],
    [3, 'Articles of Incorporation'],
  ]);

  const {
    data: dataSourceDocumentsResponse,
    error: dataSourceDocumentsFetchError,
    isLoading: isDataSourceDocumentsResponseLoading,
    mutate: mutateDataSourceDocumentsResponse,
  } = useSWR(
    getDataSourceConnetionDocumentsApiPath({
      connectionId: Id.from(dataSourceRecord.connection!.id),
      query: '',
      pagination: {
        // Hackity hack!
        // TODO: Convert this into proper infinite scroll (that's the only one that works with Google Drive API)!
        page: 1,
        // 999 because Google Drive has max limit of 1000!
        pageSize: 999,
      },
    }),
    createFetcher<DataSourceConnectionDocumentResponse[]>(),
  );

  function dataToNodeData(data: DataSourceConnectionDocumentResponse[]): NodeData {
    const hoaData: NodeData = {
      name: 'HOAs',
      children: [],
      isOpen: false,
    };

    const hoaMAP = new Map<string, Map<string, string[]>>([]);

    for (const doc of data) {
      const hoaId = doc.metadata?.storage_path;
      const docId = doc.metadata?.document_type;

      if (!hoaId || !docId) {
        continue;
      }

      const hoaName: string = hoaIdToName.get(hoaId)!;
      const docType: string = docTypeToName.get(docId)!;

      if (!hoaName || !docType) {
        continue;
      }

      if (!hoaMAP.has(hoaName)) {
        hoaMAP.set(hoaName, new Map<string, string[]>());
      }
      const hoaMap = hoaMAP.get(hoaName)!;
      if (!hoaMap.has(docType)) {
        hoaMap.set(docType, []);
      }
      hoaMap.get(docType)!.push(doc.name);
    }

    console.log(hoaMAP);

    hoaMAP.forEach((hoaMap, hoaName) => {
      const hoaNode: NodeData = {
        name: hoaName,
        children: [],
        isOpen: false,
      };
      hoaMap.forEach((docNames, docType) => {
        const docNode: NodeData = {
          name: docType,
          children: docNames.map((docName) => {
            return {
              name: docName,
              isOpen: false,
            };
          }),
          isOpen: false,
        };
        hoaNode.children?.push(docNode);
      });
      hoaData.children?.push(hoaNode);
    });

    return hoaData;
  }

  return (
    <div className="w-full docs-list">
      {
        dataSourceDocumentsResponse &&
        <p>
          <FolderTree
            data={dataToNodeData(dataSourceDocumentsResponse.response)}
            showCheckbox={false}
            readOnly={true}
            initOpenStatus="closed"
          />
        </p>
      }
    </div>
  );
};