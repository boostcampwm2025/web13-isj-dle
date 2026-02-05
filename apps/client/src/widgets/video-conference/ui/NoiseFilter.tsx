import { useRoomContext } from "@livekit/components-react";

import { useNoiseFilter } from "../model/use-noise-filter";

const NoiseFilter = () => {
  const room = useRoomContext();
  useNoiseFilter(room);

  return null;
};

export default NoiseFilter;
