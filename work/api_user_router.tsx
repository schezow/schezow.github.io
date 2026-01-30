import { promises as fs } from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "state.json");

// JSON 파일을 읽는 함수
async function readStateData() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // 파일이 없으면 빈 객체 반환
    return {};
  }
}

// JSON 파일에 쓰는 함수
async function writeStateData(data: any) {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

// GET: 특정 ID의 상태를 가져옴
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const data = await readStateData();

    if (id) {
      const response_pouch = await fetch(
        `http://223.171.137.10:8000/pouch/${id}`,
        {
          method: "GET",
        },
      );

      const result_pouch = await response_pouch.json();

      if (data[id]) {
        data[id]["pouch_state"] = result_pouch["available"];
      }

      return Response.json({ success: true, data: data[id] || null });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Error reading state:", error);
    return Response.json(
      { success: false, error: "Failed to read state" },
      { status: 500 },
    );
  }
}

// POST: 상태를 업데이트
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      seat,
      pouch_state,
      robot_use,
      officeBox_state,
      supplies_state,
      login_state,
      wait_state,
      request_time,
      current_text,
    } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "ID is required" },
        { status: 400 },
      );
    }

    const data = await readStateData();

    // 기존 데이터가 있으면 업데이트, 없으면 새로 생성
    data[id] = {
      ...data[id],
      ...(seat !== undefined && { seat }),
      ...(pouch_state !== undefined && { pouch_state }),
      ...(robot_use !== undefined && { robot_use }),
      ...(officeBox_state !== undefined && { officeBox_state }),
      ...(supplies_state !== undefined && { supplies_state }),
      ...(login_state !== undefined && { login_state }),
      ...(wait_state !== undefined && { wait_state }),
      ...(request_time !== undefined && { request_time }),
      ...(current_text !== undefined && { current_text }),
      updated_at: new Date().toISOString(),
    };

    await writeStateData(data);

    return Response.json({
      success: true,
      data: data[id],
    });
  } catch (error) {
    console.error("Error updating state:", error);
    return Response.json(
      { success: false, error: "Failed to update state" },
      { status: 500 },
    );
  }
}
