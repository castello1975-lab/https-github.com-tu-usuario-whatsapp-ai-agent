"use client";

import { useState } from "react";
import type { Faq } from "@/lib/db/types";
import { saveFaqsAction } from "@/app/(dashboard)/customization/actions";

export function FaqEditor({ initialFaqs }: { initialFaqs: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs.length ? initialFaqs : []);
  const [saving, setSaving] = useState(false);

  function updateFaq(index: number, field: keyof Faq, value: string) {
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    try {
      await saveFaqsAction(faqs.filter((f) => f.question.trim() && f.answer.trim()));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-neutral-200 rounded-xl p-3 space-y-2">
          <input
            value={faq.question}
            onChange={(e) => updateFaq(i, "question", e.target.value)}
            placeholder="Pregunta"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <textarea
            value={faq.answer}
            onChange={(e) => updateFaq(i, "answer", e.target.value)}
            placeholder="Respuesta"
            rows={2}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            onClick={() => removeFaq(i)}
            className="text-xs text-red-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={addFaq}
          className="text-sm text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-lg px-3 py-1.5"
        >
          + Añadir pregunta
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="text-sm bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar FAQs"}
        </button>
      </div>
    </div>
  );
}
