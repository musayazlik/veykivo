import { EditorRoute } from "@/components/admin/editor-route";
import { PostEditor } from "@/components/admin/editors/post-editor";

export default function PostEditorPage(props: PageProps<"/admin/blog/[id]">) {
  return <EditorRoute params={props.params} render={(id) => <PostEditor id={id} />} />;
}
