import { useNoiseFilter } from "../model/use-noise-filter";

import { useRoomContext } from "@livekit/components-react";

const NoiseFilter = () => {
  const room = useRoomContext();
  useNoiseFilter(room);

  return null;
};

export default NoiseFilter;
