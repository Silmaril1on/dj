"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheck, FaEllipsisV, FaTrash } from "react-icons/fa";
import {
  MdAdd,
  MdArrowRight,
  MdClose,
  MdDragIndicator,
  MdEdit,
} from "react-icons/md";

const STATUS_COLUMNS = [
  { key: "tasks", label: "TASKS" },
  { key: "progress", label: "PROGRESS" },
  { key: "completed", label: "COMPLETED" },
];

const PRIORITY_OPTIONS = ["low", "medium", "priority"];

const PRIORITY_RANK = {
  low: 0,
  medium: 1,
  priority: 2,
};

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

const createSubtaskId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TaskManagerPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskPriorityOrder, setTaskPriorityOrder] = useState(null);

  const groupedTasks = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, column) => {
      const columnTasks = tasks.filter((task) => task.status === column.key);

      if (column.key === "tasks" && taskPriorityOrder) {
        const prioritizedTasks = [...columnTasks].sort(
          (leftTask, rightTask) => {
            const leftMatches = leftTask.priority === taskPriorityOrder ? 1 : 0;
            const rightMatches =
              rightTask.priority === taskPriorityOrder ? 1 : 0;

            if (leftMatches !== rightMatches) {
              return rightMatches - leftMatches;
            }

            return (
              (PRIORITY_RANK[rightTask.priority] ?? -1) -
              (PRIORITY_RANK[leftTask.priority] ?? -1)
            );
          },
        );

        acc[column.key] = prioritizedTasks;
        return acc;
      }

      acc[column.key] = columnTasks;
      return acc;
    }, {});
  }, [taskPriorityOrder, tasks]);

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

      const updatedTask = {
        ...data.task,
        subtasks: normalizeSubtasks(data.task?.subtasks),
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );

      // Auto-complete: if all subtasks are done and task is in progress, move to completed
      const allDone =
        updatedTask.subtasks.length > 0 &&
        updatedTask.subtasks.every((s) => s.done);
      if (allDone && updatedTask.status === "progress") {
        moveTask(taskId, "completed");
      }
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
              activePriorityOrder={taskPriorityOrder}
              isMenuOpen={isMenuOpen}
              onPriorityOrderChange={setTaskPriorityOrder}
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
                  onStart={() => moveTask(task.id, "progress")}
                  onComplete={() => moveTask(task.id, "completed")}
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
  activePriorityOrder,
  isMenuOpen,
  onPriorityOrderChange,
  onToggleMenu,
  onCreateClick,
}) => {
  return (
    <header className="border-b border-gold/30 px-3 py-2 flex items-start justify-between relative gap-2 ">
      <div className="flex items-center space-x-5">
        <div className="*:leading-none">
          <h2 className="text-gold font-bold text-sm lg:text-base secondary">
            {columnKey === "completed" ? "Completed" : label}
          </h2>
          <p className="text-chino text-xs secondary">
            {getColumnCountText(columnKey, count)}
          </p>
        </div>
        {columnKey === "tasks" && (
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map((option) => {
              const isActive = activePriorityOrder === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onPriorityOrderChange(isActive ? null : option)
                  }
                  className={`border px-2 py-0.5 text-[10px] font-bold uppercase duration-200 cursor-pointer ${
                    isActive
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-gold/30 text-chino hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
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
  onStart,
  onComplete,
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
      {/* Card Body */}
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
        {/* Card SubTasks */}
        {totalSubtasks > 0 && (
          <div className="mt-2  bg-stone-900/40 p-2 space-y-3">
            <ul>
              {subtasks.map((subtask) => {
                const isDone = Boolean(subtask.done);

                return (
                  <li key={subtask.id}>
                    <div className="group w-full flex items-center justify-between gap-2 hover:bg-gold/10 px-1 py-0.5 duration-200">
                      <button
                        type="button"
                        onClick={() => onToggleSubtask(subtask.id)}
                        className="flex-1 *:capitalize flex items-center gap-2 text-xs secondary text-chino cursor-pointer text-left hover:pl-3 duration-300"
                      >
                        <span
                          aria-hidden="true"
                          className={
                            isDone ? "text-green-500 ml-0.5" : "text-gold"
                          }
                        >
                          {isDone ? (
                            <FaCheck size={10} />
                          ) : (
                            <MdArrowRight size={14} />
                          )}
                        </span>
                        <span
                          className={
                            isDone ? "text-green-500 font-bold" : "text-chino"
                          }
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

            {task.status !== "tasks" && (
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
            )}
          </div>
        )}
        {/*  Prioority Badge */}
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs font-bold uppercase border px-1.5 py-0.5 ${priorityClassMap[task.priority] || priorityClassMap.medium}`}
          >
            {task.priority}
          </span>

          {task.status === "tasks" && (
            <button
              type="button"
              onClick={onStart}
              className="border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-bold uppercase text-gold hover:bg-gold/20 duration-200 cursor-pointer"
            >
              Start Task
            </button>
          )}
          {task.status === "progress" && (
            <button
              type="button"
              onClick={onComplete}
              className="border border-green-500/40 bg-green-500/10 px-2 py-1 text-[10px] font-bold uppercase text-green-500 hover:bg-green-500/20 duration-200 cursor-pointer"
            >
              Complete Task
            </button>
          )}
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const normalized = normalizeSubtasks(task?.subtasks);
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setSubtasks(
      normalized.length > 0
        ? normalized
        : [{ id: createSubtaskId(), title: "", done: false }],
    );
  }, [isOpen, task]);

  const handleSubtaskChange = (subtaskId, value) => {
    setSubtasks((prev) =>
      prev.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, title: value } : subtask,
      ),
    );
  };

  const handleAddSubtaskField = () => {
    setSubtasks((prev) => [
      ...prev,
      { id: createSubtaskId(), title: "", done: false },
    ]);
  };

  const handleRemoveSubtaskField = (subtaskId) => {
    setSubtasks((prev) => {
      const next = prev.filter((subtask) => subtask.id !== subtaskId);
      return next.length > 0
        ? next
        : [{ id: createSubtaskId(), title: "", done: false }];
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const normalizedSubtasks = subtasks
      .map((subtask) => ({
        id: subtask.id || createSubtaskId(),
        title: String(subtask.title || "").trim(),
        done: Boolean(subtask.done),
      }))
      .filter((subtask) => subtask.title.length > 0);

    await onSubmit({
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      priority,
      subtasks: normalizedSubtasks,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
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
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="task-title"
                  className="text-chino text-xs secondary"
                >
                  Task title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Task title"
                  required
                  className="w-full border border-gold/30 bg-black/80 px-3 py-2 text-sm text-chino outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="task-description"
                  className="text-chino text-xs secondary"
                >
                  Task description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Task description"
                  rows={4}
                  className="w-full border border-gold/30 bg-black/80 px-3 py-2 text-sm text-chino outline-none focus:border-gold resize-y"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-chino text-xs secondary">
                    Subtasks
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubtaskField}
                    className="flex items-center gap-1 text-gold hover:text-chino duration-200 text-xs"
                  >
                    <MdAdd size={16} />
                    Add subtask
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={subtask.id || `${index}-subtask`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(event) =>
                          handleSubtaskChange(subtask.id, event.target.value)
                        }
                        placeholder={`Subtask ${index + 1}`}
                        className="flex-1 border border-gold/30 bg-black/80 px-3 py-2 text-sm text-chino outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtaskField(subtask.id)}
                        className="text-red-500 hover:text-red-400 duration-200"
                        aria-label={`Remove subtask ${index + 1}`}
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="task-priority"
                  className="text-chino text-xs secondary"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full border border-gold/30 bg-black/80 px-3 py-2 text-sm text-chino outline-none focus:border-gold"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-gold/30 px-3 py-2 text-xs text-chino hover:text-gold duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="border border-gold bg-gold/20 px-3 py-2 text-xs text-gold hover:bg-gold/30 duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                      ? "Update Task"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskManagerPage;
