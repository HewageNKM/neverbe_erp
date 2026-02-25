import React, { useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import Banner from "@/pages/website/banner/page";
import Header from "./components/Header";
import Navigation from "@/pages/website/navigation/page";
import { IconLayoutDashboard, IconWorldWww } from "@tabler/icons-react";

const Page = () => {
  const [formType, setFormType] = useState("banner");

  return (
    <PageContainer title="Website" description="CMS & Content Control">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Front-End Controller
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Website Management
              </h2>
            </div>
          </div>
        </div>

        {/* Content Control Panel */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Tab Navigation Area */}
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <Header formType={formType} setFormType={setFormType} />
          </div>

          {/* Dynamic Content Area */}
          <div className="p-6 md:p-8 min-h-[500px]">
            {formType === "banner" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Banner />
              </div>
            )}
            {formType === "navigation" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Navigation />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Page;
