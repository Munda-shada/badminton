import { createGameAction } from "@/actions/games";

export function GameForm() {
  return (
    <form action={createGameAction} className="form-grid">
      <Field className="is-wide" label="Poll title" name="title" placeholder="Prime Court Night" />
      <Field label="Date" name="date" type="date" />
      <Field label="Start time" name="startTime" type="time" />
      <Field label="End time" name="endTime" type="time" />
      <Field defaultValue="2" label="Courts booked" min="1" name="courtsBooked" type="number" />
      <Field className="is-wide" label="Location" name="location" placeholder="Velocity Sports Arena" />
      <Field
        className="is-wide"
        label="Google Maps link"
        name="mapLink"
        placeholder="https://maps.google.com/..."
        required={false}
        type="url"
      />
      <Field defaultValue="8" label="Max players" min="2" name="maxPlayers" type="number" />
      <Field
        hint="Optional now. You can add or update the session cost after the game."
        label="Cost per player (optional)"
        min="0"
        name="costPerPlayer"
        required={false}
        type="number"
      />
      <div className="form-actions is-wide">
        <button className="primary-button" type="submit">
          Publish session card
        </button>
      </div>
    </form>
  );
}

function Field({
  className = "",
  defaultValue,
  label,
  min,
  name,
  placeholder,
  required = true,
  type = "text",
  hint,
}: {
  className?: string;
  defaultValue?: string;
  hint?: string;
  label: string;
  min?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      <input
        defaultValue={defaultValue}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
