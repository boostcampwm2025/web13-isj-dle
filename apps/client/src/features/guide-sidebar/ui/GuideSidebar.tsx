import type { RouteNode } from "../model/route.types";
import Boundary from "./Boundary";
import Breadcrumb from "./Breadcrumb";
import Controls from "./Controls";
import Home from "./Home";
import Layout from "./Layout";
import Report from "./Report";
import SpaceDetail from "./SpaceDetail";
import Spaces from "./Spaces";

import { useState } from "react";

const GuideSidebar = () => {
  const [currentPath, setCurrentPath] = useState<string>("docs");

  const goPath = (path: string) => {
    setCurrentPath(path);
  };

  const goBack = () => {
    setCurrentPath((prev) => {
      const parts = prev.split("/");
      parts.pop();
      return parts.length === 0 ? "docs" : parts.join("/");
    });
  };

  const addPath = (subPath: string) => {
    setCurrentPath((prev) => prev + "/" + subPath);
  };

  const contents: RouteNode = {
    default: <Home addPath={addPath} />,
    children: {
      controls: { default: <Controls /> },
      layout: { default: <Layout /> },
      boundary: { default: <Boundary /> },
      spaces: {
        default: <Spaces addPath={addPath} />,
        children: {
          desk_zone: { default: <SpaceDetail spaceKey="desk_zone" /> },
          lobby: { default: <SpaceDetail spaceKey="lobby" /> },
          mogakco: { default: <SpaceDetail spaceKey="mogakco" /> },
          restaurant: { default: <SpaceDetail spaceKey="restaurant" /> },
          seminar_android: { default: <SpaceDetail spaceKey="seminar_android" /> },
          seminar_ios: { default: <SpaceDetail spaceKey="seminar_ios" /> },
          seminar_lounge: { default: <SpaceDetail spaceKey="seminar_lounge" /> },
          seminar_web: { default: <SpaceDetail spaceKey="seminar_web" /> },
        },
      },
      report: { default: <Report /> },
    },
  };

  const pathParts = currentPath.split("/").slice(1);
  let node: RouteNode = contents;

  for (const part of pathParts) {
    if (!node.children || !node.children[part]) break;
    node = node.children[part];
  }

  return (
    <div className="scrollbar-hide h-full overflow-y-auto">
      <Breadcrumb currentPath={currentPath} goPath={goPath} goBack={goBack} />
      {node.default || <div>내용을 불러올 수 없습니다.</div>}
    </div>
  );
};

export default GuideSidebar;
