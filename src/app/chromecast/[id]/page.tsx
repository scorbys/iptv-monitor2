import { Suspense } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ChromecastDetailsPage from "@/pages/ChromecastDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function ChromecastDetailLoading() {
  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading device details...</span>
      </div>
    </div>
  );
}

function ChromecastDetailError({ deviceId }: { deviceId: string }) {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Invalid Device ID
            </h3>
            <p className="text-gray-600">
              Device ID &quot{deviceId}&quot is invalid. Please select a valid
              Chromecast device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ChromecastDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const deviceId = resolvedParams.id;

  if (
    !deviceId ||
    deviceId.trim() === "" ||
    deviceId === "undefined" ||
    deviceId === "null"
  ) {
    return <ChromecastDetailError deviceId={deviceId || "undefined"} />;
  }

  let decodedDeviceId: string;
  try {
    decodedDeviceId = decodeURIComponent(deviceId);
    if (!decodedDeviceId || decodedDeviceId.trim() === "") {
      return <ChromecastDetailError deviceId={deviceId} />;
    }
  } catch (error) {
    console.error("Error decoding device ID:", error);
    return <ChromecastDetailError deviceId={deviceId} />;
  }

  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <Suspense fallback={<ChromecastDetailLoading />}>
            <ChromecastDetailsPage deviceId={decodedDeviceId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const deviceName = decodeURIComponent(resolvedParams.id);

    return {
      title: `Chromecast - ${deviceName}`,
      description: `Monitor and manage Chromecast device: ${deviceName}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Chromecast Device",
      description: "Monitor and manage Chromecast device",
    };
  }
}
