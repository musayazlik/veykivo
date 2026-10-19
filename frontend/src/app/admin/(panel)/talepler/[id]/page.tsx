import { EditorRoute } from "@/components/admin/editor-route";
import { InquiryDetail } from "@/components/admin/inquiry-detail";

export default function InquiryDetailPage(props: PageProps<"/admin/talepler/[id]">) {
  return <EditorRoute params={props.params} render={(id) => <InquiryDetail id={id!} />} />;
}
