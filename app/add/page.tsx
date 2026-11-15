import { redirect } from "next/navigation";
import { extractUrl } from "@/lib/links/tiktok";

// Share-target entry: pulls the link from `url` or `text` and hands it to the add form.
export default async function Add({ searchParams }: PageProps<"/add">) {
  const sp = await searchParams;
  const pick = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";
  const link = extractUrl(pick("url")) ?? extractUrl(pick("text")) ?? extractUrl(pick("title"));
  redirect(link ? `/ideas/new?link=${encodeURIComponent(link)}` : "/ideas/new");
}
