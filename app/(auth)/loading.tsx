export default function AuthLoading() {
  return (
    <div aria-busy="true" className="route-loading">
      <div className="route-loading__line" />
      <div className="route-loading__line route-loading__line--short" />
    </div>
  );
}
