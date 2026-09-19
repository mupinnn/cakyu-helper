export const dialogStyles = `
:host { all: initial; }
* { box-sizing: border-box; font-family: Geist, ui-sans-serif, system-ui, sans-serif; }
.overlay {
  position: fixed; inset: 0; z-index: 2147483646;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.panel {
  width: min(640px, 100%);
  max-height: min(90vh, 860px);
  overflow: auto;
  background: #fff;
  color: #1a202c;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  padding: 20px;
}
h1 { font-size: 18px; margin: 0 0 4px; }
.sub { color: #718096; font-size: 13px; margin-bottom: 16px; }
.warn, .note {
  border-radius: 10px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px;
}
.warn { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
.note { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
fieldset {
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
  margin: 0 0 12px;
}
legend { font-weight: 650; padding: 0 6px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #4a5568; margin-bottom: 10px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #4a5568; margin-bottom: 10px; }
.field > span:first-child { font-size: 12px; color: #4a5568; }
input, select, textarea {
  border: 1px solid #cbd5e0; border-radius: 8px; padding: 8px 10px;
  font-size: 14px; color: #1a202c; background: #fff;
}
textarea { min-height: 72px; resize: vertical; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.ratings { display: flex; gap: 6px; }
.ratings label { flex: 1; margin: 0; flex-direction: row; align-items: center; justify-content: center; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font-size: 14px; color: #1a202c; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
button { cursor: pointer; border-radius: 8px; font-weight: 600; font-size: 14px; padding: 10px 14px; border: 1px solid transparent; }
.primary { background: #149FC4; color: #fff; }
.ghost { background: #fff; border-color: #cbd5e0; color: #2d3748; }
.miss { color: #c2410c; font-size: 11px; }
.check { flex-direction: row; align-items: center; gap: 8px; color: #1a202c; font-size: 13px; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
`;
