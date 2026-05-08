import { BoardWriteView } from "@/features/board-customer/BoardWriteView";

export function generateStaticParams() {
  return [{ code: "notice" }, { code: "inquiry" }];
}

export default async function NewBoardPostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BoardWriteView code={code} />;
}
