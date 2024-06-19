"use client";

import { useState } from "react";
import { tw } from "twind";
import { Dropdown, Spinner } from "flowbite-react";
import Link from "next/link";
import AppsLoggedInLayout from "./apps-logged-in-layout";
import { Sidebar } from "./side-bar";
import { PageTitle } from "./page-title";


export function DocsList({ orgSlug }: { orgSlug: string }) {

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

          <div className={tw("mt-4 grow")}>
            
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
}