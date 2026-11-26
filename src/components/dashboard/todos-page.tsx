"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/dashboard/icons";
import { PriBadge } from "@/components/dashboard/ui";
import { useApp, type Priority } from "@/components/dashboard/types";
import { TODO_TITLE_MAX } from "@/lib/constants";

type TodoListRow = { id: string; name: string; color: string };
type TodoRow = {
  id: string;
  list_id: string;
  title: string;
  note: string | null;
  done: boolean;
  priority: Priority;
  due_date: string | null;
  position: number;
};

const PRIORITIES: readonly string[] = ["urgent", "high", "medium", "low"];

function asPriority(value: unknown): Priority {
  return typeof value === "string" && PRIORITIES.includes(value) ? value as Priority : "medium";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function failureMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const error: unknown = body?.error;
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) return asString(error.message) || fallback;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Personal todo page. It owns its data and never reaches into the dashboard's
 * task state. `useApp()` is used only for the user's name and to move to the
 * board, so this page cannot change what the board shows.
 */
export function TodoPage() {
  const { user, navigate } = useApp();

  const [lists, setLists] = useState<TodoListRow[]>([]);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [activeListId, setActiveListId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [busy, setBusy] = useState(false);

  // A key change reloads both feeds. State updates stay inside the promise
  // callbacks, matching the fetch effects used elsewhere in the dashboard.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/todo-lists"),
      fetch("/api/todos"),
    ])
      .then(async ([listResponse, todoResponse]) => {
        if (!listResponse.ok || !todoResponse.ok) {
          const broken = listResponse.ok ? todoResponse : listResponse;
          throw new Error(await failureMessage(broken, "Could not load your todos."));
        }
        const listBody = await listResponse.json();
        const todoBody = await todoResponse.json();
        if (listBody.ok !== true || todoBody.ok !== true) {
          throw new Error(await failureMessage(listResponse, "Could not load your todos."));
        }

        const loadedLists: TodoListRow[] = (listBody.data ?? []).map((row: Record<string, unknown>) => ({
          id: asString(row.id),
          name: asString(row.name),
          color: asString(row.color),
        }));
        const loadedTodos: TodoRow[] = (todoBody.data ?? []).map((row: Record<string, unknown>) => ({
          id: asString(row.id),
          list_id: asString(row.list_id),
          title: asString(row.title),
          note: typeof row.note === "string" ? row.note : null,
          done: row.done === true,
          priority: asPriority(row.priority),
          due_date: typeof row.due_date === "string" ? row.due_date : null,
          position: typeof row.position === "number" ? row.position : 0,
        }));

        setLists(loadedLists);
        setTodos(loadedTodos);
        setActiveListId((current) =>
          current && loadedLists.some((list) => list.id === current)
            ? current
            : loadedLists[0]?.id ?? ""
        );
        setError("");
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Could not load your todos.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const addList = async () => {
    const name = newListName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/todo-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not create the list."));
      const body = await response.json();
      const created: TodoListRow = {
        id: asString(body.data?.id),
        name: asString(body.data?.name),
        color: asString(body.data?.color),
      };
      setLists((current) => [...current, created]);
      setActiveListId(created.id);
      setNewListName("");
      setNewListOpen(false);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not create the list.");
    } finally {
      setBusy(false);
    }
  };

  const addTodo = async () => {
    const title = newTodoTitle.trim();
    if (!title || !activeListId || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, list_id: activeListId }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not add the todo."));
      const body = await response.json();
      const row = body.data ?? {};
      setTodos((current) => [...current, {
        id: asString(row.id),
        list_id: asString(row.list_id),
        title: asString(row.title),
        note: typeof row.note === "string" ? row.note : null,
        done: row.done === true,
        priority: asPriority(row.priority),
        due_date: typeof row.due_date === "string" ? row.due_date : null,
        position: typeof row.position === "number" ? row.position : 0,
      }]);
      setNewTodoTitle("");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add the todo.");
    } finally {
      setBusy(false);
    }
  };

  const toggleTodo = async (todo: TodoRow) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todo.id, done: !todo.done }),
      });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not update the todo."));
      const body = await response.json();
      setTodos((current) => current.map((item) =>
        item.id === todo.id ? { ...item, done: body.data?.done === true } : item
      ));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update the todo.");
    } finally {
      setBusy(false);
    }
  };

  const deleteTodo = async (todo: TodoRow) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/todos?id=${encodeURIComponent(todo.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await failureMessage(response, "Could not delete the todo."));
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the todo.");
    } finally {
      setBusy(false);
    }
  };

  const visibleTodos = todos.filter((todo) => todo.list_id === activeListId);

  return (
    <div className="fade-up page-pad">
      <style>{`
        .todo-focus:focus-visible { outline:2px solid var(--ac); outline-offset:2px }
        .todo-row { display:flex; align-items:flex-start; gap:10px; padding:10px 12px;
          border:1px solid var(--br); border-radius:var(--radius-md); background:var(--bg2) }
        .todo-row:hover { border-color:var(--brh) }
        .todo-row-title { font-size:13px; line-height:1.5; color:var(--tx); font-family:var(--font-body);
          overflow-wrap:anywhere; letter-spacing:-0.01em }
        .todo-row-done { color:var(--tx3); text-decoration:line-through }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--tx)",
            fontFamily: "var(--font-display)" }}>Todos</h2>
          <p className="page-sub">
            {user?.full_name
              ? `${user.full_name.split(" ")[0]}'s personal lists`
              : "Your personal lists"}
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm todo-focus" onClick={() => navigate("board")}>
          <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Layers size={16} /></span> Open board
        </button>
      </div>

      {error && (
        <div role="alert" className="panel panel-sm" style={{ borderColor: "var(--rd)", color: "var(--rd-text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Warn size={16} /></span>
            <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>{error}</span>
            <button type="button" className="btn btn-ghost btn-sm todo-focus"
              onClick={() => { setLoading(true); setError(""); setReloadKey((key) => key + 1); }}>Retry</button>
          </div>
        </div>
      )}

      <section className="panel" aria-label="Todo lists">
        <div className="panel-head">
          <h3 className="panel-title">Lists</h3>
          <button type="button" className="btn btn-quiet btn-sm todo-focus" aria-label="Add a list"
            onClick={() => setNewListOpen((open) => !open)}>
            <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Plus size={16} /></span> New list
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ width: 96, height: 32, borderRadius: "var(--radius-sm)", background: "var(--bg2)" }} />
            <div style={{ width: 120, height: 32, borderRadius: "var(--radius-sm)", background: "var(--bg2)" }} />
          </div>
        ) : lists.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--tx3)" }}>No lists yet. Create one to start adding todos.</p>
        ) : (
          <nav aria-label="Switch list" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lists.map((list) => {
              const active = list.id === activeListId;
              return (
                <button key={list.id} type="button" className="btn btn-sm todo-focus"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setActiveListId(list.id)}
                  style={{
                    background: active ? "var(--as)" : "var(--bg2)",
                    borderColor: active ? "var(--ag)" : "var(--br)",
                    color: active ? "var(--ac-text)" : "var(--tx2)",
                  }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%",
                    background: list.color || "var(--tx3)", flexShrink: 0 }} />
                  {list.name}
                </button>
              );
            })}
          </nav>
        )}

        {newListOpen && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="input-focus todo-focus"
              value={newListName}
              maxLength={TODO_TITLE_MAX}
              onChange={(event) => setNewListName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void addList(); }}
              placeholder="List name"
              aria-label="New list name"
              style={{ flex: 1, minWidth: 0, height: 36, padding: "0 12px", fontSize: 13,
                color: "var(--tx)", background: "var(--inp)", border: "1px solid var(--br)",
                borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)" }}
            />
            <button type="button" className="btn btn-primary btn-sm todo-focus" disabled={busy || !newListName.trim()}
              onClick={() => void addList()}>Create</button>
          </div>
        )}
      </section>

      <section className="panel" aria-label="Add a todo">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="input-focus todo-focus"
            value={newTodoTitle}
            maxLength={TODO_TITLE_MAX}
            disabled={!activeListId || busy}
            onChange={(event) => setNewTodoTitle(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void addTodo(); }}
            placeholder={activeListId ? "Add a todo and press Enter" : "Create a list first"}
            aria-label="New todo title"
            style={{ flex: 1, minWidth: 0, height: 40, padding: "0 12px", fontSize: 13,
              color: "var(--tx)", background: "var(--inp)", border: "1px solid var(--br)",
              borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)" }}
          />
          <button type="button" className="btn btn-primary todo-focus" disabled={!activeListId || busy || !newTodoTitle.trim()}
            onClick={() => void addTodo()}>
            <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Plus size={16} /></span> Add
          </button>
        </div>
      </section>

      <section className="panel" aria-label="Todos">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map((index) => (
              <div key={index} className="todo-row" aria-hidden="true">
                <div style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 4, background: "var(--bg3)" }} />
                <div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--bg3)" }} />
              </div>
            ))}
          </div>
        ) : !activeListId ? (
          <div className="empty-state empty-state-sm">
            <span className="empty-state-icon" aria-hidden="true"><Icons.Layers size={16} /></span>
            <p className="empty-state-title">No list selected</p>
            <p className="empty-state-body">Create a list above to start collecting todos.</p>
          </div>
        ) : visibleTodos.length === 0 ? (
          <div className="empty-state empty-state-sm">
            <span className="empty-state-icon" aria-hidden="true"><Icons.CheckCircle size={16} /></span>
            <p className="empty-state-title">Nothing to do here</p>
            <p className="empty-state-body">Add a todo with the field above. It will appear in this list.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleTodos.map((todo) => (
              <li key={todo.id} className="todo-row">
                <input type="checkbox" className="todo-focus" checked={todo.done}
                  disabled={busy}
                  onChange={() => void toggleTodo(todo)}
                  aria-label={`Mark ${todo.title} as ${todo.done ? "not done" : "done"}`}
                  style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: "var(--ac)", cursor: "pointer" }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <p className={`todo-row-title${todo.done ? " todo-row-done" : ""}`}>{todo.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <PriBadge p={todo.priority} />
                    {todo.due_date && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: "var(--tx3)", fontFamily: "var(--font-mono)" }}>
                        <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Calendar size={16} /></span>
                        <time dateTime={todo.due_date}>{todo.due_date}</time>
                      </span>
                    )}
                    {todo.note && <span style={{ fontSize: 11, color: "var(--tx3)" }}>{todo.note}</span>}
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-icon todo-focus" disabled={busy}
                  aria-label={`Delete ${todo.title}`} onClick={() => void deleteTodo(todo)}>
                  <span aria-hidden="true" style={{ display: "inline-flex" }}><Icons.Trash size={16} /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
