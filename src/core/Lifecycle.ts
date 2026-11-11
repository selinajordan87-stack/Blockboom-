/** Window focus is not page visibility (notably with mobile browser chrome). */
export function installLifecycle(
  win: Window,
  doc: Document,
  actions: {
    blur: () => void;
    resetInput: () => void;
    hide: () => void;
    leave: () => void;
  },
) {
  const blur = () => actions.blur();
  const visibility = () => {
    if (doc.hidden) {
      actions.resetInput();
      actions.hide();
    }
  };
  const leave = () => {
    actions.resetInput();
    actions.leave();
  };
  win.addEventListener("blur", blur);
  doc.addEventListener("visibilitychange", visibility);
  win.addEventListener("pagehide", leave);
  return () => {
    win.removeEventListener("blur", blur);
    doc.removeEventListener("visibilitychange", visibility);
    win.removeEventListener("pagehide", leave);
  };
}
