import { EditorRoute } from "@/components/admin/editor-route";
import { ServiceEditor } from "@/components/admin/editors/service-editor";

export default function ServiceEditorPage(props: PageProps<"/admin/hizmetler/[id]">) {
  return <EditorRoute params={props.params} render={(id) => <ServiceEditor id={id} />} />;
}
