import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import TvDetailsPage from "@/pages/TvDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function TvDetailLoading() {
  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading device details...</span>
      </div>
    </div>
  );
}

function TvDetailError({ tvId }: { tvId: string }) {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Invalid TV ID
            </h3>
            <p className="text-gray-600">
              TV ID &quot;{tvId}&quot; is invalid. Please select a valid TV
              device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TvDetailClient({ tvId }: { tvId: string }) {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <TvDetailsPage tvId={tvId} />
        </div>
      </div>
    </div>
  );
}

export default async function TvDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const tvId = resolvedParams.id;

  if (!tvId || tvId.trim() === "" || tvId === "undefined" || tvId === "null") {
    return <TvDetailError tvId={tvId || "undefined"} />;
  }

  let decodedTvId: string;
  try {
    decodedTvId = decodeURIComponent(tvId);
    if (!decodedTvId || decodedTvId.trim() === "") {
      return <TvDetailError tvId={tvId} />;
    }
  } catch (error) {
    console.error("Error decoding device ID:", error);
    return <TvDetailError tvId={tvId} />;
  }

  return (
    <Suspense fallback={<TvDetailLoading />}>
      <TvDetailClient tvId={decodedTvId} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const roomNo = decodeURIComponent(resolvedParams.id);

    return {
      title: `TV - ${roomNo}`,
      description: `Monitor and manage TV device: ${roomNo}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "TV Device",
      description: "Monitor and manage TV device",
    };
  }
}
