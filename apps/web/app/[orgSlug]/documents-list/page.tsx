import { Metadata } from "next";

import { DocsList } from "lib/fe/components/docs-list";

export const metadata: Metadata = {
  title: "Documents List",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <DocsList  orgSlug={params.orgSlug}/>;
};

export default Page;
