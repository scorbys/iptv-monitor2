import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ChannelDetailsPage from "@/pages/ChannelDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function ChannelDetailLoading() {
  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span>Loading channel details...</span>
      </div>
    </div>
  );
}

function ChannelDetailError({ channelId }: { channelId: string }) {
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
              TV ID &quot;{channelId}&quot; is invalid. Please select a valid TV
              device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelDetailClient({ channelId }: { channelId: string }) {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <ChannelDetailsPage channelId={channelId} />
        </div>
      </div>
    </div>
  );
}

export default async function ChannelDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const channelId = resolvedParams.id;

  if (
    !channelId ||
    channelId.trim() === "" ||
    channelId === "undefined" ||
    channelId === "null"
  ) {
    return <ChannelDetailError channelId={channelId || "undefined"} />;
  }

  let decodedChannelId: string;
  try {
    decodedChannelId = decodeURIComponent(channelId);
    if (!decodedChannelId || decodedChannelId.trim() === "") {
      return <ChannelDetailError channelId={channelId} />;
    }
  } catch (error) {
    console.error("Error decoding device ID:", error);
    return <ChannelDetailError channelId={channelId} />;
  }

  return (
    <Suspense fallback={<ChannelDetailLoading />}>
      <ChannelDetailClient channelId={decodedChannelId} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const channelName = decodeURIComponent(resolvedParams.id);

    return {
      title: `Channel - ${channelName}`,
      description: `Monitor and manage channel ${channelName}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Channel Details",
      description: "Monitor and manage channel",
    };
  }
}
