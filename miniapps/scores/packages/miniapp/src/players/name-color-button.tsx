// The palette button beside a name field (Add player and every player card) and its sheet: the Carcassonne
// meeple colours, a custom colour (the browser's picker) and "No colour". The chosen colour fills the name field
// only (field.css); with none the field looks as it always did.
import { useId, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { t } from "../i18n";
import { MEEPLE_COLORS, inkOn } from "./name-colors";

/** Props of {@link NameColorButton}. */
interface NameColorButtonProps {
  /** The colour now (`#rrggbb`), or null for none. */
  color: string | null;
  /** Called with the picked colour, or null for "No colour". */
  onChange: (color: string | null) => void;
  /** The button's accessible name (it says whose name it colours). */
  label: string;
  /** Called when the sheet opens or closes (a card keeps the button in view while it is open). */
  onOpenChange?: (open: boolean) => void;
}

/** The custom colour shown in the picker before one was chosen. */
const CUSTOM_START = "#7c3aed";

/** Opens the colour sheet; a swatch or "No colour" applies and closes, the custom picker applies while it is open. */
export function NameColorButton({ color, onChange, label, onOpenChange }: NameColorButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const customId = useId();
  const isCustom = color !== null && !MEEPLE_COLORS.some((meeple) => meeple.value === color);
  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const pick = (next: string | null) => {
    onChange(next);
    toggle(false);
  };
  return (
    <Dialog open={open} onOpenChange={toggle}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="name-color-button text-text-secondary"
          data-name-color=""
          // because a tap must not take focus from the name field first: the field would close its editing state
          // (and, on a card, hide this button) before the tap lands.
          onPointerDown={(event) => { event.preventDefault(); }}
          onMouseDown={(event) => { event.preventDefault(); }}
        >
          <Palette aria-hidden />
          {color !== null && <span className="name-color-dot" style={{ background: color }} aria-hidden />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("app.color.title")}</DialogTitle>
          <DialogDescription>{t("app.color.hint")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="swatches" role="group" aria-label={t("app.color.meeples")}>
            {MEEPLE_COLORS.map((meeple) => (
              <button
                key={meeple.id}
                type="button"
                className="swatch"
                style={{ background: meeple.value, color: inkOn(meeple.value) }}
                aria-label={t(`app.color.${meeple.id}`)}
                aria-pressed={color === meeple.value}
                onClick={() => { pick(meeple.value); }}
              >
                {color === meeple.value && <Check aria-hidden />}
              </button>
            ))}
          </div>
          <div className="swatch-custom">
            <label htmlFor={customId}>{t("app.color.custom")}</label>
            <input
              id={customId}
              type="color"
              className="swatch-picker"
              data-current={isCustom ? "" : undefined}
              value={isCustom ? color : CUSTOM_START}
              onChange={(event) => { onChange(event.target.value); }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" disabled={color === null} onClick={() => { pick(null); }}>{t("app.color.none")}</Button>
          <DialogClose asChild>
            <Button>{t("app.color.done")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
