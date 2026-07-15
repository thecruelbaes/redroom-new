'use client';

import { useActionState } from 'react';
import { loginAction, type FormState } from './actions';

const initial: FormState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-3xl hairline-strong bg-surface p-8">
        <h1 className="font-display text-2xl font-bold uppercase text-ink">Вход в админку</h1>
        <p className="mt-2 text-sm text-muted">RedRoom Studio · управление отзывами</p>

        <form action={action} className="mt-7 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-obsidian px-4 py-3.5 text-ink outline-none transition-colors focus:border-red/60"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-red px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {pending ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
      <a href="/" className="mt-6 text-center text-sm text-faint hover:text-muted cursor-pointer">
        ← На сайт
      </a>
    </div>
  );
}
