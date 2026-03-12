"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheck, FaEllipsisV, FaTrash } from "react-icons/fa";
import { MdArrowRight, MdClose, MdDragIndicator, MdEdit } from "react-icons/md";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const STATUS_COLUMNS = [
  { key: "tasks", label: "TASKS" },
  { key: "progress", label: "PROGRESS" },
  { key: "completed", label: "COMPLETED" },
];

const PRIORITY_OPTIONS = ["low", "medium", "priority"];

const priorityClassMap = {
  low: "text-green-500 border-green-500/40 bg-green-500/10 bg-green-500/30",
  medium: "text-blue-500 border-blue-500/40 bg-blue-500/10 bg-blue-500/30",
  priority: "text-red-500 border-red-500/40 bg-red-500/10 bg-red-500/30",
};

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getColumnCountText = (columnKey, count) => {
  if (columnKey === "tasks") return `${count} active tasks`;
  if (columnKey === "progress") return `${count} progressing tasks`;
  return `${count} Completed tasks`;
};

const normalizeSubtasks = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const title = String(item?.title || item?.text || "").trim();
      if (!title) return null;

      return {
        id: item?.id || `${Date.now()}-${index}-${title}`,
        title,
        done: Boolean(item?.done),
      };
    })
    .filter(Boolean);
};

const TaskManagerPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const groupedTasks = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key);
      return acc;
    }, {});
  }, [tasks]);

  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((task) => task.id === editingTaskId) || null;
  }, [editingTaskId, tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/task-manager", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      setTasks(
        (data.tasks || []).map((task) => ({
          ...task,
          subtasks: normalizeSubtasks(task.subtasks),
        })),
      );
    } catch (err) {
      setError(err.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (taskPayload) => {
    if (submitting) return;

    const title = String(taskPayload?.title || "").trim();
    if (!title) {
      setError("Task title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        description: taskPayload?.description,
        priority: taskPayload?.priority,
        subtasks: normalizeSubtasks(taskPayload?.subtasks),
      };

      const isEditing = Boolean(editingTaskId);
      const response = await fetch("/api/admin/task-manager", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { taskId: editingTaskId, ...payload } : payload,
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save task");
      }

      const normalizedTask = {
        ...data.task,
        subtasks: normalizeSubtasks(data.task?.subtasks),
      };

      if (isEditing) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === normalizedTask.id ? normalizedTask : task,
          ),
        );
      } else {
        setTasks((prev) => [normalizedTask, ...prev]);
      }

      setEditingTaskId(null);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (taskId) => {
    setEditingTaskId(taskId);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingTaskId(null);
  };

  const moveTask = async (taskId, targetStatus) => {
    const originalTask = tasks.find((task) => task.id === taskId);
    if (!originalTask || originalTask.status === targetStatus) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: targetStatus } : task,
      ),
    );

    try {
      const response = await fetch("/api/admin/task-manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: targetStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to move task");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...data.task, subtasks: normalizeSubtasks(data.task?.subtasks) }
            : task,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to move task");
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: originalTask.status } : task,
        ),
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      const response = await fetch(`/api/admin/task-manager?taskId=${taskId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete task");
      }
    } catch (err) {
      setError(err.message || "Failed to delete task");
      setTasks(previous);
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const originalTask = tasks.find((task) => task.id === taskId);
    if (!originalTask) return;

    const updatedSubtasks = normalizeSubtasks(originalTask.subtasks).map(
      (subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, done: !subtask.done }
          : subtask,
    );

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, subtasks: updatedSubtasks } : task,
      ),
    );

    try {
      const response = await fetch("/api/admin/task-manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, subtasks: updatedSubtasks }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update subtask");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...data.task, subtasks: normalizeSubtasks(data.task?.subtasks) }
            : task,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to update subtask");
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? originalTask : task)),
      );
    }
  };

  const handleRemoveSubtask = async (taskId, subtaskId) => {
    const originalTask = tasks.find((task) => task.id === taskId);
    if (!originalTask) return;

    const updatedSubtasks = normalizeSubtasks(originalTask.subtasks).filter(
      (subtask) => subtask.id !== subtaskId,
    );

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, subtasks: updatedSubtasks } : task,
      ),
    );

    try {
      const response = await fetch("/api/admin/task-manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, subtasks: updatedSubtasks }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove subtask");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...data.task, subtasks: normalizeSubtasks(data.task?.subtasks) }
            : task,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to remove subtask");
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? originalTask : task)),
      );
    }
  };

  return (
    <div className="p-3 lg:p-4 space-y-4">
      <div>
        <h1 className="text-gold text-2xl lg:text-4xl font-bold secondary">
          Task Manager
        </h1>
        <p className="text-chino/80 text-sm">
          Drag tasks between columns to update status.
        </p>
      </div>

      {error && (
        <div className="border border-crimson/40 bg-crimson/10 text-crimson p-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {STATUS_COLUMNS.map((column) => (
          <section
            key={column.key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedTaskId) {
                moveTask(draggedTaskId, column.key);
                setDraggedTaskId(null);
              }
            }}
            className="border border-gold/30 bg-stone-900 min-h-[520px]"
          >
            <ColumnHeader
              columnKey={column.key}
              label={column.label}
              count={groupedTasks[column.key]?.length || 0}
              isMenuOpen={isMenuOpen}
              onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
              onCreateClick={() => {
                setIsMenuOpen(false);
                openCreateModal();
              }}
            />

            <div className="p-2 space-y-2">
              {!loading && groupedTasks[column.key]?.length === 0 && (
                <div className="text-chino/60 text-xs border border-dashed border-gold/20 p-3 text-center">
                  No tasks in {column.label.toLowerCase()}
                </div>
              )}

              {groupedTasks[column.key]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onEdit={() => openEditModal(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onToggleSubtask={(subtaskId) =>
                    handleToggleSubtask(task.id, subtaskId)
                  }
                  onRemoveSubtask={(subtaskId) =>
                    handleRemoveSubtask(task.id, subtaskId)
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSaveTask}
        submitting={submitting}
        mode={editingTaskId ? "edit" : "create"}
        task={editingTask}
      />
    </div>
  );
};

const ColumnHeader = ({
  columnKey,
  label,
  count,
  isMenuOpen,
  onToggleMenu,
  onCreateClick,
}) => {
  return (
    <header className="border-b border-gold/30 px-3 py-2 flex items-start justify-between relative gap-2 ">
      <div className="*:leading-none">
        <h2 className="text-gold font-bold text-sm lg:text-base secondary">
          {columnKey === "completed" ? "Completed" : label}
        </h2>
        <p className="text-chino text-xs secondary">
          {getColumnCountText(columnKey, count)}
        </p>
      </div>
      {columnKey === "tasks" && (
        <>
          <button
            type="button"
            onClick={onToggleMenu}
            className="text-gold hover:text-chino duration-200 p-1 cursor-pointer"
            aria-label="Task menu"
          >
            <FaEllipsisV size={14} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute right-2 top-10 z-20 bg-black border border-gold/30 min-w-[150px]"
              >
                <button
                  type="button"
                  onClick={onCreateClick}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm text-chino hover:text-gold hover:bg-gold/10 duration-200"
                >
                  Create New Task
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </header>
  );
};

const TaskCard = ({
  task,
  onDragStart,
  onEdit,
  onDelete,
  onToggleSubtask,
  onRemoveSubtask,
}) => {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((subtask) =>
    Boolean(subtask.done),
  ).length;
  const subtaskProgress =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className="border border-gold/25 bg-black p-2 flex flex-col items-center gap-2 relative"
    >
      {/* action buttons for card */}
      <div className="gap-1 w-full flex justify-between items-center">
        <span className="text-[10px] text-chino/80 italic secondary">
          {formatDateTime(task.created_at)}
        </span>
        <div className="flex gap-2">
          <button className="active:cursor-grabbing cursor-grab text-gold-500 center">
            <MdDragIndicator size={21} />
          </button>
          <button className="text-gold cursor-pointer center" onClick={onEdit}>
            <MdEdit size={16} />
          </button>
          <button
            className="text-red-500 hover:text-red-600 duration-300 cursor-pointer center"
            onClick={onDelete}
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-start justify-between gap-2 w-full">
          <h3 className="text-gold font-bold uppercase text-md leading-tight pl-2">
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="text-chino text-xs p-2 bg-stone-900 whitespace-pre-wrap secondary">
            {task.description}
          </p>
        )}

        {totalSubtasks > 0 && (
          <div className="mt-2  bg-stone-900/40 p-2 space-y-1">
            <ul>
              {subtasks.map((subtask) => {
                const isDone = Boolean(subtask.done);

                return (
                  <li key={subtask.id}>
                    <div className="group w-full flex items-center justify-between gap-2 hover:bg-gold/10 px-1 py-0.5 duration-200">
                      <button
                        type="button"
                        onClick={() => onToggleSubtask(subtask.id)}
                        className="flex-1 *:capitalize flex items-center gap-2 text-xs text-chino cursor-pointer text-left"
                      >
                        <span
                          aria-hidden="true"
                          className={isDone ? "text-green-500" : "text-gold"}
                        >
                          {isDone ? (
                            <FaCheck size={10} />
                          ) : (
                            <MdArrowRight size={14} />
                          )}
                        </span>
                        <span
                          className={isDone ? "text-green-500" : "text-chino"}
                        >
                          {subtask.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 duration-200"
                        aria-label="Remove subtask"
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-chino/80 mb-1 font-bold secondary">
                <span>Task Progress</span>
                <span>{subtaskProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-green-500/30 overflow-hidden">
                <div
                  className="h-full bg-green-500 duration-300 rounded-r-md"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs font-bold uppercase border px-1.5 py-0.5 ${priorityClassMap[task.priority] || priorityClassMap.medium}`}
          >
            {task.priority}
          </span>
        </div>
      </div>
    </article>
  );
};

const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  mode,
  task,
}) => {
  const formConfig = useMemo(() => {
    const initialSubtaskTitles = normalizeSubtasks(task?.subtasks).map(
      (subtask) => subtask.title,
    );

    return {
      initialData: {
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        subtasks: initialSubtaskTitles.length > 0 ? initialSubtaskTitles : [""],
      },
      fields: {
        title: {
          type: "text",
          required: true,
          label: "Task title",
          placeholder: "Task title",
        },
        description: {
          type: "textarea",
          required: false,
          label: "Task description",
          placeholder: "Task description",
        },
        subtasks: {
          type: "additional",
          required: false,
          placeholder: "Add subtask (e.g. Armin van Buuren)",
          minFields: 1,
          maxFields: 100,
        },
        priority: {
          type: "select",
          required: true,
          label: "Priority",
          options: PRIORITY_OPTIONS.map((option) => ({
            value: option,
            label: option,
          })),
        },
      },
      arrayFields: ["subtasks"],
      sections: [{ fields: ["title", "description", "subtasks", "priority"] }],
    };
  }, [task]);

  const handleFormSubmit = async (formData) => {
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "medium");

    let subtaskTitles = [];
    try {
      const rawSubtasks = JSON.parse(formData.get("subtasks") || "[]");
      subtaskTitles = Array.isArray(rawSubtasks)
        ? rawSubtasks
            .map((item) => String(item || "").trim())
            .filter((item) => item.length > 0)
        : [];
    } catch {
      subtaskTitles = [];
    }

    const existingSubtasks = normalizeSubtasks(task?.subtasks);
    const existingByTitle = new Map(
      existingSubtasks.map((subtask) => [subtask.title.toLowerCase(), subtask]),
    );

    const subtasks = subtaskTitles.map((subtaskTitle, index) => {
      const key = subtaskTitle.toLowerCase();
      const existing = existingByTitle.get(key);
      return {
        id: existing?.id || `${Date.now()}-${index}-${key}`,
        title: subtaskTitle,
        done: Boolean(existing?.done),
      };
    });

    await onSubmit({ title, description, priority, subtasks });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onSubmit={onSubmit}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl border border-gold/30 bg-stone-900 p-4 space-y-3"
          >
            {/* modal header */}
            <div className="flex items-center justify-between">
              <h3 className="text-gold text-lg secondary font-bold">
                {mode === "edit" ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gold hover:rotate-90 duration-300 cursor-pointer"
              >
                <MdClose size={20} />
              </button>
            </div>
            {/* modal inputs */}
            <SubmissionForm
              formConfig={formConfig}
              onSubmit={handleFormSubmit}
              isLoading={submitting}
              submitButtonText={mode === "edit" ? "Update Task" : "Create Task"}
              showGoogle={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskManagerPage;
