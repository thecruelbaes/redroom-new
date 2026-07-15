'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addReviewAction, type FormState } from './actions';

const initial: FormState = {};
const inputCls =
  'w-full rounded-xl border border-white/10 bg-obsidian px-4 py-3 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-red/60';

export default function AddReviewForm() {
  const [state, action, pending] = useActionState(addReviewAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-2xl hairline bg-surface p-6">
      <h2 className="font-display text-lg font-bold uppercase text-ink">Добавить отзыв</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted">Имя</label>
          <input name="name" required placeholder="Анна" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted">Роль / подпись</label>
          <input name="source" placeholder="ученица · барабаны" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted">Текст отзыва</label>
        <textarea name="text" required rows={3} placeholder="Что написал ученик…" className={`${inputCls} resize-none`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted">Оценка</label>
          <select name="rating" defaultValue="5" className={`${inputCls} appearance-none`}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n} className="bg-obsidian">
                {n} ★
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted">
            Порядок (больше = выше)
          </label>
          <input name="sort_order" type="number" defaultValue={0} className={inputCls} />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-400">Отзыв добавлен ✓</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {pending ? 'Сохранение…' : 'Добавить отзыв'}
      </button>
    </form>
  );
}
