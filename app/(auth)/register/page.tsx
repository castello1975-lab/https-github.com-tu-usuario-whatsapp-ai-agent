"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Configura tu agente de WhatsApp con IA en unos minutos.
        </p>

        <form action={formAction} className="space-y-4">
          <Field label="Tu nombre" name="fullName" placeholder="Agustín" required />
          <Field
            label="Nombre del negocio"
            name="businessName"
            placeholder="Clínica Dental Sonrisa"
            required
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Zona horaria
            </label>
            <select
              name="timezone"
              defaultValue="Europe/Madrid"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="Europe/Madrid">Europa (Madrid)</option>
              <option value="America/Mexico_City">América (Ciudad de México)</option>
              <option value="America/Bogota">América (Bogotá)</option>
              <option value="America/Argentina/Buenos_Aires">América (Buenos Aires)</option>
              <option value="America/New_York">América (Nueva York)</option>
            </select>
          </div>
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="tú@negocio.com"
            required
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
          />

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-neutral-900 text-white text-sm font-medium py-2.5 hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {pending ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-6 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-neutral-900 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </div>
  );
}
