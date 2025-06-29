import dynamic from "next/dynamic";

// Dynamic import, SSR dimatikan
const ChannelsPage = dynamic(() => import("../components/ChannelsPage"), {
  ssr: false,
});

export default ChannelsPage;