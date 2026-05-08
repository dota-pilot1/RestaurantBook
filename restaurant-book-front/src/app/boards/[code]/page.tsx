import { BoardListView } from "@/features/board-customer/BoardListView";

export function generateStaticParams() {
  return [{ code: "notice" }, { code: "inquiry" }];
}

export default async function BoardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BoardListView code={code} />;
}
