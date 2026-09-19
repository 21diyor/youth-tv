import { Button } from "@/components/ui/button"

import type { DraftPublishState } from "@/admin/useDraftPublish"

// Header status + "E’lon qilish" + "Saqlash", shared by all editors.
// Only one status line is shown, most important first.
function StatusText({ state }: { state: DraftPublishState }) {
  if (state.publishError) {
    return (
      <span className="text-[12px] font-medium text-red-600">
        {state.publishError}
      </span>
    )
  }

  if (state.saveError) {
    return (
      <span className="text-[12px] font-medium text-red-600">
        {state.saveError}
      </span>
    )
  }

  if (state.published) {
    return (
      <span className="whitespace-nowrap text-[12px] font-medium text-emerald-600">
        E’lon qilindi
      </span>
    )
  }

  if (state.saved) {
    return (
      <span className="whitespace-nowrap text-[12px] font-medium text-emerald-600">
        Saqlandi
      </span>
    )
  }

  if (state.isDirty) {
    return (
      <span className="whitespace-nowrap text-[12px] font-medium text-neutral-500">
        Saqlanmagan o‘zgarishlar bor — e’lon qilishdan oldin saqlang
      </span>
    )
  }

  if (state.hasUnpublishedChanges) {
    return (
      <span className="whitespace-nowrap text-[12px] font-medium text-amber-600">
        E’lon qilinmagan o‘zgarishlar bor
      </span>
    )
  }

  return null
}

export function DraftPublishActions({
  state,
}: {
  state: DraftPublishState
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <StatusText state={state} />

      <Button
        variant="outline"
        onClick={state.handlePublish}
        disabled={!state.canPublish}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        E’lon qilish
      </Button>

      <Button
        onClick={state.handleSave}
        disabled={!state.canSave}
        className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Saqlash
      </Button>
    </div>
  )
}
