import { Metadata } from "next";

import DocumentsListPage from "./documents-list-page";

export const metadata: Metadata = {
  title: "HOA Documents",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <DocumentsListPage  orgSlug={params.orgSlug}/>;
};

export default Page;
