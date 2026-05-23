"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BLIND_PRESETS, PRESET_LABELS, type PresetName } from "@/lib/blind-presets";
import { calculatePayouts } from "@/lib/payout";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// ---- Schema ----

const numOrEmpty = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(0).optional()
);

const BlindLevelSchema = z.object({
  levelIndex: z.number(),
  isBreak: z.boolean(),
  smallBlind: numOrEmpty,
  bigBlind: numOrEmpty,
  ante: numOrEmpty,
  durationMinutes: z.preprocess((v) => Number(v), z.number().int().min(1)),
  label: z.string().optional(),
});

const FormSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  buyInAmount: z.preprocess((v) => Number(v), z.number().int().min(1, "Buy-in must be at least $1")),
  rebuyAmount: numOrEmpty,
  addOnAmount: numOrEmpty,
  lateRegLevels: z.preprocess((v) => Number(v ?? 0), z.number().int().min(0)),
  blindLevels: z.array(BlindLevelSchema).min(1),
});

// Use the output type so number fields are typed as numbers
type FormValues = z.output<typeof FormSchema>;

// ---- Sortable Row ----

function SortableLevel({
  id,
  index,
  register,
  watch,
  setValue,
  remove,
}: {
  id: string;
  index: number;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  watch: ReturnType<typeof useForm<FormValues>>["watch"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  remove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBreak = watch(`blindLevels.${index}.isBreak`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
        <button
          type="button"
          onClick={() => setValue(`blindLevels.${index}.isBreak`, !isBreak)}
          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
            isBreak
              ? "bg-orange-900 text-orange-300"
              : "bg-zinc-700 text-zinc-300"
          }`}
        >
          {isBreak ? "Break" : "Level"}
        </button>

        {isBreak ? (
          <>
            <input
              {...register(`blindLevels.${index}.label`)}
              placeholder="Break name"
              className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder-zinc-500"
            />
            <input
              {...register(`blindLevels.${index}.durationMinutes`)}
              type="number"
              min={1}
              placeholder="Min"
              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            />
            <span className="text-xs text-zinc-500">min</span>
          </>
        ) : (
          <>
            <input
              {...register(`blindLevels.${index}.smallBlind`)}
              type="number"
              min={1}
              placeholder="SB"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            />
            <span className="text-xs text-zinc-600">/</span>
            <input
              {...register(`blindLevels.${index}.bigBlind`)}
              type="number"
              min={1}
              placeholder="BB"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            />
            <input
              {...register(`blindLevels.${index}.ante`)}
              type="number"
              min={0}
              placeholder="Ante"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            />
            <input
              {...register(`blindLevels.${index}.durationMinutes`)}
              type="number"
              min={1}
              placeholder="Min"
              className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            />
            <span className="text-xs text-zinc-500">min</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => remove(index)}
        className="text-zinc-600 hover:text-red-400 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ---- Main Page ----

export default function NewTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      buyInAmount: 50,
      lateRegLevels: 2,
      blindLevels: BLIND_PRESETS.standard.map((l, i) => ({ ...l, levelIndex: i })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "blindLevels",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  }

  function applyPreset(preset: PresetName) {
    const levels = BLIND_PRESETS[preset].map((l, i) => ({
      ...l,
      levelIndex: i,
      smallBlind: l.smallBlind ?? undefined,
      bigBlind: l.bigBlind ?? undefined,
      ante: l.ante ?? undefined,
    }));
    setValue("blindLevels", levels);
  }

  function addLevel() {
    append({
      levelIndex: fields.length,
      isBreak: false,
      durationMinutes: 20,
    });
  }

  function addBreak() {
    append({
      levelIndex: fields.length,
      isBreak: true,
      durationMinutes: 15,
      label: "Break",
    });
  }

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setError(null);

    const buyInCents = Math.round(data.buyInAmount * 100);
    const rebuyCents =
      data.rebuyAmount && Number(data.rebuyAmount) > 0
        ? Math.round(Number(data.rebuyAmount) * 100)
        : undefined;
    const addOnCents =
      data.addOnAmount && Number(data.addOnAmount) > 0
        ? Math.round(Number(data.addOnAmount) * 100)
        : undefined;

    const blindLevels = data.blindLevels.map((l, i) => ({
      ...l,
      levelIndex: i,
      smallBlind: l.smallBlind ? Number(l.smallBlind) : undefined,
      bigBlind: l.bigBlind ? Number(l.bigBlind) : undefined,
      ante: l.ante ? Number(l.ante) : undefined,
    }));

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          buyInAmount: buyInCents,
          rebuyAmount: rebuyCents,
          addOnAmount: addOnCents,
          lateRegLevels: data.lateRegLevels,
          blindLevels,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to create tournament");
        setSubmitting(false);
        return;
      }

      const tournament = await res.json();
      router.push(`/dashboard/tournaments/${tournament.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const buyIn = watch("buyInAmount") || 0;
  const payoutPreview = calculatePayouts(Math.round(buyIn * 100) * 9, 9);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">New Tournament</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              s <= step ? "bg-green-500" : "bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Tournament Setup</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Tournament Name
              </label>
              <input
                {...register("name")}
                placeholder="Friday Night Poker"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Buy-In ($)
                </label>
                <input
                  {...register("buyInAmount")}
                  type="number"
                  min={1}
                  step={1}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Rebuy ($) <span className="text-zinc-500 font-normal">optional</span>
                </label>
                <input
                  {...register("rebuyAmount")}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Add-On ($) <span className="text-zinc-500 font-normal">optional</span>
                </label>
                <input
                  {...register("addOnAmount")}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Late Reg (levels)
                </label>
                <input
                  {...register("lateRegLevels")}
                  type="number"
                  min={0}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const ok = await trigger(["name", "buyInAmount", "lateRegLevels"]);
                if (ok) setStep(2);
              }}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Next: Blind Structure <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Blind Structure */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Blind Structure</h2>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABELS) as PresetName[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md font-medium transition-colors"
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-500 flex gap-4">
              <span>SB = Small Blind</span>
              <span>BB = Big Blind</span>
              <span>Ante</span>
              <span>Duration (min)</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {fields.map((field, index) => (
                    <SortableLevel
                      key={field.id}
                      id={field.id}
                      index={index}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      remove={remove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addLevel}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Level
              </button>
              <button
                type="button"
                onClick={addBreak}
                className="flex items-center gap-1.5 text-sm px-3 py-2 bg-orange-950 hover:bg-orange-900 border border-orange-900 rounded-lg transition-colors text-orange-300"
              >
                <Plus size={14} /> Add Break
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-zinc-700 text-zinc-300 hover:text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Next: Payout Preview <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Payout Preview */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Review & Confirm</h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium">{watch("name") || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Buy-In</span>
                <span>${watch("buyInAmount")}</span>
              </div>
              {watch("rebuyAmount") && Number(watch("rebuyAmount")) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Rebuy</span>
                  <span>${watch("rebuyAmount")}</span>
                </div>
              )}
              {watch("addOnAmount") && Number(watch("addOnAmount")) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Add-On</span>
                  <span>${watch("addOnAmount")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Blind levels</span>
                <span>{fields.filter((f) => !watch(`blindLevels.${fields.indexOf(f)}.isBreak`)).length} levels + {fields.filter((_, i) => watch(`blindLevels.${i}.isBreak`)).length} breaks</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Late registration</span>
                <span>First {watch("lateRegLevels")} levels</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                Payout Preview (9 players × ${watch("buyInAmount")})
              </h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                {payoutPreview.map((p) => (
                  <div key={p.place} className="flex justify-between text-sm">
                    <span className="text-zinc-400">
                      {p.place === 1 ? "1st" : p.place === 2 ? "2nd" : p.place === 3 ? "3rd" : `${p.place}th`}
                    </span>
                    <span>
                      {p.percentage}% — ${(p.amount / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-zinc-600 pt-1">
                  Actual payouts calculated from real prize pool at tournament time.
                </p>
              </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-3 text-yellow-300 text-sm">
                Some required fields are missing. Go back to Step 1 and fill in all required fields.
              </div>
            )}

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 border border-zinc-700 text-zinc-300 hover:text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Tournament"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
