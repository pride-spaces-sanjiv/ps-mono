import { Editor, type EditorProps } from "prism-react-editor";
import { BasicSetup } from "prism-react-editor/setups";

import "prism-react-editor/prism/languages/tsx";
import "prism-react-editor/languages/jsx";

import "prism-react-editor/layout.css";
import "prism-react-editor/scrollbar.css";
import "prism-react-editor/themes/github-dark.css";
import "prism-react-editor/search.css";
import "prism-react-editor/invisibles.css";
import { cn } from "@/utils/cn";

export default function PrismEditor({ ...props }: Partial<EditorProps>) {
  return (
    // @ts-ignore
    <Editor
      language="json"
      {...props}
      className={cn("", ...(props?.className as string))}
    >
      {/* @ts-ignore */}
      <BasicSetup />
    </Editor>
  );
}
