import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

const VALID_STATUS = ["tasks", "progress", "completed"];
const VALID_PRIORITY = ["low", "medium", "priority"];

const sanitizeSubtasks = (value) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("subtasks must be an array");
  }

  return value
    .slice(0, 200)
    .map((item, index) => {
      const title = String(item?.title || item?.text || "").trim();
      if (!title) return null;

      return {
        id: String(item?.id || `subtask-${Date.now()}-${index}`),
        title: title.slice(0, 300),
        done: Boolean(item?.done),
      };
    })
    .filter(Boolean);
};

const getNextOrderIndex = async (status) => {
  const { data, error } = await supabaseAdmin
    .from("task_manager_tasks")
    .select("order_index")
    .eq("status", status)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.order_index || 0) + 1;
};

const ensureAdmin = async () => {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);

  if (error || !user) {
    return { error: "User not authenticated", status: 401 };
  }

  if (!user.is_admin) {
    return { error: "Admin access required", status: 403 };
  }

  return { user };
};

export async function GET() {
  try {
    const auth = await ensureAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabaseAdmin
      .from("task_manager_tasks")
      .select(
        "id, title, description, status, priority, subtasks, order_index, created_at",
      )
      .order("status", { ascending: true })
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tasks: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = await ensureAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const title = body?.title?.trim();
    const description = body?.description?.trim() || null;
    const priority = body?.priority || "medium";
    let subtasks;

    try {
      subtasks = sanitizeSubtasks(body?.subtasks);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!VALID_PRIORITY.includes(priority)) {
      return NextResponse.json(
        { error: "Priority must be low, medium, or priority" },
        { status: 400 },
      );
    }

    const orderIndex = await getNextOrderIndex("tasks");

    const { data, error } = await supabaseAdmin
      .from("task_manager_tasks")
      .insert({
        title,
        description,
        priority,
        subtasks: subtasks || [],
        status: "tasks",
        order_index: orderIndex,
        created_by: auth.user.id,
      })
      .select(
        "id, title, description, status, priority, subtasks, order_index, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await ensureAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const taskId = body?.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    const patch = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 },
        );
      }
      patch.title = title;
    }

    if (body.description !== undefined) {
      const description = String(body.description || "").trim();
      patch.description = description || null;
    }

    if (body.priority !== undefined) {
      if (!VALID_PRIORITY.includes(body.priority)) {
        return NextResponse.json(
          { error: "Priority must be low, medium, or priority" },
          { status: 400 },
        );
      }
      patch.priority = body.priority;
    }

    if (body.subtasks !== undefined) {
      try {
        patch.subtasks = sanitizeSubtasks(body.subtasks);
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (body.status !== undefined) {
      if (!VALID_STATUS.includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be tasks, progress, or completed" },
          { status: 400 },
        );
      }

      patch.status = body.status;
      patch.order_index = await getNextOrderIndex(body.status);
      patch.completed_at =
        body.status === "completed" ? new Date().toISOString() : null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No update fields provided" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("task_manager_tasks")
      .update(patch)
      .eq("id", taskId)
      .select(
        "id, title, description, status, priority, subtasks, order_index, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await ensureAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("task_manager_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
