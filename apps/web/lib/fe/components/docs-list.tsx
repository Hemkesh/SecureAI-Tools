"use client";

import useSWR from "swr";
import { DataSourceRecord } from "../data-source-utils";
import { getDataSourceConnetionDocumentsApiPath, getDataSourceConnetionLinkApiPath } from "../api-paths";
import { DataSourceConnectionDocumentResponse, Id, DataSourceConnectionDocumentLink } from "@repo/core";
import { createFetcher } from "../api";
import { Tree } from 'primereact/tree';
import 'react-folder-tree/dist/style.css';
import 'styles/DocumentsList.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primeicons/primeicons.css';

import { tw } from "twind";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import Link from "next/link";
import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "flowbite-react";
import { TreeNode } from "primereact/treenode";

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

export const DocsList = ({
  dataSourceRecord,
}: {
  dataSourceRecord: DataSourceRecord;
}) => {
  const [docId, setDocId] = useState<number>();

  const {
    data: dataSourceDocumentsResponse,
  } = useSWR(
    getDataSourceConnetionDocumentsApiPath({
      connectionId: Id.from(dataSourceRecord.connection!.id),
      query: '',
      pagination: {
        page: 1,
        pageSize: 999,
      },
    }),
    createFetcher<DataSourceConnectionDocumentResponse[]>(),
  );

  return (
    <div className="w-full flex flex-row">
      {
        dataSourceDocumentsResponse ?
          <FolderViewer filesData={dataSourceDocumentsResponse.response} setDocId={setDocId}/> :
          <div className="w-full">
            <Spinner
              className="m-auto"
              color="dark"
              size="xl"
            />
          </div>
      }
      {docId && <PDFViewer docId={docId} dataSourceRecord={dataSourceRecord} />}
    </div>
  );
};

export const FolderViewer = ({
  filesData,
  setDocId,
}: {
  filesData: DataSourceConnectionDocumentResponse[],
  setDocId: (docId: number) => void
}) => {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [keyMapping, setKeyMapping] = useState(new Map<string, string>());
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('');

  useEffect(() => {
    function dataToNodeData(data: DataSourceConnectionDocumentResponse[]): TreeNode[] {
      let nodeData: TreeNode[] = [];
      let docKeyMapping = new Map<string, string>();
      const hoaMAP = new Map<string, Map<string, DataSourceConnectionDocumentResponse[]>>([]);

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
          hoaMAP.set(hoaName, new Map<string, DataSourceConnectionDocumentResponse[]>());
        }
        const hoaMap = hoaMAP.get(hoaName)!;
        if (!hoaMap.has(docType)) {
          hoaMap.set(docType, []);
        }
        hoaMap.get(docType)!.push(doc);
      }

      let i = 0;

      // Make nodedata
      hoaMAP.forEach((hoaMap, hoaName) => {
        let node: TreeNode = {
          key: i.toString(),
          label: hoaName,
          icon: 'pi pi-warehouse',
          children: [],
        }

        let j = 0;
        hoaMap.forEach((docList, docType) => {
          let node2: TreeNode = {
            key: i.toString() + '-' + j.toString(),
            label: docType,
            icon: 'pi pi-folder',
            children: [],
          }

          let k = 0;
          for (const doc of docList) {
            node2.children?.push({
              key: i.toString() + '-' + j.toString() + '-' + k.toString(),
              label: doc.name,
              // data: doc.metadata?.content,
              icon: 'pi pi-file',
              leaf: true,
            });

            docKeyMapping.set(i.toString() + '-' + j.toString() + '-' + k.toString(), doc.externalId);
            k++;
          }
          node.children?.push(node2);
          j++;
        });

        nodeData.push(node);
        i++;
      })
      setKeyMapping(docKeyMapping);

      return nodeData;
    }

    setNodes(dataToNodeData(filesData));

  }, [filesData, setNodes]);

  return (
    <>
      <div className="w-full docs-list">
        <Tree
          value={nodes}
          selectionMode="single"
          selectionKeys={selectedNodeKey ?? ''} 
          onSelectionChange={(e) => {
            const clickedId = e.value as string;
            const key = keyMapping.get(clickedId);
            if (key) {
              setDocId(parseInt(key));
              setSelectedNodeKey(clickedId);
            }
          }}
          onNodeClick={(e) => {
            let tempNodes = [...nodes];
            // find the node that was cliekd and change its expanded state
            
            // step one, decode the key to get the path
            const key = e.node.key!.toString();
            const path = key.split('-');
            const pathLength = path.length;
            let currNode = null;
            for (let i = 0; i < pathLength; i++) {
              if (i === 0) {
                currNode = nodes[parseInt(path[i]!)];
              } else if (i !== 0 && currNode) {
                currNode = currNode?.children?.[parseInt(path[i]!)];
              }
            }

            if (currNode) {
              currNode.expanded = !currNode.expanded;
            }

            setNodes(tempNodes);
          }}
          filter
          filterMode="lenient"
          filterPlaceholder="Search"
          filterBy="label"
          className="w-full"
        />
      </div>
    </>
  );
}

export const PDFViewer = ({
  docId,
  dataSourceRecord,
}: {
  docId: number,
  dataSourceRecord: DataSourceRecord
}) => {

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
  });

  const {
    data: dataSourceDocumentLink,
    error: dataSourceDocumentLinkFetchError,
    isLoading: isDataSourceDocumentLinkLoading,
    mutate: mutateDataSourceDocumentLink,
  } = useSWR(
    getDataSourceConnetionLinkApiPath({
      connectionId: Id.from(dataSourceRecord.connection!.id),
      documentId: docId.toString(),
    }),
    createFetcher<DataSourceConnectionDocumentLink[]>(),
  );

  return (
    <>
      {
        dataSourceDocumentLink ?
          <div className="flex w-full doc-viewer">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <div className={tw("flex flex-col w-full")}>
                <div className={tw("grow overflow-scroll")} style={{ height: '80vh' }}>
                  <Viewer
                    fileUrl={dataSourceDocumentLink.response.find((link) => link.expiration === null)?.slug || ''}
                    plugins={[pageNavigationPluginInstance, defaultLayoutPluginInstance]}
                  // defaultScale={SpecialZoomLevel.PageFit}
                  />
                </div>
              </div>
            </Worker>
          </div>
          : <div className={tw("flex flex-col justify-center items-center w-full")}>
            <Spinner size="xl" />
          </div>
      }
    </>
  );
}