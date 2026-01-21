import type * as Monaco from "monaco-editor";

export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
}

export interface FileSystemNode extends FileSystemItem {
  children: FileSystemNode[];
}

export const buildTree = (items: Record<string, FileSystemItem>): FileSystemNode[] => {
  const nodes: Record<string, FileSystemNode> = {};
  const root: FileSystemNode[] = [];

  Object.values(items).forEach((item) => {
    nodes[item.id] = { ...item, children: [] };
  });

  Object.values(nodes).forEach((node) => {
    if (node.parentId && nodes[node.parentId]) {
      nodes[node.parentId].children.push(node);
    } else {
      root.push(node);
    }
  });

  const sortNodes = (nodeList: FileSystemNode[]) => {
    nodeList.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodeList.forEach((node) => sortNodes(node.children));
  };

  sortNodes(root);
  return root;
};

export const getLanguageFromFileName = (fileName: string, monaco: typeof Monaco | null): string | undefined => {
  if (!monaco) return undefined;
  const parts = fileName.split(".");
  if (parts.length < 2) return undefined;

  const ext = `.${parts[parts.length - 1]}`;
  const languages = monaco.languages.getLanguages();
  const languageObj = languages.find((l: Monaco.languages.ILanguageExtensionPoint) => l.extensions?.includes(ext));
  return languageObj ? languageObj.id : undefined;
};
