import { EditorRoute } from "@/components/admin/editor-route";
import { TeamMemberEditor } from "@/components/admin/editors/team-editor";

export default function TeamMemberEditorPage(props: PageProps<"/admin/ekip/[id]">) {
  return <EditorRoute params={props.params} render={(id) => <TeamMemberEditor id={id} />} />;
}
