// Required fallback for the @modal parallel route slot — rendered whenever
// the slot has no matching intercepted route for the current URL (which is
// almost always: the modal is only ever active while an intercepted
// /article/[id] navigation is open). Without this, a hard refresh/direct
// load of any other page in the app would 404, since Next can't recover an
// unmatched slot's state on a full page load.
export default function Default() {
  return null;
}
