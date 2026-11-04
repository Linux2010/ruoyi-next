import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dict/type/{dictType}
 * 对齐 RuoYi GET /system/dict/data/type/{dictType}：
 * 返回 sys_dict_data 中 status='0' 的启用项，按 dict_sort 升序。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dictType: string }> }
) {
  try {
    const { dictType } = await params;
    const rows = await prisma.sys_dict_data.findMany({
      where: { dict_type: dictType, status: "0" },
      orderBy: [{ dict_sort: "asc" }, { dict_code: "asc" }],
    });
    return NextResponse.json(
      rows.map((r) => ({
        dictLabel: r.dict_label,
        dictValue: r.dict_value,
        isDefault: r.is_default,
      }))
    );
  } catch (e) {
    console.error("GET /api/dict/type error:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
