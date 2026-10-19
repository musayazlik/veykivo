import { EditorRoute } from "@/components/admin/editor-route";
import { ProjectEditor } from "@/components/admin/editors/project-editor";

export default function ProjectEditorPage(props: PageProps<"/admin/projeler/[id]">) {
  return <EditorRoute params={props.params} render={(id) => <ProjectEditor id={id} />} />;
}
